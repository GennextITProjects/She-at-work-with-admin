import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// NOTE: do NOT pass fetchOptions: { cache: "no-store" } here.
// neon-http issues one fetch() per query, and an explicit no-store fetch
// opts the *entire* rendering route out of the Full Route Cache — which
// silently made every DB-backed page (/, /blogs, /news, ...) render
// dynamically on every request and ignore its `export const revalidate`.
// neon-http uses POST, which Next.js never stores in the Data Cache, so
// omitting the option cannot serve stale query results.
const sql = neon(connectionString);

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV !== "production",
});

export { sql };
