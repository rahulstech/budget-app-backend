import { Router, Request, Response } from "express";
import { BudgetIdParamsSchema, GetCategorySnapShotParamsSchema, GetExpenseSnapShotParamsSchema, PostBudgetBodySchema } from "./BudgetValidationSchemas.js";
import { asyncHandler } from "../../Helper.js";
import { validateBody, validateParams } from "../../middleware/Validators.js";
import { handleGetSnapShot, handleJoinBudget, handleLeaveBudget, handlePostBudget } from "../../controller/BudgetController.js";
import { EntityType } from "../../../core/Types.js";



function buildRoute(...segments: string[]): string {
  let route = "";
  if (segments.length > 0) {
    for (const s of segments) {
      route += `/${s}`;
    }
  }
  return route;
}

export const budgetRouter = Router();

// Create a budget (handler implemented in controller)
budgetRouter.post(
  "/budget",
  validateBody(PostBudgetBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.validatedBody;
    const userId = req.userId;
    const service = req.budgetService;

    const result = await handlePostBudget(service, { body, userId });

    res.status(201).json(result);
  }
));


const budgetsRouter = Router({ mergeParams: true });

budgetRouter.use(
  "/budgets/:budgetId", 
  validateParams(BudgetIdParamsSchema),
  budgetsRouter
);

// join budget as participant
budgetsRouter.get(
  buildRoute("join"), 
  validateParams(BudgetIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {budgetId} = req.validatedParams!!;
    const userId = req.userId
    const service = req.budgetService;

    const response = await handleJoinBudget(service, { budgetId, userId });
    res.json(response);
  }));



// leave budget as participant
budgetsRouter.delete(
  buildRoute("leave"), 
  validateParams(BudgetIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.validatedParams!!;
    const userId = req.userId;
    const service = req.budgetService;

    const response = await handleLeaveBudget(service, { budgetId, userId });
    res.json(response);
  }));


// get budget snapshot
budgetsRouter.get(
  buildRoute(),
  validateParams(BudgetIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.validatedParams!!;
    const userId = req.userId;
    const service = req.budgetService;

    const result = await handleGetSnapShot(
                      service, 
                      { userId, entity: EntityType.BUDGET, budgetId }
                    );
    res.json(result);
  })
)


// get category snapshot
budgetsRouter.get(
  buildRoute("categories",":categoryId"), 
  validateParams(GetCategorySnapShotParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId, categoryId } = req.validatedParams!!;
    const userId = req.userId;
    const service = req.budgetService;

    const result = await handleGetSnapShot(
                      service, 
                      { userId, entity: EntityType.CATEGORY, budgetId, recordId: categoryId }
                    );
    res.json(result);
  })
)


// get expense snapshot
budgetsRouter.get(
  buildRoute("expenses",":expenseId"), 
  validateParams(GetExpenseSnapShotParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId, expenseId } = req.validatedParams!!;
    const userId = req.userId;
    const service = req.budgetService;

    const result = await handleGetSnapShot(
                      service, 
                      { userId, entity: EntityType.EXPENSE, budgetId, recordId: expenseId }
                    );
    res.json(result);
  })
)