import { Router, Request, Response } from "express";
import { GetBudgetsQuerySchema, PostBudgetBodySchema, SnapShotQuerySchema } from "../middleware/BudgetValidationSchemas.js";
import { asyncHandler } from "../Helper.js";
import { validateBody, validateQuery } from "../middleware/Validators.js";
import { handleGetBudgetsOfParticipant, handleGetSnapShot, handleJoinPartcipant, handleLeavePariticipant, handlePostBudget, handleRemoveParticipant } from "../controller/BudgetController.js";

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
budgetRouter.get(buildRoute("snapshot",":entity"),
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

    await handleJoinPartcipant(service, { budgetId, userId });

    res.sendStatus(200);
  }));

// leave budget as participant
budgetRouter.delete(buildRoute("leave"), 
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.params;
    const userId = req.userId;
    const service = req.budgetService;

    await handleLeavePariticipant(service, { budgetId, userId });

    res.sendStatus(200);
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