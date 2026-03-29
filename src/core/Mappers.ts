import z from "zod";
import { HttpError } from "./HttpError.js";

export function mapZodErrorToHttpError(error: z.ZodError, statusCode: number = 400): HttpError {
    const items = error.issues.map(issue => {
        const code = issue.code;
        const path = issue.path.join(":").toUpperCase();
        return `${code}|${path}`;
    });
    return new HttpError(statusCode, null, items);
}