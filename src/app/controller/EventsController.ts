import { HttpError } from "../../core/HttpError.js";
import { mapZodErrorToHttpError } from "../../core/Mappers.js";
import { EventType } from "../../core/Types.js";
import { BudgetService } from "../../service/BudgetService.js";
import { EventDto } from "../../service/Dtos.js";
import { EventSchema } from "../middleware/EventValidationSchemas.js";
import { ControllerParams, EventBodyModel, PostEventsBodyModel, ResponseModel } from "../Types.js";

// Append offline evnets
export async function handlePostEvents(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {

  const { events, userId } = params;
  const sortedEvents = (events as EventBodyModel[])
    .sort((a, b) => a.when - b.when);

  const results: ResponseModel[] = [];

  // execute sequentially so that dependent event does not fail
  for (const e of sortedEvents) {
    const res = await processSingleEvent(service, e, userId);
    results.push(res);
  }

  return { events: results };
}



// Sync events
export async function handleGetEvents(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { userId, budgetId, key, count } = params;
  const events = await service.getEvents(budgetId, userId, key, count);
  const nextKey = events.length > 0 ? events[events.length-1].sequence : key;
  return {
    budgetId,
    key,
    nextKey,
    events: events.map(toSyncResponseModel) 
  };
}


// helpers

/**
 * Helper Methods
 */

async function processSingleEvent(service: BudgetService, rawEvent: any, actorUserId: string): Promise<ResponseModel> {
  try {
    const validated = validateSingleEvent(rawEvent);
    return await dispatchEvent(service, validated, actorUserId);
  }
  catch(error: any) {
    return normalizeFailure(rawEvent,error);
  }
}


function validateSingleEvent(rawEvent: Record<string,any>): EventBodyModel {
  const parsed = EventSchema.safeParse(rawEvent);
  if (!parsed.success) {
      throw mapZodErrorToHttpError(parsed.error);
    }

  return parsed.data;
}


async function dispatchEvent(service: BudgetService, event: EventBodyModel, actorUserId: string): Promise<ResponseModel> {
  try {
    const syncEvent = await callServiceForEvent(
      service,
      event,
      actorUserId
    );

    return normalizeSuccess(syncEvent);
  } 
  catch (err: any) {
    return normalizeFailure(event, err);
  }
}


async function callServiceForEvent(service: BudgetService, event: EventBodyModel, actorUserId: string): Promise<EventDto> {
  const { budgetId } = event;
  switch (event.event) {
    case await EventType.EDIT_BUDGET:
      return service.editBudget({
        id: budgetId,
        actorUserId,
        title: event.title,
        details: event.details,
        version: event.version,
        when: event.when,
      });

    case EventType.DELETE_BUDGET: 
      return service.deleteBudget({
        id: budgetId,
        actorUserId,
        version: event.version,
        when: event.when,
      })

    case EventType.ADD_CATEGORY:
      return await service.addCategory({
        id: event.id,
        budgetId,
        actorUserId,
        name: event.name,
        allocate: event.allocate,
        when: event.when,
      });

    case EventType.EDIT_CATEGORY:
      return await service.editCategory({
        id: event.id,
        budgetId,
        actorUserId,
        name: event.name,
        allocate: event.allocate,
        version: event.version,
        when: event.when,
      });

    case EventType.DELETE_CATEGORY:
      return await service.deleteCategory({
        id: event.id,
        budgetId,
        actorUserId,
        version: event.version,
        when: event.when
      });

    case EventType.ADD_EXPENSE:
      return await service.addExpense({
        id: event.id,
        budgetId,
        actorUserId,
        categoryId: event.categoryId,
        date: event.date,
        amount: event.amount,
        when: event.when,
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
        when: event.when,
      });

    case EventType.DELETE_EXPENSE:
      return await service.deleteExpense({
        id: event.id,
        budgetId,
        actorUserId,
        version: event.version,
        when: event.when
      });

    default:
      throw new HttpError.BadRequest("UNSUPPORTED_EVENT");
  }
}


function normalizeSuccess(dto: EventDto): ResponseModel {
  const { event, budgetId, recordId: id, data } = dto;
  return {
    event,
    id,
    budgetId,
    version: data?.version,
  };
}

function normalizeFailure(body: any, err: any): ResponseModel {
  const { event, budgetId, id } = body;
  if (err instanceof HttpError) {
    return {
      event, id, budgetId, 
      errors: err.flatten(),
    };
  }

  return {
    event,  id, budgetId,
    errors: ["INTERNAL_ERROR"],
  };
}

function toSyncResponseModel(dto: EventDto): ResponseModel {
  const { event, budgetId, actorUserId: actorId, recordId, when, data } = dto;
  return {
    event,
    budgetId,
    actorId,
    recordId,
    when,
    data,
  };
}