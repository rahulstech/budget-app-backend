import z from "zod";
import { EventSchema, PostBudgetBodySchema, PostEventsBodySchema } from "./middleware/BudgetValidationSchemas.js";

export type ResponseModel = { [key: string]: any, errors?: string[] };

// export type SyncResponseModel = { 
//     type: string,
//     budgetId: string, 
//     actorUserId: string,
//     [key: string]: any,
//     errors?: string[],
// }

// export type SnapShotResponseModel = {
//     [key: string]: any,
//     errors?: string[],
// };

export type ControllerParams = {
    [key: string]: any,
};

export type PostBudgetBodyModel = z.infer<typeof PostBudgetBodySchema>;

export type PostEventsBodyModel = z.infer<typeof PostEventsBodySchema>;

export type EventBodyModel = z.infer<typeof EventSchema>