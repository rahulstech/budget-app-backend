import z from "zod";

export const CreateUserBodySchema = z.object({
    firstName: z.string(),
    lastName: z.string().optional()
});

export const UpdateUserBodySchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional()
});

export const GetPhotoUploadUrlQuerySchema = z.object({
    type: z.string(),
    size: z.coerce.number().positive()
})

export const ConfirmPhotoUploadUrlQuerySchema = z.object({
    key: z.string(),
})