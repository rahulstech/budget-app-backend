export class AppError extends Error {

    readonly name: string = this.constructor.name;

    constructor(message: string | null, readonly shouldShutdown: boolean = false, readonly cause: any = null) {
        super(message ?? undefined);

        // prepare stack trace
        Error.captureStackTrace(this);
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
