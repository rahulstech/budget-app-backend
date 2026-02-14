import { PagedResult } from "../core/Types.js";
import { Expense, UpdateExpenseModel } from "./Models.js";

export interface ExpenseRepo {

    /**
     * Inserts a new expense.
     */
    insertExpense(expense: Expense): Promise<Expense>

    /**
     * Lists expenses for a budget with paging.
     *
     * What this checks:
     * - Nothing related to authorization
     * - Budget existence is assumed to be validated by caller
     */
    getExpenses(
        budgetId: string,
        limit: number,
        offset: number,
    ): Promise<Omit<Expense,"serverCreatedAt">[]>

    /**
     * Updates an expense using optimistic locking.
     *
     * What this checks:
     * - Expense id exists
     * - Version matches expectedVersion
     *
     * Authorization is handled by the service layer.
     */
    updateExpense(id: string,updates: UpdateExpenseModel,expectedVersion: number,newLastModified: number): Promise<Expense>

    /**
     * Deletes multiple expenses by id.
     *
     * What this checks:
     * - Deletes if id exist
     * - Version matches expectedVersion
     *
     * Authorization is handled by the service layer.
     */
    deleteExpense(id: string, expectedVersion: number): Promise<void>
}
