import prisma from '../utils/prisma.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: stock ? parseInt(stock) : 0,
        imageUrl
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, imageUrl } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (imageUrl) updateData.imageUrl = imageUrl;

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
