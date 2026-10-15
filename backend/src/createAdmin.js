// Utility script to create a brand-new ADMIN account, or promote an existing
// USER/EMPLOYEE account to ADMIN. Admin accounts are intentionally NOT
// available through the public /api/auth/register endpoint, so this is the
// only way to get the first admin into the system.
//
// Usage:
//   node src/createAdmin.js <email> <password> [name]
//
// Examples:
//   node src/createAdmin.js owner@luxeattire.com Str0ngPass! "Store Owner"
//   node src/createAdmin.js existing.user@example.com anything
//     (if the email already exists, the password argument is ignored and
//      that account is simply promoted to ADMIN)

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [, , email, password, name] = process.argv;

  if (!email || !password) {
    console.log('Usage: node src/createAdmin.js <email> <password> [name]');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log(`${email} is already an ADMIN.`);
    } else {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', isVerified: true }
      });
      console.log(`Promoted existing account "${updated.name}" (${updated.email}) to ADMIN.`);
    }
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        name: name || 'Admin',
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true
      }
    });
    console.log(`Created new ADMIN account "${created.name}" (${created.email}).`);
  }
}

main()
  .catch((err) => {
    console.error('Failed to create/promote admin:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
