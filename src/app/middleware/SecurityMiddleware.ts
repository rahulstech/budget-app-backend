import { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpError } from "../../core/HttpError.js";
import { Environment, isProdEnvironment } from "../../core/Environment.js";

export function extractUserId(): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction)=> {
        const httpUnauthorized = new HttpError.Unauthorized("NOT_LOGGED_IN");
        if (isProdEnvironment()) {
            const authService = req.authService!!;
            const authrization = req.headers["authorization"];
            const idToken = authService.extractIdTokenFromHeader(authrization);
            if (null === idToken) {
                return next(httpUnauthorized);
            }
            const authUser = await authService.verifyIdToken(idToken);
            if (null === authUser) {
                return next(httpUnauthorized);
            }
            req.userId = authUser.userId;
            return next();
        }
        else if (typeof req.headers.authorization === "string") {
            req.userId = req.headers.authorization;
            return next();
        }
        next(httpUnauthorized);
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