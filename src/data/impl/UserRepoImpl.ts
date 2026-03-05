import { eq } from "drizzle-orm";
import { Database, UpdateUserModel, User, UserPublicInfo } from "../Models.js";
import { users } from "../schema/Tables.js";
import { UserRepo } from "../UserRepo.js";

export class UserRepoImpl implements UserRepo {

    constructor(private readonly db: Database) {}

    async insertUser(user: User): Promise<User> {
        const [row] = await this.db.insert(users).values(user).returning();
        return row;
    }

    async updateUser(id: string, updates: UpdateUserModel): Promise<User | null> {
        const [row] = await this.db.update(users)
        .set({
            ...updates,
            lastModified: Date.now()
        })
        .where(eq(users.id, id))
        .returning();

        return row ?? null;
    }

    async deleteUser(id: string): Promise<void> {
        await this.db.delete(users).where(eq(users.id, id));
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

    async getUserPublicInfo(id: string): Promise<UserPublicInfo | null> {
        const [row] = await this.db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            photo: users.photo,
        }).from(users).where(eq(users.id, id));
        
        return row ?? null;
    }
}