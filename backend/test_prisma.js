require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

try {
  const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL
  });
  console.log("Success with datasourceUrl!");
} catch (e) {
  console.error("Error with datasourceUrl:", e.message);
}
