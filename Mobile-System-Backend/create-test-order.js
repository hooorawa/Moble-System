import mongoose from 'mongoose';
import Cart from './models/cartModel.js';
import Order from './models/orderModel.js';
import OrderProduct from './models/orderProductModel.js';
import Product from './models/productModel.js';
import Variation from './models/variationModel.js';
import Customer from './models/customerModel.js';
import Address from './models/addressModel.js';

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

// Create a test order with variants
const createTestOrder = async () => {
  try {
    console.log('=== Creating Test Order with Variants ===\n');

    // 1. Get or create a test customer
    let customer = await Customer.findOne({ email: 'test@example.com' });
    if (!customer) {
      customer = new Customer({
        name: 'Test Customer',
        email: 'test@example.com',
        phoneNumber: '1234567890'
      });
      await customer.save();
      console.log('Created test customer');
    }

    // 2. Get or create a test address
    let address = await Address.findOne({ customer: customer._id });
    if (!address) {
      address = new Address({
        customer: customer._id,
        name: 'Test Address',
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        phoneNumber: '1234567890'
      });
      await address.save();
      console.log('Created test address');
    }

    // 3. Get a product
    const product = await Product.findOne();
    if (!product) {
      console.log('No products found. Please add a product first.');
      return;
    }
    console.log(`Using product: ${product.name}`);

    // 4. Get variations
    const variations = await Variation.find().limit(2);
    if (variations.length < 2) {
      console.log('Not enough variations found. Please add variations first.');
      return;
    }
    console.log(`Found ${variations.length} variations`);

    // 5. Create test cart with variants
    const testVariants = [
      {
        variation: variations[0]._id,
        value: 'Test Value 1',
        priceAdjustment: 10
      },
      {
        variation: variations[1]._id,
        value: 'Test Value 2',
        priceAdjustment: 5
      }
    ];

    const cart = new Cart({
      user: 'test-user-123',
      items: [{
        product: product._id,
        quantity: 2,
        selectedVariants: testVariants,
        price: product.price + 15, // base price + variant adjustments
        totalPrice: (product.price + 15) * 2
      }],
      subtotal: (product.price + 15) * 2,
      tax: ((product.price + 15) * 2) * 0.1,
      delivery: 0,
      total: ((product.price + 15) * 2) * 1.1
    });

    await cart.save();
    console.log('Created test cart with variants');

    // 6. Create test order
    const order = new Order({
      orderNumber: 'TEST' + Date.now(),
      customer: customer._id,
      deliveryAddress: address._id,
      billingAddress: address._id,
      paymentMethod: {
        type: 'cash_on_delivery',
        details: {}
      },
      notes: 'Test order with variants'
    });

    await order.save();
    console.log('Created test order');

    // 7. Create order product with variants
    const orderProduct = new OrderProduct({
      order: order._id,
      product: product._id,
      quantity: 2,
      selectedVariants: testVariants,
      unitPrice: product.price + 15,
      totalPrice: (product.price + 15) * 2,
      productSnapshot: {
        name: product.name,
        description: product.description || '',
        images: product.images || [],
        brand: {
          name: product.brand?.name || 'Unknown Brand',
          logo: product.brand?.logo || ''
        },
        category: {
          name: product.category?.name || 'Uncategorized'
        },
        sku: product.sku || '',
        originalPrice: product.price
      }
    });

    await orderProduct.save();
    console.log('Created order product with variants');

    // Update order with order product
    order.orderProducts = [orderProduct._id];
    order.subtotal = orderProduct.totalPrice;
    order.tax = orderProduct.totalPrice * 0.1;
    order.delivery = 0;
    order.total = orderProduct.totalPrice * 1.1;
    await order.save();

    console.log('\n=== Test Order Created Successfully ===');
    console.log(`Order ID: ${order._id}`);
    console.log(`Order Number: ${order.orderNumber}`);
    console.log(`Order Product ID: ${orderProduct._id}`);
    console.log(`Variants: ${orderProduct.selectedVariants.length}`);

    // 8. Test fetching the order with populated data
    const populatedOrder = await Order.findById(order._id)
      .populate([
        {
          path: 'orderProducts',
          populate: [
            {
              path: 'product',
              select: 'name images sku description'
            },
            {
              path: 'selectedVariants.variation',
              select: 'name type'
            }
          ]
        }
      ]);

    console.log('\n=== Testing Order Fetch with Population ===');
    console.log('Order Products:', populatedOrder.orderProducts.length);
    
    if (populatedOrder.orderProducts.length > 0) {
      const orderProduct = populatedOrder.orderProducts[0];
      console.log(`Product: ${orderProduct.product?.name}`);
      console.log(`Variants: ${orderProduct.selectedVariants?.length || 0}`);
      
      if (orderProduct.selectedVariants && orderProduct.selectedVariants.length > 0) {
        orderProduct.selectedVariants.forEach((variant, index) => {
          console.log(`  Variant ${index + 1}: ${variant.variation?.name || 'No name'}: ${variant.value}`);
        });
      }
    }

  } catch (error) {
    console.error('Error creating test order:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createTestOrder();
  await mongoose.disconnect();
  console.log('\nTest completed. Database disconnected.');
};

main().catch(console.error);
