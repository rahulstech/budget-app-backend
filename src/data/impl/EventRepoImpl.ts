import { and, asc, eq, gt, ne, sql } from "drizzle-orm";
import { EventRepo } from "../EventRepo.js";
import { events } from "../schema/Tables.js";
import { Database, Event } from "../Models.js";
import { PagedResult } from "../../core/CoreTypes.js";

export class EventRepoImpl implements EventRepo {

    constructor(private readonly db: Database) {}

    async insertEvent(event: Event): Promise<Event> {
        const [newEvent] = await this.db.insert(events)
        .values(
            {
                ...event,
                sequence: sql<bigint>`get_next_event_sequence(${event.budgetId})`
            }
        )
        .returning();
        return newEvent;
    }


    async getBudgetEvents(budgetId: string, excludeUserId: string, lastSequence: number, itemCount: number = 20): Promise<PagedResult<number, Event>> {
        const safeItemCount = Math.min(itemCount, 100); // hard cap

        const items = await this.db
            .select()
            .from(events)
            .where(and(
                eq(events.budgetId, budgetId),
                ne(events.userId, excludeUserId),
                gt(events.sequence, lastSequence),
            ))
            .orderBy(asc(events.sequence))
            .limit(safeItemCount);

        return { key: lastSequence, items };
    }
}