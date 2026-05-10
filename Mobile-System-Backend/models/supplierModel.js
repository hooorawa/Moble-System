import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    trim: true
  },
  reciepNo: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  modal: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  buyingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
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

supplierSchema.index({ date: -1, createdAt: -1 });
supplierSchema.index({ reciepNo: 1 });

export default mongoose.model('Supplier', supplierSchema);
