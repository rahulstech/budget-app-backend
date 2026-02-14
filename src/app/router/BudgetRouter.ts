import { Router, Request, NextFunction, Response } from "express";
import { handlePostBudget, handleRemoveParticipant } from "../controller/BudgetController.js";
import { CreateBudgetSchema, CreateEventsBodySchema, GetBudgetsQuerySchema, GetEventsQuerySchema, SnapShotQuerySchema } from "../middleware/ValidationSchemas.js";
import { handleGetBudgetsOfParticipant, handleGetEvents, handleGetSnapShot, handleJoinPartcipant, 
  handleLeavePariticipant, handlePostEvents } from "../controller/BudgetController.js";
import { validateBody, validateQuery } from "../middleware/Validators.js";
import { asyncHandler } from "../Helper.js";

function buildRoute(end: string): string {
  return `/budgets/:budgetId/${end}`;
}

export const budgetRouter = Router();


// Create a budget (handler implemented in controller)
budgetRouter.post(
  "/budget",
  validateBody(CreateBudgetSchema, "INVALID_CREATE_BUDGET_REQUEST"),
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

// Push sync events for a budget
budgetRouter.post(buildRoute("events"), 
  validateBody(CreateEventsBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const budgetId = req.params.budgetId as string;
    const service = req.budgetService;
    const body = req.body;

    const results = await handlePostEvents(service, { body, budgetId, userId });

    res.json(results);
  }));


// Fetch sync events for a budget (handled in controller)
budgetRouter.get(
  buildRoute("events"),
  validateQuery(GetEventsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {budgetId} = req.params;
    const userId = req.userId;
    const { key, count } = req.validatedQuery as any;
    const service = req.budgetService;

    const results = await handleGetEvents(service, { budgetId, userId, key, count });

    res.json(results);
  }));



// Get latest snapshot for a budget
budgetRouter.get(buildRoute("snapshot"),
  validateQuery(SnapShotQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {budgetId} = req.params;
    const service = req.budgetService;
    const { entity, key, count } = req.validatedQuery as any;
    
    const results = await handleGetSnapShot(service, { budgetId, entity, key, count });

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
budgetRouter.delete(buildRoute("participants/:participantId"), 
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId, participantId } = req.params;
    const userId = req.userId;
    const service = req.budgetService;

    await handleRemoveParticipant(service, { budgetId, userId, participantId });

    res.sendStatus(200);
  }));
