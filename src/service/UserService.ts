import { generateUUID } from "../core/Helpers.js";
import { HttpError } from "../core/HttpError.js";
import { UpdateUserModel, User, UserPublicInfo } from "../data/Models.js";
import { RepoClient } from "../data/RepoClient.js";
import { UserRepo } from "../data/UserRepo.js";
import { StorageService } from "./StorageService.js";

const MAX_PHOTO_SIZE = 5242880; // 5 mb

const DIR_TEMP = 'temp';

const DIR_PUBLIC = 'public';


export type CreateUserDto = Pick<User,"id"|"firstName"|"lastName"|"email">;

export type UpdateUserDto = Omit<UpdateUserModel,"photo">;

export type UploadUrlResult = {
    url: string;
    expiresInSeconds: number,
    key: string;
};

export class UserService {

    private readonly userRepo: UserRepo;

    constructor(
        private readonly client: RepoClient,
        private readonly storageService: StorageService,
    ) {
        const factory = client.getRepoFactory();
        this.userRepo = factory.createUserRepo();
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        const user: User = {
            ...dto,
            photo: null,
            lastModified: Date.now()
        };
        return this.userRepo.insertUser(user);
    }

    async updateUser(id: string, data: UpdateUserModel): Promise<void> {
        const { firstName, lastName, email, photo } = data;

        if (!await this.userRepo.userExists(id)) {
            throw new HttpError.Conflict("USER_NOT_EXISTS");
        }

        await this.userRepo.updateUser(id, { firstName, lastName, email });
    }

    async deleteUser(id: string): Promise<void> {
        await this.userRepo.deleteUser(id);
    }

    async getUser(id: string): Promise<User|null> {
        return this.userRepo.getUser(id);
    }

    async getUserPublicInfo(id: string): Promise<UserPublicInfo|null> {
        return this.userRepo.getUserPublicInfo(id);
    }

    async getPhotoUploadUrl(contentType: string, contentLength: number): Promise<UploadUrlResult> {
        if (contentLength > MAX_PHOTO_SIZE) {
            throw new HttpError.BadRequest('photo-too-large');
        }

        const name = generateUUID();

        const { url, expiresInSeconds } = await this.storageService.getUploadUrl({
            key: this.getTempKey(name),
            contentType,
            contentLength,
        });

        return { url, expiresInSeconds, key: name };
    }

    async markUploaded(userId: string, key: string): Promise<string> {

        // check if the photo exists in the temp location
        const exists = await this.storageService.exists(this.getTempKey(key));
        if (!exists) {
            throw new HttpError.NotFound('photo-not-found');
        }

        const tempKey = this.getTempKey(key);
        const publicKey = this.getUserPhotosKey(userId,key);

        // move the photo to the user-photos folder
        await this.storageService.copy(tempKey,publicKey);

        // generate the public url of the photo
        const publicUrl = this.storageService.getPublicUrl(this.getPublicUrlKey(publicKey));

        // update the user photo in db
        await this.userRepo.updateUser(userId, { photo: publicUrl });

        return publicUrl
    }

    /* =========================================================
       Helpers
       ========================================================= */

    private getTempKey(name: string): string {
        return `${DIR_TEMP}/${name}`;
    }

    private getUserPhotosKey(userId: string, name: string): string {
        return `${DIR_PUBLIC}/user-photos/${userId}/${name}`;
    }

    private getPublicUrlKey(publicKey: string): string {
        if (publicKey.startsWith(DIR_PUBLIC)) {
            return publicKey.substring(DIR_PUBLIC.length)
        }
        return publicKey;
    }
}