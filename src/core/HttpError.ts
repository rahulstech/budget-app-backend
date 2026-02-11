import { STATUS_CODES } from "node:http";
import { AppError } from "./AppError.js";

function getHttpStatusMessage(statusCode: number): string {
    return STATUS_CODES[statusCode] ?? "";
}

export class HttpError extends AppError {

    constructor(readonly statusCode: number, message: string | null = null, readonly errorItems?: HttpError.ErrorItem[]) {
        super(message ?? getHttpStatusMessage(statusCode), false);
        this.statusCode = statusCode;
        this.errorItems = errorItems;
    }

    toJson(): object {
        const appErrorJson = super.toJson()
        const json = {
            ...appErrorJson,
            name: this.name,
            statusCode: this.statusCode,
            errorItems: this.errorItems,
        };
        return json;
    }
}

export namespace HttpError {

    export type ErrorItem = {
        message: string,
        code?: string,
    }

    export class BadRequest extends HttpError {

        constructor(message: string | null, errorItems?: HttpError.ErrorItem[]) {
            super(404, message, errorItems);
        }
    }

    export class NotFound extends HttpError {

        constructor(message?: string) {
            super(404, message)
        }
    }

    export class Conflict extends HttpError {

        constructor(message?: string) {
            super(409, message)
        }
    }

    export class Forbidden extends HttpError {

        constructor(message?: string) {
            super(403, message)
        }
    }
}