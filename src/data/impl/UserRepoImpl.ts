import { eq } from "drizzle-orm";
import { Database, ParticipantUser, UpdateUserModel, User } from "../Models.js";
import { participants, users } from "../schema/Tables.js";
import { UserRepo } from "../UserRepo.js";

export class UserRepoImpl implements UserRepo {

    constructor(private readonly db: Database) {}

    async insertUser(user: User): Promise<User> {
        const [row] = await this.db.insert(users).values(user).returning();
        return row;
    }

    async updateUser(id: string, updates: UpdateUserModel): Promise<User | null> {
        const [row] = await this.db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();

        return row ?? null;
    }

    async deleteUser(id: string): Promise<void> {
        await this.db.delete(users).where(eq(users.id, id));
    }

    async getParticipantUsers(budgetId: string): Promise<ParticipantUser[]> {
        const rows = await this.db.select({
            userId: participants.userId,
            user: users
        })
            .from(participants)
            .leftJoin(users, eq(participants.userId, users.id))
            .where(eq(participants.budgetId, budgetId));

        return rows.map(r => {
            if (r.user === null) {
                return {
                    id: r.userId,
                    firstName: null,
                    lastName: null
                }
            }
            return r.user
        });
    }
    
    async userExists(id: string): Promise<boolean> {
        const rows = await this.db.select({ id: users.id })
            .from(users)
            .where(eq(users.id, id));
        
        return rows.length > 0;
    }

    async getUser(id: string): Promise<User | null> {
        const [row] = await this.db.select().from(users).where(eq(users.id, id));
        return row ?? null;
    }
}