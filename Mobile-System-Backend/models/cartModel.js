import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
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
  price: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    index: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  delivery: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // No tax or delivery fees for now - just use subtotal
  this.tax = 0; // No tax for now
  this.delivery = 0; // No delivery fee for now
  this.total = this.subtotal; // Total is just the subtotal
  
  next();
});

// Index for better query performance
cartSchema.index({ user: 1, isActive: 1 });
cartSchema.index({ 'items.product': 1 });

export default mongoose.model('Cart', cartSchema);
