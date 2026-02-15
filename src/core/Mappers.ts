import z from "zod";
import { HttpError } from "./HttpError.js";

function mapZodIssueToCode(issue: z.ZodIssue): string {
    const code = issue.code;
  if (code === "custom") return "VALIDATION_ERROR";
  return code.toUpperCase(); 
}


export function mapZodErrorToHttpError(error: z.ZodError, statusCode: number = 400): HttpError {
    const items = error.issues.map(issue => {
        const errorcode = mapZodIssueToCode(issue);
        const path = issue.path.join("_").toUpperCase();
        return `${errorcode}_${path}`;
    });
    return new HttpError(statusCode, items);
}