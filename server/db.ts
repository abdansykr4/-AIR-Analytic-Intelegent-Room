import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     "DATABASE_URL must be set. Did you forget to provision a database?",
//   );
// }

export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'air_system',
  user: 'postgres',
  password: 'abc123'
});

export const db = drizzle(pool, { schema });