import { HttpError } from "../../core/HttpError.js";
import { EntityType } from "../../core/Types.js";
import { BudgetService } from "../../service/budget/BudgetService.js";
import { CreateBudgetDto } from "../../service/Dtos.js";
import { ControllerParams, ResponseModel } from "../Types.js";


// Create a budget
export async function handlePostBudget(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { userId, body } = params;

  const dto: CreateBudgetDto = {
    eventId: body.eventId,
    id: body.id,
    actorUserId: userId,
    title: body.title,
    details: body.details,
    when: body.when,
  };

  const result = await service.createBudget(dto);
  return result;
}

// Join Participant
export async function handleJoinBudget(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { budgetId, userId } = params
  return await service.addParticipant({ budgetId, actorUserId: userId, userId, joinedAt: Date.now() });
}

// Leave Participant
export async function handleLeaveBudget(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { budgetId, userId } = params;
  const result = await service.removeParticipant({ budgetId, actorUserId: userId, userId });
  return {
    budgetId: result.budgetId,
    userId: result.recordId
  };
}

export async function handleGetSnapShot(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { userId, entity, budgetId, recordId, key, count } = params;

  await service.canGetSnapShotOrThrow(budgetId, userId);

  switch(entity) {
    case EntityType.BUDGET: {
      return service.getBudget(budgetId);
    }
    case EntityType.CATEGORY: {
      if (recordId) {
        return getSnapShotOfCategory(service, recordId);
      }
      else {
        return getSnapShotOfCategories(service, budgetId);
      }
    }
    case EntityType.EXPENSE: {
      if (recordId) {
        return getSnapShotOfExpense(service, recordId)
      }
      else {
        return getSnapShotOfExpenses(service, budgetId, key, count)
      }
    }
    case EntityType.PARTICIPANT: {
      return getSnapShotOfParticipants(service,budgetId);
    }
  }

  throw new HttpError.ServerError(`can not get snaphot of unknow entity ${entity}`);
}

export async function handleGetBudgetsOfParticipant(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { userId, key, count } = params;
  const { nextKey, budgets } = await service.getBudgetsOfParticipant(userId, key, count);
  return {
    userId,
    key,
    nextKey,
    budgets,
  };
}

export async function handleGetLastEventSequenceOfBudget(service: BudgetService, params: ControllerParams): Promise<ResponseModel> {
  const { budgetId, userId } = params;

  await service.canGetSnapShotOrThrow(budgetId, userId);

  const lastSequence = await service.getLastEventSequence(budgetId);

  return {
    budgetId,
    lastSequence
  };
}

async function getSnapShotOfExpense(service: BudgetService, expenseId: string): Promise<ResponseModel> {
  return service.getExpense(expenseId);
}

async function getSnapShotOfExpenses(service: BudgetService, budgetId: string, key: number, count: number): Promise<ResponseModel> {
  const { nextKey, items } = await service.getExpensesOfBudget(budgetId, key, count);
  return { 
    budgetId,
    key,
    nextKey,
    expenses: items
  };
}


async function getSnapShotOfCategory(service: BudgetService, categoryId: string): Promise<ResponseModel> {
  return service.getCategory(categoryId)
}

async function getSnapShotOfCategories(service: BudgetService, budgetId: string): Promise<ResponseModel> {
  const result = await service.getCategoriesOfBudget(budgetId)
  return { categories: result };
}

async function getSnapShotOfParticipants(service: BudgetService, budgetId: string): Promise<ResponseModel> {
  const result = await service.getParticipantsOfBudget(budgetId);
  return { participants: result };
}