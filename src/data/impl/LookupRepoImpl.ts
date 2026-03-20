import { LookupRepo } from "../LookupRepo.js";
import { budgets, categories, expenses, participants, events } from "../schema/Tables.js";
import { and, count, desc, eq } from "drizzle-orm";
import { Database } from "../Models.js";
import { EventType } from "../../core/Types.js";
import { RepoError } from "../RepoError.js";

export class LookupRepoImpl implements LookupRepo {

  constructor(private readonly db: Database) {}

  /* ================= Budget ================= */

  async budgetExists(budgetId: string, ignoreDeleted: boolean = false): Promise<boolean> {
    try {
      const [budget] = await this.db
        .select({ isDeleted: budgets.isDeleted })
        .from(budgets)
        .where(eq(budgets.id, budgetId))
        .limit(1)

      if (budget) {
        return ignoreDeleted || !budget.isDeleted;
      }

      return false;
    }
    catch (error: any) {
      throw RepoError.create({
        error,
        message: "budget exists check failed"
      });
    }
  }

  async isCreatorOfBudget(budgetId: string, userId: string): Promise<boolean> {
    try {
      const row = await this.db
        .select({ id: budgets.id })
        .from(budgets)
        .where(
          and(
            eq(budgets.id, budgetId),
            eq(budgets.createdBy, userId)
          )
        )
        .limit(1)

      return row.length > 0
    }
    catch (error: any) {
      throw RepoError.create({
        error,
        message: "is creator of budget check failed"
      });
    }
  }

  /* ================= Expense ================= */

  async isCreatorOfExpense(
    expenseId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const row = await this.db
        .select({ id: expenses.id })
        .from(expenses)
        .where(
          and(
            eq(expenses.id, expenseId),
            eq(expenses.createdBy, userId)
          )
        )
        .limit(1)

      return row.length > 0
    }
    catch (error: any) {
      throw RepoError.create({
        error,
        message: "is creator of expense check failed"
      });
    }
  }

  /* ================= Participants ================= */

  async wasParticipantAtTime(
    budgetId: string,
    userId: string,
    atMillis: number
  ): Promise<boolean> {
    try {
      const [resultLastAdded] = await this.db.select({ whenLastAdded: events.when }).from(events)
      .where(and(
        eq(events.budgetId, budgetId),
        eq(events.type, EventType.ADD_PARTICIPANT),
        eq(events.recordId, userId))
      )
      .orderBy(desc(events.serverCreatedAt))
      .limit(1);

      if (!resultLastAdded) {
        return false;
      }

      const [resultLastRemoved] = await this.db.select({ whenLastRemoved: events.when }).from(events)
      .where(and(
        eq(events.budgetId, budgetId),
        eq(events.type, EventType.REMOVE_PARTICIPANT),
        eq(events.recordId, userId))
      )
      .orderBy(desc(events.serverCreatedAt))
      .limit(1);

      if (!resultLastRemoved) {
        return resultLastAdded.whenLastAdded <= atMillis;
      }

      return resultLastRemoved.whenLastRemoved < resultLastAdded.whenLastAdded 
                && resultLastAdded.whenLastAdded <= atMillis;
    }
    catch (error: any) {
      throw RepoError.create({
        error,
        message: "was participant at time check failed"
      });
    }
  }

  async countBudgetParticipants(budgetId: string): Promise<number> {
    try {
      const [row] = await this.db
          .select({
              count: count(participants.budgetId)
          })
          .from(participants)
          .where(eq(participants.budgetId, budgetId));
      
      return row?.count;
    }
    catch (error: any) {
      throw RepoError.create({
        error,
        message: "count budget participants failed"
      });
    }
  }
  
  async isParticipantOfBudget(budgetId: string, userId: string): Promise<boolean> {
    try {
      const results = await this.db
          .select({ userId: participants.userId })
          .from(participants)
          .where(and(
              eq(participants.budgetId, budgetId),
              eq(participants.userId, userId)
          ));

      return results.length > 0;
    }
    catch (error: any) {
      throw RepoError.create({
        error,
        message: "is participant of budget check failed"
      });
    }
  }
}