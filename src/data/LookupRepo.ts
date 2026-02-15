export interface LookupRepo {
    
  budgetExists(budgetId: string, ignoreDeleted: boolean): Promise<boolean>

  categoryExists(categoryId: string): Promise<boolean>

  expenseExists(expenseId: string): Promise<boolean>

  isParticipantOfBudget(budgetId: string, userId: string): Promise<boolean>

  isCategoryOfBudget(budgetId: string, categoryId: string): Promise<boolean>

  wasParticipantAtTime(budgetId: string,userId: string, atMillis: number): Promise<boolean>

  isCreatorOfBudget(budgetId: string, userId: string): Promise<boolean>

  isCreatorOfExpense(expenseId: string, userId: string): Promise<boolean>

  countBudgetParticipants(budgetId: string): Promise<number>
}
