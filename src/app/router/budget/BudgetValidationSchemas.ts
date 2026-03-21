import z from "zod";

export const PostBudgetBodySchema = z.object({
  eventId: z.uuid(),
  id: z.uuid(),
  title: z.string().nonempty(),
  details: z.string().optional(),
  when: z.number().int().nonnegative(),
});

export const BudgetIdParamsSchema = z.object({
  budgetId: z.uuid()
});

export const GetCategorySnapShotParamsSchema = z.object({
  categoryId: z.uuid()
});

export const GetExpenseSnapShotParamsSchema = z.object({
  expenseId: z.uuid()
});
