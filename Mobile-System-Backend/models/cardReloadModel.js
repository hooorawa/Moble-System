import mongoose from 'mongoose';

const cardReloadSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['card', 'reload'],
    required: true
  },
  entryType: {
    type: String,
    enum: ['add-card', 'add-stock', 'daily-sales'],
    required: true
  },
  cardType: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  availableQty: {
    type: Number,
    default: 0,
    min: 0
  },
  newQty: {
    type: Number,
    default: 0,
    min: 0
  },
  dailySalesQty: {
    type: Number,
    default: 0,
    min: 0
  },
  qtySold: {
    type: Number,
    default: 0,
    min: 0
  },
  qtyAvl: {
    type: Number,
    default: 0,
    min: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  soldAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  availableAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  newAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    enum: ['Admin', 'Employer']
  }
}, { timestamps: true });

cardReloadSchema.index({ mode: 1, entryType: 1 });
cardReloadSchema.index({ createdAt: -1 });

export default mongoose.model('CardReload', cardReloadSchema);
