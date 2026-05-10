import mongoose from 'mongoose';
import Cart from './models/cartModel.js';
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

// Test function to check cart and order variants
const testCartAndOrderVariants = async () => {
  try {
    console.log('=== Testing Cart and Order Variants ===\n');

    // 1. Check all carts
    const carts = await Cart.find({ isActive: true })
      .populate('items.product', 'name sku')
      .populate('items.selectedVariants.variation', 'name type');

    console.log(`Found ${carts.length} active carts\n`);

    for (let i = 0; i < carts.length; i++) {
      const cart = carts[i];
      console.log(`Cart ${i + 1} (User: ${cart.user}):`);
      console.log(`  Items: ${cart.items.length}`);
      
      cart.items.forEach((item, itemIndex) => {
        console.log(`    Item ${itemIndex + 1}: ${item.product?.name || 'Unknown'}`);
        console.log(`      - Quantity: ${item.quantity}`);
        console.log(`      - Selected Variants: ${item.selectedVariants?.length || 0}`);
        
        if (item.selectedVariants && item.selectedVariants.length > 0) {
          item.selectedVariants.forEach((variant, vIndex) => {
            console.log(`        Variant ${vIndex + 1}: ${variant.variation?.name || 'No name'}: ${variant.value}`);
          });
        } else {
          console.log(`        No variants found`);
        }
      });
      console.log('');
    }

    // 2. Check all orders
    const orders = await Order.find().sort({ createdAt: -1 }).limit(3);
    console.log(`Found ${orders.length} recent orders\n`);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log(`Order ${i + 1}: ${order.orderNumber}`);
      console.log(`  Order Products: ${order.orderProducts.length}`);
      
      // Get order products for this order
      const orderProducts = await OrderProduct.find({ order: order._id })
        .populate('product', 'name sku')
        .populate('selectedVariants.variation', 'name type');

      orderProducts.forEach((orderProduct, opIndex) => {
        console.log(`    Order Product ${opIndex + 1}: ${orderProduct.product?.name || 'Unknown'}`);
        console.log(`      - Quantity: ${orderProduct.quantity}`);
        console.log(`      - Selected Variants: ${orderProduct.selectedVariants?.length || 0}`);
        
        if (orderProduct.selectedVariants && orderProduct.selectedVariants.length > 0) {
          orderProduct.selectedVariants.forEach((variant, vIndex) => {
            console.log(`        Variant ${vIndex + 1}: ${variant.variation?.name || 'No name'}: ${variant.value}`);
          });
        } else {
          console.log(`        No variants found`);
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testCartAndOrderVariants();
  await mongoose.disconnect();
  console.log('\nTest completed. Database disconnected.');
};

main().catch(console.error);
