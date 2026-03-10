import z from "zod";
import { PostBudgetBodySchema } from "./middleware/BudgetValidationSchemas.js";
import { EventSchema, PostEventsBodySchema } from "./middleware/EventValidationSchemas.js";
import { HttpResponseError } from "../core/Types.js";

export type ResponseModel = { 
    [key: string]: any, 
    error?: HttpResponseError,
};


export type ControllerParams = {
    [key: string]: any,
};

export type PostBudgetBodyModel = z.infer<typeof PostBudgetBodySchema>;

export type PostEventsBodyModel = z.infer<typeof PostEventsBodySchema>;

export type EventBodyModel = z.infer<typeof EventSchema>;