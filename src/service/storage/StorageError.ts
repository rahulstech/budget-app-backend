import { AppError } from "../../core/AppError.js";
import { HttpError } from "../../core/HttpError.js";

export type StorageErrorCode = 
| 'MEDIA_TOO_BIG'
| 'INTERNAL_ERROR'

export class StorageError extends AppError {

    constructor(readonly code: StorageErrorCode, readonly context: Record<string,any>|null = null,  shouldShutdown: boolean = false, reason?: any) {
        super(code,shouldShutdown,reason);
    }

    toHttpError(): HttpError {
        switch(this.code) {
            case "MEDIA_TOO_BIG": return new HttpError.BadRequest(this.code);
            default: return new HttpError.ServerError();
        }
    }
}