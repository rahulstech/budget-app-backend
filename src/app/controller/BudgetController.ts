import { HttpError } from "../../core/HttpError.js";
import { BudgetService } from "../../service/BudgetService.js";
import { CreateBudgetDto, EventDto } from "../../service/Dtos.js";
import { EventType } from "../../core/Types.js";
import { EventSchema } from "../middleware/BudgetValidationSchemas.js";
import { logError } from "../../core/Logger.js";
import { ControllerParams, EventBodyModel, ResponseModel, PostEventsBodyModel } from "../Types.js";
import { mapZodErrorToHttpError } from "../../core/Mappers.js";

/**
 * Controller Methods
 */

// Create a budget
export async function handlePostBudget(service: BudgetService, params: ControllerParams) {
  const { userId, body } = params;
  const dto: CreateBudgetDto = {
    id: body.id,
    actorUserId: userId,
    title: body.title,
    details: body.details,
    lastModified: body.lastModified,
  };

  const { budgetId, data, actorUserId } = await service.createBudget(dto);

  return { id: budgetId, createdBy: actorUserId, version: data!.version };
}


// Append offline evnets
export async function handlePostEvents(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {

  const { body, userId, budgetId } = params;
  const events = (body as PostEventsBodyModel).events
    .sort((a, b) => a.lastModified - b.lastModified);

  const results: ResponseModel[] = [];

  // execute sequentially so that dependent event does not fail
  for (const e of events) {
    const res = await processSingleEvent(service, e, budgetId, userId);
    results.push(res);
  }

  return { events: results };
}



// Sync events
export async function handleGetEvents(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { userId, budgetId, key, count } = params;
  const events = await service.getEvents(budgetId, userId, key, count);
  return { events: events.map(toSyncResponseModel) };
}

// Join Participant
export async function handleJoinPartcipant(service: BudgetService, params: ControllerParams) {
  const { budgetId, userId } = params
  await service.addParticipant({ budgetId, actorUserId: userId, userId });
  return true;
}

// Leave Participant
export async function handleLeavePariticipant(service: BudgetService, params: ControllerParams) {
  const { budgetId, userId } = params;
  await service.removeParticipant({ budgetId, actorUserId: userId, userId });
}

// Remove Participant
export async function handleRemoveParticipant(service: BudgetService, params: ControllerParams) {
  const { budgetId, userId, participantId } = params;
  await service.removeParticipant({ budgetId, actorUserId: userId, userId: participantId }) 
}

// Get SnapShot
export async function handleGetSnapShot(service: BudgetService, params: ControllerParams): Promise<unknown> {
  const { budgetId, userId, entity, key, count } = params;

  await service.canGetSnapShotOrThrow(budgetId,userId);

  switch(entity) {
    case "budget": {
      return await service.getBudget(budgetId);
    }
    case "participant": {
      return { participants: await service.getParticipantsOfBudget(budgetId) };
    }
    case "category": {
      return { categories: await service.getCategoriesOfBudget(budgetId) };
    }
    case "expense": {
      const { items } = await service.getExpensesOfBudget(budgetId, key, count);
      return { key, expenses: items };
    }
    default: {
      throw new HttpError.BadRequest("UNKNOWN_ENTITY");
    }
  }
}


export async function handleGetBudgetsOfParticipant(service: BudgetService, params: ControllerParams): Promise<unknown> {
  const { userId, key, count } = params;
  const { key: page, items: budgets } = await service.getBudgetsOfParticipant(userId, key, count);
  return { 
    page, 
    budgets
  };
}

/**
 * Helper Methods
 */

async function processSingleEvent(service: BudgetService, rawEvent: any,budgetId: string, actorUserId: string): Promise<ResponseModel> {
  try {
    const validated = validateSingleEvent(rawEvent);
    return await dispatchEvent(service, validated, budgetId, actorUserId);
  }
  catch(error: any) {
    const httpError = error as HttpError;
    return {
      ...rawEvent,
      erros: httpError.flatten()
    }
  }
}


function validateSingleEvent(rawEvent: Record<string,any>): EventBodyModel {
  const parsed = EventSchema.safeParse(rawEvent);
  if (!parsed.success) {
      throw mapZodErrorToHttpError(parsed.error);
    }

  return parsed.data;
}


async function dispatchEvent(service: BudgetService, event: EventBodyModel, budgetId: string,actorUserId: string): Promise<ResponseModel> {
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


async function callServiceForEvent(service: BudgetService, event: EventBodyModel, budgetId: string, actorUserId: string): Promise<EventDto> {

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

    case EventType.DELETE_BUDGET: 
      return service.deleteBudget({
        id: budgetId,
        actorUserId,
        version: event.version,
        lastModified: event.lastModified,
      })

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
        allocate: event.allocate,
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


function normalizeSuccess(syncEvent: EventDto): ResponseModel {
  return {
    event: syncEvent.type,
    id: syncEvent.recordId,
    version: syncEvent.data?.version,
  };
}

function normalizeFailure(event: any, budgetId: string, err: any): ResponseModel {
  if (err instanceof HttpError) {
    return {
      event: event.event,
      id: event.id ?? budgetId,
      errors: err.flatten(),
    };
  }
  
  logError("", err);

  return {
    event: event.event,
    id: event.id ?? budgetId,
    errors: ["INTERNAL_ERROR"],
  };
}

function toSyncResponseModel(dto: EventDto): ResponseModel {
  // base object: type, actor, when
  let base: ResponseModel = {
    budgetId: dto.budgetId,
    actorUserId: dto.actorUserId,
    type: dto.type,
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
