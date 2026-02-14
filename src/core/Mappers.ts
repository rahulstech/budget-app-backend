import z from "zod";
import { HttpError } from "./HttpError.js";

export function mapZodErrorToHttpError(error: z.ZodError, statusCode: number = 400): HttpError {
    const items = error.issues.map(({ message }) => ({ message } satisfies HttpError.ErrorItem))
    return new HttpError(statusCode, items);
}