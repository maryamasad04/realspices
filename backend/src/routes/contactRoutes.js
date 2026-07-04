import express from 'express';
import {
  createContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getUserContacts
} from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createContact);

router.use(authenticate);

router.get('/', getContacts);
router.get('/user/my-contacts', getUserContacts);
router.get('/:id', getContactById);
router.put('/:id/status', updateContactStatus);
router.delete('/:id', deleteContact);

export default router;
