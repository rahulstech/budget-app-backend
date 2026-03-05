import { AppError } from "../core/AppError.js";

export class StorageError extends AppError {

    constructor(readonly code: StorageError.ErrorCode, shouldShutdown: boolean = false, reason: any = null) {
        super(code,shouldShutdown,reason);
    }
}

export namespace StorageError {

    export type ErrorCode = 
    | 'size-exceed'
    | 'client-error'
    | 'unknown-error'
}

export interface StorageService {

    getUploadUrl(inputs: StorageService.UploadUrlInputs): Promise<StorageService.UploadUrlOutputs>

    copy(sourceKey: string, destinationKey: string): Promise<void>

    exists(key: string): Promise<boolean>

    getPublicUrl(key: string): string
}

export namespace StorageService {
    
    export type UploadUrlInputs = {
        key: string;
        contentType: string;
        contentLength: number;
        expiresInSeconds?: number;
    }

    export type UploadUrlOutputs = {
        url: string,
        expiresInSeconds: number,
    }

}