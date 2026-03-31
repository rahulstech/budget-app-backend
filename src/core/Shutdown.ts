import { logFatal } from "./Logger.js";

export type ShutdownCallback = ()=> Promise<void> | void;

const shutdownCallbacks: ShutdownCallback[] = [];

export function onShutdown(callback: ShutdownCallback) {
    shutdownCallbacks.push(callback);
}

function shutdown(eventName: string, exitCode: number): void {
    
    process.on(eventName, async (cause?: any) => {
        logFatal(`shutdown initiated by ${eventName} with exit code ${exitCode}`, { cause });

        for(const callback of shutdownCallbacks) {
            try {
                await callback();
            }
            catch(ignore) {}
        }

        process.exit(exitCode);
    })
}

["SIGINTR","SIGTER"].forEach(signal => shutdown(signal, 0));

["uncaughtException", "unhandledRejection"].forEach(reason => shutdown(reason, 1));