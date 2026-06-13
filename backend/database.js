const { Pool } = require('pg');

let pool = null;

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  pool = new Pool({
    connectionString,
    ssl: connectionString && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT NULL,
        currency TEXT DEFAULT 'USD',
        purpose TEXT DEFAULT '',
        phone_verified INTEGER DEFAULT 0,
        country_code TEXT DEFAULT '+1',
        country TEXT DEFAULT 'US',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        target TEXT NOT NULL,
        code TEXT NOT NULL,
        purpose TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        creator_id INTEGER NOT NULL REFERENCES users(id),
        avatar TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        paid_by INTEGER NOT NULL REFERENCES users(id),
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        category TEXT DEFAULT 'General',
        split_type TEXT DEFAULT 'equal',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        receipt TEXT DEFAULT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_splits (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        is_settled INTEGER DEFAULT 0,
        settled_at TIMESTAMP DEFAULT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id SERIAL PRIMARY KEY,
        payer_id INTEGER NOT NULL REFERENCES users(id),
        payee_id INTEGER NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        related_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, contact_id)
      )
    `);
  } finally {
    client.release();
  }
}

function convertQuery(sql) {
  let idx = 0;
  const converted = sql.replace(/\?/g, () => `$${++idx}`);
  return converted;
}

async function run(sql, params = []) {
  const converted = convertQuery(sql);
  const client = await pool.connect();
  try {
    const hasReturning = /\bRETURNING\b/i.test(sql);
    if (hasReturning) {
      const result = await client.query(converted, params);
      return result.rows.length > 0 ? result.rows[0].id : 0;
    } else {
      await client.query(converted, params);
      const idResult = await client.query('SELECT lastval() as id');
      return idResult.rows[0].id;
    }
  } finally {
    client.release();
  }
}

async function get(sql, params = []) {
  const converted = convertQuery(sql);
  const result = await pool.query(converted, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function all(sql, params = []) {
  const converted = convertQuery(sql);
  const result = await pool.query(converted, params);
  return result.rows;
}

async function runInTransaction(queries) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const { sql, params } of queries) {
      const converted = convertQuery(sql);
      const result = await client.query(converted, params || []);
      results.push(result);
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { initDatabase, run, get, all, runInTransaction };
