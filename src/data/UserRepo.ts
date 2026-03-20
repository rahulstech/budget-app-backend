import { User, UserPublicInfo } from "./Models.js";

export interface UserRepo {

    upsertUser(user: User): Promise<User | null>

    deleteUser(id: string): Promise<void>

    getUser(id: string): Promise<User | null>

    getPhotoKey(id: string): Promise<string | null>

    setPhoto(id: string, photo: string, photoKey: string): Promise<string>

    removePhoto(id: string): Promise<void>

    getUserPublicInfo(id: string): Promise<UserPublicInfo | null>

    userExists(id: string): Promise<boolean>
}