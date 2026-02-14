import type { BudgetService } from "../../service/BudgetService.ts";
import { Logger } from "../core/Logger.ts";

declare global {
    namespace Express {
        interface Request {

            apiGateway?: {
                event?: {
                    requestContext?: {
                        authorizer?: {
                            claim?: {
                                sub: string,
                            }
                        }
                    }
                }
            }
            
            budgetService: BudgetService,

            userId: string,

            validatedQuery?: unknown,

            validatedBody?: unknown,

            logger: Logger,
        }
    }
}