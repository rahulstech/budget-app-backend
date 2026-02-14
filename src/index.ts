import serverless from "serverless-http";
import { createApp } from "./app/App.js";
import { budgetService } from "./app/ServiceProvider.js";

// create express app
const app = createApp(budgetService);

// handle lambda event
export const handler = serverless(app, {
    provider: 'aws',
});