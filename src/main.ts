import { createApp } from "./app/App.js";
import { budgetService, userService } from "./app/ServiceProvider.js";

const SERVER_PORT = 3000;

const app = createApp(budgetService, userService);

app.listen(SERVER_PORT, (error?: Error)=> {
    if (error) {
        console.error(`server closed with error `, error);
    }
    else {
        console.log(`server is ready to receive request in http://localhost:${SERVER_PORT}`);
    }
});