import { ParticipantRepo } from "../ParticipantRepo.js";
import { participants, participants as tParticipants, users } from "../schema/Tables.js";
import { Database, Participant, ParticipantUser } from "../Models.js";
import { and, eq, sql } from "drizzle-orm";

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

    async getParticipantsOfBudget(budgetId: string): Promise<ParticipantUser[]> {
        const rows = await this.db.select({
            userId: participants.userId,
            budgetId: participants.budgetId,
            userExists: sql<boolean>`users.id IS NOT NULL`,
            firstName: users.firstName,
            lastName: users.lastName,
            photo: users.photo,
            joinedAt: participants.joinedAt,
        })
        .from(participants)
        .leftJoin(users, eq(participants.userId, users.id))
        .where(eq(participants.budgetId, budgetId));

        return rows;
    }

    async findParticipantById(userId: string, budgetId: string): Promise<ParticipantUser | null> {
        const [row] = await this.db.select({
            userId: participants.userId,
            budgetId: participants.budgetId,
            userExists: sql<boolean>`users.id IS NOT NULL`,
            firstName: users.firstName,
            lastName: users.lastName,
            photo: users.photo,
            joinedAt: participants.joinedAt,
        })
        .from(participants)
        .leftJoin(users, eq(participants.userId, users.id))
        .where(and(
            eq(participants.userId, userId),
            eq(participants.budgetId,budgetId)
        ));

        return row ?? null;
    }
}