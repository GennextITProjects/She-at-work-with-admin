// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";
// import * as schema from "./schema";

// const sql = neon(process.env.DATABASE_URL!);

// export const db = drizzle(sql, {
//   schema,
//   logger: process.env.NODE_ENV !== "production",
// });

// export { sql }; // 👈 needed for sql.transaction([...])
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const sql = neon(connectionString, {
  fetchOptions: {
    cache: "no-store",
  },
});

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV !== "production",
});

export { sql };