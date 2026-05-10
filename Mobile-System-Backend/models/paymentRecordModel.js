import mongoose from 'mongoose';

const paymentRecordSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerMobile: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: {
      type: String,
      required: true
    },
    details: {
      cardLast4: String,
      cardBrand: String,
      transactionId: String
    }
  },
  amount: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paidPrice: {
    type: Number,
    required: true
  },
  paymentPlanType: {
    type: String,
    enum: ['full', 'installment'],
    default: 'full'
  },
  advancePaidPrice: {
    type: Number,
    default: 0
  },
  monthlyInstallment: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    default: 0
  },
  totalInstallments: {
    type: Number,
    default: 0
  },
  paidInstallments: {
    type: Number,
    default: 0
  },
  remainingMonths: {
    type: Number,
    default: 0
  },
  invoice: {
    billNumber: {
      type: String,
      default: ''
    },
    invoiceNumber: {
      type: String,
      default: ''
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    customerNocNumber: {
      type: String,
      default: ''
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    cashPayable: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    balanceAmount: {
      type: Number,
      default: 0
    },
    warrantyMonths: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    }
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'refunded'],
    default: 'paid'
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'confirmedByModel'
  },
  confirmedByModel: {
    type: String,
    enum: ['Admin', 'Employer']
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Indexes
// Note: order has unique: true which creates an index, no need to duplicate
paymentRecordSchema.index({ customer: 1 });
paymentRecordSchema.index({ orderNumber: 1 });
paymentRecordSchema.index({ paymentStatus: 1});
paymentRecordSchema.index({ createdAt: -1 });

export default mongoose.model('PaymentRecord', paymentRecordSchema);
