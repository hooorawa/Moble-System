import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount
} from '../controllers/cartController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get user's cart - PROTECTED
router.get('/:userId', auth, getCart);

// Add item to cart - PROTECTED
router.post('/:userId/add', auth, addToCart);

// Update cart item quantity - PROTECTED
router.put('/:userId/item/:itemId', auth, updateCartItem);

// Remove item from cart - PROTECTED
router.delete('/:userId/item/:itemId', auth, removeFromCart);

// Clear entire cart - PROTECTED
router.delete('/:userId/clear', auth, clearCart);

// Get cart item count - PROTECTED
router.get('/:userId/count', auth, getCartItemCount);

export default router;
