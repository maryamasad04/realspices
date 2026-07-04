import prisma from '../utils/prisma.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        orders: {
          include: {
            items: {
              include: { product: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    // Role management is not supported for the current database schema.
    res.status(501).json({ error: 'Role management not supported in current database schema' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.query;

    const where = {};

    if (status) {
      where.orderStatus = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const updateData = {};

    if (orderStatus) {
      if (!['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(orderStatus)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }
      updateData.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      if (!['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
      }
      updateData.paymentStatus = paymentStatus;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalPrice: true }
      }),
      prisma.order.count({
        where: { orderStatus: 'PROCESSING' }
      }),
      prisma.order.count({
        where: { orderStatus: 'DELIVERED' }
      })
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        pendingOrders,
        completedOrders
      },
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};
