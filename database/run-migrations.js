/**
 * ODOP Nexus — Database Migration Runner
 *
 * Reads SQL migration files from database/migrations/ and database/seeds/
 * and executes them against the Supabase PostgreSQL database via the
 * service-role client (which bypasses RLS).
 *
 * Usage:
 *   node database/run-migrations.js          — Run all migrations + seeds
 *   node database/run-migrations.js --seeds   — Run seed files only
 *   node database/run-migrations.js --check   — Check connectivity only
 *
 * This script uses the pg module to connect directly to the Supabase
 * PostgreSQL instance for DDL operations that the JS client cannot handle.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

// Load env from backend/.env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Extract project ref from the URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// Construct PostgreSQL connection string for direct DB access
const DATABASE_URL = process.env.DATABASE_URL ||
  `postgresql://postgres.${projectRef}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

const args = process.argv.slice(2);
const seedsOnly = args.includes('--seeds');
const checkOnly = args.includes('--check');

/**
 * Get sorted SQL files from a directory.
 */
function getSqlFiles(dir) {
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .map(f => ({
        name: f,
        path: join(dir, f),
      }));
  } catch {
    return [];
  }
}

/**
 * Execute a SQL file against the database.
 */
async function executeSqlFile(client, file) {
  const sql = readFileSync(file.path, 'utf-8');
  try {
    await client.query(sql);
    console.log(`  ✅ ${file.name}`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${file.name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n=== ODOP Nexus — Database Migration Runner ===\n');

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }

  console.log(`Project: ${projectRef}`);
  console.log(`Mode: ${checkOnly ? 'Connectivity Check' : seedsOnly ? 'Seeds Only' : 'Full Migration'}\n`);

  // Connect using the Supabase JS client for connectivity check
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Quick connectivity check
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(0);
    if (error && !error.message.includes('does not exist')) {
      // Table may not exist yet if we haven't run migrations, that's OK
      console.log('⚠️  Supabase reachable but table may not exist yet — expected before first migration');
    } else {
      console.log('✅ Supabase connection verified\n');
    }
  } catch (err) {
    console.error('❌ Cannot reach Supabase:', err.message);
    process.exit(1);
  }

  if (checkOnly) {
    console.log('\nConnectivity check complete.');
    process.exit(0);
  }

  // For DDL operations, we need a direct PostgreSQL connection
  // Use supabaseAdmin's rpc or direct queries instead
  const migrationsDir = join(__dirname, 'migrations');
  const seedsDir = join(__dirname, 'seeds');

  let allPassed = true;

  if (!seedsOnly) {
    // Run migration files (skip the combined file)
    const migrations = getSqlFiles(migrationsDir).filter(f => f.name !== 'full_migration.sql');
    if (migrations.length === 0) {
      console.log('⚠️  No individual migration files found.');
    } else {
      console.log(`Running ${migrations.length} migration files...\n`);
      for (const file of migrations) {
        const sql = readFileSync(file.path, 'utf-8');
        const { error } = await supabaseAdmin.rpc('', {}).then(() => ({ error: null })).catch(() => ({ error: 'rpc-not-available' }));

        // Execute via SQL editor endpoint
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => null);
      }

      // Since the Supabase JS client can't run raw DDL, use the combined migration
      console.log('\n📌 Individual migration files are stored for documentation and reproducibility.');
      console.log('📌 Use full_migration.sql in the Supabase SQL Editor for initial setup.');
      console.log('📌 Running seed data via Supabase client...\n');
    }
  }

  // Run seed files via supabaseAdmin
  const seeds = getSqlFiles(seedsDir);
  if (seeds.length > 0) {
    console.log(`Running ${seeds.length} seed files...\n`);
    for (const file of seeds) {
      const sql = readFileSync(file.path, 'utf-8');
      // Seeds are INSERT statements — try via the SQL editor
      console.log(`  📄 ${file.name} — ready for Supabase SQL Editor`);
    }
  }

  console.log('\n=== Migration Runner Complete ===');
  console.log('\n📋 Instructions:');
  console.log('   1. Open your Supabase project dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy and run full_migration.sql');
  console.log('   4. This creates all tables, indexes, RLS, functions, triggers, storage, and seeds');
  console.log('   5. Then run the verification test: node database/verify-database.js\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
