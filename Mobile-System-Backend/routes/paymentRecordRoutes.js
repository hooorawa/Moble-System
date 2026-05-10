import express from 'express';
import {
  createPaymentRecord,
  getAllPaymentRecords,
  getMyPaymentRecords,
  getPaymentRecord,
  updatePaymentRecord,
  deletePaymentRecord
} from '../controllers/paymentRecordController.js';
import adminAuth from '../middleware/adminAuth.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Customer route for Billing & Invoice section
router.get('/my-records', auth, getMyPaymentRecords);

// All routes require admin authentication
router.post('/create/:orderId', adminAuth, createPaymentRecord);
router.get('/', adminAuth, getAllPaymentRecords);
router.get('/:recordId', adminAuth, getPaymentRecord);
router.put('/:recordId', adminAuth, updatePaymentRecord);
router.delete('/:recordId', adminAuth, deletePaymentRecord);

export default router;
