import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { createService, getServices, updateService, deleteService } from '../controllers/serviceController.js';

const router = express.Router();

router.post('/', adminAuth, createService);
router.get('/', adminAuth, getServices);
router.put('/:id', adminAuth, updateService);
router.delete('/:id', adminAuth, deleteService);

export default router;
