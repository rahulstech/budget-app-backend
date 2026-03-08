import { Router, Request, Response } from "express";
import { GetBudgetsQuerySchema, PostBudgetBodySchema, SnapShotQuerySchema } from "../middleware/BudgetValidationSchemas.js";
import { asyncHandler } from "../Helper.js";
import { validateBody, validateQuery } from "../middleware/Validators.js";
import { handleGetBudgetsOfParticipant, handleGetSnapShot, handleJoinBudget, handleLeaveBudget, handlePostBudget, handleRemoveParticipant } from "../controller/BudgetController.js";
import { isDevEnvironment } from "../../core/Environment.js";
import { logDebug } from "../../core/Logger.js";

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

    if (isDevEnvironment()) {
      logDebug("post.budget.body", body!)
    }

    const result = await handlePostBudget(service, { body, userId });

    res.status(201).json(result);
  }
));


budgetRouter.get("/budgets", 
  validateQuery(GetBudgetsQuerySchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, budgetService } = req;
    const { key, count } = req.validatedQuery as any;

    const result = await handleGetBudgetsOfParticipant(budgetService, { userId, key, count });

    res.json(result);
  })
)

// Get latest snapshot for a budget
budgetRouter.get(buildRoute("snapshot"),
  validateQuery(SnapShotQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const { budgetId } = req.params;
    const service = req.budgetService;
    const { entity, key, count } = req.validatedQuery as any;
    
    const results = await handleGetSnapShot(service, { budgetId, userId, entity, key, count });

    res.json(results);
}));



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

// remove a participant from budget
budgetRouter.delete(buildRoute("participants",":participantId"), 
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId, participantId } = req.params;
    const userId = req.userId;
    const service = req.budgetService;

    await handleRemoveParticipant(service, { budgetId, userId, participantId });

    res.sendStatus(200);
  }));