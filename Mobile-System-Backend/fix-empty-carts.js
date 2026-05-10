// Fix Empty Carts Script
// This script will clean up any empty carts that have incorrect totals

import mongoose from 'mongoose';
import Cart from './models/cartModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mobile-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixEmptyCarts = async () => {
  try {
    console.log('🔍 Looking for empty carts with incorrect totals...');
    
    // Find carts that are empty but have non-zero totals
    const emptyCartsWithTotals = await Cart.find({
      $and: [
        { items: { $size: 0 } }, // Empty items array
        { $or: [
          { subtotal: { $ne: 0 } },
          { tax: { $ne: 0 } },
          { delivery: { $ne: 0 } },
          { total: { $ne: 0 } }
        ]}
      ]
    });
    
    console.log(`Found ${emptyCartsWithTotals.length} empty carts with incorrect totals`);
    
    if (emptyCartsWithTotals.length > 0) {
      console.log('📋 Empty carts before fix:');
      emptyCartsWithTotals.forEach((cart, index) => {
        console.log(`  ${index + 1}. User: ${cart.user}`);
        console.log(`     Items: ${cart.items.length}`);
        console.log(`     Subtotal: ${cart.subtotal}`);
        console.log(`     Tax: ${cart.tax}`);
        console.log(`     Delivery: ${cart.delivery}`);
        console.log(`     Total: ${cart.total}`);
        console.log('');
      });
      
      // Fix each empty cart
      for (const cart of emptyCartsWithTotals) {
        cart.subtotal = 0;
        cart.tax = 0;
        cart.delivery = 0;
        cart.total = 0;
        await cart.save();
        console.log(`✅ Fixed cart for user: ${cart.user}`);
      }
      
      console.log('🎉 All empty carts have been fixed!');
    } else {
      console.log('✅ No empty carts with incorrect totals found');
    }
    
    // Show summary of all carts
    const allCarts = await Cart.find({ isActive: true });
    console.log('\n📊 Cart Summary:');
    console.log(`Total active carts: ${allCarts.length}`);
    
    const emptyCarts = allCarts.filter(cart => cart.items.length === 0);
    const cartsWithItems = allCarts.filter(cart => cart.items.length > 0);
    
    console.log(`Empty carts: ${emptyCarts.length}`);
    console.log(`Carts with items: ${cartsWithItems.length}`);
    
    if (emptyCarts.length > 0) {
      console.log('\n📋 Empty carts after fix:');
      emptyCarts.forEach((cart, index) => {
        console.log(`  ${index + 1}. User: ${cart.user}`);
        console.log(`     Items: ${cart.items.length}`);
        console.log(`     Subtotal: ${cart.subtotal}`);
        console.log(`     Tax: ${cart.tax}`);
        console.log(`     Delivery: ${cart.delivery}`);
        console.log(`     Total: ${cart.total}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error fixing empty carts:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixEmptyCarts();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

main();
