import { ParticipantUser, UpdateUserModel, User } from "./Models.js";

export interface UserRepo {

    insertUser(user: User): Promise<User>

    updateUser(id: string, updats: UpdateUserModel): Promise<User | null>

    deleteUser(id: string): Promise<void>

    getParticipantUsers(budgetId: string): Promise<ParticipantUser[]>

    getUser(id: string): Promise<User | null>

    userExists(id: string): Promise<boolean>
}