import z from "zod";
import { PostBudgetBodySchema } from "./middleware/BudgetValidationSchemas.js";
import { EventSchema, PostEventsBodySchema } from "./middleware/EventValidationSchemas.js";

export type ResponseModel = { [key: string]: any, errors?: string[] };

export type ControllerParams = {
    [key: string]: any,
};

export type PostBudgetBodyModel = z.infer<typeof PostBudgetBodySchema>;

export type PostEventsBodyModel = z.infer<typeof PostEventsBodySchema>;

export type EventBodyModel = z.infer<typeof EventSchema>;