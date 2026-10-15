// Utility script to create a brand-new DELIVERY account, or promote an existing
// USER/EMPLOYEE account to DELIVERY.
//
// Usage:
//   node src/createDelivery.js <email> <password> [name]
//
// Examples:
//   node src/createDelivery.js driver1@example.com pass123 "Driver 1"
//   node src/createDelivery.js existing.user@example.com anything

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
    console.log('Usage: node src/createDelivery.js <email> <password> [name]');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === 'DELIVERY') {
      console.log(`${email} is already a DELIVERY partner.`);
    } else {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'DELIVERY', isVerified: true }
      });
      console.log(`Promoted existing account "${updated.name}" (${updated.email}) to DELIVERY.`);
    }
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        name: name || 'Delivery Driver',
        email,
        password: hashedPassword,
        role: 'DELIVERY',
        isVerified: true
      }
    });
    console.log(`Created new DELIVERY account "${created.name}" (${created.email}).`);
  }
}

main()
  .catch((err) => {
    console.error('Failed to create/promote delivery partner:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
