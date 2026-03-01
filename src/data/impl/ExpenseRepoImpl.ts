import { and, asc, eq, sql } from "drizzle-orm";
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

    async getExpenseById(id: string): Promise<Expense | null> {
        const [row] = await this.db.select().from(expenses).where(eq(expenses.id, id));
        return row || null;
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
                version: sql`version + 1`,
                offlineLastModified: newLastModified,
            })
            .where(eq(expenses.id, id))
            .returning();
        
        if (row && row.version !== expectedVersion+1) {
            throw new RepoError("VERSION_MISMATCH", { ...row, version: row.version-1 });
        }

        return row;
    }

    /* ================= Delete ================= */

    async deleteExpense(id: string, expectedVersion: number): Promise<boolean> {
        const [deletedExpense] = await this.db
            .delete(expenses)
            .where(eq(expenses.id, id))
            .returning();

        if (deletedExpense && deletedExpense.version !== expectedVersion) {
            throw new RepoError("VERSION_MISMATCH", deletedExpense);
        }

        return typeof deletedExpense !== undefined;
    }
}
