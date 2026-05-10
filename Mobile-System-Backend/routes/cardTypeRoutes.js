import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import {
  getCardTypes,
  createCardType,
  updateCardType,
  deleteCardType
} from '../controllers/cardTypeController.js';

const router = express.Router();

router.get('/', adminAuth, getCardTypes);
router.post('/', adminAuth, createCardType);
router.put('/:id', adminAuth, updateCardType);
router.delete('/:id', adminAuth, deleteCardType);

export default router;
