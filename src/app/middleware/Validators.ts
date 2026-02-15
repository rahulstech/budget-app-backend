import { NextFunction, Request, Response, RequestHandler } from "express";
import { ZodSchema } from "zod";
import { mapZodErrorToHttpError } from "../../core/Mappers.js";

export function validateBody(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return next(mapZodErrorToHttpError(parsed.error))
    }

    // attach parsed result for downstream handler
    req.validatedBody = parsed.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return next(mapZodErrorToHttpError(parsed.error));
    }

    req.validatedQuery = parsed.data;
    next();
  }
}