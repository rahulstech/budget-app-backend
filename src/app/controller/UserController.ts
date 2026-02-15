import { UserService } from "../../service/UserService.js";
import { ControllerParams } from "../Types.js";

export async function handlePostUser(service: UserService, params: ControllerParams): Promise<any> {
    const { userId, firstName, lastName } = params;
    const user = await service.createUser({ id: userId, firstName, lastName });
    return user;
}

export async function handlePatchUser(service: UserService, params: ControllerParams): Promise<void> {
    const { userId, firstName, lastName } = params;
    await service.updateUser({ id: userId, firstName, lastName });
}

export async function handleDeleteUser(service: UserService, params: ControllerParams): Promise<void> {
    const { userId } = params;
    await service.deleteUser(userId);
}

export async function handleGetUser(service: UserService, params: ControllerParams): Promise<any> {
    const { userId } = params;
    const user = await service.getUser(userId);
    console.log(user);
    return user;
}