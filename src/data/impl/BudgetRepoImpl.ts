import { BudgetRepo } from "../BudgetRepo.js";
import { budgets, participants } from "../schema/Tables.js";
import { Budget, Database, SelectBudgetModel, UpdateBudgetModel } from "../Models.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { RecordNotFound, RepoError, UniqueConstraintError, VersionMismatchError } from "../RepoError.js";

export class BudgetRepoImpl implements BudgetRepo {

  constructor(private readonly db: Database) {}

  async insertBudget(budget: Budget): Promise<Budget> {

    try {
      const [newBudget] = await this.db.insert(budgets)
                        .values(budget).returning()
                        .onConflictDoNothing();

      if (!newBudget) {
        throw new UniqueConstraintError({ budgetId: budget.id });
      }
      
      return newBudget;
    }
    catch(error: any) {
      throw RepoError.create({
        error, 
        message: "insert budget failed"
      })
    }
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    const [budget] = await this.db.select().from(budgets).where(eq(budgets.id,id));
    return budget ?? null;
  }

  async getBudgetsOfParticipant(
    userId: string, 
    limit: number, 
    offset: number
  ): Promise<Omit<Budget,"isDeleted"|"serverCreatedAt">[]> {
    try {
      const rows = await this.db.select({
        id: budgets.id,
        title: budgets.title,
        details: budgets.details,
        createdBy: budgets.createdBy,
        version: budgets.version,
        offlineLastModified: budgets.offlineLastModified,
      })
      .from(participants)
      .innerJoin(budgets, eq(participants.budgetId, budgets.id))
      .where(eq(participants.userId, userId))
      .limit(limit)
      .offset(offset);
      return rows;
    }
    catch(error: any) {
      throw RepoError.create({
        error,
        message: "fail to get budgets of participants",
        context: { userId, limit, offset }
      });
    }
  }

  async updateBudget(id: string, updates: UpdateBudgetModel, expectedVersion: number, lastModified: number): Promise<Budget> {
    try {
      const [row] = await this.db
        .update(budgets)
        .set({
          ...updates,
          version: sql`version + 1`,
          offlineLastModified: lastModified
        })
        .where(eq(budgets.id, id))
        .returning();

      if (!row) {
        throw new RecordNotFound({id},"budget not found; update failed");
      }
      if (row.version !== expectedVersion+1) {
        throw new VersionMismatchError(
          { id, expectedVersion, actualVersion: row.version-1 },
          "version mismatch; update failed"
        )
      }

      return row;
    }
    catch(error: any) {
      throw RepoError.create({
        error,
        context:  { id }, 
        message: "update budget failed"
      })
    }
  }


  async deleteBudget(id: string, expectedVersion: number): Promise<boolean> {
    try {
      const [row] = await this.db.delete(budgets)
        .where(and(
          eq(budgets.id,id),
          eq(budgets.version,expectedVersion)
        ))
        .returning();

        if (row.version !== expectedVersion) {
          throw new VersionMismatchError(
            { id, expectedVersion, actualVersion: row.version },
            "version mismatch; delete failed"
          )
        }

        return true;
    }
    catch(error: any) {
      throw RepoError.create({
        error,
        context: { id }, 
        message: "delete budget failed"
      })
    }
  }
}