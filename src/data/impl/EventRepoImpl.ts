import { and, asc, eq, gt, ne, sql } from "drizzle-orm";
import { EventRepo } from "../EventRepo.js";
import { events } from "../schema/Tables.js";
import { Database, Event } from "../Models.js";
import { RepoError } from "../RepoError.js";

export class EventRepoImpl implements EventRepo {

    constructor(private readonly db: Database) {}

    async insertEvent(event: Event): Promise<Event> {
        try {
            const [newEvent] = await this.db.insert(events)
                .values({
                    ...event,
                    sequence: sql<bigint>`get_next_event_sequence(${event.budgetId})`
                })
                .returning();

            return newEvent;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id: event.id, type: event.type },
                message: "insert event failed"
            });
        }
    }

    async insertEvents(newEvents: Event[]): Promise<Event[]> {
        try {
            const values = newEvents.map(event => ({
                ...event,
                sequence: sql<bigint>`get_next_event_sequence(${event.budgetId})`
            }));
            
            return await this.db.insert(events)
                .values(values)
                .returning();
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { count: newEvents.length, events: newEvents.map( ({id,type}) => ({ id, type }))},
                message: "bulk insert events failed"
            });
        }
    }

    async getEventById(id: string): Promise<Event | null> {
        try {
            const [event] = await this.db.select().from(events).where(eq(events.id, id));
            return event ?? null;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "get event by id failed"
            });
        }
    }

    async getBudgetEvents(
        budgetId: string, excludeUserId: string, lastSequence: number, itemCount: number = 20
    ): Promise<Omit<Event,"serverCreatedAt">[]> {
        try {
            const safeItemCount = Math.min(itemCount, 100); // hard cap

            return await this.db
                .select({
                    id: events.id,
                    type: events.type,
                    sequence: events.sequence,
                    budgetId: events.budgetId,
                    userId: events.userId,
                    recordId: events.recordId,
                    when: events.when,
                    data: events.data,
                })
                .from(events)
                .where(and(
                    ne(events.userId, excludeUserId),
                    eq(events.budgetId, budgetId),
                    gt(events.sequence, lastSequence),
                ))
                .orderBy(asc(events.sequence))
                .limit(safeItemCount);
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId, excludeUserId, lastSequence, itemCount },
                message: "get budget events failed"
            });
        }
    }
}