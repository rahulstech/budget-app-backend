import { BudgetRepo } from "../BudgetRepo.js";
import { budgets, participants } from "../schema/Tables.js";
import { Budget, Database, SelectBudgetModel, UpdateBudgetModel } from "../Models.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { RepoError } from "../RepoError.js";

export class BudgetRepoImpl implements BudgetRepo {

  constructor(private readonly db: Database) {}

  async insertBudget(budget: Budget): Promise<Budget> {
    const [newBudget] = await this.db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    const [budget] = await this.db.select().from(budgets).where(eq(budgets.id,id));
    return budget ?? null;
  }

  async getBudgetsOfParticipant(userId: string, limit: number, offset: number): Promise<SelectBudgetModel[]> {
    const results = await this.db.select({
      id: budgets.id,
      title: budgets.title,
      details: budgets.details,
      version: budgets.version,
      offlineLastModified: budgets.offlineLastModified,
      createdBy: budgets.createdBy
    })
      .from(budgets)
      .innerJoin(participants, eq(budgets.id, participants.budgetId))
      .where(eq(participants.userId, userId))
      .orderBy(desc(budgets.serverCreatedAt))
      .limit(limit)
      .offset(offset);

    return results;
  }

  async updateBudget(id: string, updates: UpdateBudgetModel, expectedVersion: number, lastModified: number): Promise<Budget> {
    // prepare update payload
    const [row] = await this.db
      .update(budgets)
      .set({
        ...updates,
        version: sql`version + 1`,
        offlineLastModified: lastModified
      })
      .where(eq(budgets.id, id))
      .returning();

    if (row && row.version !== expectedVersion+1) {
      throw new RepoError("VERSION_MISMATCH", { ...row, version: row.version-1 });
    }

    return row;
  }

  async deleteBudget(id: string, expectedVersion: number): Promise<boolean> {
    // Implementation for deleting a budget from the database
    const [row] = await this.db.delete(budgets)
      .where(and(
        eq(budgets.id,id),
        eq(budgets.version,expectedVersion)
      ))
      .returning();

      if (row && row.version !== expectedVersion) {
        throw new RepoError("VERSION_MISMATCH", row);
      }

      return typeof row !== undefined;
  }

  
}