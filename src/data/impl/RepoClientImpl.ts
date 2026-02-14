import { RepoFactory } from "../RepoFactory.js";
import { Database } from "../Models.js";
import { RepoFactoryImpl } from "./RepoFactoryImpl.js";
import { RepoClient } from "../RepoClient.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppError } from "../../core/AppError.js";
import { onShutdown } from "../../core/Shutdown.js";

export type Config = {
    DB_USER: string,
    DB_PASS: string,
    DB_HOST: string,
    DB_PORT: number,
    DB_NAME: string,
    DB_USE_SSL: boolean,
    DB_SSL_CA?: string,
    DB_MAX_CONNECTION?: number,
}

export class RepoClientImpl implements RepoClient {

    private readonly pool: Pool;

    private db?: Database;

    private factory?: RepoFactory;

    constructor(config: Config) {
        const { 
            DB_USER,
            DB_PASS,
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_MAX_CONNECTION,
            DB_USE_SSL,
            DB_SSL_CA,
        } = config;



        this.pool = new Pool({
            max: DB_MAX_CONNECTION,
            user: DB_USER,
            password: DB_PASS,
            host: DB_HOST,
            port: DB_PORT,
            database: DB_NAME,
            ssl: DB_USE_SSL ? {
                ca: DB_SSL_CA,
                rejectUnauthorized: true
            } : false
        });

        onShutdown(this.disconnect);
    }

    connect(): void {
        this.db = drizzle(this.pool);
    }

    async disconnect(): Promise<void> {
        await this.pool.end();
    }

    runInTransaction<T>(action: (factory: RepoFactory) => Promise<T>): Promise<T> {
        this.checkConnectedOrThrow();
        return this.db!.transaction(async (tx: Database) => {
            const result = await action(new RepoFactoryImpl(tx));
            return result;
        });
    }

    getRepoFactory(): RepoFactory {
        this.checkConnectedOrThrow();
        if (!this.factory) {
            this.factory = new RepoFactoryImpl(this.db!);
        }
        return this.factory!;
    }

    private checkConnectedOrThrow(): void {
        if (!this.db) {
            throw new AppError("call connect() first.", true);
        }
        else if (this.pool.ended) {
            throw new AppError("connection is already closed.", true);
        }
    }
}