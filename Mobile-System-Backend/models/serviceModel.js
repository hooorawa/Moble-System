import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  },
  services: {
    type: String,
    required: true,
    trim: true
  },
  serviceType: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  remark: {
    type: String,
    default: '',
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

serviceSchema.index({ date: -1, createdAt: -1 });

export default mongoose.model('Service', serviceSchema);
