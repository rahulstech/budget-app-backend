import { createApp } from "./app/App.js";
import { getServiceProvider } from "./app/ServiceProvider.js";
import { initEnvironment } from "./core/Environment.js";
import { logDebug, logError, logFatal } from "./core/Logger.js";

const SERVER_PORT = 3000;

try {
    initEnvironment();

    const { budgetService, userService } = getServiceProvider();

    const app = createApp(budgetService, userService);

    app.listen(SERVER_PORT, (error?: Error)=> {
        if (error) {
            logError(`server closed with error `, error);
        }
        else {
            logDebug(`server is ready to receive request in http://localhost:${SERVER_PORT}`);
        }
    });
}
catch(err: any) {
    logFatal("server initialization error", { err });
}