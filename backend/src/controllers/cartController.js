import prisma from '../utils/prisma.js';

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    let cart = await prisma.cart.findFirst({
      where: { user_id: userId },
      include: {
        cartItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId },
        include: {
          cartItems: {
            include: { product: true }
          }
        }
      });
    }

    const totalPrice = cart.cartItems.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        ...cart,
        totalPrice
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Invalid product or quantity' });
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    let cart = await prisma.cart.findFirst({
      where: { user_id: userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId }
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: BigInt(productId)
      }
    });

    let cartItem;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true }
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: BigInt(productId),
          quantity
        },
        include: { product: true }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: cartItem
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.cart.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true }
    });

    res.json({
      success: true,
      message: 'Cart item updated',
      data: updatedItem
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.cart.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const cart = await prisma.cart.findFirst({
      where: { user_id: userId }
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id }
    });

    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};
