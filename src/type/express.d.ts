import type { BudgetService } from "../../service/BudgetService.ts";
import { Logger } from "../core/Logger.ts";
import { UserService } from "../service/UserService.ts";

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

            userService: UserService,

            userId: string,

            validatedQuery?: unknown,

            validatedBody?: unknown,

            logger: Logger,
        }
    }
}