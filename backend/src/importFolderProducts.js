// One-off utility: creates shop products from the photos in
// backend/uploads/women, backend/uploads/men and backend/uploads/kids.
// Products that already exist (matched by name) are skipped, so it is safe to re-run.
// To add more photos later, drop them in the folder, add a row below and run again.
//
// Usage:
//   node src/importFolderProducts.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { normalizeColor } = require('./utils/shopDefaults');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const photo = (time) => `WhatsApp Image 2026-10-15 at ${time}.jpeg`;

const FOLDER_CATEGORY = { women: 'womens-wear', men: 'mens-wear', kids: 'kids-wear' };

const PRODUCTS = [
  // Women's Wear
  {
    folder: 'women', file: photo('16.44.39'), name: 'Long Sleeve Embroidered Shirt Blouse', price: 3490,
    sizes: ['L', 'XL', 'XXL'], colors: ['Maroon', 'Mustard', 'White', 'Teal', 'Black'],
    description: 'Classic long sleeve shirt blouse with a stylish collar, buttoned cuffs and a delicate embroidered floral detail on the chest. Camry material – light weight and comfortable for everyday wear.'
  },
  {
    folder: 'women', file: photo('16.44.40'), name: 'Acid Wash Denim Crop Jacket', price: 4990,
    sizes: ['M', 'L', 'XL'], colors: ['Blue Aside', 'Black Acid'],
    description: 'Cropped denim jacket with a textured acid wash, stylish collar, front flap pockets and a trendy frayed hem. Light weight with a comfortable fit.'
  },
  {
    folder: 'women', file: photo('16.44.41'), name: 'Two-Tone Popcorn Knit Short Frock', price: 3290,
    sizes: ['M', 'L', 'XL'], colors: ['Olive Green', 'Blue', 'Burgundy', 'Grey', 'White', 'Beige'],
    description: 'Fitted short sleeve short frock in textured popcorn material, with a two-tone front and mandala print. Light weight, comfortable fit and a stylish look.'
  },
  {
    folder: 'women', file: photo('16.44.42'), name: 'Striped Linen Wide-Leg Pants', price: 3790,
    sizes: ['M', 'L', 'XL', 'XXL'], colors: ['Blue', 'Pink', 'Green', 'Orange'],
    description: 'Breathable striped linen pants with a relaxed wide leg, elastic waist and side pockets. Light, durable and perfect for everyday wear.'
  },
  {
    folder: 'women', file: photo('16.44.52'), name: 'Tiered Acid Wash Denim Maxi Skirt', price: 4490,
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Blue'],
    description: 'Flowing tiered maxi skirt in soft acid wash denim, with a smocked elastic waistband and button-front detail.'
  },

  // Men's Wear
  {
    folder: 'men', file: photo('16.44.39'), name: 'Wide Stripe Short Sleeve Shirt', price: 3290,
    sizes: ['M', 'L', 'XL'], colors: ['Sage Green', 'Beige', 'Sky Blue', 'Pink'],
    description: 'Short sleeve shirt with bold vertical stripes and a chest pocket. Soft, breathable, light weight and durable fabric.'
  },
  {
    folder: 'men', file: photo('16.44.41'), name: 'Leaf Print Short Sleeve Shirt', price: 3290,
    sizes: ['M', 'L', 'XL'], colors: ['Lavender', 'Blue', 'Beige', 'Purple'],
    description: "Men's short sleeve shirt with an artistic leaf print on a white base. Soft, breathable and light weight – style meets comfort."
  },
  {
    folder: 'men', file: photo('16.44.42'), name: 'Black Floral Print Short Sleeve Shirt', price: 3490,
    sizes: ['M', 'L', 'XL'], colors: ['Black'],
    description: "Men's short sleeve shirt with a tonal grey floral print on black, chest pocket and matching buttons. Soft, breathable and durable."
  },
  {
    folder: 'men', file: photo('16.44.46'), name: 'Marble Print Oversized T-Shirt', price: 2490,
    sizes: ['M', 'L', 'XL'], colors: ['Charcoal'],
    description: "Casual crew neck men's t-shirt with an all-over charcoal and grey marble print. Soft, breathable fabric – perfect for everyday style."
  },
  {
    folder: 'men', file: photo('16.44.49'), name: 'White Linen Long Sleeve Shirt', price: 3990,
    sizes: ['M', 'L', 'XL'], colors: ['White'],
    description: "Crisp white long sleeve men's shirt with a button-down collar and embroidered chest logo. Breathable, lightweight and comfortable."
  },
  {
    folder: 'men', file: photo('16.44.50'), name: 'Acid Wash Drawstring Denim Pants', price: 5490,
    sizes: ['28', '30', '32', '34', '36'], colors: ['Blue'],
    description: "Relaxed straight-fit men's denim pants in a textured aside wash, with an elastic drawstring waistband and classic five-pocket design."
  },

  // Kids' Wear
  {
    folder: 'kids', file: photo('16.44.40'), name: 'Boys Cargo Shorts', price: 1990,
    sizes: ['22', '24', '26'], colors: ['Olive Green', 'Khaki', 'Brown', 'Grey', 'Navy'],
    description: 'Vintage-style boys cargo shorts with an elastic drawstring waist, button flap pockets and zip pockets.'
  },
  {
    folder: 'kids', file: photo('16.44.41'), name: 'Boys Denim Cargo Shorts', price: 2290,
    sizes: ['22', '24', '26'], colors: ['Blue Aside', 'Black Acid'],
    description: 'Durable denim cargo shorts for boys with an elastic drawstring waistband, cargo pockets and brand tag.'
  },
  {
    folder: 'kids', file: photo('16.44.43'), name: 'Girls Flower Patch Denim Skirt', price: 1890,
    sizes: ['S', 'M', 'L'], colors: ['Navy'],
    description: 'Cute denim skirt for your little princess, with colourful flower patches, an elastic waist and star button detail.'
  },
  {
    folder: 'kids', file: photo('16.44.44'), name: 'Girls Button Front Denim Skirt', price: 1890,
    sizes: ['S', 'M', 'L'], colors: ['Blue'],
    description: 'Comfortable and stylish denim skirt with front buttons, side flap pockets, an elastic waist and a frayed hem.'
  }
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const p of PRODUCTS) {
    const filePath = path.join(UPLOADS_DIR, p.folder, p.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Missing image, skipped: ${p.folder}/${p.file}`);
      skipped++;
      continue;
    }
    if (await prisma.product.findFirst({ where: { name: p.name } })) {
      skipped++;
      continue;
    }
    const image = encodeURI(`/uploads/${p.folder}/${p.file}`);
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        image,
        images: [image],
        category: FOLDER_CATEGORY[p.folder],
        brand: 'KSC',
        isNewArrival: true,
        colors: [...new Set(p.colors.map(normalizeColor))],
        sizes: p.sizes,
        stock: 20
      }
    });
    created++;
  }
  console.log(`Created ${created} product(s), skipped ${skipped}.`);
}

main()
  .catch((err) => {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
