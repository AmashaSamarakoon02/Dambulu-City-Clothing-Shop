async function runSanityCheck() {
  const baseUrl = 'http://127.0.0.1:5000/api';

  try {
    console.log('1. Logging in as admin...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@luxeattire.com',
        password: 'password123'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    // Get JWT cookie
    const cookieHeader = loginRes.headers.get('set-cookie');
    console.log('Login successful. Received cookies:', !!cookieHeader);

    // Create a new product as admin
    console.log('2. Creating a new sample clothing item...');
    const productRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieHeader 
      },
      body: JSON.stringify({
        name: "Sanity Check Jacket",
        description: "A premium jacket for testing",
        price: 15000,
        originalPrice: 18000,
        image: "/uploads/seed/men_product_1.png",
        category: "mens-wear",
        brand: "Luxe",
        isNewArrival: true,
        isBestSeller: false,
        colors: ["Black", "Navy"],
        sizes: ["M", "L", "XL"],
        stock: 100
      })
    });

    if (!productRes.ok) {
      const errData = await productRes.text();
      throw new Error(`Product creation failed: ${errData}`);
    }

    const productData = await productRes.json();
    console.log('Product created successfully with ID:', productData.id);

    console.log('3. Fetching shop products to ensure the new product is visible dynamically...');
    const shopRes = await fetch(`${baseUrl}/products`);
    const shopData = await shopRes.json();
    
    // In our paginated API, shopData.data contains the array
    const products = shopData.data;
    const found = products.find(p => p.name === "Sanity Check Jacket");
    
    if (found) {
      console.log('SUCCESS! The new product is immediately available in the shop payload.');
      console.log('Product Details:', found);
    } else {
      console.log('ERROR: Product not found in shop payload.');
    }

  } catch (err) {
    console.error('Integration Check Failed:', err.message);
  }
}

runSanityCheck();
