import { Router, Request, Response } from "express";
import { PostBudgetBodySchema } from "../middleware/BudgetValidationSchemas.js";
import { asyncHandler } from "../Helper.js";
import { validateBody } from "../middleware/Validators.js";
import { handleJoinBudget, handleLeaveBudget, handlePostBudget } from "../controller/BudgetController.js";



function buildRoute(...segments: string[]): string {
  let route = "/budgets/:budgetId";
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


// join budget as participant
budgetRouter.get(buildRoute("join"), 
  asyncHandler(async (req: Request, res: Response) => {
    const {budgetId} = req.params;
    const userId = req.userId
    const service = req.budgetService;

    const response = await handleJoinBudget(service, { budgetId, userId });

    res.status(200).json(response);
  }));

// leave budget as participant
budgetRouter.delete(buildRoute("leave"), 
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.params;
    const userId = req.userId;
    const service = req.budgetService;

    const response = await handleLeaveBudget(service, { budgetId, userId });

    res.status(200).json(response);
  }));