import express from 'express';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/addressController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getUserAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;
