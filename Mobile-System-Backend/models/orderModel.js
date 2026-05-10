import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  // One-to-One relationship with Address
  deliveryAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  billingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  // One-to-Many relationship with OrderProduct (through populate)
  orderProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderProduct'
  }],
  
  // Direct storage of order items with variants for quick access
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variants: {
      type: Map,
      of: String, // Dynamic key-value pairs for any variant type
      default: {}
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
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
  }],
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'bank_transfer', 'koko_payment'],
      required: true
    },
    details: {
      cardLast4: String,
      cardBrand: String,
      transactionId: String
    }
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  delivery: {
    type: Number,
    required: true,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'preparing', 'shipped', 'out_for_delivery', 'delivered'],
    default: 'pending'
  },
  trackingNumber: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  estimatedDelivery: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD${year}${month}${day}${random}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', async function(next) {
  if (this.orderProducts && this.orderProducts.length > 0) {
    // This will be calculated when orderProducts are populated
    // For now, we'll calculate it in the controller
  }
  next();
});

// Indexes for better query performance
// Note: customer already has index: true in schema
orderSchema.index({ customer: 1, createdAt: -1 });
// orderNumber has unique: true which creates an index, no need to duplicate
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ deliveryAddress: 1 });
orderSchema.index({ billingAddress: 1 });

export default mongoose.model('Order', orderSchema);
