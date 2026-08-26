// db/index-pool.ts
// WebSocket-backed pool. Only used by admin write paths that need real
// transactions (`dbPool.transaction(...)`), which the stateless neon-http
// client in ./index.ts cannot do. Everything else should import `db` there.
import * as schema from "./schema";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Admin writes are low-concurrency; a large ceiling only means more
    // simultaneously-open WebSockets to the Neon compute.
    max: 3,
    // Was 30_000. An idle-but-open WebSocket keeps the Neon compute awake, so
    // every admin write used to block scale-to-zero for a further 30 seconds.
    // 5s is still long enough to reuse the connection across a burst of edits.
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });

// Cache on globalThis in ALL environments. This was previously dev-only, which
// is backwards: in production each warm lambda instance rebuilt its own Pool
// (and its own WebSocket) on every cold module evaluation.
globalForDb.pool = pool;

export const dbPool = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV !== "production",
});
