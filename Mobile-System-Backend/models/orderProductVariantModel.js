import mongoose from 'mongoose';

const orderProductVariantSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderProduct',
    required: true,
    index: true
  },
  productVariant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true,
    index: true
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
    default: 0
  },
  // Store variant snapshot at time of order (in case variant details change later)
  variantSnapshot: {
    variationName: { type: String, required: true },
    value: { type: String, required: true },
    priceAdjustment: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
// Note: order, orderProduct, and productVariant already have index: true in schema
orderProductVariantSchema.index({ variation: 1 });

// Compound index to ensure unique combination of orderProduct and productVariant
orderProductVariantSchema.index({ orderProduct: 1, productVariant: 1 }, { unique: true });

export default mongoose.model('OrderProductVariant', orderProductVariantSchema);

