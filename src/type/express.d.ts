import type { BudgetService } from "../../service/BudgetService.ts";
import { Logger } from "../core/Logger.ts";
import { AuthService } from "../service/auth/AuthService.ts";
import { UserService } from "../service/user/UserService.ts";

declare global {
    namespace Express {
        interface Request {
            budgetService: BudgetService,

            userService: UserService,

            authService?: AuthService,

            userId: string,

            validatedQuery?: Record<string,any>,

            validatedBody?: Record<string,any>,

            validatedParams?: Record<string,unknown>,

            logger: Logger,
        }
    }
}