import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats
} from '../controllers/adminController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
