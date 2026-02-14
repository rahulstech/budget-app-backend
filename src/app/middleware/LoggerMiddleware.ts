import { NextFunction, Request, RequestHandler, Response } from "express";
import { pinoHttp } from "pino-http";
import { generateUUID } from "../../core/Helpers.js";
import { globalLogger, Logger } from "../../core/Logger.js";

export function httpLogger(): RequestHandler {
    return (request: Request, response: Response, next: NextFunction) => {
        const logger = pinoHttp({
            logger: globalLogger.logger,

            genReqId: (_req: Request, _res: Response): string => generateUUID(),

            serializers: {
                req: (req: Request): any => ({
                    id: req.id,
                    url: req.url,
                    method: req.method,
                    userId: req.userId,
                }),
            }
        });

        request.logger = new Logger(logger.logger);

        logger(request,response,next);
    }
}