import { NextFunction, Request, Response, RequestHandler } from "express";
import { ZodSchema } from "zod";
import { HttpError } from "../../core/HttpError.js";

export function validateBody(schema: ZodSchema<any>, message = "VALIDATION_FAILED"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const errorItems: HttpError.ErrorItem[] = parsed.error.issues.map((issue) => ({
        message: issue.message,
      }));

      return next(new HttpError(400, message, errorItems));
    }

    // attach parsed result for downstream handler
    (req as any).validatedBody = parsed.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema<any>, message = "INVALID_QUERY"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const errorItems: HttpError.ErrorItem[] = parsed.error.issues.map((issue) => ({ message: issue.message }));
      return next(new HttpError(400, message, errorItems));
    }

    (req as any).validatedQuery = parsed.data;
    next();
  }
}