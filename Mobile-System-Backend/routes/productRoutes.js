import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  addProductImages,
  deleteProduct,
  softDeleteProduct,
  getProductsByCategory,
  getProductsByBrand,
  getProductsByCategoryAndBrand,
  testVariationProductRelations
} from '../controllers/productController.js';
import { uploadProductS3 } from '../config/s3MulterConfig.js';

const router = express.Router();

// Get all products
router.get('/', getAllProducts);

// Get products by category
router.get('/category/:categoryId', getProductsByCategory);

// Get products by brand
router.get('/brand/:brandId', getProductsByBrand);

// Get products by category and brand
router.get('/category/:categoryId/brand/:brandId', getProductsByCategoryAndBrand);

// Get product by ID
router.get('/:id', getProductById);

// Create new product
router.post('/', uploadProductS3.array('images', 5), createProduct);

// Update product
router.put('/:id', uploadProductS3.array('images', 5), updateProduct);

// Add images to product
router.post('/:id/images', uploadProductS3.array('images', 10), addProductImages);

// Soft delete product (deactivate)
router.patch('/:id/deactivate', softDeleteProduct);

// Delete product permanently
router.delete('/:id', deleteProduct);

// Test variation-product relationships
router.get('/test/relationships', testVariationProductRelations);

export default router;
