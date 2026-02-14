import { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpError } from "../../core/HttpError.js";
import { Environment, isProdEnvironment } from "../../core/Environment.js";

export function extractUserId(): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction)=> {
        if (req.apiGateway) {
            const claim = req.apiGateway?.event?.requestContext?.authorizer?.claim;
            if (claim) {
                req.userId = claim.sub;
                return next();
            }
        }
        if (typeof req.headers.authorization === "string") {
            req.userId = req.headers.authorization;
            return next();
        }
        next(new HttpError.Forbidden("NOT_LOGGED_IN"));
    }
}

export function checkApiKey(): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction)=> {
        if (isProdEnvironment()) {
            const apiKey = req.headers["x-api-key"];
            if (Environment.API_KEY_ANDROID !== apiKey) {
                return next(new HttpError.Forbidden("INCORRECT_API_KEY"));
            }
        }
        next();
    }
}