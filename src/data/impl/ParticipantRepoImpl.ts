import { ParticipantRepo } from "../ParticipantRepo.js";
import { participants, participants as tParticipants, users } from "../schema/Tables.js";
import { Database, Participant, ParticipantUser } from "../Models.js";
import { and, eq, sql } from "drizzle-orm";
import { RepoError } from "../RepoError.js";

export class ParticipantRepoImpl implements ParticipantRepo {

    constructor(private readonly db: Database) {}

    async insertParticipant(participant: Participant): Promise<Participant> {
        try {
            const [savedParticipant] = await this.db
                .insert(tParticipants)
                .values(participant)
                .returning()
                .onConflictDoUpdate({ 
                    target: [participants.budgetId, participants.userId], 
                    set: participant
                });

            return savedParticipant;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId: participant.budgetId, userId: participant.userId },
                message: "insert participant failed"
            });
        }
    }

    async deleteParticipant(budgetId: string, userId: string): Promise<void> {
        try {
            await this.db.delete(participants)
                .where(and(
                    eq(participants.budgetId, budgetId), 
                    eq(participants.userId, userId))
                );
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId, userId },
                message: "delete participant failed"
            });
        }
    }

    async getParticipantsOfBudget(budgetId: string): Promise<ParticipantUser[]> {
        try {
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
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId },
                message: "get participants of budget failed"
            });
        }
    }

    async findParticipantById(userId: string, budgetId: string): Promise<ParticipantUser | null> {
        try {
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
        catch (error: any) {
            throw RepoError.create({
                error,
                message: "find participant by id failed"
            });
        }
    }
}