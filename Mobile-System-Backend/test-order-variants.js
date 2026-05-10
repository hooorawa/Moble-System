import mongoose from 'mongoose';
import OrderProductVariant from './models/orderProductVariantModel.js';
import Order from './models/orderModel.js';
import OrderProduct from './models/orderProductModel.js';
import ProductVariant from './models/productVariantModel.js';
import Product from './models/productModel.js';
import Variation from './models/variationModel.js';

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

// Test function to demonstrate order product variants
const testOrderProductVariants = async () => {
  try {
    console.log('=== Testing Order Product Variants ===\n');

    // 1. Get all orders
    const orders = await Order.find().limit(5);
    console.log(`Found ${orders.length} orders\n`);

    for (const order of orders) {
      console.log(`--- Order ${order.orderNumber} ---`);
      
      // 2. Get order products for this order
      const orderProducts = await OrderProduct.find({ order: order._id })
        .populate('product', 'name sku')
        .populate('selectedVariants.variation', 'name type');
      
      console.log(`Order Products: ${orderProducts.length}`);
      
      for (const orderProduct of orderProducts) {
        console.log(`  - Product: ${orderProduct.product?.name || 'Unknown'}`);
        console.log(`    Quantity: ${orderProduct.quantity}`);
        console.log(`    Selected Variants: ${orderProduct.selectedVariants?.length || 0}`);
        
        if (orderProduct.selectedVariants && orderProduct.selectedVariants.length > 0) {
          for (const variant of orderProduct.selectedVariants) {
            console.log(`      * ${variant.variation?.name || 'Unknown'}: ${variant.value}`);
          }
        }
      }

      // 3. Get order product variants for this order
      const orderProductVariants = await OrderProductVariant.find({ order: order._id })
        .populate('orderProduct', 'product quantity')
        .populate('productVariant', 'value priceAdjustment')
        .populate('variation', 'name type');
      
      console.log(`Order Product Variants: ${orderProductVariants.length}`);
      
      for (const opv of orderProductVariants) {
        console.log(`  - Product: ${opv.orderProduct?.product || 'Unknown'}`);
        console.log(`    Variation: ${opv.variation?.name || 'Unknown'} (${opv.variation?.type || 'Unknown'})`);
        console.log(`    Value: ${opv.value}`);
        console.log(`    Price Adjustment: ${opv.priceAdjustment}`);
        console.log(`    Variant Snapshot: ${opv.variantSnapshot?.variationName} - ${opv.variantSnapshot?.value}`);
      }
      
      console.log('');
    }

    // 4. Get statistics
    const totalOrderProductVariants = await OrderProductVariant.countDocuments();
    console.log(`Total Order Product Variants in database: ${totalOrderProductVariants}`);

    // 5. Get variants by variation type
    const variantsByType = await OrderProductVariant.aggregate([
      {
        $lookup: {
          from: 'variations',
          localField: 'variation',
          foreignField: '_id',
          as: 'variationData'
        }
      },
      {
        $unwind: '$variationData'
      },
      {
        $group: {
          _id: '$variationData.type',
          count: { $sum: 1 },
          variations: { $addToSet: '$variationData.name' }
        }
      }
    ]);

    console.log('\nVariants by Type:');
    for (const type of variantsByType) {
      console.log(`  - ${type._id}: ${type.count} variants`);
      console.log(`    Variations: ${type.variations.join(', ')}`);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testOrderProductVariants();
  await mongoose.disconnect();
  console.log('\nTest completed. Database disconnected.');
};

main().catch(console.error);

