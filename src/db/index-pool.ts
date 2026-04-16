// db/index-pool.ts
import * as schema from "./schema";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const dbPool = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV !== "production",
});