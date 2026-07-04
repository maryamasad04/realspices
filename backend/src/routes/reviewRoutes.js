import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);

router.use(authenticate);

router.post('/product/:productId', createReview);
router.get('/user/all', getUserReviews);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

export default router;
