import { AppError } from "../core/AppError.js";

export type RepoErrorCode = 
| "VERSION_MISMATCH"
;

export class RepoError extends AppError {

    constructor(readonly code: RepoErrorCode, reason: string | Error | null = null, shouldShutdown: boolean = false) {
        super(code, shouldShutdown, reason ?? undefined);
    }
}