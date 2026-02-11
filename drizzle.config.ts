// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/data/schema/*.ts",
  out: "./drizzle/migration",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "budget_app",
    ssl: false,
  },
} satisfies Config;