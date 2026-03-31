import { logFatal } from "./Logger.js";

type ShutdownHandler = (cause?: any) => Promise<void> | void;

const shutdownCallbacks: ShutdownCallback[] = [];

export type ShutdownCallback = ()=> Promise<void> | void;

export function onShutdown(callback: ShutdownCallback) {
    shutdownCallbacks.push(callback);
}


async function invokeShoutdownCallbacks() {
    for(const callback of shutdownCallbacks) {
        try {
            await callback();
        }
        catch(ignore) {}
    }
}

function shutdown(eventName: string, exitCode: number, handler: ShutdownHandler): void {
    
    process.on(eventName, async (cause?: any) => {
        await handler(cause);
        process.exit(exitCode);
    })
}

function shutdownOnSignal(signal: string) {
    shutdown(signal, 0, async () => {
        invokeShoutdownCallbacks();
    });
} 

function shutdownOnUnhandledError(errorType: string) {
    shutdown(errorType, 1, async (cause?: any) => {
        logFatal(`unhandled error ${errorType}`, { cause });

        invokeShoutdownCallbacks();
    });
}



["SIGINT"].forEach(signal => shutdownOnSignal(signal));

["uncaughtException", "unhandledRejection"].forEach(errorType => shutdownOnUnhandledError(errorType));