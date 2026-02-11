export class AppError extends Error {

    readonly name: string = this.constructor.name;
    readonly shouldShutdown: boolean = false;

    constructor(message: string, shouldShutdown: boolean = false, reason?: Error) {
        super(message);
        this.shouldShutdown = shouldShutdown;

        // prepare stack trace
        Error.captureStackTrace(this);
        this.stack = [this.stack, reason?.stack].filter(Boolean).join("\n");
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
