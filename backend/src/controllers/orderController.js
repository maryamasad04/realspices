import prisma from '../utils/prisma.js';

export const createOrder = async (req, res, next) => {
  try {
    const { addressId } = req.body;
    const userId = req.user.id;

    if (!addressId) {
      return res.status(400).json({ error: 'Address ID is required' });
    }

    const cart = await prisma.cart.findFirst({
      where: { user_id: userId },
      include: {
        cartItems: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address || address.user_id !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    for (const item of cart.cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product: ${item.product.name}`
        });
      }
    }

    const totalAmount = cart.cartItems.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          address_id: addressId,
          total_amount: totalAmount,
          status: 'pending'
        }
      });

      for (const item of cart.cartItems) {
        await tx.orderItem.create({
          data: {
            order_id: newOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.price
          }
        });

        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }

      await tx.cartItem.deleteMany({
        where: { cart_id: cart.id }
      });

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          orderItems: {
            include: { product: true }
          },
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { user_id: userId },
      include: {
        orderItems: {
          include: { product: true }
        },
      },
      orderBy: { created_at: 'desc' }
    });

    // Transform orders to required response format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      total_amount: order.total_amount || order.totalPrice || order.total_amount,
      order_items: order.orderItems.map(item => ({
        id: item.id,
        product_id: item.product_id || item.productId,
        product_name: item.product?.name,
        price: item.price,
        quantity: item.quantity,
        image: item.product?.imageUrl,
        grade: item.product?.grade,
        weight: item.product?.weight,
        product: item.product ? {
          name: item.product.name,
          image: item.product.imageUrl
        } : undefined
      })),
      // shipping_address: order.address, // Uncomment if address relation exists
      // ...other fields as needed
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { product: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    // Accept UUID from body, params, or query (prefer body for cancel)
    const id = req.body.id || req.params.id || req.query.id;
    const userId = req.user.id;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid or missing order UUID' });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Allow only order owner or admin to cancel
    if (order.userId !== userId && req.user.role !== 'ADMIN') {
      console.warn('[CancelOrder] Access denied:', {
        attemptedBy: userId,
        attemptedRole: req.user.role,
        orderId: order.id,
        orderOwner: order.userId,
        reqUser: req.user
      });
      return res.status(403).json({
        error: 'Access denied: you can only cancel your own order.',
        debug: {
          attemptedBy: userId,
          attemptedRole: req.user.role,
          orderId: order.id,
          orderOwner: order.userId
        }
      });
    }
    }

    if (order.status === 'delivered' || order.status === 'shipped') {
      return res.status(400).json({ error: 'Cannot cancel shipped or delivered orders' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: { increment: item.quantity }
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};
