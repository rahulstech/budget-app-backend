import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { budgets, categories, events, expenses, participants } from "./schema/Tables.js";

export type Database = NodePgDatabase | PgTransaction<any,any,any>;

export type Budget = typeof budgets.$inferSelect;

export type UpdateBudgetModel = Partial<Pick<Budget, "title" | "details">>;

export type Participant = typeof participants.$inferSelect;

export type Category = typeof categories.$inferSelect;

export type UpdateCategoryModel = Partial<Pick<Category, "name" | "allocate">>;

export type Expense = typeof expenses.$inferSelect;

export type UpdateExpenseModel = Partial<Pick<Expense, "date" | "amount" | "note">>;

export type Event = typeof events.$inferSelect;

