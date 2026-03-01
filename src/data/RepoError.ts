import { AppError } from "../core/AppError.js";

export type RepoErrorCode = 
| "VERSION_MISMATCH"
| "DB_ERROR"
;

export class RepoError extends AppError {

    constructor(readonly code: RepoErrorCode, readonly context?: any, source: Error | null = null, shouldShutdown: boolean = false) {
        super(code, shouldShutdown, source);
    }
}