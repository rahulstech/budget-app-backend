import { Event } from "./Models.js";

export interface EventRepo {
    
    insertEvent(event: Event): Promise<Event>

    getBudgetEvents(
        budgetId: string, excludeUserId: string, lastSequence: number, itemCount: number
    ): Promise<Omit<Event,"id"|"sequence"|"serverCreatedAt">[]>
}