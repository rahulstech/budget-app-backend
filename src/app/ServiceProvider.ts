import { Environment, isProdEnvironment } from "../core/Environment.js";
import { RepoClientImpl } from "../data/impl/RepoClientImpl.js";
import { AuthService } from "../service/auth/AuthService.js";
import { BudgetService } from "../service/budget/BudgetService.js";
import { StorageService } from "../service/storage/StorageService.js";
import { UserService } from "../service/user/UserService.js";


export type ServiceProvider = { 
    budgetService: BudgetService, 
    userService: UserService, 
    storageService: StorageService,
    authService?: AuthService, 
}

export function getServiceProvider(): ServiceProvider {
    const {
        DB_USER,
        DB_PASS,
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_USE_SSL,
        DB_SSL_CA_BASE64,
        DB_MAX_CONNECTION,
        FIREBASE_SERVICEACCOUNT_JSON_BASE64
    } = Environment;

    const DB_SSL_CA = DB_USE_SSL ? Buffer.from(DB_SSL_CA_BASE64,"base64").toString("utf-8") : undefined

    // connect database
    const repoClient = new RepoClientImpl({ DB_USER,DB_PASS,DB_HOST,DB_PORT,DB_NAME,DB_USE_SSL,DB_SSL_CA,DB_MAX_CONNECTION });
    repoClient.connect();

    // create budget service
    const budgetService = new BudgetService(repoClient);

    const storageService = new StorageService();

    // create user service
    const userService = new UserService(repoClient,storageService);

    // create AuthService
    let authService: AuthService | undefined;
    if (isProdEnvironment()) {
        const serviceAccount = AuthService.decodeSeviceAccountJsonBase64(FIREBASE_SERVICEACCOUNT_JSON_BASE64);
        authService = new AuthService(serviceAccount);
    }
    

    return {
        budgetService,
        storageService,
        userService,
        authService,
    } satisfies ServiceProvider;
}

