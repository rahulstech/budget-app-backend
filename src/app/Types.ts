import z from "zod";
import { CreateBudgetSchema, EventSchema, GetEventsQuerySchema, SnapShotQuerySchema, GetBudgetsQuerySchema, CreateEventsBodySchema } from "./middleware/ValidationSchemas.js";

export type EventResponseModel = { event: string, id: string, version?: number, errors?: string[] } | { [key: string]: any, errors?: string[] };

export type SyncResponseModel = { 
    type: string,
    budgetId: string, 
    actorUserId: string,
    [key: string]: any,
    errors?: string[],
}

export type SnapShotResponseModel = {
    [key: string]: any,
    errors?: string[],
};

export type ControllerParams = {
    [key: string]: any,
};

export type CreatedBudgetRequestModel = z.infer<typeof CreateBudgetSchema>;

export type CreateEventsBodyModel = z.infer<typeof CreateEventsBodySchema>;

export type EventRequestModel = z.infer<typeof EventSchema>;

export type SyncRequestModel = z.infer<typeof GetEventsQuerySchema>;

export type SnapShotQueryModel = z.infer<typeof SnapShotQuerySchema>;

export type GetBudgetsQueryModel = z.infer<typeof GetBudgetsQuerySchema>;