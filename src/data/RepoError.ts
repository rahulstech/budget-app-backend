import { DrizzleQueryError } from "drizzle-orm";
import { AppError } from "../core/AppError.js";

type RepoErrorContext = Record<string,any>;

export class RepoError extends AppError {

    constructor(message: string | null, readonly context: RepoErrorContext|null = null, cause: any = null, shouldShutdown: boolean = false) {
        super(message, shouldShutdown, cause);
    }

    static create(params: {
        error: any, 
        context?: RepoErrorContext, 
        message?: string,
        shouldShutdown?: boolean
    }): RepoError {

        const { error, context, message, shouldShutdown = false } = params;

        if (error instanceof RepoError) {
            return error;
        }
        
        if (error instanceof DrizzleQueryError) {
            const code = (error.cause as any).code;
            switch(code) {
                case "23505": 
                    return new UniqueConstraintError(context, message);
                case "23503":
                    return new ForeignKeyError(context, message);
                case "23502":
                    return new NotNullContraintError(context, message)
            }
        }
        return new RepoError(message ?? "internal error", context, error, shouldShutdown);
    }
}

export class RecordNotFound extends RepoError {

    constructor(context?: RepoErrorContext, message?: string) {
        super(message ?? null,context);
    }
}

export class UniqueConstraintError extends RepoError {

    constructor(context?: RepoErrorContext, message?: string) {
        super(message ?? null, context)
    }
}

export class VersionMismatchError extends RepoError {

    constructor(context?: RepoErrorContext, message?: string) {
        super(message ?? null, context)
    }
}

export class ForeignKeyError extends RepoError {

    constructor(context?: RepoErrorContext, message?: string) {
        super(message ?? null,context)
    }
}


export class NotNullContraintError extends RepoError {

    constructor(context?: RepoErrorContext, message?: string) {
        super(message ?? null,context)
    }
}