import type { BudgetService } from "../../service/BudgetService.ts";
import { Logger } from "../src/core/Logger.ts";

declare global {
    namespace Express {
        interface Request {
            
            budgetService: BudgetService,

            userId: string,

            validatedQuery?: unknown,

            validatedBody?: unknown,

            logger: Logger,
        }
    }
}