// One-off utility: creates shop products from the photos in
// the folders in backend/uploads (women, men, kids, shoes, accessories, ethnic, sportswear, bags).
// A row can set `category` to override the folder's category (the ethnic/ photos are sold under Women's and Men's Wear).
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

const FOLDER_CATEGORY = {
  women: 'womens-wear', men: 'mens-wear', kids: 'kids-wear', shoes: 'shoes', accessories: 'accessories',
  sportswear: 'sportswear', bags: 'bags'
};

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
  },

  // Shoes (photos: Unsplash License, see uploads/CREDITS.md)
  {
    folder: 'shoes', file: 'suede-sneakers.jpg', name: 'Suede Low-Top Sneakers', price: 6490, originalPrice: 7990,
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44'], colors: ['Beige'],
    description: 'Soft suede low-top sneakers with a cushioned collar and a classic gum rubber sole. Easy to pair with jeans, chinos or dresses for everyday comfort.'
  },
  {
    folder: 'shoes', file: 'white-pumps.jpg', name: 'Classic Pointed-Toe Pumps', price: 5990,
    sizes: ['36', '37', '38', '39', '40', '41'], colors: ['Ivory'],
    description: 'Elegant pointed-toe pumps with a textured finish and a slim mid-height heel. Perfect for weddings, parties and the office.'
  },
  {
    folder: 'shoes', file: 'brown-monk-straps.jpg', name: 'Leather Double Monk Strap Shoes', price: 8990, originalPrice: 10990,
    sizes: ['39', '40', '41', '42', '43', '44', '45'], colors: ['Brown'],
    description: 'Smart double monk strap shoes in rich brown leather with a cap toe and buckle closure. A refined choice for formal and smart-casual outfits.'
  },
  {
    folder: 'shoes', file: 'kids-red-sneakers.jpg', name: "Kids' Canvas Sneakers", price: 2490,
    sizes: ['19', '20', '21', '22', '23', '24'], colors: ['Red'],
    description: 'Comfortable high-top canvas sneakers for little ones, with soft lining, lace-up front and a flexible rubber sole.'
  },

  // Accessories (photos: Unsplash License, see uploads/CREDITS.md)
  {
    folder: 'accessories', file: 'leather-handbag.jpg', name: 'Leather Satchel Handbag', price: 7490, originalPrice: 8990,
    sizes: ['One Size'], colors: ['Tan'],
    description: 'Structured satchel handbag in polished tan leather with buckle details, top handles and a detachable shoulder strap. Roomy enough for daily essentials.'
  },
  {
    folder: 'accessories', file: 'sunglasses.jpg', name: 'Classic Half-Rim Sunglasses', price: 2990,
    sizes: ['One Size'], colors: ['Black'],
    description: 'Timeless half-rim sunglasses with gradient lenses and a lightweight metal bridge. UV protection for sunny Sri Lankan days.'
  },
  {
    folder: 'accessories', file: 'white-minimal-watch.jpg', name: 'Minimalist Leather-Strap Watch', price: 6990,
    sizes: ['One Size'], colors: ['White'],
    description: 'Clean minimalist analog watch with a gold-tone case, white dial and soft white leather strap. A subtle everyday accessory.'
  },
  {
    folder: 'accessories', file: 'leather-belt.jpg', name: 'Genuine Leather Belt', price: 2490,
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Brown'],
    description: 'Durable genuine leather belt with stitched edges and a brushed metal buckle. Works with jeans and formal trousers alike.'
  },

  // Sarees & kurtas (photos in ethnic/, listed under Women's and Men's Wear)
  {
    folder: 'ethnic', file: 'green-silk-saree.jpg', category: 'womens-wear', name: 'Sage Green Silk Saree', price: 14990, originalPrice: 17990,
    sizes: ['Free Size'], colors: ['Sage Green'],
    description: 'Elegant soft silk saree in sage green with a subtle woven pattern and matching blouse piece. Perfect for weddings, poruwa ceremonies and festive occasions.'
  },
  {
    folder: 'ethnic', file: 'purple-gold-border-saree.jpg', category: 'womens-wear', name: 'Purple Saree with Gold Border', price: 11990,
    sizes: ['Free Size'], colors: ['Purple'],
    description: 'Rich purple saree with a wide woven gold border and pallu. Comes with an unstitched blouse piece.'
  },
  {
    folder: 'ethnic', file: 'red-pink-bridal-saree.jpg', category: 'womens-wear', name: 'Red & Pink Kanjivaram-Style Saree', price: 18990,
    sizes: ['Free Size'], colors: ['Red'],
    description: 'Vibrant red saree with pink contrast blouse and gold zari motifs – a statement look for brides and bridesmaids.'
  },
  {
    folder: 'ethnic', file: 'mens-blue-kurta-set.jpg', category: 'mens-wear', name: "Men's Royal Blue Kurta Set", price: 6990, originalPrice: 8490,
    sizes: ['M', 'L', 'XL', 'XXL'], colors: ['Royal Blue'],
    description: 'Comfortable cotton-blend kurta with matching pants in royal blue. Ideal for Avurudu, weddings and religious occasions.'
  },
  {
    folder: 'ethnic', file: 'white-cotton-kurti.jpg', category: 'womens-wear', name: 'White Cotton Embroidered Kurti', price: 3990,
    sizes: ['S', 'M', 'L', 'XL'], colors: ['White'],
    description: 'Breathable pure cotton kurti with self-textured embroidery, three-quarter sleeves and a V-neck. Pair with leggings or palazzo pants.'
  },

  // Sportswear
  {
    folder: 'sportswear', file: 'rose-sports-bra-leggings-set.jpg', name: 'Rose Sports Bra & Leggings Set', price: 5490, originalPrice: 6490,
    sizes: ['XS', 'S', 'M', 'L'], colors: ['Rose'],
    description: 'Matching medium-support sports bra and high-waist leggings in sweat-wicking stretch fabric. Great for gym, yoga and running.'
  },
  {
    folder: 'sportswear', file: 'white-tank-black-leggings.jpg', name: 'High-Waist Yoga Leggings', price: 3290,
    sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Black'],
    description: 'Squat-proof, four-way stretch leggings with a wide high waistband that stays in place during yoga and workouts.'
  },
  {
    folder: 'sportswear', file: 'mens-running-set.jpg', name: "Men's Running Tee & Shorts Set", price: 4290,
    sizes: ['M', 'L', 'XL', 'XXL'], colors: ['Black'],
    description: 'Lightweight quick-dry running long-sleeve tee and shorts. Breathable mesh panels keep you cool on morning runs.'
  },
  {
    folder: 'sportswear', file: 'black-training-set.jpg', name: 'Black Training Bra & Leggings Set', price: 4990,
    sizes: ['S', 'M', 'L'], colors: ['Black'],
    description: 'Racer-back training bra and full-length leggings in soft compression fabric for HIIT, kickboxing and gym sessions.'
  },

  // Bags
  {
    folder: 'bags', file: 'burgundy-leather-backpack.jpg', name: 'Burgundy Leather Backpack', price: 8990, originalPrice: 10990,
    sizes: ['One Size'], colors: ['Burgundy'],
    description: 'Spacious faux-leather backpack with padded laptop sleeve, side pockets and adjustable straps. Perfect for campus and office.'
  },
  {
    folder: 'bags', file: 'black-crossbody-sling.jpg', name: 'Black Crossbody Sling Bag', price: 3990,
    sizes: ['One Size'], colors: ['Black'],
    description: 'Compact crossbody bag with double zip compartments and a long adjustable strap. Keeps phone, wallet and keys close at hand.'
  },
  {
    folder: 'bags', file: 'brown-leather-clutch.jpg', name: 'Brown Leather Clutch', price: 2990,
    sizes: ['One Size'], colors: ['Brown'],
    description: 'Slim zip-top clutch in textured leather with card slots inside. Easy to carry for evenings out.'
  },
  {
    folder: 'bags', file: 'grey-mini-satchel.jpg', name: 'Grey Mini Satchel Bag', price: 5490,
    sizes: ['One Size'], colors: ['Grey'],
    description: 'Structured mini satchel with gold buckle straps, top handle and detachable shoulder strap.'
  },
  {
    folder: 'bags', file: 'leather-duffel-bag.jpg', name: 'Leather Weekender Duffel Bag', price: 12990,
    sizes: ['One Size'], colors: ['Brown'],
    description: 'Roomy weekender duffel in rich brown leather with sturdy handles and a shoulder strap – ideal for short trips.'
  }
];

const NEW_CATEGORIES = [
  { name: 'Sportswear', slug: 'sportswear' },
  { name: 'Bags', slug: 'bags' }
];

async function main() {
  for (const c of NEW_CATEGORIES) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
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
        originalPrice: p.originalPrice || null,
        image,
        images: [image],
        category: p.category || FOLDER_CATEGORY[p.folder],
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
