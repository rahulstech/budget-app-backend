import pino, { Level, LoggerOptions } from "pino";

export type LogContext = string | Error | Record<string,any>;

export const DEFAULT_LOG_LEVEL: Level = process.env.NODE_ENV === "prod" ? "warn" : "debug";

export class Logger {

    constructor(readonly logger: pino.Logger = this.createLogger()) {}

    private createLogger(): pino.Logger {
        const option: LoggerOptions = {
            level: DEFAULT_LOG_LEVEL,

            timestamp: pino.stdTimeFunctions.isoTime,

            formatters: {
                level: (label, _) => ({ label })
            },

            transport: process.env.NODE_ENV === "dev" ? 
            {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                }
            } : undefined,
        };
        return pino(option);
    }

    private log(level: Level, message: string, context?: LogContext) {
        const normalied = this.normalizeLogContext(level,context);
        switch(level) {
            case "fatal": this.logger.fatal(normalied, message)
            break;
            case "error": this.logger.error(normalied, message)
            break;
            case "warn": this.logger.warn(normalied, message)
            break;
            case "info": this.logger.info(normalied, message)
            break;
            case "debug": this.logger.debug(normalied, message)
        }
    }

    private normalizeLogContext(level: Level, context?: LogContext): Record<string,any> {
        if (!context) return {};

        if (context instanceof Error) {
            const error = context as any;
            if (typeof error.toJson === "function") {
                return error.toJson();
            }
            return {
                reason: {
                    name: error.name,
                    message: error.message,
                    stack: level == "fatal" ? error.stack : undefined, 
                }
            }
        }

        return {context};
    }

    fatal(message: string, context?: LogContext) {
        this.log("fatal",message,context);
    }

    error(message: string, context?: LogContext) {
        this.log("error",message,context);
    }

    warn(message: string, context?: LogContext) {
        this.log("warn",message,context);
    }

    info(message: string, context?: LogContext) {
        this.log("info",message,context);
    }

    debug(message: string, context?: LogContext) {
        this.log("debug",message,context);
    }
}

export const globalLogger = new Logger();

export function logFatal(message: string, context?: LogContext) {
    globalLogger.fatal(message,context);
}

export function logError(message: string, context?: LogContext) {
    globalLogger.error(message,context);
}

export function logWarn(message: string, context?: LogContext) {
    globalLogger.warn(message,context);
}

export function logInfo(message: string, context?: LogContext) {
    globalLogger.info(message,context);
}

export function logDebug(message: string, context?: LogContext) {
    globalLogger.debug(message,context);
}