import { eq } from "drizzle-orm";
import { Database, UpsertUserModel, User, UserPublicInfo } from "../Models.js";
import { users } from "../schema/Tables.js";
import { UserRepo } from "../UserRepo.js";
import { RecordNotFound, RepoError } from "../RepoError.js";

export class UserRepoImpl implements UserRepo {

    constructor(private readonly db: Database) {}

    async upsertUser(data: UpsertUserModel): Promise<User | null> {
        try {
            const [newRow] = await this.db.insert(users)
                    .values({
                        id: data.id,
                        email: data.email ?? null,
                        firstName: data.firstName ?? null,
                        lastName: data.lastName ?? null,
                        photo: data.photo ?? null,
                        photoKey: data.photoKey ?? null,
                        lastModified: Date.now()
                    })
                    .returning()
                    .onConflictDoUpdate({
                        target: [users.id],
                        set: {
                            ...data,
                            id: undefined
                        },
                    });

            return newRow; 
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id: data.id },
                message: "upsert user failed"
            });
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            await this.db.delete(users).where(eq(users.id, id));
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "delete user failed"
            });
        }
    }
    
    async userExists(id: string): Promise<boolean> {
        try {
            const rows = await this.db.select({ id: users.id })
                .from(users)
                .where(eq(users.id, id));
            
            return rows.length > 0;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "user exists check failed"
            });
        }
    }

    async getUser(id: string): Promise<User | null> {
        try {
            const [row] = await this.db.select().from(users).where(eq(users.id, id));
            return row ?? null;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "get user failed"
            });
        }
    }

    async getUserPublicInfo(id: string): Promise<UserPublicInfo | null> {
        try {
            const [row] = await this.db.select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                photo: users.photo,
            }).from(users).where(eq(users.id, id));
            
            return row ?? null;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "get user public info failed"
            });
        }
    }

    async getPhotoKey(id: string): Promise<string | null> {
        try {
            const [row] = await this.db.select({
                key: users.photoKey
            })
            .from(users)
            .where(eq(users.id,id));

            return row?.key ?? null;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "get photo key failed"
            });
        }
    }

    async setPhoto(id: string, photo: string, photoKey: string): Promise<string> {
        await this.updatePhoto(id,photo,photoKey);
        return photo;
    }

    async removePhoto(id: string): Promise<void> {
        return this.updatePhoto(id,null,null);
    }

    private async updatePhoto(id: string, photo: string|null, photoKey: string|null): Promise<void> {
        try {
            const [row] = await this.db.update(users)
                    .set({
                        photo,
                        photoKey
                    })
                    .where(eq(users.id, id))
                    .returning({ photo: users.photo });

            if (!row) {
                throw new RecordNotFound({ id }, "user not found, updae photo failed")
            }
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "update photo failed"
            });
        }
    }
}