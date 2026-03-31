import { AppError } from "../../core/AppError.js";
import { generateUUID } from "../../core/Helpers.js";
import { HttpError } from "../../core/HttpError.js";
import { UpsertUserModel, User, UserPublicInfo } from "../../data/Models.js";
import { RepoClient } from "../../data/RepoClient.js";
import { RepoError } from "../../data/RepoError.js";
import { UserRepo } from "../../data/UserRepo.js";
import { UserDto } from "../Dtos.js";
import { toUserDto } from "../Mappers.js";
import { StorageError } from "../storage/StorageError.js";
import { StorageService } from "../storage/StorageService.js";

const MAX_PHOTO_SIZE = 5242880; // 5 mb

const DIR_TEMP = 'temp';

const DIR_PUBLIC = 'public';


export type CreateUserDto = Pick<User,"id"|"firstName"|"lastName"|"email">;

export type UploadUrlResult = {
    url: string;
    expiresInSeconds: number,
    key: string;
};

export class UserService {

    constructor(
        private readonly client: RepoClient,
        private readonly storageService: StorageService,
    ) {
        const factory = client.getRepoFactory();
    }

    private getUserRepo(): UserRepo {
        return this.client.getRepoFactory().createUserRepo();
    }

    async updateUser(id: string, data: Partial<Omit<User, "id"|"lastModified">>): Promise<UserDto> {
        try {
            const user: UpsertUserModel = {
                id,
                ...data,
                lastModified: Date.now()
            }
            const updatedUser = await this.getUserRepo().upsertUser(user);
            return toUserDto(updatedUser);
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    async deleteUser(id: string): Promise<void> {
        await this.getUserRepo().deleteUser(id);
    }

    async getUser(id: string): Promise<UserDto> {
        try {
            const userRepo = this.getUserRepo();
            const user = await userRepo.getUser(id);
            if (null === user) {
                throw new HttpError.NotFound("USER_NOT_FOUND", { id });
            }

            return toUserDto(user);
        }
        catch(err: any) { 
            throw this.mapError(err);
        }
    }

    async getUserPublicInfo(id: string): Promise<UserPublicInfo|null> {
        try {
            const userRepo = this.getUserRepo();
            const userInfo = await userRepo.getUserPublicInfo(id);
            if (null === userInfo) {
                throw new HttpError.NotFound("USER_NOT_FOUND", {id});
            }
            return userInfo;
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    async getPhotoUploadUrl(contentType: string, contentLength: number): Promise<UploadUrlResult> {
        if (contentLength > MAX_PHOTO_SIZE) {
            throw new HttpError.BadRequest("PHOTO_TOO_BIG");
        }

        try {
            const name = generateUUID();
            const { url, expiresInSeconds } = await this.storageService.getUploadUrl({
                key: this.getTempKey(name),
                contentType,
                contentLength,
            });

            return { url, expiresInSeconds, key: name };
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    async markUploaded(userId: string, key: string): Promise<string> {
        try {
            // check if the photo exists in the temp location
            const exists = await this.storageService.exists(this.getTempKey(key));
            if (!exists) {
                // it may be marked uploaded before. so, check if photo exists in db, 
                // if photo key does not exists in db then throw
                if (!(await this.checkPhotoExists(userId, key))) {
                    throw new HttpError.NotFound('PHOTO_NOT_FOUND');
                }
                
                const publicKey = this.createPhotoKey(userId,key);
                const publicUrl = this.storageService.getPublicUrl(this.getPublicUrlKey(publicKey));
                return publicUrl;
            }

            const tempKey = this.getTempKey(key);
            const photoKey = this.createPhotoKey(userId,key);

            // move the photo to the user-photos folder
            await this.storageService.copy(tempKey,photoKey);

            // generate the public url of the photo
            const publicUrl = this.storageService.getPublicUrl(this.getPublicUrlKey(photoKey));

            // delete current photo from storage
            await this.deletePhotoFromStorage(userId);

            // update the user photo in db
            return await this.getUserRepo().setPhoto(userId, publicUrl, photoKey);
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    async removeProfilePhoto(userId: string): Promise<void> {
        try {
            const wasExist = await this.deletePhotoFromStorage(userId);
            if (wasExist) {
                await this.getUserRepo().removePhoto(userId);
            }
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    /* =========================================================
       Helpers
       ========================================================= */

    private getTempKey(name: string): string {
        return `${DIR_TEMP}/${name}`;
    }

    private createPhotoKey(userId: string, name: string): string {
        return `${DIR_PUBLIC}/user-photos/${userId}/${name}`;
    }

    private getPublicUrlKey(publicKey: string): string {
        if (publicKey.startsWith(DIR_PUBLIC)) {
            return publicKey.substring(DIR_PUBLIC.length)
        }
        return publicKey;
    }

    private async deletePhotoFromStorage(userId: string): Promise<boolean> {
        const photoKey = await this.getUserRepo().getPhotoKey(userId);
        if (null == photoKey) return false;

        await this.storageService.delete(photoKey);
        return true;
    }

    private async checkPhotoExists(userId: string, confirmationKey: string): Promise<boolean> {
        const expectedKey = this.createPhotoKey(userId, confirmationKey);
        const actualKey = await this.getUserRepo().getPhotoKey(userId);

        return expectedKey !== actualKey
    }

    private mapError(err: any): AppError {
        if (err instanceof StorageError) {
            return err.toHttpError();
        }
        if (err instanceof HttpError) {
            return err;
        }
        return new HttpError.ServerError(null,err);
    }
}