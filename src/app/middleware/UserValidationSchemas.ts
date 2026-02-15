import z from "zod";

export const CreateUserBodySchema = z.object({
    firstName: z.string(),
    lastName: z.string().optional()
});

export const UpdateUserBodySchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional()
});