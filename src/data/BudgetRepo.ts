import { Budget, SelectBudgetModel, UpdateBudgetModel, } from "./Models.js";

export interface BudgetRepo {

  insertBudget(budget: Budget): Promise<Budget>

  getBudgetById(id: string): Promise<Budget | null>

  getBudgetsOfParticipant(userId: string, limit: number, offset: number): Promise<SelectBudgetModel[]>
  
  updateBudget(id: string, budget: UpdateBudgetModel, expectedVersion: number, lastModified: number): Promise<Budget>
  
  deleteBudget(id: string, expectedVersion: number): Promise<void>
}