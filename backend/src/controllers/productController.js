const prisma = require('../prismaClient');
const { normalizeColor } = require('../utils/shopDefaults');

const SORT_OPTIONS = {
  newest: { createdAt: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  name: { name: 'asc' }
};

const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, search = '', category = '', size = '', color = '',
      minPrice, maxPrice, sort = 'newest'
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 1000);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    if (size) where.sizes = { has: size };
    if (color) where.colors = { has: normalizeColor(color) };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (req.query.new === 'true') where.isNewArrival = true;
    if (req.query.bestSeller === 'true') where.isBestSeller = true;
    if (req.query.inStock === 'true') where.stock = { gt: 0 };

    let products;
    let total;
    if (req.query.sale === 'true') {
      // "On sale" compares two columns, which Prisma can't express in `where`,
      // so filter the (small) candidate set in memory.
      const candidates = await prisma.product.findMany({
        where: { ...where, originalPrice: { not: null } },
        orderBy: SORT_OPTIONS[sort] || SORT_OPTIONS.newest
      });
      const onSale = candidates.filter((p) => p.originalPrice > p.price);
      total = onSale.length;
      products = onSale.slice(skip, skip + limitNumber);
    } else {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limitNumber,
          orderBy: SORT_OPTIONS[sort] || SORT_OPTIONS.newest
        }),
        prisma.product.count({ where })
      ]);
    }

    res.json({
      data: products,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Available filter values for the shop sidebar.
const getProductFilters = async (req, res) => {
  try {
    const where = req.query.category ? { category: req.query.category } : {};
    const products = await prisma.product.findMany({ where, select: { sizes: true, colors: true, price: true } });
    const sizes = [...new Set(products.flatMap((p) => p.sizes))];
    const colors = [...new Set(products.flatMap((p) => p.colors))].sort();
    const prices = products.map((p) => p.price);
    res.json({
      sizes,
      colors,
      minPrice: prices.length ? Math.floor(Math.min(...prices)) : 0,
      maxPrice: prices.length ? Math.ceil(Math.max(...prices)) : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const rating = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: true
    });
    res.json({ ...product, averageRating: rating._avg.rating || 0, reviewCount: rating._count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const toProductData = (body) => {
  const images = (body.images || []).filter(Boolean);
  return {
    name: body.name,
    description: body.description || '',
    price: body.price,
    originalPrice: body.originalPrice || null,
    image: images[0],
    images,
    category: body.category,
    brand: body.brand || null,
    isNewArrival: !!body.isNewArrival,
    isBestSeller: !!body.isBestSeller,
    colors: [...new Set((body.colors || []).map(normalizeColor))],
    sizes: body.sizes || [],
    stock: body.stock ?? 0
  };
};

const createProduct = async (req, res) => {
  try {
    const product = await prisma.product.create({ data: toProductData(req.body) });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: toProductData(req.body)
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    // Order items keep their name/image snapshot; their product link becomes null.
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllProducts, getProductFilters, getProductById, createProduct, updateProduct, deleteProduct
};
