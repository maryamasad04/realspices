import express from 'express';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
} from '../controllers/wishlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getUserWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/:productId/check', checkWishlist);

export default router;
