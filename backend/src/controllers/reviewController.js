const prisma = require('../prismaClient');

const getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(req.params.id, 10) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    if (!productId || !rating || !comment?.trim()) {
      return res.status(400).json({ error: 'Please add a rating and a comment' });
    }
    const ratingValue = parseInt(rating, 10);
    if (!(ratingValue >= 1 && ratingValue <= 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (comment.length > 1000) {
      return res.status(400).json({ error: 'Comment is too long (max 1000 characters)' });
    }
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId, 10) || 0 } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const review = await prisma.review.create({
      data: {
        rating: ratingValue,
        comment: comment.trim(),
        productId: product.id,
        userId: req.user.userId
      },
      include: { user: { select: { name: true } } }
    });
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { name: true } }, product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getReviewsByProduct, createReview, deleteReview, getAllReviews
};
