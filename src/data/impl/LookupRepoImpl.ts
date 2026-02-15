import { LookupRepo } from "../LookupRepo.js";
import { budgets, categories, expenses, participants, events } from "../schema/Tables.js";
import { and, count, desc, eq } from "drizzle-orm";
import { Database } from "../Models.js";
import { EventType } from "../../core/Types.js";

export class LookupRepoImpl implements LookupRepo {

  constructor(private readonly db: Database) {}

  /* ================= Budget ================= */

  async budgetExists(budgetId: string, ignoreDeleted: boolean = false): Promise<boolean> {
    const [budget] = await this.db
      .select({ isDeleted: budgets.isDeleted })
      .from(budgets)
      .where(eq(budgets.id, budgetId))
      .limit(1)

    if (budget) {
      console.log(budget);
      return ignoreDeleted || !budget.isDeleted;
    }

    return false;
  }

  async isCreatorOfBudget(budgetId: string, userId: string): Promise<boolean> {
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

  /* ================= Category ================= */

  async categoryExists(categoryId: string): Promise<boolean> {
    const row = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1)

    return row.length > 0
  }

  async isCategoryOfBudget(budgetId: string,categoryId: string): Promise<boolean> {
    const row = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.budgetId, budgetId)
        )
      )
      .limit(1)

    return row.length > 0;
  }

  /* ================= Expense ================= */

  async expenseExists(expenseId: string): Promise<boolean> {
    const row = await this.db
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1)

    return row.length > 0
  }

  async isCreatorOfExpense(
    expenseId: string,
    userId: string
  ): Promise<boolean> {
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

  /* ================= Participants ================= */

  /**
   * Checks whether a user was a participant of a budget
   * at a specific moment in time.
   *
   * joinedAtMillis <= atMillis
   * AND (leftAtMillis IS NULL OR leftAtMillis > atMillis)
   */
  async wasParticipantAtTime(
    budgetId: string,
    userId: string,
    atMillis: number
  ): Promise<boolean> {

    const [resultLastAdded] = await this.db.select({ whenLastAdded: events.serverCreatedAt }).from(events)
    .where(and(
      eq(events.budgetId, budgetId),
      eq(events.type, EventType.ADD_PARTICIPANT),
      eq(events.recordId, userId))
    )
    .orderBy(desc(events.serverCreatedAt))
    .limit(1);

    if (!resultLastAdded) {
      // not an participant
      return false;
    }

    const [resultLastRemoved] = await this.db.select({ whenLastRemoved: events.serverCreatedAt }).from(events)
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

  async countBudgetParticipants(budgetId: string): Promise<number> {
        const [row] = await this.db
            .select({
                count: count(participants.budgetId)
            })
            .from(participants)
            .where(eq(participants.budgetId, budgetId));
        
        return row?.count;
    }
    
    async isParticipantOfBudget(budgetId: string, userId: string): Promise<boolean> {
        const results = await this.db
            .select({ userId: participants.userId })
            .from(participants)
            .where(and(
                eq(participants.budgetId, budgetId),
                eq(participants.userId, userId)
            ));

        return results.length > 0;
    }
}
