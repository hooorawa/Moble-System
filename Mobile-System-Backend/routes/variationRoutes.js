import express from 'express';
import {
  getAllVariations,
  getVariationById,
  createVariation,
  updateVariation,
  deleteVariation
} from '../controllers/variationController.js';

const router = express.Router();

// Get all variations
router.get('/', getAllVariations);

// Get variation by ID
router.get('/:id', getVariationById);

// Create new variation
router.post('/', createVariation);

// Update variation
router.put('/:id', updateVariation);

// Delete variation
router.delete('/:id', deleteVariation);

export default router;
