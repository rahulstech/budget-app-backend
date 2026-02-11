import { Router, Request } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/Validators.js";
import { handlePostBudget } from "../controller/BudgetController.js";
import { CreateBudgetSchema } from "../ValidationSchemas.js";


export const budgetRouter = Router();


// Create a budget (handler implemented in controller)
budgetRouter.post(
  "/budget",
  validateBody(CreateBudgetSchema, "INVALID_CREATE_BUDGET_REQUEST"),
  async (req: Request, res, next) => {
    try {
      const body = (req as any).validatedBody as z.infer<typeof CreateBudgetSchema>;
      const actorUserId = req.userId;
      const service = req.budgetService;

      const result = await handlePostBudget(service, body, actorUserId);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);


