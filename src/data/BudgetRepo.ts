import { Budget, UpdateBudgetModel } from "./Models.js";

export interface BudgetRepo {

  insertBudget(budget: Budget): Promise<Budget>;

  getBudgetById(id: string): Promise<Budget | null>;
  
  updateBudget(id: string, budget: UpdateBudgetModel, expectedVersion: number, lastModified: number): Promise<Budget>;
  
  deleteBudget(id: string, expectedVersion: number): Promise<void>;
}