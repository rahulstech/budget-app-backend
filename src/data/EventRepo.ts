import { PagedResult } from "../core/CoreTypes.js";
import { Event } from "./Models.js";

export interface EventRepo {
    
    insertEvent(event: Event): Promise<Event>

    getBudgetEvents(budgetId: string, excludeUserId: string, lastSequence: number, itemCount: number): Promise<PagedResult<number, Event>>
}