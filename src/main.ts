import { createApp } from "./app/App.js";
import { getServiceProvider } from "./app/ServiceProvider.js";
import { initEnvironment } from "./core/Environment.js";
import { logDebug, logFatal } from "./core/Logger.js";

const SERVER_PORT = 3000;

try {
    initEnvironment();

    const services = getServiceProvider();

    const app = createApp(services);

    app.listen(SERVER_PORT, (error?: Error)=> {
        if (error) {
            logFatal("server closed with error", {error});
        }
        else {
            logDebug(`server is ready to receive request in ${process.env.BASE_URL}:${SERVER_PORT}`);
        }
    });
}
catch(err: any) {
    logFatal("server initialization error", { err });
}