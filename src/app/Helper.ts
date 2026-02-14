import { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(handler: (req: Request, res: Response)=> Promise<void> | void): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {   
        try {     
            await handler(req,res);
        }
        catch(error) {
            next(error);
        }
    }
}
