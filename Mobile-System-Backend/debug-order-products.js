import mongoose from 'mongoose';
import Order from './models/orderModel.js';
import OrderProduct from './models/orderProductModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/Mobile');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Debug function to check order products and their variants
const debugOrderProducts = async () => {
  try {
    console.log('=== Debugging Order Products ===\n');

    // Get the latest order
    const latestOrder = await Order.findOne().sort({ createdAt: -1 });
    if (!latestOrder) {
      console.log('No orders found in database');
      return;
    }

    console.log(`Latest Order: ${latestOrder.orderNumber}`);
    console.log(`Order ID: ${latestOrder._id}`);
    console.log(`Order Products: ${latestOrder.orderProducts.length}\n`);

    // Get order products for this order
    const orderProducts = await OrderProduct.find({ order: latestOrder._id })
      .populate('product', 'name sku')
      .populate('selectedVariants.variation', 'name type');

    console.log(`Found ${orderProducts.length} order products:\n`);

    for (let i = 0; i < orderProducts.length; i++) {
      const orderProduct = orderProducts[i];
      console.log(`Order Product ${i + 1}:`);
      console.log(`  - ID: ${orderProduct._id}`);
      console.log(`  - Product: ${orderProduct.product?.name || 'Unknown'}`);
      console.log(`  - Quantity: ${orderProduct.quantity}`);
      console.log(`  - Unit Price: ${orderProduct.unitPrice}`);
      console.log(`  - Total Price: ${orderProduct.totalPrice}`);
      console.log(`  - Selected Variants: ${orderProduct.selectedVariants?.length || 0}`);
      
      if (orderProduct.selectedVariants && orderProduct.selectedVariants.length > 0) {
        console.log(`  - Variant Details:`);
        orderProduct.selectedVariants.forEach((variant, idx) => {
          console.log(`    ${idx + 1}. Variation: ${variant.variation?.name || 'Not populated'}`);
          console.log(`       Value: ${variant.value}`);
          console.log(`       Price Adjustment: ${variant.priceAdjustment}`);
          console.log(`       Raw variation ID: ${variant.variation}`);
        });
      } else {
        console.log(`  - No variants found`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Debug error:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await debugOrderProducts();
  await mongoose.disconnect();
  console.log('\nDebug completed. Database disconnected.');
};

main().catch(console.error);
