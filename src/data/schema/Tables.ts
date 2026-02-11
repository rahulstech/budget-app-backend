import { pgTable, uuid, text, bigint, integer, numeric, json, index, primaryKey, date } from "drizzle-orm/pg-core";

const CommonFields = {

  // utc epoch millis of record creation in server
  serverCreatedAt: bigint("server_created_at", { mode: "number" }).notNull(),

  // client sets this (epoch millis)
  offlineLastModified: bigint("offline_last_modified", { mode: "number" }).notNull(),

  // optimistic concurrency control
  version: integer("version").notNull(),

  // user who created the record
  createdBy: text("created_by").notNull(),
};



export const budgets = pgTable("budgets", {
  // client sent global id as primary key
  id: uuid("id").primaryKey(),

  title: text("title").notNull(),

  details: text("details"),

  ...CommonFields,
});



export const categories = pgTable('categories', {
  // client sent global id as primary key
    id: uuid('id').primaryKey(),
    
    name: text('name').notNull(),

    // currency stored as numeric(12,2). change precision/scale if needed.
    allocate: numeric('allocate', { precision: 12, scale: 2 }).notNull(),

    budgetId: text('budget_id').notNull(),

    ...CommonFields

}, (table) => [
  index('idx_categories_budgetId').on(table.budgetId),
]);



export const expenses = pgTable('expenses', {
  // client sent global id as primary key
  id: uuid('id').primaryKey(),

  budgetId: uuid('budget_id').notNull(),
  
  categoryId: uuid('category_id').notNull(),

  // iso format date of expense
  date: date("date", { mode: "string" }).notNull(),

  // currency stored as numeric(12,2).
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),

  note: text('note'),

  ...CommonFields

}, (table) => [
  index('idx_expenses_budgetId').on(table.budgetId),
]);



export const participants = pgTable('participants', {

  // budget where the participant is added
  budgetId: uuid('budget_id').notNull(),

  // auth system id for the participant
  userId: text('user_id').notNull(),

}, (table) => [
  primaryKey({ name: "pk_participants", columns: [table.budgetId, table.userId] }),
]);



export const events = pgTable("accepted_events", {
  id: uuid("id").primaryKey(),

  // always increasing integer value per budget
  sequence: bigint("sequence_no", { mode: "number" }).notNull(),

  serverCreatedAt: bigint("created_at", { mode: "number" }).notNull(),

  // event associated budget
  budgetId: uuid("budget_id").notNull(),

  // event type
  type: text("type").notNull(),

  // utc epoch millis when event actually occured in client end
  when: bigint("when", { mode: "number" }).notNull(),

  // user who made the event
  userId: text("user_id").notNull(),

  // id of the record in its table
  recordId: text("record_id").notNull(),

  data: json("data"),
}, (table) => [
  index("idx_accepted_events_budgetId_userId").on(table.budgetId, table.userId)
]);