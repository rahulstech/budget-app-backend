import { Event } from "./Models.js";

export interface EventRepo {
    
    insertEvent(event: Event): Promise<Event>

    getEventById(id: string): Promise<Event | null>

    getBudgetEvents(
        budgetId: string, excludeUserId: string, lastSequence: number, itemCount: number
    ): Promise<Omit<Event,"id"|"serverCreatedAt">[]>
}