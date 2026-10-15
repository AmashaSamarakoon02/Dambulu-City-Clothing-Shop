// One-off utility: upgrades existing data to the shopping-system schema.
// - creates the default clothing categories
// - maps old category values (women/men/kids) to the new slugs
// - converts hex colours to readable names
// - copies the bundled product images into backend/uploads/seed and repoints
//   product image paths (the old /src/assets paths only work on the Vite dev server)
// - fills Product.images and OrderItem snapshots
// Safe to run more than once.
//
// Usage:
//   node src/migrateShopData.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { DEFAULT_CATEGORIES, LEGACY_CATEGORY_MAP, normalizeColor } = require('./utils/shopDefaults');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ASSETS_DIR = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets');
const SEED_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'seed');

const migrateImagePath = (image) => {
  const match = /^\/src\/assets\/(.+)$/.exec(image || '');
  if (!match) return image;
  const source = path.join(ASSETS_DIR, match[1]);
  if (fs.existsSync(source)) {
    fs.mkdirSync(SEED_UPLOADS_DIR, { recursive: true });
    fs.copyFileSync(source, path.join(SEED_UPLOADS_DIR, match[1]));
  }
  return `/uploads/seed/${match[1]}`;
};

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }
  console.log(`Ensured ${DEFAULT_CATEGORIES.length} categories.`);

  const products = await prisma.product.findMany();
  for (const product of products) {
    const image = migrateImagePath(product.image);
    const images = (product.images.length ? product.images : [product.image]).map(migrateImagePath);
    await prisma.product.update({
      where: { id: product.id },
      data: {
        category: LEGACY_CATEGORY_MAP[product.category] || product.category,
        colors: [...new Set(product.colors.map(normalizeColor))],
        image,
        images
      }
    });
  }
  console.log(`Updated ${products.length} product(s).`);

  const items = await prisma.orderItem.findMany({ where: { productName: '' }, include: { product: true } });
  for (const item of items) {
    if (!item.product) continue;
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { productName: item.product.name, productImage: migrateImagePath(item.product.image) }
    });
  }
  console.log(`Backfilled ${items.length} order item snapshot(s).`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
