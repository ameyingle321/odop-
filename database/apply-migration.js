/**
 * ODOP Nexus — Apply Migration via Supabase Management API
 *
 * Executes the full_migration.sql against the Supabase PostgreSQL
 * database using the Supabase Management API (SQL endpoint).
 *
 * Usage: node database/apply-migration.js
 *
 * This script NEVER prints credential values.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

// Extract project ref
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

/**
 * Execute a SQL statement via the Supabase pg_query RPC or direct connection.
 * We use the service-role key to bypass RLS and execute DDL.
 */
async function executeSqlViaPg(sql) {
  const { default: pg } = await import('pg');

  // Try direct connection using the DATABASE_URL if available
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query(sql);
    } finally {
      await client.end();
    }
    return;
  }

  // Fallback: try using the Supabase transaction pooler with the password
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (dbPassword) {
    const connStr = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
    const client = new pg.Client({ connectionString: connStr });
    await client.connect();
    try {
      await client.query(sql);
    } finally {
      await client.end();
    }
    return;
  }

  throw new Error(
    'No direct database connection available.\n' +
    'Add one of these to backend/.env:\n' +
    '  DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:6543/postgres\n' +
    '  SUPABASE_DB_PASSWORD=your_database_password\n\n' +
    'Or run the SQL manually in the Supabase SQL Editor:\n' +
    '  1. Open Supabase Dashboard > SQL Editor\n' +
    '  2. Paste contents of database/migrations/full_migration.sql\n' +
    '  3. Click Run'
  );
}

async function main() {
  console.log('\n=== ODOP Nexus — Apply Database Migration ===\n');
  console.log(`Project: ${projectRef}`);

  // Read the combined migration file
  const migrationPath = join(__dirname, 'migrations', 'full_migration.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  try {
    console.log('Running full_migration.sql...\n');
    await executeSqlViaPg(sql);
    console.log('✅ Migration completed successfully!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('');
    console.error('📋 Manual alternative:');
    console.error('  1. Open your Supabase project dashboard');
    console.error('  2. Navigate to SQL Editor');
    console.error('  3. Paste the contents of database/migrations/full_migration.sql');
    console.error('  4. Click Run');
    process.exit(1);
  }

  console.log('Next step: Run verification with  node database/verify-database.js\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
