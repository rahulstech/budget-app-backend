import { Request, Response, Router } from "express";
import { asyncHandler } from "../Helper.js";
import { validateBody, validateQuery } from "../middleware/Validators.js";
import { handleGetEvents, handlePostEvents } from "../controller/EventsController.js";
import { GetEventsQuerySchema, PostEventsBodySchema } from "../middleware/EventValidationSchemas.js";

export const eventRouter = Router();

eventRouter.post("/events",
    validateBody(PostEventsBodySchema),
    asyncHandler(async (req: Request, res: Response)=> {
        const userId = req.userId;
        const body = req.validatedBody;
        const service = req.budgetService;

        const result = await handlePostEvents(service,{ userId, body });

        res.json(result);
    }));

eventRouter.get("/events",
    validateQuery(GetEventsQuerySchema),
    asyncHandler(async (req: Request, res: Response)=> {
        const userId = req.userId;
        const query = req.validatedQuery as any;
        const service = req.budgetService;

        const result = await handleGetEvents(service,{ userId, ...query });

        res.json(result);
    }))
