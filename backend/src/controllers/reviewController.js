import prisma from '../utils/prisma.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { product_id: BigInt(productId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        avgRating,
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const userHasOrder = await prisma.orderItem.findFirst({
      where: {
        product_id: BigInt(productId),
        order: {
          user_id: userId
        }
      }
    });

    if (!userHasOrder) {
      return res.status(403).json({ error: 'You must purchase this product to review it' });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        user_id: userId,
        product_id: BigInt(productId)
      }
    });

    if (existingReview) {
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      });
    }

    const review = await prisma.review.create({
      data: {
        user_id: userId,
        product_id: BigInt(productId),
        rating,
        comment: comment || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment: comment || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const reviews = await prisma.review.findMany({
      where: { user_id: userId },
      include: { product: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};
