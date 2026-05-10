import express from 'express';
import {
  getAllStockItems,
  getStockItemById,
  updateStockQuantity,
  bulkUpdateStock,
  getStockStatistics
} from '../controllers/stockController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Get all stock items
router.get('/', getAllStockItems);

// Get stock statistics
router.get('/statistics', getStockStatistics);

// Get stock item by ID
router.get('/:id', getStockItemById);

// Update stock quantity for a single item
router.put('/:id', updateStockQuantity);

// Bulk update stock quantities
router.put('/bulk/update', bulkUpdateStock);

export default router;
