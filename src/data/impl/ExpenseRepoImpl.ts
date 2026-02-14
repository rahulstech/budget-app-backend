import { and, asc, eq } from "drizzle-orm";
import { ExpenseRepo } from "../ExpenseRepo.js";
import { expenses } from "../schema/Tables.js";
import { Database, Expense, UpdateExpenseModel } from "../Models.js";
import { RepoError } from "../RepoError.js";

export class ExpenseRepoImpl implements ExpenseRepo {

    constructor(private readonly db: Database) {}

    /* ================= Insert ================= */

    async insertExpense(expense: Expense): Promise<Expense> {
        const [row] = await this.db
            .insert(expenses)
            .values(expense)
            .returning();
        return row;
    }

    async getExpenses(
        budgetId: string, limit: number, offset: number = 20
    ): Promise<Omit<Expense,"serverCreatedAt">[]> {
        return await this.db
                .select({
                    id: expenses.id,
                    budgetId: expenses.budgetId,
                    categoryId: expenses.categoryId,
                    date: expenses.date,
                    amount: expenses.amount,
                    note: expenses.note,
                    version: expenses.version,
                    offlineLastModified: expenses.offlineLastModified,
                    createdBy: expenses.createdBy,
                })
                .from(expenses)
                .where(eq(expenses.budgetId, budgetId))
                .orderBy(asc(expenses.serverCreatedAt))
                .limit(limit)
                .offset(offset);
    }

    /* ================= Update ================= */

    async updateExpense(
        id: string,
        updates: UpdateExpenseModel,
        expectedVersion: number,
        newLastModified: number
    ): Promise<Expense> {

        const [row] = await this.db
            .update(expenses)
            .set({
                ...updates,
                version: expectedVersion + 1,
                offlineLastModified: newLastModified,
            })
            .where(
                and(
                    eq(expenses.id, id),
                )
            )
            .returning();
        
        if (!row) {
            throw new RepoError("VERSION_MISMATCH");
        }

        return row;
    }

    /* ================= Delete ================= */

    async deleteExpense(id: string, expectedVersion: number): Promise<void> {
        const [row] = await this.db
            .delete(expenses)
            .where(eq(expenses.id, id))
            .returning();

        if (row && row.version !== expectedVersion) {
            throw new RepoError("VERSION_MISMATCH");
        }
    }
}
