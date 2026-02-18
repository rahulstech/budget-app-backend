import { HttpError } from "../../core/HttpError.js";
import { BudgetService } from "../../service/BudgetService.js";
import { CreateBudgetDto } from "../../service/Dtos.js";
import { ControllerParams } from "../Types.js";


// Create a budget
export async function handlePostBudget(service: BudgetService, params: ControllerParams) {
  const { userId, body } = params;
  const dto: CreateBudgetDto = {
    id: body.id,
    actorUserId: userId,
    title: body.title,
    details: body.details,
    when: body.when,
  };

  return await service.createBudget(dto);
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
      return { budgetId, budget: await service.getBudget(budgetId) };
    }
    case "participant": {
      return { budgetId, participants: await service.getParticipantsOfBudget(budgetId) };
    }
    case "category": {
      return { budgetId, categories: await service.getCategoriesOfBudget(budgetId) };
    }
    case "expense": {
      const { items } = await service.getExpensesOfBudget(budgetId, key, count);
      return { budgetId, key, nextKey: key+1, expenses: items };
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
