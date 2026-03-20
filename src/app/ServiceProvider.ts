import { Environment } from "../core/Environment.js";
import { RepoClientImpl } from "../data/impl/RepoClientImpl.js";
import { BudgetService } from "../service/budget/BudgetService.js";
import { StorageService } from "../service/storage/StorageService.js";
import { UserService } from "../service/user/UserService.js";

const {
    DB_USER,
    DB_PASS,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USE_SSL,
    DB_SSL_CA_BASE64,
    DB_MAX_CONNECTION,
} = Environment;

const DB_SSL_CA = DB_USE_SSL ? Buffer.from(DB_SSL_CA_BASE64,"base64").toString("utf-8") : undefined

// connect database
const repoClient = new RepoClientImpl({ DB_USER,DB_PASS,DB_HOST,DB_PORT,DB_NAME,DB_USE_SSL,DB_SSL_CA,DB_MAX_CONNECTION });
repoClient.connect();

// create budget service
export const budgetService = new BudgetService(repoClient);

export const storageService = new StorageService();

// create user service
export const userService = new UserService(repoClient,storageService);