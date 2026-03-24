import type { BudgetService } from "../../service/BudgetService.ts";
import { Logger } from "../core/Logger.ts";
import { UserService } from "../service/user/UserService.ts";

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

            validatedQuery?: Record<string,any>,

            validatedBody?: Record<string,any>,

            validatedParams?: Record<string,unknown>,

            logger: Logger,
        }
    }
}