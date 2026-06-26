import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { parseEnv } from '@neondatabase/env';
import neonConfig from '../../neon';

const { postgres } = parseEnv(neonConfig, ['DATABASE_URL']);

const globalForPool = globalThis as unknown as { __pgPool?: Pool };

const pool =
  globalForPool.__pgPool ??
  new Pool({ connectionString: postgres.databaseUrl, max: 5 });

if (process.env.NODE_ENV !== 'production') globalForPool.__pgPool = pool;

export const db = drizzle(pool);
