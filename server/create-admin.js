require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

async function createAdmin() {
  const args = require('minimist')(process.argv.slice(2));
  const username = args.u || args.username || process.env.ADMIN_USERNAME;
  const password = args.p || args.password || process.env.ADMIN_PASSWORD;
  const registerSecret = args.rs || args.registerSecret || process.env.REGISTER_SECRET;

  if (!registerSecret || registerSecret !== process.env.REGISTER_SECRET) {
    console.error('REGISTER_SECRET required and must match environment value');
    process.exit(2);
  }
  if (!username || !password) {
    console.error('Provide username and password via --username/--password or ADMIN_USERNAME/ADMIN_PASSWORD env vars');
    process.exit(2);
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const q = await db.query('INSERT INTO users(username,password_hash,role) VALUES($1,$2,$3) RETURNING id,username', [username, hash, 'staff']);
    console.log('Created user', q.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Could not create user:', err.message || err);
    process.exit(1);
  }
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
