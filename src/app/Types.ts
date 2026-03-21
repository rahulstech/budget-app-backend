import z from "zod";
import { PostBudgetBodySchema } from "./router/budget/BudgetValidationSchemas.js";
import { HttpResponseError } from "../core/Types.js";

export type ResponseModel = { 
    [key: string]: any, 
    error?: HttpResponseError,
};


export type ControllerParams = {
    [key: string]: any,
};

export type PostBudgetBodyModel = z.infer<typeof PostBudgetBodySchema>;