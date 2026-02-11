import { budgetRouter } from "./app/router/BudgetRouter.js";
import { Environment } from "./core/Environment.js";
import { RepoClientImpl } from "./data/impl/RepoClientImpl.js";
import { BudgetService } from "./service/BudgetService.js";
import express, { Express, Request, Response, NextFunction } from "express";
import { HttpError } from "./core/HttpError.js";
import { logError, logInfo } from "./core/Logger.js";
import { budgetsRouter } from "./app/router/BudgetsRouter.js";
import { httpLogger } from "./app/middleware/LoggerMiddleware.js";

const {
    DB_USER,
    DB_PASS,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USE_SSL, 
} = Environment;

// connect database
const repoClient = new RepoClientImpl({ DB_USER,DB_PASS, DB_HOST,DB_PORT,DB_NAME,DB_USE_SSL });
repoClient.connect();

// start service
const budgetService = new BudgetService(repoClient);

const app: Express = express();
const SERVER_PORT = Environment.SERVER_PORT;

app.use(express.json());

app.use(httpLogger());

app.use((req: Request, _res: Response, next: NextFunction)=> {
    req.budgetService = budgetService;
    next();
});

app.use((req: Request, _res: Response, next: NextFunction)=> {
    const auth = req.headers.authorization as string;
    if (!auth) {
        return next(new HttpError.Forbidden());
    }
    req.userId = auth;
    next();
});

/**
 * app routes
 */
app.use(budgetRouter);

app.use(budgetsRouter);

/**
 * 404 NOT FOUND handler
 */
app.use((req: Request, res: Response, next: NextFunction)=> {
    next(new HttpError(404,`${req.method} ${req.url}`));
});

/**
 * Router Error handler
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction)=> {
    if (err instanceof HttpError) {
        const errors = err.errorItems?.map(e => e.message) ?? [err.message];
        res.status(err.statusCode).json({ errors });
    }
    else {
        req.logger.error("internal server error", err);
        res.status(500).json({ errors: ["internal server error"] });
    }
});

const server = app.listen(SERVER_PORT, (error?: Error)=> {
    if (error) {
        logError(`server not started`, error);
    }
    else {
        logInfo(`server started and listening on port ${SERVER_PORT}`);
    }
});