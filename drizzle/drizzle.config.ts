// drizzle.config.ts
import type { Config } from "drizzle-kit";
import { DBConfig } from "./db.config.js";

const { user, password, host, port, database, ssl } = DBConfig;

export default {
  schema: "./src/data/schema/*.ts",
  out: "./drizzle/migration",
  dialect: "postgresql",
  dbCredentials: {
    host: host,
    port,
    user,
    password,
    database,
    ssl
  },
} satisfies Config;