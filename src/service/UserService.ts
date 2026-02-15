import { HttpError } from "../core/HttpError.js";
import { RepoClient } from "../data/RepoClient.js";
import { UserRepo } from "../data/UserRepo.js";
import { UserDto } from "./Dtos.js";
import { toUserDto } from "./Mappers.js";

export class UserService {

    private readonly userRepo: UserRepo;

    constructor(private readonly client: RepoClient) {
        const factory = client.getRepoFactory();
        this.userRepo = factory.createUserRepo();
    }

    async createUser(dto: UserDto): Promise<UserDto> {
        const { id, firstName, lastName } = dto;

        if (await this.userRepo.userExists(id)) {
            throw new HttpError.Conflict("USER_EXISTS");
        }

        const user = await this.userRepo.insertUser({
            id,
            firstName,
            lastName: lastName ?? null
        });
        return toUserDto(user);
    }

    async updateUser(data: any): Promise<void> {
        const { id, firstName, lastName } = data;

        if (!await this.userRepo.userExists(id)) {
            throw new HttpError.Conflict("USER_NOT_EXISTS");
        }

        await this.userRepo.updateUser(id, { firstName, lastName });
    }

    async deleteUser(id: string): Promise<void> {
        await this.userRepo.deleteUser(id);
    }

    async getUser(id: string): Promise<UserDto> {
        const user = await this.userRepo.getUser(id);
        if (null === user) {
            throw new HttpError.NotFound("USER_NOT_EXISTS");
        }
        return toUserDto(user);
    }
}