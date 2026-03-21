import { AppError } from "../../core/AppError.js";
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
  const { userId, entity, budgetId, recordId } = params;

  await service.canGetSnapShotOrThrow(budgetId, userId);

  switch(entity) {
    case EntityType.BUDGET: {
      return service.getBudget(budgetId);
    }
    case EntityType.CATEGORY: {
      return service.getCategory(recordId);
    }
    case EntityType.EXPENSE: {
      return service.getExpense(recordId);
    }
  }

  throw new AppError(`can not get snaphot of unknow entity ${entity}`);
}