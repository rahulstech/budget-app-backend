import { Router, Request, Response } from "express";
import { BudgetIdParamsSchema, BudgetsOfParticipantQuerySchema, GetCategorySnapShotParamsSchema, GetExpenseSnapShotParamsSchema, GetExpensesSnapShotQuerySchema, PostBudgetBodySchema } from "./BudgetValidationSchemas.js";
import { asyncHandler } from "../../Helper.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/Validators.js";
import { handleGetBudgetsOfParticipant, handleGetLastEventSequenceOfBudget, handleGetSnapShot, handleJoinBudget, handleLeaveBudget, handlePostBudget } from "../../controller/BudgetController.js";
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



// get budgets of participants
budgetRouter.get(
  "/budgets",
  validateQuery(BudgetsOfParticipantQuerySchema),
  asyncHandler(async (req: Request,res: Response) => {
    const userId = req.userId;
    const { key, count } = req.validatedQuery!!
    const service = req.budgetService;

    const response = await handleGetBudgetsOfParticipant(service, { userId, key, count });
    res.json(response);
  })
)



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



// get snapshot of budget categories
budgetsRouter.get(
  buildRoute("categories"), 
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.validatedParams!!;
    const userId = req.userId;
    const service = req.budgetService;

    const result = await handleGetSnapShot(
                      service, 
                      { userId, entity: EntityType.CATEGORY, budgetId }
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



// get snapshot of budget expenses with pagination
budgetsRouter.get(
  buildRoute("expenses"), 
  validateQuery(GetExpensesSnapShotQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.validatedParams!!;
    const { key, count } = req.validatedQuery!!;
    const userId = req.userId;
    const service = req.budgetService;

    const result = await handleGetSnapShot(
                      service, 
                      { userId, entity: EntityType.EXPENSE, budgetId, key, count }
                    );
    res.json(result);
  })
)



// get expense snapshot by id
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



// get all participants snapshot
budgetsRouter.get(
  buildRoute("participants"), 
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.validatedParams!!;
    const userId = req.userId;
    const service = req.budgetService;

    const result = await handleGetSnapShot(
                      service, 
                      { userId, entity: EntityType.PARTICIPANT, budgetId }
                    );
    res.json(result);
  })
)



// get last event sequence of budget
budgetsRouter.get(
  buildRoute("last-event-sequence"),
  asyncHandler(async (req: Request, res: Response) => {
    const { budgetId } = req.params;
    const userId = req.userId;
    const service = req.budgetService;

    const response = await handleGetLastEventSequenceOfBudget(service, { userId, budgetId });

    res.json(response);
  })
)