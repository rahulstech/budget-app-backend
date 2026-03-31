import { createApp } from "./app/App.js";
import { budgetService, userService } from "./app/ServiceProvider.js";
import { logDebug, logError } from "./core/Logger.js";

const SERVER_PORT = 3000;

const app = createApp(budgetService, userService);

app.listen(SERVER_PORT, (error?: Error)=> {
    if (error) {
        logError(`server closed with error `, error);
    }
    else {
        logDebug(`server is ready to receive request in http://localhost:${SERVER_PORT}`);
    }
});