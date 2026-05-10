import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderProductVariants
} from '../controllers/orderController.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Protected routes (require authentication)
// IMPORTANT: Specific routes must come before generic routes
router.post('/create', auth, createOrder);
router.get('/user', auth, getUserOrders);
router.put('/cancel/:orderId', auth, cancelOrder);
router.get('/:orderId/variants', auth, getOrderProductVariants);
router.get('/:orderId', auth, getOrder);

// Admin routes
router.get('/admin/all', adminAuth, getAllOrders);
router.put('/admin/:orderId/status', adminAuth, updateOrderStatus);

export default router;
