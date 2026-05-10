import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import {
  getReloadTypes,
  createReloadType,
  updateReloadType,
  deleteReloadType
} from '../controllers/reloadTypeController.js';

const router = express.Router();

router.get('/', adminAuth, getReloadTypes);
router.post('/', adminAuth, createReloadType);
router.put('/:id', adminAuth, updateReloadType);
router.delete('/:id', adminAuth, deleteReloadType);

export default router;
