import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import {
  createCardReloadRecord,
  getCardReloadRecords,
  updateCardReloadRecord,
  deleteCardReloadRecord
} from '../controllers/cardReloadController.js';

const router = express.Router();

router.post('/', adminAuth, createCardReloadRecord);
router.get('/', adminAuth, getCardReloadRecords);
router.put('/:recordId', adminAuth, updateCardReloadRecord);
router.delete('/:recordId', adminAuth, deleteCardReloadRecord);

export default router;
