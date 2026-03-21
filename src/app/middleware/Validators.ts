import { NextFunction, Request, Response, RequestHandler } from "express";
import { ZodSchema } from "zod";
import { mapZodErrorToHttpError } from "../../core/Mappers.js";

export function validateBody(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return next(mapZodErrorToHttpError(parsed.error))
    }

    const data = parsed.data ?? {};
    if (req.validatedBody) {
      req.validatedBody = { ...req.validatedBody!!, ...data };
    }
    else {
      req.validatedBody = { ...data  };
    }
    next();
  };
}

export function validateQuery(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return next(mapZodErrorToHttpError(parsed.error));
    }

    const data = parsed.data ?? {};
    if (req.validatedQuery) {
      req.validatedQuery = { ...req.validatedQuery!!, ...data };
    }
    else {
      req.validatedQuery = { ...data  };
    }
    next();
  }
}

export function validateParams(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      return next(mapZodErrorToHttpError(parsed.error));
    }

    const data = parsed.data ?? {};

    if (req.validatedParams) {
      req.validatedParams = { ...req.validatedParams!!, ...data };
    }
    else {
      req.validatedParams = { ...data  };
    }

    next();
  }
}