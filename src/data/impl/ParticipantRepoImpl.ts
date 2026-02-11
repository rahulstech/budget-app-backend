import { ParticipantRepo } from "../ParticipantRepo.js";
import { participants, participants as tParticipants } from "../schema/Tables.js";
import { Database, Participant } from "../Models.js";
import { and, eq } from "drizzle-orm";

export class ParticipantRepoImpl implements ParticipantRepo {

    constructor(private readonly db: Database) {}

    async insertParticipant(participant: Participant): Promise<Participant> {
        const [savedParticipant] = await this.db.insert(tParticipants).values(participant).returning();
        return savedParticipant;
    }

    async deleteParticipant(budgetId: string, userId: string): Promise<void> {
        await this.db.delete(participants)
        .where(and(
            eq(participants.budgetId, budgetId), 
            eq(participants.userId, userId))
        );
    }

    async getBudgetParticipants(budgetId: string): Promise<Participant[]> {
        return await this.db.select()
            .from(participants)
            .where(eq(participants.budgetId, budgetId))
    }
}