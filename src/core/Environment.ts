import z from "zod";
import { AppError } from "./AppError.js";

const EnvSchema = z.object({
    NODE_ENV: z.enum(["dev","prod","test"]).default("dev"),

    DB_USER: z.string(),
    DB_PASS: z.string(),
    DB_HOST: z.hostname(),
    DB_PORT: z.coerce.number().int(),
    DB_NAME: z.string(),
    DB_USE_SSL: z.coerce.boolean().default(false),

    SERVER_PORT: z.coerce.number().int().default(3000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    throw new AppError("error parsing process.env", true, parsed.error);
}

export const Environment = parsed.data;

export const isDevEnvironment = process.env.NODE_ENV === "dev";

export const isProdEnvironment = process.env.NODE_ENV === "prod";

