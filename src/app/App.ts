import { budgetRouter } from "./router/budget/BudgetRouter.js";
import { BudgetService } from "../service/budget/BudgetService.js";
import express, { Express, Request, Response, NextFunction } from "express";
import { HttpError } from "../core/HttpError.js";
import { httpLogger } from "./middleware/LoggerMiddleware.js";
import { checkApiKey, extractUserId } from "./middleware/SecurityMiddleware.js";
import { noauthUserRoutes, userRouter } from "./router/user/UserRouter.js";
import { UserService } from "../service/user/UserService.js";
import { eventRouter } from "./router/event/EventRouter.js";
import { AppError } from "../core/AppError.js";


export function createApp(budgetService: BudgetService, userService: UserService): Express {
    const app: Express = express();

    app.use(checkApiKey());

    app.use(express.json());

    app.use(httpLogger());

    app.use((req: Request, _res: Response, next: NextFunction)=> {
        req.budgetService = budgetService;
        req.userService = userService;
        next();
    });



    /**
     * no auth app routes
     */
    app.use(noauthUserRoutes);

    app.use(extractUserId());

    /**
     * authorized app routes
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
        console.log(err);

        if (err instanceof HttpError) {
            res.status(err.statusCode)
            .json({ 
                error: {
                    statusCode: err.statusCode,
                    message: err.message
                }
             });
        }
        else if (err instanceof AppError) {
            res.status(500)
            .json({ 
                error: {
                    statusCode: 500,
                    message: err.message
                }
             });
        }
        else {
            res.sendStatus(500);
        }
    });

    return app;
}

