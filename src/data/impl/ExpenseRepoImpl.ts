import { and, asc, eq } from "drizzle-orm";
import { ExpenseRepo } from "../ExpenseRepo.js";
import { expenses } from "../schema/Tables.js";
import { Database, Expense, UpdateExpenseModel } from "../Models.js";
import { RepoError } from "../RepoError.js";
import { PagedResult } from "../../core/CoreTypes.js";

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

    async getExpenses(budgetId: string, page: number, perPage: number = 20): Promise<PagedResult<number, Expense>> {
        const limit = perPage;
        const offset = (page - 1) * perPage;  

        const items = await this.db
                .select()
                .from(expenses)
                .where(eq(expenses.budgetId, budgetId))
                .limit(limit)
                .offset(offset)
                .orderBy(asc(expenses.serverCreatedAt));

        return { key: page, items };
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
