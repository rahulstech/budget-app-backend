import { STATUS_CODES } from "node:http";
import { AppError } from "./AppError.js";

function getHttpStatusMessage(statusCode: number): string {
    return STATUS_CODES[statusCode] ?? "";
}

export class HttpError extends AppError {

    readonly issues?: HttpError.ErrorItem[]

    constructor(readonly statusCode: number, issue?: string | HttpError.ErrorItem[]) {
        super(getHttpStatusMessage(statusCode), false);
        this.statusCode = statusCode;
        if (typeof issue === "string") {
            this.issues = [{ message: issue }];
        }
        else {
            this.issues = issue;
        }
    }

    flatten(): string[] {
        return this.issues?.map(iss => iss.message) ?? [];
    }
}

export namespace HttpError {

    export type ErrorItem = {
        message: string,
        code?: string,
    }

    export class BadRequest extends HttpError {

        constructor(issue?: string | HttpError.ErrorItem[]) {
            super(400, issue);
        }
    }

    export class Forbidden extends HttpError {

        constructor(issue?: string | HttpError.ErrorItem[]) {
            super(403, issue);
        }
    }

    export class NotFound extends HttpError {

        constructor(issue?: string | HttpError.ErrorItem[]) {
            super(404, issue);
        }
    }

    export class Conflict extends HttpError {

        constructor(issue?: string | HttpError.ErrorItem[]) {
            super(409, issue);
        }
    }

    export class ServerError extends HttpError {

        constructor(issue?: string | HttpError.ErrorItem[]) {
            super(500, issue);
        }
    }
}