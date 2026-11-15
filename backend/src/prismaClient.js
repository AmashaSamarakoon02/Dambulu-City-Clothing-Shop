const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;

// Neon suspends the database after a few idle minutes and closes open connections.
// - idleTimeoutMillis: drop our idle connections before Neon does
// - connectionTimeoutMillis: give a sleeping database time to wake up
// - keepAlive: detect dead sockets early
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 20_000,
  keepAlive: true
});

// Without this listener, a connection closed by the server crashes the whole backend.
// The pool discards the broken client and opens a new one on the next query.
pool.on('error', (err) => {
  console.warn('[db] idle connection closed by the server:', err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
