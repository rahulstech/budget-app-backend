import { BudgetRepo } from "../BudgetRepo.js";
import { budgets } from "../schema/Tables.js";
import { Budget, Database, UpdateBudgetModel } from "../Models.js";
import { and, eq } from "drizzle-orm";
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

  async updateBudget(id: string, updates: UpdateBudgetModel, expectedVersion: number, lastModified: number): Promise<Budget> {
    // prepare update payload
    const [row] = await this.db
      .update(budgets)
      .set({
        ...updates,
        version: expectedVersion + 1,
        offlineLastModified: lastModified
      })
      .where(and(eq(budgets.id, id), eq(budgets.version, expectedVersion)))
      .returning();

      console.log("row: ", row);

    if (!row) {
      // no rows updated -> version mismatch or not found
      throw new RepoError("VERSION_MISMATCH");
    }

    return row;
  }

  async deleteBudget(id: string, expectedVersion: number): Promise<void> {
    // Implementation for deleting a budget from the database
    const [row] = await this.db.delete(budgets)
      .where(and(
        eq(budgets.id,id),
        eq(budgets.version,expectedVersion)
      ))
      .returning();

      if (row && row.version !== expectedVersion) {
        throw new RepoError("VERSION_MISMATCH");
      }
  }

  
}