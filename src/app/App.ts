import { budgetRouter } from "./router/budget/BudgetRouter.js";
import { BudgetService } from "../service/budget/BudgetService.js";
import express, { Express, Request, Response, NextFunction } from "express";
import { HttpError } from "../core/HttpError.js";
import { httpLogger } from "./middleware/LoggerMiddleware.js";
import { checkApiKey, extractUserId } from "./middleware/SecurityMiddleware.js";
import { userRouter } from "./router/user/UserRouter.js";
import { UserService } from "../service/user/UserService.js";
import { eventRouter } from "./router/event/EventRouter.js";
import { AppError } from "../core/AppError.js";
import { profileRoutes } from "./router/user/ProfileRoutes.js";
import { logError } from "../core/Logger.js";
import { AuthService } from "../service/auth/AuthService.js";
import { ServiceProvider } from "./ServiceProvider.js";


export function createApp(services: ServiceProvider): Express {
    const app: Express = express();

    app.use(checkApiKey());

    app.use(express.json());

    app.use(httpLogger());

    app.use((req: Request, _res: Response, next: NextFunction)=> {
        const { budgetService, userService, authService } = services;
        req.budgetService = budgetService;
        req.userService = userService;
        req.authService = authService;
        next();
    });



    /**
     * no auth app routes
     */
    app.use(profileRoutes);

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
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction)=> {
        logError("unhandled api error occurred", { err });

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
            res.status(500).json({
                error: {
                    statusCode: 500,
                    message: "Internal Server Error"
                }
            });
        }
    });

    return app;
}

