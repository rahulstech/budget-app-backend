import z from "zod";

export const PostBudgetBodySchema = z.object({
  id: z.string().nonempty(),
  title: z.string().nonempty(),
  details: z.string().optional(),
  when: z.number().int().nonnegative(),
});

export const SnapShotQuerySchema = z.object({
  entity: z.string(),
  key: z.coerce.number().int().positive().optional(),
  count: z.coerce.number().int().positive().optional(),
});

export const GetBudgetsQuerySchema = z.object({
  key: z.coerce.number().int().positive().optional(),
  count: z.coerce.number().int().positive().optional(),
});
