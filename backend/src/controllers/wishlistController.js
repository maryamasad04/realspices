import prisma from '../utils/prisma.js';

export const getUserWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: userId },
      include: { product: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingWishlist = await prisma.wishlist.findFirst({
      where: {
        user_id: userId,
        product_id: BigInt(productId)
      }
    });

    if (existingWishlist) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        user_id: userId,
        product_id: BigInt(productId)
      },
      include: { product: true }
    });

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlistItem
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlist = await prisma.wishlist.findFirst({
      where: {
        user_id: userId,
        product_id: BigInt(productId)
      }
    });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    await prisma.wishlist.delete({
      where: { id: wishlist.id }
    });

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};

export const checkWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlist = await prisma.wishlist.findFirst({
      where: {
        user_id: userId,
        product_id: BigInt(productId)
      }
    });

    res.json({
      success: true,
      data: {
        inWishlist: !!wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};
