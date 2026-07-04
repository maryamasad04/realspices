import prisma from '../utils/prisma.js';

export const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, street, city, state, pincode, country, is_default } = req.body;

    if (!full_name || !phone || !street || !city || !state || !pincode || !country) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        user_id: userId,
        full_name,
        phone,
        street,
        city,
        state,
        pincode,
        country,
        is_default: is_default || false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { full_name, phone, street, city, state, pincode, country, is_default } = req.body;

    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address || address.user_id !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (is_default && !address.is_default) {
      await prisma.address.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        full_name: full_name || address.full_name,
        phone: phone || address.phone,
        street: street || address.street,
        city: city || address.city,
        state: state || address.state,
        pincode: pincode || address.pincode,
        country: country || address.country,
        is_default: is_default !== undefined ? is_default : address.is_default
      }
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address || address.user_id !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address || address.user_id !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.updateMany({
      where: { user_id: userId },
      data: { is_default: false }
    });

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: { is_default: true }
    });

    res.json({
      success: true,
      message: 'Default address updated',
      data: updatedAddress
    });
  } catch (error) {
    next(error);
  }
};
