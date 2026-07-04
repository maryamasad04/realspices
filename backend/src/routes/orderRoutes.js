import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id', updateOrderStatus);
router.delete('/:id', cancelOrder);

export default router;
