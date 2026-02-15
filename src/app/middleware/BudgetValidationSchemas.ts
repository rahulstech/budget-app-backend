import z from "zod";
import { EventType } from "../../core/Types.js";

/**
 * Shared primitives
 */
const NonEmptyString = z.string().nonempty();
const NonNegativeInt = z.number().int().nonnegative();
const EpochMillis = z.number().int().nonnegative();

// decimal-as-string to preserve precision
const DecimalString = z.string().regex(/^\d+(\.\d+)?$/);


export const PostBudgetBodySchema = z.object({
  id: z.string().nonempty(),
  title: z.string().nonempty(),
  details: z.string().optional(),
  lastModified: z.number().int().nonnegative(),
});


/**
 * Individual event schemas
 */
const EditBudgetEventSchema = z.object({
  event: z.literal(EventType.EDIT_BUDGET),
  title: z.string().optional(),
  details: z.string().optional(),
  version: NonNegativeInt,
  lastModified: EpochMillis,
});


const DeleteBudgetEventSchema = z.object({
  event: z.literal(EventType.DELETE_BUDGET),
  version: NonNegativeInt,
  lastModified: EpochMillis,
});

const AddCategoryEventSchema = z.object({
  event: z.literal(EventType.ADD_CATEGORY),
  id: NonEmptyString,
  name: NonEmptyString,
  allocate: DecimalString,
  lastModified: EpochMillis,
});

const EditCategoryEventSchema = z.object({
  event: z.literal(EventType.EDIT_CATEGORY),
  id: NonEmptyString,
  name: z.string().optional(),
  allocate: DecimalString.optional(),
  version: NonNegativeInt,
  lastModified: EpochMillis,
});

const DeleteCategoryEventSchema = z.object({
  event: z.literal(EventType.DELETE_CATEGORY),
  id: NonEmptyString,
  version: NonNegativeInt,
  lastModified: EpochMillis,
});

const AddExpenseEventSchema = z.object({
  event: z.literal(EventType.ADD_EXPENSE),
  id: NonEmptyString,
  categoryId: NonEmptyString,
  date: z.iso.date(),
  amount: DecimalString,
  note: z.string().optional(),
  lastModified: EpochMillis,
});

const EditExpenseEventSchema = z.object({
  event: z.literal(EventType.EDIT_EXPENSE),
  id: NonEmptyString,
  date: z.iso.date().optional(),
  amount: DecimalString.optional(),
  note: z.string().optional(),
  version: NonNegativeInt,
  lastModified: EpochMillis,
});

const DeleteExpenseEventSchema = z.object({
  event: z.literal(EventType.DELETE_EXPENSE),
  id: NonEmptyString,
  version: NonNegativeInt,
  lastModified: EpochMillis,
});

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
export const PostEventsBodySchema = z.object({
  events: z.array(z.looseObject({
    event: z.string(),
    lastModified: EpochMillis
  })).min(1).max(25)
});


// Query schema for fetching sync events
export const GetEventsQuerySchema = z.object({
  key: z.coerce.number().int().positive().optional(),
  count: z.coerce.number().int().positive().optional(),
});

export const SnapShotQuerySchema = z.object({
  entity: z.enum(["budget", "participant", "category", "expense"]),
  key: z.coerce.number().int().positive().optional(),
  count: z.coerce.number().int().positive().optional(),
});

export const GetBudgetsQuerySchema = z.object({
  key: z.coerce.number().int().positive().optional(),
  count: z.coerce.number().int().positive().optional(),
});

// export const DeleteBudgetQuerySchema = z.object({
//   version: z.coerce.number().int().positive()
// });
