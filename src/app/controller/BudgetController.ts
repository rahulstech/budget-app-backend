import { HttpError } from "../../core/HttpError.js";
import { BudgetService } from "../../service/BudgetService.js";
import { CreateBudgetDto, EventDto } from "../../service/Dtos.js";
import { EventType } from "../../core/CoreTypes.js";
import { EventBatchRequestModel, EventRequestModel, EventSchema, SyncRequestModel } from "../ValidationSchemas.js";
import { logError } from "../../core/Logger.js";
import { EventResponseModel, SyncResponseModel } from "../AppTypes.js";

/**
 * Controller Methods
 */

// Create a budget
export async function handlePostBudget(service: BudgetService, body: any, actorUserId: string) {
  const dto: CreateBudgetDto = {
    id: body.id,
    actorUserId,
    title: body.title,
    details: body.details,
    lastModified: body.lastModified,
  };

  const { budgetId, data } = await service.createBudget(dto);
  const { version } = data!;
  return { budgetId, version };
}


// Append offline evnets
export async function handlePostEvents(
  service: BudgetService,
  events: EventBatchRequestModel,
  budgetId: string,
  actorUserId: string
): Promise<EventResponseModel[]> {
  return Promise.all(
    events
    .sort((a,b) => a.lastModified - b.lastModified) // sort ascending order of lastModified
    .map((e) => processSingleEvent(service, e, budgetId, actorUserId))
  );
}


// Sync events
export async function handleGetEvents(service: BudgetService, queries: SyncRequestModel, budgetId: string, userId: string): Promise<SyncResponseModel[]> {
  const { after, count } = queries;
  const events = await service.getEvents(budgetId, userId, after, count );
  return events.map(toSyncResponseModel);
}

// Join Participant
export async function handleJoinPartcipant(service: BudgetService, budgetId: string, userId: string) {
  await service.addParticipant({ budgetId, actorUserId: userId, userId });
  return true;
}

// Leave Participant
export async function handleLeavePariticipant(service: BudgetService, budgetId: string, userId: string) {
  await service.removeParticipant({ budgetId, actorUserId: userId, userId });
}

// Get SnapShot
export async function handleGetSnapShot(service: BudgetService, budgetId: string, userId: string, entity: string, params: any) {
  switch(entity) {
    case "budget": {
      return await service.getBudget(budgetId);
    }
    case "participant": {
      return await service.getParticipantsOfBudget(budgetId);
    }
    case "category": {
      return await service.getCategoriesOfBudget(budgetId);
    }
    default: {
      throw new HttpError.BadRequest("UNKNOWN_ENTITY");
    }
  }
}

export async function handleGetSnapShotPaged(service: BudgetService, budgetId: string, userId: string, entity: string, params: any) {
  switch(entity) {
    case "expense": {
      const page = params.page as number;
      const per_page = params.per_page as number;
      const result = await service.getExpensesOfBudget(budgetId, page, per_page);
      return result.items;
    }
    default: {
      throw new HttpError(400,"UNKNOWN_ENTITY");
    }
  }
}

/**
 * Helper Methods
 */

async function processSingleEvent(
  service: BudgetService,
  rawEvent: any,
  budgetId: string,
  actorUserId: string
): Promise<EventResponseModel> {
  try {
    const validated = validateSingleEvent(rawEvent);
    return await dispatchEvent(service, validated, budgetId, actorUserId);
  }
  catch(error: any) {
    const httpError = error as HttpError;
    return {
      ...rawEvent,
      erros: httpError.errorItems?.map(item => item.message) ?? [httpError.message]
    }
  }
}


function validateSingleEvent(rawEvent: Record<string,any>): EventRequestModel {
  const parsed = EventSchema.safeParse(rawEvent);
  if (!parsed.success) {
      const errorItems: HttpError.ErrorItem[] = parsed.error.issues.map((issue) => ({
        message: issue.message,
      }));

      throw new HttpError(400, null, errorItems);
    }

  return parsed.data;
}


async function dispatchEvent(service: BudgetService, event: EventRequestModel, budgetId: string,actorUserId: string): Promise<EventResponseModel> {
  try {
    const syncEvent = await callServiceForEvent(
      service,
      event,
      budgetId,
      actorUserId
    );

    return normalizeSuccess(syncEvent);
  } 
  catch (err: any) {
    return normalizeFailure(event, budgetId, err);
  }
}


async function callServiceForEvent(service: BudgetService, event: EventRequestModel, budgetId: string, actorUserId: string): Promise<EventDto> {

  switch (event.event) {
    case await EventType.EDIT_BUDGET:
      return service.editBudget({
        id: budgetId,
        actorUserId,
        title: event.title,
        details: event.details,
        version: event.version,
        lastModified: event.lastModified,
      });

    case await EventType.DELETE_BUDGET:
      return service.deleteBudget({
        id: budgetId,
        actorUserId,
        version: event.version,
        lastModified: event.lastModified,
      });

    case EventType.ADD_CATEGORY:
      return await service.addCategory({
        id: event.id,
        budgetId,
        actorUserId,
        name: event.name,
        allocate: event.allocate,
        lastModified: event.lastModified,
      });

    case EventType.EDIT_CATEGORY:
      return await service.editCategory({
        id: event.id,
        budgetId,
        actorUserId,
        name: event.name,
        allocate: event.amount,
        version: event.version,
        lastModified: event.lastModified,
      });

    case EventType.DELETE_CATEGORY:
      return await service.deleteCategory({
        id: event.id,
        budgetId,
        actorUserId,
        version: event.version,
        lastModified: event.lastModified
      });

    case EventType.ADD_EXPENSE:
      return await service.addExpense({
        id: event.id,
        budgetId,
        actorUserId,
        categoryId: event.categoryId,
        date: event.date,
        amount: event.amount,
        lastModified: event.lastModified,
      });

    case EventType.EDIT_EXPENSE:
      return await service.editExpense({
        id: event.id,
        budgetId,
        actorUserId,
        categoryId: event.categoryId,
        date: event.date,
        amount: event.amount,
        note: event.note,
        version: event.version,
        lastModified: event.lastModified,
      });

    case EventType.DELETE_EXPENSE:
      return await service.deleteExpense({
        id: event.id,
        budgetId,
        actorUserId,
        version: event.version,
        lastModified: event.lastModified
      });

    default:
      throw new HttpError(400, "UNSUPPORTED_EVENT");
  }
}


function normalizeSuccess(syncEvent: EventDto): EventResponseModel {
  return {
    event: syncEvent.type,
    id: syncEvent.recordId,
    version: syncEvent.data?.version,
  };
}

function normalizeFailure(event: any, budgetId: string, err: any): EventResponseModel {
  if (err instanceof HttpError) {
    return {
      event: event.event,
      id: event.id ?? budgetId,
      errors: err.errorItems?.map(item => item.message) ?? [err.message],
    };
  }
  
  logError("", err);

  return {
    event: event.event,
    id: event.id ?? budgetId,
    errors: ["INTERNAL_ERROR"],
  };
}

function toSyncResponseModel(dto: EventDto): SyncResponseModel {
  // base object: type, actor, when
  let base: SyncResponseModel = {
    budgetId: dto.budgetId,
    actorUserId: dto.actorUserId,
    sequence: dto.sequence,
    type: dto.type,
    when: dto.when,
  };

  // map recordId to a semantic id based on event type
  switch (dto.type) {
    case EventType.CREATE_BUDGET:
    case EventType.EDIT_BUDGET:
    case EventType.DELETE_BUDGET:
      base.budgetId = dto.recordId;
    break;

    case EventType.ADD_CATEGORY:
    case EventType.EDIT_CATEGORY:
    case EventType.DELETE_CATEGORY:
      base.categoryId = dto.recordId;
    break;

    case EventType.ADD_EXPENSE:
    case EventType.EDIT_EXPENSE:
    case EventType.DELETE_EXPENSE: {
        base.categoryId = dto.data?.categoryId
        base.expenseId = dto.recordId;
    }
    break;

    case EventType.ADD_PARTICIPANT:
    case EventType.REMOVE_PARTICIPANT:
      base.participantId = dto.recordId;
    break;
  }

  // merge data fields (if present)
  if (dto.data) {
    base = {
      ...base,
      ...dto.data
    };
  }

  return base;
}
