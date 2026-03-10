import { HttpError } from "../../core/HttpError.js";
import { mapZodErrorToHttpError } from "../../core/Mappers.js";
import { EventType, HttpResponseError } from "../../core/Types.js";
import { BudgetService } from "../../service/BudgetService.js";
import { EventDto } from "../../service/Dtos.js";
import { EventSchema } from "../middleware/EventValidationSchemas.js";
import { ControllerParams, EventBodyModel, ResponseModel } from "../Types.js";

// Append offline evnets
export async function handlePostEvents(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {

  const { body, userId } = params;
  const sortedEvents = (body.events as EventBodyModel[])
    .sort((a, b) => a.when - b.when);

  const results: ResponseModel[] = [];

  // execute sequentially so that dependent event does not fail
  for (const e of sortedEvents) {
    try {
      const res = await processSingleEvent(service, e, userId);
      results.push(res);
    }
    catch(err: any) {
      const res = normalizeFailure(e, err);
      results.push(res);
      break;
    }
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
    events 
  };
}


// helpers

/**
 * Helper Methods
 */

async function processSingleEvent(service: BudgetService, rawEvent: any, actorUserId: string): Promise<ResponseModel> {
  const validated = validateSingleEvent(rawEvent);
  return await dispatchEvent(service, validated, actorUserId);
}


function validateSingleEvent(rawEvent: Record<string,any>): EventBodyModel {
  const parsed = EventSchema.safeParse(rawEvent);
  if (!parsed.success) {
      const err = mapZodErrorToHttpError(parsed.error);
      throw err;
    }

  return parsed.data;
}


async function dispatchEvent(service: BudgetService, input: EventBodyModel, actorUserId: string): Promise<ResponseModel> {
  const { 
    eventId, event, budgetId, recordId, 
    version, // when event successfully applied new version is returned
    currentRecord // when version mismatch happens, current record is returned

  } = await callServiceForEvent(service, input,actorUserId);

  return {
    eventId,
    event,
    budgetId,
    recordId,
    version,
    currentRecord
  };
}


async function callServiceForEvent(service: BudgetService, event: EventBodyModel, actorUserId: string): Promise<EventDto> {
  switch (event.event) {
    case await EventType.EDIT_BUDGET:
      return service.editBudget({
        eventId: event.eventId,
        id: event.budgetId,
        actorUserId,
        title: event.title,
        details: event.details,
        version: event.version,
        when: event.when,
      });

    case EventType.DELETE_BUDGET: 
      return service.deleteBudget({
        eventId: event.eventId,
        id: event.budgetId,
        actorUserId,
        version: event.version,
        when: event.when,
      })

    case EventType.ADD_CATEGORY:
      return await service.addCategory({
        eventId: event.eventId,
        id: event.recordId,
        budgetId: event.budgetId,
        actorUserId,
        name: event.name,
        allocate: event.allocate,
        when: event.when,
      });

    case EventType.EDIT_CATEGORY:
      return await service.editCategory({
        eventId: event.eventId,
        id: event.recordId,
        budgetId: event.budgetId,
        actorUserId,
        name: event.name,
        allocate: event.allocate,
        version: event.version,
        when: event.when,
      });

    case EventType.DELETE_CATEGORY:
      return await service.deleteCategory({
        eventId: event.eventId,
        id: event.recordId,
        budgetId: event.budgetId,
        actorUserId,
        version: event.version,
        when: event.when
      });

    case EventType.ADD_EXPENSE:
      return await service.addExpense({
        eventId: event.eventId,
        id: event.recordId,
        budgetId: event.budgetId,
        actorUserId,
        categoryId: event.categoryId,
        note: event.note,
        date: event.date,
        amount: event.amount,
        when: event.when,
      });

    case EventType.EDIT_EXPENSE:
      return await service.editExpense({
        eventId: event.eventId,
        id: event.recordId,
        budgetId: event.budgetId,
        actorUserId,
        date: event.date,
        amount: event.amount,
        note: event.note,
        version: event.version,
        when: event.when,
      });

    case EventType.DELETE_EXPENSE:
      return await service.deleteExpense({
        eventId: event.eventId,
        id: event.recordId,
        budgetId: event.budgetId,
        actorUserId,
        version: event.version,
        when: event.when
      });

    default:
      throw new HttpError.BadRequest("UNSUPPORTED_EVENT");
  }
}


function normalizeFailure(body: any, err: any): ResponseModel {
  const { eventId, event, budgetId, recordId } = body;
  let error: HttpResponseError;
  if (err instanceof HttpError) {
    error = {
      statusCode: err.statusCode,
      message: err.message,
    }
  }
  else {
    error = {
      statusCode: 500,
      message: err.message ?? "INTERNAL_SERVER_ERROR"
    };
  }
  return {
      eventId,
      event,
      budgetId,
      recordId,  
      error
  };
}