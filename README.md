# Dambulla City Clothing Shop

An online clothing store for **Dambulla City Clothing Shop** (Dambulla, Sri Lanka): men's, women's and kids' wear, shoes and accessories.

## Features

- **Customers:** register with email verification, log in, reset a forgotten password, browse and filter products (category, size, colour, price), wishlist, cart, checkout (Cash on Delivery, card or bank transfer), order history and order tracking.
- **Admin portal** (separate login at `/admin/login`): sales dashboard, order management and status updates, products with image upload, categories, customer accounts and reviews.
- **Delivery partners:** list of orders to deliver, with status updates.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS (`frontend/`)
- **Backend:** Node.js, Express 5, Prisma, PostgreSQL (`backend/`)

## Running locally

1. **Backend:** create `backend/.env` with these keys:

   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=any-long-random-text
   PORT=5000
   CORS_ORIGIN=http://localhost:5173
   CLIENT_URL=http://localhost:5173
   # Optional – real emails (Gmail App Password). Without these, email links are shown on screen.
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=
   SMTP_PASS=
   MAIL_FROM=
   ```

   Then run:

   ```
   cd backend
   npm install
   npx prisma db push
   node src/migrateShopData.js   # creates the default categories
   node src/seed.js              # optional sample products
   npm run dev                   # http://localhost:5000
   ```

2. **Frontend:**

   ```
   cd frontend
   npm install
   npm run dev                   # http://localhost:5173
   ```

3. **Create an admin account:**

   ```
   cd backend
   npm run create-admin admin@example.com YourPassw0rd "Shop Admin"
   ```

   Then sign in at `http://localhost:5173/admin/login`.

> Card payments use a demo payment page (no real money is charged). Test card: `4242 4242 4242 4242`.
