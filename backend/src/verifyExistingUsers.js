// One-off utility: marks every existing account as email-verified.
// Run once after adding the `isVerified` column so accounts created before
// email verification existed are not locked out.
//
// Usage:
//   node src/verifyExistingUsers.js

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const { count } = await prisma.user.updateMany({
    where: { isVerified: false },
    data: { isVerified: true }
  });
  console.log(`Marked ${count} existing account(s) as verified.`);
}

main()
  .catch((err) => {
    console.error('Failed to verify existing users:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
