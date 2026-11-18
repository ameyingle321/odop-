/**
 * ODOP Nexus — Execute SQL via Supabase
 *
 * Uses the Supabase service-role client to execute the migration
 * by splitting it into individual statements and executing them
 * via supabase.rpc() after creating a helper function.
 *
 * Usage: node database/execute-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'public' },
});

/**
 * Execute raw SQL via the Supabase SQL HTTP API.
 * Uses the /sql endpoint which accepts raw SQL with service-role auth.
 */
async function execSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL execution failed (${response.status}): ${text}`);
  }
}

/**
 * Split a SQL file into individual statements.
 * Handles multi-line statements, functions with $$ delimiters, etc.
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('--') || trimmed === '') {
      current += line + '\n';
      continue;
    }

    // Track $$ delimiters for function bodies
    const dollarQuotes = (line.match(/\$\$/g) || []).length;
    if (dollarQuotes % 2 !== 0) {
      inDollarQuote = !inDollarQuote;
    }

    current += line + '\n';

    // If we're not inside a function body and the line ends with ;
    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt && !stmt.match(/^--/)) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  // Add any remaining statement
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function main() {
  console.log('\n=== ODOP Nexus — Execute Migration ===\n');

  // Step 1: Create a helper function to execute arbitrary SQL
  console.log('Step 1: Creating exec_sql helper function...');

  const createHelperFn = `
    CREATE OR REPLACE FUNCTION public.exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
    END;
    $$;
  `;

  // Try creating the helper function first - use direct insert approach
  // Actually, the simplest approach is to read and split the SQL,
  // then use the helper function to execute each statement

  // First, try if exec_sql already exists
  try {
    const { error } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });
    if (error) {
      console.log('exec_sql not available. Need direct DB access.');
      console.log('');
      console.log('Please run the migration in one of these ways:');
      console.log('');
      console.log('Option 1 — Supabase SQL Editor (Recommended):');
      console.log('  1. Open your Supabase Dashboard > SQL Editor');
      console.log('  2. Copy the entire contents of database/migrations/full_migration.sql');
      console.log('  3. Paste into the SQL Editor and click "Run"');
      console.log('');
      console.log('Option 2 — Add DATABASE_URL to backend/.env:');
      console.log('  1. Go to Supabase Dashboard > Settings > Database');
      console.log('  2. Copy the "URI" connection string');
      console.log('  3. Add it as DATABASE_URL in backend/.env');
      console.log('  4. Run: node database/apply-migration.js');
      console.log('');
      process.exit(1);
    }

    console.log('✅ exec_sql function available');
  } catch (err) {
    console.log('Cannot reach exec_sql:', err.message);
    process.exit(1);
  }

  // Step 2: Read and execute the migration
  const migrationPath = join(__dirname, 'migrations', 'full_migration.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  const statements = splitSqlStatements(sql);

  console.log(`\nStep 2: Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    // Skip comment-only statements
    if (stmt.split('\n').every(l => l.trim().startsWith('--') || l.trim() === '')) {
      continue;
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        console.error(`  ❌ Statement ${i + 1}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        // Show progress every 10 statements
        if (successCount % 10 === 0) {
          console.log(`  ✅ ${successCount} statements executed...`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n✅ ${successCount} statements succeeded`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} statements failed`);
  }
  console.log('\nNext step: Run verification with  node database/verify-database.js\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
