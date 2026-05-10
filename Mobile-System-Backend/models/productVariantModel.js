import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variation',
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  priceAdjustment: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productVariantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure unique combination of product, variation, and value
productVariantSchema.index({ product: 1, variation: 1, value: 1 }, { unique: true });

// Index for better query performance
productVariantSchema.index({ product: 1 });
productVariantSchema.index({ variation: 1 });
productVariantSchema.index({ isActive: 1 });

export default mongoose.model('ProductVariant', productVariantSchema);
