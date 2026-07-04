import prisma from '../utils/prisma.js';

export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const userId = req.user?.id || null;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        user_id: userId,
        status: 'new'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Contact message sent successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req, res, next) => {
  try {
    const contacts = await prisma.contact.findMany({
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

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
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

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

export const updateContactStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'in progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: { status },
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
      message: 'Contact status updated',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getUserContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const contacts = await prisma.contact.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};
