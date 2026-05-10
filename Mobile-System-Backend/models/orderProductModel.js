import mongoose from 'mongoose';

const orderProductSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedVariants: [{
    variation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variation',
      required: true
    },
    value: {
      type: String,
      required: true
    },
    priceAdjustment: {
      type: Number,
      default: 0
    }
  }],
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  // Store product snapshot at time of order (in case product details change later)
  productSnapshot: {
    name: { type: String, required: true },
    description: String,
    images: [String],
    brand: {
      name: String,
      logo: String
    },
    category: {
      name: String
    },
    sku: String,
    originalPrice: Number
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
// Note: order and product already have index: true in schema
orderProductSchema.index({ order: 1, product: 1 });

// Calculate total price before saving
orderProductSchema.pre('save', function(next) {
  this.totalPrice = this.unitPrice * this.quantity;
  next();
});

export default mongoose.model('OrderProduct', orderProductSchema);
