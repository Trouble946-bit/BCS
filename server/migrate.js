const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  const sqlPath = path.join(__dirname, 'sql', 'init.sql');
  const content = fs.readFileSync(sqlPath, 'utf8');
  // split statements by semicolon and run individually
  const statements = content
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await db.query(stmt);
      console.log('Executed statement');
    } catch (err) {
      console.error('Migration statement failed:', err.message || err);
      process.exitCode = 1;
    }
  }
  console.log('Migrations finished.');
  process.exit(process.exitCode || 0);
}

runMigrations().catch(err => { console.error(err); process.exit(1); });
