import { RepoFactory } from "./RepoFactory.js";

export interface RepoClient {

    connect(): void

    disconnect(): Promise<void>

    runInTransaction<T>(action: (factory: RepoFactory)=> Promise<T>): Promise<T>

    getRepoFactory(): RepoFactory
}
