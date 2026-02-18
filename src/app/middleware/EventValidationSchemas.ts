import z from "zod";
import { EventType } from "../../core/Types.js";

const NonEmptyString = z.string().nonempty();
const NonNegativeInt = z.number().int().nonnegative();
const EpochMillis = z.number().int().nonnegative();
// decimal-as-string to preserve precision
const DecimalString = z.string().regex(/^\d+(\.\d+)?$/);

const EventCommonSchema = z.object({
    budgetId: z.uuid(),
    when: EpochMillis,
})

/**
 * Individual event schemas
 */
const EditBudgetEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.EDIT_BUDGET),
    title: z.string().optional(),
    details: z.string().optional(),
    version: NonNegativeInt,
});


const DeleteBudgetEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.DELETE_BUDGET),
    version: NonNegativeInt,
});

const AddCategoryEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.ADD_CATEGORY),
    id: NonEmptyString,
    name: NonEmptyString,
    allocate: DecimalString,
});

const EditCategoryEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.EDIT_CATEGORY),
    id: NonEmptyString,
    name: z.string().optional(),
    allocate: DecimalString.optional(),
    version: NonNegativeInt,
});

const DeleteCategoryEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.DELETE_CATEGORY),
    id: NonEmptyString,
    version: NonNegativeInt,
});

const AddExpenseEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.ADD_EXPENSE),
    id: NonEmptyString,
    categoryId: NonEmptyString,
    date: z.iso.date(),
    amount: DecimalString,
    note: z.string().optional(),
});

const EditExpenseEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.EDIT_EXPENSE),
    id: NonEmptyString,
    date: z.iso.date().optional(),
    amount: DecimalString.optional(),
    note: z.string().optional(),
    version: NonNegativeInt,
});

const DeleteExpenseEventSchema = EventCommonSchema.extend({
    event: z.literal(EventType.DELETE_EXPENSE),
    id: NonEmptyString,
    version: NonNegativeInt,
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
    budgetId: z.uuid(),
    event: z.string(),
    when: EpochMillis,
  })).min(1).max(25)
});


// Query schema for fetching sync events
export const GetEventsQuerySchema = z.object({
    budgetId: z.uuid(),
    key: z.coerce.number().int().positive().optional(),
    count: z.coerce.number().int().positive().optional(),
});