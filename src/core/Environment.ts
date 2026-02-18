import z from "zod";
import { AppError } from "./AppError.js";

const EnvSchema = z.object({
    NODE_ENV: z.enum(["dev","prod","test"]).default("dev"),
    BASE_URL: z.url(),
    DB_USER: z.string(),
    DB_PASS: z.string(),
    DB_HOST: z.hostname(),
    DB_PORT: z.coerce.number().int(),
    DB_NAME: z.string(),
    DB_MAX_CONNECTION: z.coerce.number().int().default(1),
    DB_USE_SSL: z.coerce.boolean().default(false),
    DB_SSL_CA_BASE64: z.base64().nonempty().default(""),
    API_KEY_ANDROID: z.string().nonempty().default(""),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    throw new AppError("error parsing process.env", true, parsed.error);
}

export const Environment = parsed.data;

export const isDevEnvironment = (): boolean =>  process.env.NODE_ENV === "dev";

export const isProdEnvironment = (): boolean => process.env.NODE_ENV === "prod";

