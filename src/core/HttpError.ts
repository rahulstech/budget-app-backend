import { STATUS_CODES } from "node:http";
import { AppError } from "./AppError.js";

function getHttpStatusMessage(statusCode: number): string {
    return STATUS_CODES[statusCode] ?? "";
}

export class HttpError extends AppError {

    readonly issues?: HttpError.ErrorItem[]

    constructor(readonly statusCode: number, message?: string | null, cause?: any, shouldShutdown: boolean = false) {
        super(
            message ?? getHttpStatusMessage(statusCode), 
            shouldShutdown,
            cause
        );
    }

    flatten(): string[] {
        const issues = this.issues;
        if (!issues) {
            return [];
        }
        return issues;
    }
}

export namespace HttpError {

    export type ErrorItem = string

    export class BadRequest extends HttpError {

        constructor(message?: string) {
            super(400, message);
        }
    }

    export class Unauthorized extends HttpError {

        constructor(message?: string) {
            super(401, message);
        }
    }

    export class Forbidden extends HttpError {

        constructor(message?: string) {
            super(403, message);
        }
    }

    export class NotFound extends HttpError {

        constructor(message?: string, context?: Record<string,any>) {
            super(404, message,context);
        }
    }

    export class Conflict extends HttpError {

        constructor(message?: string) {
            super(409, message);
        }
    }

    export class ServerError extends HttpError {

        constructor(message: string|null = null, cause?: any, shouldShutdown: boolean = false) {
            super(500, message ?? getHttpStatusMessage(500), cause, shouldShutdown);
        }
    }
}