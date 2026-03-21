import { UserService } from "../../service/user/UserService.js";
import { ControllerParams, ResponseModel } from "../Types.js";

export async function handlePutUser(service: UserService, params: ControllerParams): Promise<ResponseModel> {
    const { userId, firstName, lastName, email } = params;
    return await service.updateUser(userId, { firstName, lastName, email });
}

export async function handleDeleteUser(service: UserService, params: ControllerParams): Promise<void> {
    const { userId } = params;
    await service.deleteUser(userId);
}

export async function handleGetUser(service: UserService, params: ControllerParams): Promise<any> {
    const { userId } = params;
    const user = await service.getUser(userId);

    return user;
}

export async function handleGetUserPublicInfo(service: UserService, params: ControllerParams): Promise<any> {
    const { userId } = params;
    const user = await service.getUser(userId);
    return user;
}

export async function handleGetPhotoUploadUrl(service: UserService, params: ControllerParams): Promise<ResponseModel> {
    const { type, size } = params;
    return await service.getPhotoUploadUrl(type, size);
}

export async function handleConfirmPhotoUploadUrl(service: UserService, params: ControllerParams): Promise<ResponseModel> {
    const { userId, key } = params;
    const publicUrl = await service.markUploaded(userId, key);
    return { photo: publicUrl };
}

export async function handleDeleteProfilePhoto(service: UserService, params: ControllerParams): Promise<void> {
    const { userId } = params;
    await service.removeProfilePhoto(userId);
}