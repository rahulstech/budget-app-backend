import { createApp } from "./app/App.js";
import { getServiceProvider } from "./app/ServiceProvider.js";
import { initEnvironment } from "./core/Environment.js";
import { logFatal } from "./core/Logger.js";

const SERVER_PORT = process.env.PORT || 3000;

try {
    initEnvironment();

    const services = getServiceProvider();

    const app = createApp(services);

    app.listen(SERVER_PORT,(error?: Error)=> {
        if (error) {
            logFatal("server closed with error", {error});
        }
    });
}
catch(err: any) {
    logFatal("server initialization error", { err });
}