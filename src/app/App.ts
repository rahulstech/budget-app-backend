import { budgetRouter } from "./router/BudgetRouter.js";
import { BudgetService } from "../service/BudgetService.js";
import express, { Express, Request, Response, NextFunction } from "express";
import { HttpError } from "../core/HttpError.js";
import { httpLogger } from "./middleware/LoggerMiddleware.js";
import { checkApiKey, extractUserId } from "./middleware/SecurityMiddleware.js";
import { userRouter } from "./router/UserRouter.js";
import { UserService } from "../service/UserService.js";
import { eventRouter } from "./router/EventRouter.js";


export function createApp(budgetService: BudgetService, userService: UserService): Express {
    const app: Express = express();

    app.use(checkApiKey());

    app.use(express.json());

    app.use(httpLogger());

    app.use(extractUserId());

    app.use((req: Request, _res: Response, next: NextFunction)=> {
        req.budgetService = budgetService;
        req.userService = userService;
        next();
    });

    /**
     * app routes
     */
    app.use(budgetRouter);

    app.use(eventRouter);

    app.use(userRouter);

    /**
     * 404 NOT FOUND handler
     */
    app.use((req: Request, _res: Response, next: NextFunction)=> {
        next(new HttpError(404,`${req.method} ${req.url}`));
    });

    /**
     * Router Error handler
     */
    app.use((err: Error, req: Request, res: Response, _next: NextFunction)=> {
        if (err instanceof HttpError) {
            res.status(err.statusCode).json({ errors: err.flatten() });
        }
        else {
            req.logger.error("internal server error", err);
            res.status(500).json({ errors: ["internal server error"] });
        }
    });

    return app;
}

