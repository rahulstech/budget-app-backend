import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { budgets, categories, events, expenses, participants, users } from "./schema/Tables.js";

export type Database = NodePgDatabase | PgTransaction<any,any,any>;

export type Budget = typeof budgets.$inferSelect;

export type UpdateBudgetModel = Partial<Pick<Budget, "title" | "details" | "isDeleted">>;

export type SelectBudgetModel = Omit<Budget,"serverCreatedAt"|"isDeleted">

export type Participant = typeof participants.$inferSelect;

export type Category = typeof categories.$inferSelect;

export type UpdateCategoryModel = Partial<Pick<Category, "name" | "allocate">>;

export type Expense = typeof expenses.$inferSelect;

export type UpdateExpenseModel = Partial<Pick<Expense, "date" | "amount" | "note">>;

export type Event = typeof events.$inferSelect;

export type User = typeof users.$inferSelect;

export type UserPublicInfo = {
    id: string,
    firstName: string,
    lastName: string | null,
    displayPhotoThumbnailUrl: string | null,
    displayPhotoRawUrl: string | null,
};

export type ParticipantUser = {
    id: string,
    budgetId: string,
    userExists: boolean,
    firstName: string | null,
    lastName: string | null,
    displayPhotoThumbnailUrl: string | null,
    displayPhotoRawUrl: string | null,
    joinedAt: number,
}

export type UpdateUserModel = Partial<Omit<User,"id">>;

