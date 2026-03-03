import { ParticipantUser, UpdateUserModel, User, UserPublicInfo } from "./Models.js";

export interface UserRepo {

    insertUser(user: User): Promise<User>

    updateUser(id: string, updats: UpdateUserModel): Promise<User | null>

    deleteUser(id: string): Promise<void>

    getUser(id: string): Promise<User | null>

    getUserPublicInfo(id: string): Promise<UserPublicInfo | null>

    userExists(id: string): Promise<boolean>
}