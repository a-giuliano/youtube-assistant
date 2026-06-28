import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { parseEnv } from '@neondatabase/env';
import neonConfig from './neon';

loadEnv({ path: '.env.local' });
const env = parseEnv(neonConfig);

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  // Only manage the `public` schema. `neon_auth` is owned by Neon Auth itself
  // and Drizzle Kit must never touch it (or it will try to drop/recreate the
  // auth tables on every push).
  schemaFilter: ['public'],
  dbCredentials: {
    url: env.postgres.databaseUrl,
  },
});
