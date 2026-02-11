import { NextFunction, Request, Response, Router } from "express";
import { handleGetEvents, handleGetSnapShot, handleJoinPartcipant, handleLeavePariticipant, handlePostEvents } from "../controller/BudgetController.js";
import { validateBody, validateQuery } from "../middleware/Validators.js";
import { EventBatchRequestModel, EventsBatchSchema, GetEventsQuerySchema, SnapShotQuerySchema, SnapShotRequestModel, SyncRequestModel } from "../ValidationSchemas.js";

function buildRoute(end: string): string {
  return `/budgets/:budgetId/${end}`;
}

export const budgetsRouter = Router({ mergeParams: true });

// Push sync events for a budget

budgetsRouter.post(buildRoute("events"), 
  validateBody(EventsBatchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorUserId = req.userId;
      const budgetId = req.params.budgetId as string;
      const service = req.budgetService;
      const body = req.body as EventBatchRequestModel;

      const results = await handlePostEvents(service, body, budgetId, actorUserId);

      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  });

// Fetch sync events for a budget (handled in controller)

budgetsRouter.get(
  buildRoute("events"),
  validateQuery(GetEventsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budgetId = req.params.budgetId as string;
    const actorUserId = req.userId;
    const queries = req.validatedQuery as SyncRequestModel;
    const service = req.budgetService;

    const transformed = await handleGetEvents(service, queries, budgetId, actorUserId);

    res.status(200).json(transformed);
  }
  catch (err) {
    next(err);
  }
});



// Get latest snapshot for a budget
budgetsRouter.get(buildRoute("snapshot"),
  validateQuery(SnapShotQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budgetId = req.params.budgetId as string;
    const userId = req.userId;
    const service = req.budgetService;
    const { entity, page, per_page } = req.validatedQuery as SnapShotRequestModel;
    
    const results = await handleGetSnapShot(service, budgetId, userId, entity, { page, per_page });

    res.json(results);
  }
  catch(err) {
    next(err);
  }
});



// join budget as participant
budgetsRouter.get(buildRoute("join"), 
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budgetId = req.params.budgetId as string;
    const actorUserId = req.userId
    const service = req.budgetService;

    await handleJoinPartcipant(service, budgetId, actorUserId);

    res.sendStatus(200);
  }
  catch (err) {
    next(err);
  }
});

// leave budget as participant
budgetsRouter.delete(buildRoute("leave"), 
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budgetId = req.params.budgetId as string;
    const actorUserId = req.userId;
    const service = req.budgetService;

    await handleLeavePariticipant(service, budgetId, actorUserId);

    res.sendStatus(200);
  }
  catch (err) {
    next(err);
  }
});

