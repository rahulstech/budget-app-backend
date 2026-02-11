import z from "zod";
import { EventType } from "../core/CoreTypes.js";

/**
 * Shared primitives
 */
const NonEmptyString = z.string().nonempty();
const NonNegativeInt = z.number().int().nonnegative();
const EpochMillis = z.number().int().nonnegative();

// decimal-as-string to preserve precision
const DecimalString = z.string().regex(/^\d+(\.\d+)?$/);


export const CreateBudgetSchema = z.object({
  id: z.string().nonempty(),
  title: z.string().nonempty(),
  details: z.string().optional(),
  lastModified: z.number().int().nonnegative(),
}).strict();


/**
 * Individual event schemas
 */
const EditBudgetEventSchema = z.object({
  event: z.literal(EventType.EDIT_BUDGET),
  title: z.string().optional(),
  details: z.string().optional(),
  version: NonNegativeInt,
  lastModified: EpochMillis,
}).strict();


const DeleteBudgetEventSchema = z.object({
  event: z.literal(EventType.DELETE_BUDGET),
  version: NonNegativeInt,
  lastModified: EpochMillis,
}).strict();

const AddCategoryEventSchema = z.object({
  event: z.literal(EventType.ADD_CATEGORY),
  id: NonEmptyString,
  name: NonEmptyString,
  allocate: DecimalString,
  lastModified: EpochMillis,
}).strict();

const EditCategoryEventSchema = z.object({
  event: z.literal(EventType.EDIT_CATEGORY),
  id: NonEmptyString,
  name: z.string().optional(),
  amount: DecimalString.optional(),
  version: NonNegativeInt,
  lastModified: EpochMillis,
}).strict();

const DeleteCategoryEventSchema = z.object({
  event: z.literal(EventType.DELETE_CATEGORY),
  id: NonEmptyString,
  version: NonNegativeInt,
  lastModified: EpochMillis,
}).strict();

const AddExpenseEventSchema = z.object({
  event: z.literal(EventType.ADD_EXPENSE),
  id: NonEmptyString,
  categoryId: NonEmptyString,
  date: z.iso.date(),
  amount: DecimalString,
  note: z.string().optional(),
  lastModified: EpochMillis,
}).strict();

const EditExpenseEventSchema = z.object({
  event: z.literal(EventType.EDIT_EXPENSE),
  id: NonEmptyString,
  categoryId: NonEmptyString,
  date: z.iso.date().optional(),
  amount: DecimalString.optional(),
  note: z.string().optional(),
  version: NonNegativeInt,
  lastModified: EpochMillis,
}).strict();

const DeleteExpenseEventSchema = z.object({
  event: z.literal(EventType.DELETE_EXPENSE),
  id: NonEmptyString,
  version: NonNegativeInt,
  lastModified: EpochMillis,
}).strict();

/**
 * Discriminated union: a single event
 */
export const EventSchema = z.discriminatedUnion("event", [
  EditBudgetEventSchema,
  DeleteBudgetEventSchema,
  AddCategoryEventSchema,
  EditCategoryEventSchema,
  DeleteCategoryEventSchema,
  AddExpenseEventSchema,
  EditExpenseEventSchema,
  DeleteExpenseEventSchema,
]);

/**
 * Batch schema: 1–25 events
 */
export const EventsBatchSchema = z.array(
  z.looseObject({
    event: z.string(),
    lastModified: EpochMillis
  })
).min(1).max(25);


// Query schema for fetching sync events
export const GetEventsQuerySchema = z.object({
  after: z.coerce.number().int().optional().default(0),
  count: z.coerce.number().int().optional().default(20),
}).strict();

export const SnapShotQuerySchema = z.object({
  entity: z.enum(["budget", "participant", "category", "expense"]),
  page: z.coerce.number().int().optional(),
  per_page: z.coerce.number().int().optional(),
}).strict()


export type EventBatchRequestModel = z.infer<typeof EventsBatchSchema>;

export type EventRequestModel = z.infer<typeof EventSchema>;

export type SyncRequestModel = z.infer<typeof GetEventsQuerySchema>;

export type SnapShotRequestModel = z.infer<typeof SnapShotQuerySchema>;