import express from 'express';
import {
  getProductVariants,
  getProductVariantsGrouped,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getAvailableVariationsForProduct,
  getProductLinkedVariations
} from '../controllers/productVariantController.js';

const router = express.Router();

// Get all product variants for a specific product
router.get('/product/:productId', getProductVariants);

// Get product variants grouped by variation
router.get('/product/:productId/grouped', getProductVariantsGrouped);

// Get available variations for a product (variations that can be added)
router.get('/product/:productId/available', getAvailableVariationsForProduct);

// Get variations linked to a product (for display purposes)
router.get('/product/:productId/linked', getProductLinkedVariations);

// Create new product variant
router.post('/product/:productId', createProductVariant);

// Update product variant
router.put('/:variantId', updateProductVariant);

// Delete product variant
router.delete('/:variantId', deleteProductVariant);

export default router;
