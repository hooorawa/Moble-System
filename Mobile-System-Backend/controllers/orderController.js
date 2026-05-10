import Order from '../models/orderModel.js';
import OrderProduct from '../models/orderProductModel.js';
import OrderProductVariant from '../models/orderProductVariantModel.js';
import ProductVariant from '../models/productVariantModel.js';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import Customer from '../models/customerModel.js';
import Address from '../models/addressModel.js';
import Counter from '../models/counterModel.js';
import { convertArrayToProxyUrls, getBaseUrl, convertAllImagesInObject } from '../utils/imageUrlHelper.js';

// Create new order with proper relationships
export const createOrder = async (req, res) => {
  try {
    console.log('=== ORDER CREATION STARTED ===');
    console.log('Request body:', req.body);
    
    // Require authentication - use authenticated user's ID from token
    const authenticatedUserId = req.user?.userId;
    
    if (!authenticatedUserId) {
      console.log('[ORDER] Authentication required - no user token found');
      return res.status(401).json({
        success: false,
        message: 'Please login to place an order'
      });
    }
    
    console.log('[ORDER] Authenticated user ID:', authenticatedUserId);
    
    // Fetch authenticated user's customer record
    const customer = await Customer.findById(authenticatedUserId);
    
    if (!customer) {
      console.log('[ORDER] Customer not found for authenticated user:', authenticatedUserId);
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found. Please register first.'
      });
    }
    
    console.log('[ORDER] Using authenticated customer:', customer.email, 'ID:', customer._id);
    
    // Use customer's email for cart lookup (frontend uses email as cartUserId)
    const cartUserId = customer.email;
    const { 
      deliveryAddressId, 
      billingAddressId, 
      paymentMethod, 
      notes = '',
      useBillingAsDelivery = false 
    } = req.body;

    console.log('Create order request:', { cartUserId, deliveryAddressId, billingAddressId, paymentMethod });

    // Validate required fields
    if (!deliveryAddressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address and payment method are required'
      });
    }

    console.log('[ORDER] Customer details - Name:', customer.name, 'Email:', customer.email);

    // Get addresses
    const deliveryAddress = await Address.findById(deliveryAddressId);
    if (!deliveryAddress) {
      return res.status(404).json({
        success: false,
        message: 'Delivery address not found'
      });
    }

    let billingAddress = deliveryAddress;
    if (!useBillingAsDelivery && billingAddressId) {
      billingAddress = await Address.findById(billingAddressId);
      if (!billingAddress) {
        return res.status(404).json({
          success: false,
          message: 'Billing address not found'
        });
      }
    }

    // Get user's cart using customer email
    console.log('Looking for cart with user:', cartUserId);
    const cart = await Cart.findOne({ user: cartUserId, isActive: true })
      .populate({
        path: 'items.product',
        populate: {
          path: 'brand category',
          select: 'name logo'
        }
      })
      .populate('items.selectedVariants.variation', 'name');

    console.log('Cart found:', !!cart);
    if (cart) {
      console.log('Cart items count:', cart.items.length);
      console.log('Cart details:', JSON.stringify(cart, null, 2));
      
      // Debug each cart item and its variants
      cart.items.forEach((item, index) => {
        console.log(`Cart Item ${index}: ${item.product?.name}, Variants: ${item.selectedVariants?.length || 0}`);
        
        if (item.selectedVariants && item.selectedVariants.length > 0) {
          item.selectedVariants.forEach((variant, vIndex) => {
            console.log(`  Cart Variant ${vIndex}: ${variant.variation?.name || 'No name'}: ${variant.value}`);
          });
        }
      });
    } else {
      console.log('No cart found for user:', cartUserId);
      // Let's check if there are any carts for this user
      const allCarts = await Cart.find({ user: cartUserId });
      console.log('All carts for user:', allCarts.length);
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or not found'
      });
    }

    // Check product availability and stock
    console.log(`[ORDER PLACEMENT] Checking stock for ${cart.items.length} items`);
    for (const item of cart.items) {
      console.log(`[ORDER PLACEMENT] Item: ${item.product.name}, Available: ${item.product.quantity}, Requested: ${item.quantity}`);
      if (item.product.quantity < item.quantity) {
        console.log(`[ORDER PLACEMENT] Insufficient stock for ${item.product.name}`);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}. Available: ${item.product.quantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Generate 4-digit order number
    const generateOrderNumber = async () => {
      try {
        // Get or create counter for orders
        const counter = await Counter.findOneAndUpdate(
          { name: 'orderNumber' },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );
        
        // If value exceeds 9999, reset to 1000
        if (counter.value > 9999) {
          await Counter.updateOne(
            { name: 'orderNumber' },
            { value: 1000 }
          );
          return '1000';
        }
        
        return counter.value.toString().padStart(4, '0');
      } catch (error) {
        console.error('Error generating order number:', error);
        // Fallback: generate random 4-digit number if counter fails
        return Math.floor(Math.random() * 9000 + 1000).toString();
      }
    };

    // Create order
    const order = new Order({
      orderNumber: await generateOrderNumber(),
      customer: customer._id,
      deliveryAddress: deliveryAddress._id,
      billingAddress: billingAddress._id,
      paymentMethod: {
        type: paymentMethod.type || paymentMethod,
        details: paymentMethod.details || {}
      },
      notes,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    console.log('Creating order with data:', {
      orderNumber: order.orderNumber,
      customer: customer._id,
      deliveryAddress: deliveryAddress._id,
      billingAddress: billingAddress._id,
      paymentMethod: paymentMethod
    });

    await order.save();
    console.log('Order created:', order._id, 'Order Number:', order.orderNumber);

    // Update product stock (deduct quantity when order is placed)
    console.log(`[ORDER PLACEMENT] Deducting stock for order ${order._id}`);
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        console.log(`[ORDER PLACEMENT] Product: ${product.name}, Current quantity: ${product.quantity}, Ordered: ${item.quantity}`);
        product.quantity -= item.quantity;
        await product.save();
        console.log(`[ORDER PLACEMENT] Stock deducted: ${product.name} - ${item.quantity} units (remaining: ${product.quantity})`);
      }
    }

    // Create order products and calculate totals
    let subtotal = 0;
    const orderProducts = [];
    const orderItems = []; // New array for direct item storage

    console.log('Processing cart items for order products...');
    
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      console.log(`Processing item ${i + 1}:`, {
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        selectedVariants: item.selectedVariants,
        variantsCount: item.selectedVariants?.length || 0
      });
      
      // Convert selectedVariants to variants Map for direct storage
      const variantsMap = new Map();
      if (item.selectedVariants && item.selectedVariants.length > 0) {
        item.selectedVariants.forEach(variant => {
          // Handle both old format {variation: ObjectId, value: string} and new format {key: value}
          const key = variant.variation?.name || variant.variation || Object.keys(variant)[0];
          const value = variant.value || Object.values(variant)[0];
          if (key && value) {
            variantsMap.set(key, value);
          }
        });
      }
      
      // Debug: Log each variant in detail
      if (item.selectedVariants && item.selectedVariants.length > 0) {
        console.log(`  Variants for ${item.product.name}:`);
        item.selectedVariants.forEach((variant, vIndex) => {
          console.log(`    Variant ${vIndex}:`, {
            variation: variant.variation,
            value: variant.value,
            priceAdjustment: variant.priceAdjustment
          });
        });
        console.log(`  Converted to Map:`, Object.fromEntries(variantsMap));
      } else {
        console.log(`  No variants found for ${item.product.name}`);
      }

      try {
        // Create product snapshot
        const productSnapshot = {
          name: item.product.name,
          description: item.product.description || '',
          images: item.product.images || [],
          brand: {
            name: item.product.brand?.name || 'Unknown Brand',
            logo: item.product.brand?.logo || ''
          },
          category: {
            name: item.product.category?.name || 'Uncategorized'
          },
          sku: item.product.sku || '',
          emiNumber: item.product.emiNumber || '',
          originalPrice: item.product.price
        };

        // Calculate total price for this order product
        const totalPrice = item.price * item.quantity;

        // Debug: Log what we're saving
        console.log(`Creating order product for: ${item.product.name}, Variants: ${item.selectedVariants?.length || 0}`);

        // Create order product
        const orderProduct = new OrderProduct({
          order: order._id,
          product: item.product._id,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants || [],
          unitPrice: item.price,
          totalPrice: totalPrice,
          productSnapshot
        });

        await orderProduct.save();
        
        // Debug: Log what was actually saved
        console.log(`Order product saved with ${orderProduct.selectedVariants?.length || 0} variants`);
        if (orderProduct.selectedVariants && orderProduct.selectedVariants.length > 0) {
          console.log(`  Saved variants:`, orderProduct.selectedVariants);
        }
        orderProducts.push(orderProduct._id);
        subtotal += orderProduct.totalPrice;

        // Create order item for direct storage
        const orderItem = {
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          variants: variantsMap,
          unitPrice: item.price,
          totalPrice: totalPrice,
          productSnapshot
        };
        
        orderItems.push(orderItem);
        console.log(`Order item created with variants:`, Object.fromEntries(variantsMap));

        console.log(`Order product created: ${orderProduct._id}, total: ${orderProduct.totalPrice}`);

        // Create order product variants for each selected variant
        if (item.selectedVariants && item.selectedVariants.length > 0) {
          console.log(`Creating order product variants for ${item.selectedVariants.length} variants`);
          
          for (const selectedVariant of item.selectedVariants) {
            try {
              // Find the corresponding product variant
              const productVariant = await ProductVariant.findOne({
                product: item.product._id,
                variation: selectedVariant.variation,
                value: selectedVariant.value
              });

              if (productVariant) {
                // Create order product variant
                const orderProductVariant = new OrderProductVariant({
                  order: order._id,
                  orderProduct: orderProduct._id,
                  productVariant: productVariant._id,
                  variation: selectedVariant.variation,
                  value: selectedVariant.value,
                  priceAdjustment: selectedVariant.priceAdjustment || 0,
                  variantSnapshot: {
                    variationName: selectedVariant.variation?.name || 'Unknown Variation',
                    value: selectedVariant.value,
                    priceAdjustment: selectedVariant.priceAdjustment || 0
                  }
                });

                await orderProductVariant.save();
                console.log(`Order product variant created: ${orderProductVariant._id} for variation ${selectedVariant.value}`);
              } else {
                console.warn(`Product variant not found for product ${item.product._id}, variation ${selectedVariant.variation}, value ${selectedVariant.value}`);
              }
            } catch (variantError) {
              console.error(`Error creating order product variant:`, variantError);
              // Don't throw error here, just log it and continue
            }
          }
        }

        // Stock already deducted above after order creation
      } catch (itemError) {
        console.error(`Error processing item ${i + 1}:`, itemError);
        throw itemError;
      }
    }

    // Update order with order products and totals
    console.log('Updating order with totals...');
    order.orderProducts = orderProducts;
    order.items = orderItems; // Add direct item storage with variants
    order.subtotal = subtotal;
    order.tax = 0; // No tax for now
    order.delivery = 0; // No delivery fee for now
    order.total = subtotal; // Total is just the subtotal

    console.log('Order totals:', {
      subtotal: order.subtotal,
      tax: order.tax,
      delivery: order.delivery,
      total: order.total
    });

    await order.save();
    console.log('Order updated with totals');

    // Update customer with new order
    if (!customer.orders) {
      customer.orders = [];
    }
    customer.orders.push(order._id);
    await customer.save();
    console.log('Customer updated with new order');

    // Clear the cart
    cart.items = [];
    await cart.save();
    console.log('Cart cleared');

    // Populate the order for response
    console.log('Populating order for response...');
    try {
      await order.populate([
        {
          path: 'customer',
          select: 'name email phoneNumber'
        },
        {
          path: 'deliveryAddress',
          select: 'name address city postalCode phoneNumber'
        },
        {
          path: 'billingAddress',
          select: 'name address city postalCode phoneNumber'
        },
        {
          path: 'orderProducts',
          populate: [
            {
              path: 'product',
                select: 'name images sku emiNumber',
              populate: {
                path: 'brand category',
                select: 'name'
              }
            }
          ]
        }
      ]);
      console.log('Order populated successfully');
    } catch (populateError) {
      console.error('Error populating order:', populateError);
      // Continue with response even if populate fails
    }

    console.log('Order completed successfully:', order.orderNumber);

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    
    // Deep clone to avoid mutating the original Mongoose document
    let orderObj = JSON.parse(JSON.stringify(order.toObject ? order.toObject() : order));
    
    console.log('=== CONVERTING ORDER IMAGES (CREATE) ===');
    console.log('Order ID:', orderObj._id);
    console.log('Order Number:', orderObj.orderNumber);
    console.log('Base URL:', baseUrl);
    console.log('Items count:', orderObj.items?.length || 0);
    console.log('OrderProducts count:', orderObj.orderProducts?.length || 0);
    
    // Direct conversion for order items - productSnapshot.images
    if (orderObj.items && Array.isArray(orderObj.items)) {
      console.log(`Processing ${orderObj.items.length} order items...`);
      for (let i = 0; i < orderObj.items.length; i++) {
        const item = orderObj.items[i];
        if (item && item.productSnapshot) {
          if (item.productSnapshot.images && Array.isArray(item.productSnapshot.images) && item.productSnapshot.images.length > 0) {
            console.log(`Item ${i} - Found ${item.productSnapshot.images.length} images`);
            console.log(`  Original first image: ${item.productSnapshot.images[0]}`);
            const converted = convertArrayToProxyUrls(item.productSnapshot.images, baseUrl);
            orderObj.items[i].productSnapshot.images = converted;
            if (converted.length > 0) {
              console.log(`  Converted first image: ${converted[0]}`);
            }
          } else {
            console.log(`Item ${i} - No images in productSnapshot.images or empty array`);
          }
        } else {
          console.log(`Item ${i} - No productSnapshot found`);
        }
      }
    } else {
      console.log('No items array found in order');
    }
    
    // Direct conversion for orderProducts - productSnapshot.images and product.images
    if (orderObj.orderProducts && Array.isArray(orderObj.orderProducts)) {
      console.log(`Processing ${orderObj.orderProducts.length} order products...`);
      for (let i = 0; i < orderObj.orderProducts.length; i++) {
        const op = orderObj.orderProducts[i];
        if (op && op.productSnapshot && op.productSnapshot.images && Array.isArray(op.productSnapshot.images)) {
          console.log(`OrderProduct ${i} - Converting productSnapshot.images`);
          orderObj.orderProducts[i].productSnapshot.images = convertArrayToProxyUrls(op.productSnapshot.images, baseUrl);
        }
        if (op && op.product && op.product.images && Array.isArray(op.product.images)) {
          console.log(`OrderProduct ${i} - Converting product.images`);
          orderObj.orderProducts[i].product.images = convertArrayToProxyUrls(op.product.images, baseUrl);
        }
      }
    }
    
    // Final verification - log what we're sending
    console.log('=== FINAL ORDER DATA (CREATE) ===');
    if (orderObj.items && orderObj.items.length > 0) {
      console.log('First item structure:', {
        hasProductSnapshot: !!orderObj.items[0].productSnapshot,
        hasImages: !!orderObj.items[0].productSnapshot?.images,
        imagesCount: orderObj.items[0].productSnapshot?.images?.length || 0,
        firstImage: orderObj.items[0].productSnapshot?.images?.[0]
      });
    }
    
    console.log('=== IMAGE CONVERSION COMPLETED (CREATE) ===');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: orderObj
    });

  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get user's orders with full relationships
export const getUserOrders = async (req, res) => {
  try {
    // Use authenticated user's ID from token
    const authenticatedUserId = req.user?.userId;
    
    if (!authenticatedUserId) {
      console.log('[GET_ORDERS] Authentication required - no user token found');
      return res.status(401).json({
        success: false,
        message: 'Please login to view orders'
      });
    }
    
    console.log('[GET_ORDERS] Fetching orders for authenticated user:', authenticatedUserId);
    
    // Fetch customer record
    const customer = await Customer.findById(authenticatedUserId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }
    
    console.log('[GET_ORDERS] Using customer:', customer.email, 'ID:', customer._id);
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: customer._id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate([
        {
          path: 'customer',
          select: 'name email phoneNumber'
        },
        {
          path: 'deliveryAddress',
          select: 'name address city postalCode phoneNumber'
        },
        {
          path: 'billingAddress',
          select: 'name address city postalCode phoneNumber'
        },
        {
          path: 'orderProducts',
          populate: [
            {
              path: 'product',
              select: 'name images sku',
              populate: {
                path: 'brand category',
                select: 'name'
              }
            },
            {
              path: 'selectedVariants.variation',
              select: 'name'
            }
          ]
        }
      ])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    const ordersWithProxyUrls = orders.map(order => {
      // Deep clone to avoid mutating the original Mongoose document
      let orderObj = JSON.parse(JSON.stringify(order.toObject ? order.toObject() : order));
      
      // Direct conversion for order items - productSnapshot.images
      if (orderObj.items && Array.isArray(orderObj.items)) {
        for (let i = 0; i < orderObj.items.length; i++) {
          const item = orderObj.items[i];
          if (item && item.productSnapshot && item.productSnapshot.images && Array.isArray(item.productSnapshot.images)) {
            orderObj.items[i].productSnapshot.images = convertArrayToProxyUrls(item.productSnapshot.images, baseUrl);
          }
        }
      }
      
      // Direct conversion for orderProducts - productSnapshot.images and product.images
      if (orderObj.orderProducts && Array.isArray(orderObj.orderProducts)) {
        for (let i = 0; i < orderObj.orderProducts.length; i++) {
          const op = orderObj.orderProducts[i];
          if (op && op.product && op.product.images && Array.isArray(op.product.images)) {
            orderObj.orderProducts[i].product.images = convertArrayToProxyUrls(op.product.images, baseUrl);
          }
          if (op && op.productSnapshot && op.productSnapshot.images && Array.isArray(op.productSnapshot.images)) {
            orderObj.orderProducts[i].productSnapshot.images = convertArrayToProxyUrls(op.productSnapshot.images, baseUrl);
          }
        }
      }
      
      return orderObj;
    });

    res.json({
      success: true,
      data: {
        orders: ordersWithProxyUrls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get single order with full relationships
export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Use authenticated user's ID from token
    const authenticatedUserId = req.user?.userId;
    
    if (!authenticatedUserId) {
      console.log('[GET_ORDER] Authentication required - no user token found');
      return res.status(401).json({
        success: false,
        message: 'Please login to view orders'
      });
    }
    
    console.log('[GET_ORDER] Fetching order for authenticated user:', authenticatedUserId);

    // Fetch customer record
    const customer = await Customer.findById(authenticatedUserId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }
    
    console.log('[GET_ORDER] Using customer:', customer.email, 'ID:', customer._id);

    // Fetch order for authenticated customer
    const order = await Order.findOne({ _id: orderId, customer: customer._id });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to view it'
      });
    }

    // Populate the order with related data
    await order.populate([
        {
          path: 'customer',
          select: 'name email phoneNumber'
        },
        {
          path: 'deliveryAddress',
          select: 'name address city postalCode phoneNumber state country'
        },
        {
          path: 'billingAddress',
          select: 'name address city postalCode phoneNumber state country'
        },
        {
          path: 'orderProducts',
          populate: [
            {
              path: 'product',
                select: 'name images sku description emiNumber',
              populate: {
                path: 'brand category',
                select: 'name logo'
              }
            },
            {
              path: 'selectedVariants.variation',
              select: 'name type'
            }
          ]
        },
        {
          path: 'items.productId',
          select: 'name images sku description',
          populate: {
            path: 'brand category',
            select: 'name logo'
          }
        }
      ]);

    console.log('=== ORDER POPULATED ===');
    console.log('Order items (raw):', JSON.stringify(order.items?.slice(0, 1), null, 2));

    // Debug: Log order products and their variants
    console.log(`Order found: ${order.orderNumber}, Products: ${order.orderProducts?.length || 0}`);
    
    if (order.orderProducts && order.orderProducts.length > 0) {
      order.orderProducts.forEach((product, index) => {
        console.log(`Product ${index}: ${product.product?.name}, Variants: ${product.selectedVariants?.length || 0}`);
        
        if (product.selectedVariants && product.selectedVariants.length > 0) {
          product.selectedVariants.forEach((variant, vIndex) => {
            console.log(`  Variant ${vIndex}: ${variant.variation?.name || 'No name'}: ${variant.value}`);
          });
        }
      });
    }

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    
    // Deep clone to avoid mutating the original Mongoose document
    let orderObj = JSON.parse(JSON.stringify(order.toObject ? order.toObject() : order));
    
    console.log('=== CONVERTING ORDER IMAGES ===');
    console.log('Order ID:', orderObj._id);
    console.log('Order Number:', orderObj.orderNumber);
    console.log('Base URL:', baseUrl);
    console.log('Items count:', orderObj.items?.length || 0);
    console.log('OrderProducts count:', orderObj.orderProducts?.length || 0);
    
    // Direct conversion for order items - productSnapshot.images and productId.images
    if (orderObj.items && Array.isArray(orderObj.items)) {
      console.log(`Processing ${orderObj.items.length} order items...`);
      for (let i = 0; i < orderObj.items.length; i++) {
        const item = orderObj.items[i];
        if (item) {
          // Convert productSnapshot.images
          if (item.productSnapshot && item.productSnapshot.images && Array.isArray(item.productSnapshot.images) && item.productSnapshot.images.length > 0) {
            console.log(`Item ${i} - Found ${item.productSnapshot.images.length} images in productSnapshot`);
            console.log(`  Original first image: ${item.productSnapshot.images[0]}`);
            const converted = convertArrayToProxyUrls(item.productSnapshot.images, baseUrl);
            orderObj.items[i].productSnapshot.images = converted;
            if (converted.length > 0) {
              console.log(`  Converted first image: ${converted[0]}`);
            }
          }
          // Convert productId.images (if productId is populated)
          if (item.productId && item.productId.images && Array.isArray(item.productId.images) && item.productId.images.length > 0) {
            console.log(`Item ${i} - Found ${item.productId.images.length} images in productId`);
            console.log(`  Original first image: ${item.productId.images[0]}`);
            const converted = convertArrayToProxyUrls(item.productId.images, baseUrl);
            orderObj.items[i].productId.images = converted;
            if (converted.length > 0) {
              console.log(`  Converted first image: ${converted[0]}`);
            }
          }
        }
      }
    } else {
      console.log('No items array found in order');
    }
    
    // Direct conversion for orderProducts - productSnapshot.images and product.images
    if (orderObj.orderProducts && Array.isArray(orderObj.orderProducts)) {
      console.log(`Processing ${orderObj.orderProducts.length} order products...`);
      for (let i = 0; i < orderObj.orderProducts.length; i++) {
        const op = orderObj.orderProducts[i];
        if (op && op.productSnapshot && op.productSnapshot.images && Array.isArray(op.productSnapshot.images)) {
          console.log(`OrderProduct ${i} - Converting productSnapshot.images`);
          orderObj.orderProducts[i].productSnapshot.images = convertArrayToProxyUrls(op.productSnapshot.images, baseUrl);
        }
        if (op && op.product && op.product.images && Array.isArray(op.product.images)) {
          console.log(`OrderProduct ${i} - Converting product.images`);
          orderObj.orderProducts[i].product.images = convertArrayToProxyUrls(op.product.images, baseUrl);
        }
      }
    }
    
    // Final verification - log what we're sending
    console.log('=== FINAL ORDER DATA ===');
    if (orderObj.items && orderObj.items.length > 0) {
      console.log('First item structure:', {
        hasProductSnapshot: !!orderObj.items[0].productSnapshot,
        hasProductId: !!orderObj.items[0].productId,
        productSnapshotImages: orderObj.items[0].productSnapshot?.images?.length || 0,
        productIdImages: orderObj.items[0].productId?.images?.length || 0,
        firstProductSnapshotImage: orderObj.items[0].productSnapshot?.images?.[0],
        firstProductIdImage: orderObj.items[0].productId?.images?.[0]
      });
    }
    if (orderObj.orderProducts && orderObj.orderProducts.length > 0) {
      console.log('First orderProduct structure:', {
        hasProduct: !!orderObj.orderProducts[0].product,
        hasProductSnapshot: !!orderObj.orderProducts[0].productSnapshot,
        productImages: orderObj.orderProducts[0].product?.images?.length || 0,
        productSnapshotImages: orderObj.orderProducts[0].productSnapshot?.images?.length || 0,
        firstProductImage: orderObj.orderProducts[0].product?.images?.[0],
        firstProductSnapshotImage: orderObj.orderProducts[0].productSnapshot?.images?.[0]
      });
    }
    
    console.log('=== IMAGE CONVERSION COMPLETED ===');

    res.json({
      success: true,
      data: orderObj
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, notes, paymentStatus } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled', 'refunded'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // No shipping status for local system

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'customer',
        select: 'name email phoneNumber'
      },
      {
        path: 'deliveryAddress',
        select: 'name address city postalCode phoneNumber'
      },
      {
        path: 'billingAddress',
        select: 'name address city postalCode phoneNumber'
      },
      {
        path: 'orderProducts',
        populate: {
          path: 'product',
            select: 'name images sku emiNumber',
          populate: {
            path: 'brand category',
            select: 'name'
          }
        }
      }
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If order is cancelled by admin, restore stock
    if (status === 'cancelled') {
      console.log(`[ADMIN ORDER CANCELLATION] Restoring stock for order ${order._id}`);
      for (const orderProduct of order.orderProducts) {
        const product = await Product.findById(orderProduct.product);
        if (product) {
          console.log(`[ADMIN ORDER CANCELLATION] Product: ${product.name}, Current quantity: ${product.quantity}, Restoring: ${orderProduct.quantity}`);
          product.quantity += orderProduct.quantity;
          await product.save();
          console.log(`[ADMIN ORDER CANCELLATION] Stock restored: ${product.name} + ${orderProduct.quantity} units (new total: ${product.quantity})`);
        }
      }
    }

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    const orderObj = order.toObject();
    
    // Convert images in order products
    if (orderObj.orderProducts && Array.isArray(orderObj.orderProducts)) {
      orderObj.orderProducts = orderObj.orderProducts.map(op => {
        if (op.product && op.product.images && Array.isArray(op.product.images)) {
          op.product.images = convertArrayToProxyUrls(op.product.images, baseUrl);
        }
        return op;
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: orderObj
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const authenticatedUserId = req.user?.userId;

    console.log('[CANCEL ORDER] Request received for authenticated user:', authenticatedUserId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!authenticatedUserId) {
      console.log('[CANCEL ORDER] Authentication required');
      return res.status(401).json({
        success: false,
        message: 'Please login to cancel orders'
      });
    }

    // Fetch customer record
    const customer = await Customer.findById(authenticatedUserId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    console.log('[CANCEL ORDER] Customer:', customer.email, 'ID:', customer._id);

    // Find the order
    const order = await Order.findOne({ _id: orderId, customer: customer._id })
      .populate('orderProducts')
      .populate('customer', 'email');

    if (!order) {
      console.log('[CANCEL ORDER] Order not found or access denied:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to access it'
      });
    }

    console.log('[CANCEL ORDER] Order found:', {
      orderId: order._id,
      customerId: order.customer?._id,
      status: order.status
    });

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this order'
      });
    }

    // Restore product stock
    console.log(`[ORDER CANCELLATION] Restoring stock for order ${order._id}`);
    for (const orderProduct of order.orderProducts) {
      const product = await Product.findById(orderProduct.product);
      if (product) {
        console.log(`[ORDER CANCELLATION] Product: ${product.name}, Current quantity: ${product.quantity}, Restoring: ${orderProduct.quantity}`);
        product.quantity += orderProduct.quantity;
        await product.save();
        console.log(`[ORDER CANCELLATION] Stock restored: ${product.name} + ${orderProduct.quantity} units (new total: ${product.quantity})`);
      }
    }

    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Get all orders (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate([
        {
          path: 'customer',
          select: 'name email phoneNumber'
        },
        {
          path: 'deliveryAddress',
          select: 'name address city postalCode phoneNumber'
        },
        {
          path: 'billingAddress',
          select: 'name address city postalCode phoneNumber'
        },
        {
          path: 'orderProducts',
          populate: [
            {
              path: 'product',
              select: 'name images sku',
              populate: {
                path: 'brand category',
                select: 'name'
              }
            },
            {
              path: 'selectedVariants.variation',
              select: 'name'
            }
          ]
        }
      ])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    const ordersWithProxyUrls = orders.map(order => {
      // Deep clone to avoid mutating the original Mongoose document
      let orderObj = JSON.parse(JSON.stringify(order.toObject ? order.toObject() : order));
      
      // Direct conversion for order items - productSnapshot.images
      if (orderObj.items && Array.isArray(orderObj.items)) {
        for (let i = 0; i < orderObj.items.length; i++) {
          const item = orderObj.items[i];
          if (item && item.productSnapshot && item.productSnapshot.images && Array.isArray(item.productSnapshot.images)) {
            orderObj.items[i].productSnapshot.images = convertArrayToProxyUrls(item.productSnapshot.images, baseUrl);
          }
        }
      }
      
      // Direct conversion for orderProducts - productSnapshot.images and product.images
      if (orderObj.orderProducts && Array.isArray(orderObj.orderProducts)) {
        for (let i = 0; i < orderObj.orderProducts.length; i++) {
          const op = orderObj.orderProducts[i];
          if (op && op.product && op.product.images && Array.isArray(op.product.images)) {
            orderObj.orderProducts[i].product.images = convertArrayToProxyUrls(op.product.images, baseUrl);
          }
          if (op && op.productSnapshot && op.productSnapshot.images && Array.isArray(op.productSnapshot.images)) {
            orderObj.orderProducts[i].productSnapshot.images = convertArrayToProxyUrls(op.productSnapshot.images, baseUrl);
          }
        }
      }
      
      return orderObj;
    });

    res.json({
      success: true,
      data: {
        orders: ordersWithProxyUrls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get order product variants for a specific order
export const getOrderProductVariants = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order product variants with populated data
    const orderProductVariants = await OrderProductVariant.find({ order: orderId })
      .populate({
        path: 'orderProduct',
        select: 'product quantity unitPrice totalPrice',
        populate: {
          path: 'product',
          select: 'name images sku',
          populate: {
            path: 'brand category',
            select: 'name'
          }
        }
      })
      .populate({
        path: 'productVariant',
        select: 'value priceAdjustment isActive',
        populate: {
          path: 'variation',
          select: 'name type'
        }
      })
      .populate({
        path: 'variation',
        select: 'name type'
      });

    res.status(200).json({
      success: true,
      message: 'Order product variants retrieved successfully',
      data: {
        orderId,
        variants: orderProductVariants
      }
    });

  } catch (error) {
    console.error('Get order product variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order product variants',
      error: error.message
    });
  }
};
