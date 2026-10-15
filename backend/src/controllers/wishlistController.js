const prisma = require('../prismaClient');

const getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items.map((item) => item.product));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.userId, productId: product.id } },
      update: {},
      create: { userId: req.user.userId, productId: product.id }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.userId, productId: req.params.productId }
    });
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
