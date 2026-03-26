import { asc, eq, sql } from "drizzle-orm";
import { ExpenseRepo } from "../ExpenseRepo.js";
import { expenses } from "../schema/Tables.js";
import { Database, Expense, UpdateExpenseModel } from "../Models.js";
import { RecordNotFound, RepoError, VersionMismatchError } from "../RepoError.js";
import { logDebug } from "../../core/Logger.js";

export class ExpenseRepoImpl implements ExpenseRepo {

    constructor(private readonly db: Database) {}

    /* ================= Insert ================= */

    async insertExpense(expense: Expense): Promise<Expense> {
        try {
            const [row] = await this.db
                .insert(expenses)
                .values(expense)
                .returning()
                .onConflictDoNothing();
            return row;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId: expense.budgetId, categoryId: expense.categoryId, id: expense.id },
                message: "insert expense failed"
            });
        }
    }

    async getExpenseById(id: string): Promise<Expense | null> {
        try {
            const [row] = await this.db.select().from(expenses).where(eq(expenses.id, id));
            return row ?? null;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "get expense by id failed"
            });
        }
    }

    async getExpenses(
        budgetId: string, limit: number, offset: number = 20
    ): Promise<Omit<Expense,"serverCreatedAt">[]> {

        logDebug("get expenses of budget", { budgetId, limit, offset });
        
        try {
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
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId, limit, offset },
                message: "get expenses failed"
            });
        }
    }

    /* ================= Update ================= */

    async updateExpense(
        id: string,
        updates: UpdateExpenseModel,
        expectedVersion: number,
        newLastModified: number
    ): Promise<Expense> {
        try {
            const [row] = await this.db
                .update(expenses)
                .set({
                    ...updates,
                    version: sql`version + 1`,
                    offlineLastModified: newLastModified,
                })
                .where(eq(expenses.id, id))
                .returning();
            
            if (!row) {
                throw new RecordNotFound({ id },"expense not found, update expense failed");
            }
            if (row.version !== expectedVersion+1) {
                throw new VersionMismatchError(
                    { id, expectedVersion, actualVersion: row.version-1 },
                    "version mismatch, update expense failed"
                )
            }

            return row;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "update expense failed"
            });
        }
    }

    /* ================= Delete ================= */

    async deleteExpense(id: string, expectedVersion: number): Promise<boolean> {
        try {
            const [row] = await this.db
                .delete(expenses)
                .where(eq(expenses.id, id))
                .returning({ version: expenses.version });

            if (row && row.version !== expectedVersion) {
                throw new VersionMismatchError(
                    { id, expectedVersion, actualVersion: row.version },
                    "version mismatch, delete expense failed"
                )
            }

            return true;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "delete expense failed"
            });
        }
    }
}