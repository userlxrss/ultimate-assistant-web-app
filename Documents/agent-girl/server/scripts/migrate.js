#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔄 Starting database migration...');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        // Ignore errors for objects that already exist
        if (error.code === '42P07' || error.code === '42710') {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    // Create migration history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) DEFAULT '2.0.0',
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT DEFAULT 'Initial OAuth system schema'
      )
    `);

    // Record migration
    await client.query(`
      INSERT INTO migration_history (version, description)
      VALUES ('2.0.0', 'Enhanced OAuth system with encrypted token storage')
    `);

    await client.query('COMMIT');

    console.log('🎉 Migration completed successfully!');
    console.log('📊 Database schema version: 2.0.0');

    // Display table information
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tablesResult = await client.query(tablesQuery);

    console.log('\n📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Verify database connection before migration
async function verifyConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n💡 Please check:');
    console.error('   • Database server is running');
    console.error('   • DATABASE_URL is correct');
    console.error('   • Database exists');
    console.error('   • User has necessary permissions');
    return false;
  }
}

async function main() {
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);

  const connected = await verifyConnection();
  if (!connected) {
    process.exit(1);
  }

  await runMigration();
}

main().catch(error => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});