import serverless from "serverless-http";
import { createApp } from "./app/App.js";
import { getServiceProvider } from "./app/ServiceProvider.js";
import { initEnvironment } from "./core/Environment.js";
import { logFatal } from "./core/Logger.js";

let handler: ReturnType<typeof serverless>;


try {
    // init environment variables
    initEnvironment();

    // get services
    const { budgetService, userService } = getServiceProvider();

    // create express app
    const app = createApp(budgetService,userService);

    // handle lambda event
    handler = serverless(app, {
        provider: 'aws',
    });
}
catch(err: any) {
    logFatal("server initialization error", { err });
}

export { handler };