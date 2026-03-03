// drizzle.config.ts
import type { Config } from "drizzle-kit";
import { DBConfig } from "./db.config";

const {host,port,user,password,database,ssl } = DBConfig

export default {
  schema: "./src/data/schema/*.ts",
  out: "./drizzle/migration",
  dialect: "postgresql",
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
    ssl
  },
} satisfies Config;