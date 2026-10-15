// Seeds the default categories and sample products.
// Existing products (matched by name) are left untouched, so this is safe to
// re-run and never deletes products that appear in customer orders.
//
// Usage:
//   node src/seed.js

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { DEFAULT_CATEGORIES } = require('./utils/shopDefaults');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Images live in backend/uploads/seed (served at /uploads/seed).
const products = [
  {
    name: "Luxe Long Sleeve Boxy Shirt",
    category: "womens-wear",
    price: 4053,
    originalPrice: 5790,
    isNewArrival: true,
    image: "/uploads/seed/women_product_1.png",
    colors: ["Maroon", "Black"],
    sizes: ["XS", "S", "M", "L", "XL"]
  },
  {
    name: "Rolled Up Sleeve Relaxed Fit Shirt",
    category: "womens-wear",
    price: 3493,
    originalPrice: 4990,
    isNewArrival: true,
    image: "/uploads/seed/women_product_2.png",
    colors: ["Gold", "White"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Casual Linen Navy Blue Shirt",
    category: "mens-wear",
    price: 5200,
    originalPrice: 6500,
    isNewArrival: true,
    image: "/uploads/seed/men_product_1.png",
    colors: ["Navy", "Beige"],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    name: "Premium White Crew Neck T-Shirt",
    category: "mens-wear",
    price: 2500,
    isNewArrival: false,
    image: "/uploads/seed/men_product_2.png",
    colors: ["White", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    name: "Floral Summer Dress",
    category: "kids-wear",
    price: 3150,
    originalPrice: 4500,
    isNewArrival: true,
    image: "/uploads/seed/kids_product_1.png",
    colors: ["Pink", "Lemon"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"]
  },
  {
    name: "Striped Polo & Shorts Set",
    category: "kids-wear",
    price: 2800,
    originalPrice: 3500,
    isNewArrival: false,
    image: "/uploads/seed/kids_product_2.png",
    colors: ["Sky Blue", "White"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"]
  }
];

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }

  let created = 0;
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        description: "Premium quality clothing crafted for style and comfort. Limited edition release.",
        price: p.price,
        originalPrice: p.originalPrice || null,
        image: p.image,
        images: [p.image],
        category: p.category,
        brand: "Luxe Attire",
        isNewArrival: p.isNewArrival,
        isBestSeller: true,
        colors: p.colors,
        sizes: p.sizes,
        stock: 20
      }
    });
    created++;
  }

  console.log(`Seed completed! ${created} product(s) created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
