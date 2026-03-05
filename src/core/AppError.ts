export class AppError extends Error {

    readonly name: string = this.constructor.name;

    constructor(message: string, readonly shouldShutdown: boolean = false, readonly reason: any = null) {
        super(message);

        // prepare stack trace
        Error.captureStackTrace(this);
        if (reason instanceof Error) {
            this.stack = [this.stack, reason.stack].filter(Boolean).join("\n");
        }
    }

    toJson(): object {
        const json: Record<string,any> = {};
        for (const key in Object.getOwnPropertyNames(this)) {
            if (key === "stack") continue;
            
            const value = (this as any)[key];
            if (typeof value !== "function") {
                json[key] = value;
            }
        }
        return json;
    }
}
