// drizzle.config.ts
import type { Config } from "drizzle-kit";
import { configDotenv } from "dotenv";

const NODE_ENV = process.env.NODE_ENV ?? "dev";

const env = {};

configDotenv({ 
  path: `${NODE_ENV}.env`,
  processEnv: env
 });

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_USE_SSL,
  DB_SSL_CA_BASE64
} = env as any;

const port = typeof DB_PORT === "undefined" ? undefined : Number(DB_PORT);

const useSSL = DB_USE_SSL === "true";

const ssl = useSSL ? 
        { 
          ca: Buffer.from(DB_SSL_CA_BASE64!,"base64").toString("utf-8"),
          rejectUnauthorized: true
        }
        : false;

export default {
  schema: "./src/data/schema/*.ts",
  out: "./drizzle/migration",
  dialect: "postgresql",
  dbCredentials: {
    host: DB_HOST!,
    port,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME!,
    ssl
  },
} satisfies Config;