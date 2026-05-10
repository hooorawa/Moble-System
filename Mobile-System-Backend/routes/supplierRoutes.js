import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { createSupplier, getSuppliers, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';

const router = express.Router();

router.post('/', adminAuth, createSupplier);
router.get('/', adminAuth, getSuppliers);
router.put('/:id', adminAuth, updateSupplier);
router.delete('/:id', adminAuth, deleteSupplier);

export default router;
