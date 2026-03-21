import z from "zod";

export const UpdateUserBodySchema = z.object({
    email: z.email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
});

export const GetPhotoUploadUrlQuerySchema = z.object({
    type: z.string(),
    size: z.coerce.number().positive()
})

export const ConfirmPhotoUploadBodySchema = z.object({
    key: z.string(),
})