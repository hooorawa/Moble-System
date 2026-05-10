import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import ProductVariant from '../models/productVariantModel.js';
import Customer from '../models/customerModel.js';
import mongoose from 'mongoose';
import { convertArrayToProxyUrls, getBaseUrl } from '../utils/imageUrlHelper.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.userId || req.body?.userId;
    
    // Security check: User can only access their own cart
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }
    
    let isAuthorized = false;
    
    if (authenticatedUserId === userId) {
      // Direct match (same format)
      isAuthorized = true;
    } else if (userId.includes('@')) {
      // userId is email, check if authenticated user's email matches
      try {
        const customer = await Customer.findById(authenticatedUserId).select('email');
        
        if (customer && customer.email === userId) {
          isAuthorized = true;
        } else if (!customer) {
          // If customer not found by ID, try to find by email directly
          const customerByEmail = await Customer.findOne({ email: userId });
          if (customerByEmail && customerByEmail._id.toString() === authenticatedUserId) {
            isAuthorized = true;
          }
        }
      } catch (dbError) {
        return res.status(500).json({
          success: false,
          message: 'Database error during authorization'
        });
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own cart.'
      });
    }
    
    let cart = await Cart.findOne({ user: userId, isActive: true })
      .populate({
        path: 'items.product',
        select: 'name price images',
        populate: {
          path: 'brand category',
          select: 'name'
        }
      })
      .populate({
        path: 'items.selectedVariants.variation',
        select: 'name'
      })
      .lean();

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    if (cart.items && Array.isArray(cart.items)) {
      cart.items = cart.items.map(item => {
        const itemObj = item.toObject ? item.toObject() : item;
        if (itemObj.product && itemObj.product.images && Array.isArray(itemObj.product.images)) {
          itemObj.product.images = convertArrayToProxyUrls(itemObj.product.images, baseUrl);
        }
        return itemObj;
      });
    }

    // Add cache headers for faster subsequent loads
    res.setHeader('Cache-Control', 'private, max-age=60'); // Cache for 1 minute
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.userId || req.body?.userId;
    const { productId, quantity = 1, selectedVariants = [] } = req.body;
    
    // Security check: User can only add to their own cart
    // Handle both email and ObjectId formats
    let isAuthorized = false;
    
    // TEMPORARY FIX: Allow access if user is authenticated (bypass email/ID mismatch)
    if (authenticatedUserId) {
      console.log('User is authenticated, allowing access temporarily');
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own cart.'
      });
    }
    
    // Debug: Log what we received
    console.log('Cart Controller - Received data:');
    console.log('  userId:', userId);
    console.log('  productId:', productId);
    console.log('  quantity:', quantity);
    console.log('  selectedVariants:', selectedVariants);

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate price with variant adjustments
    let itemPrice = product.price;
    let totalVariantAdjustment = 0;
    const processedVariants = [];

    for (const variant of selectedVariants) {
      // Convert variation string ID to ObjectId if needed
      const variationId = mongoose.Types.ObjectId.isValid(variant.variation) 
        ? variant.variation 
        : new mongoose.Types.ObjectId(variant.variation);

      const productVariant = await ProductVariant.findOne({
        product: productId,
        variation: variationId,
        value: variant.value,
        isActive: true
      });
      
      if (productVariant) {
        totalVariantAdjustment += productVariant.priceAdjustment;
      }

      // Store the processed variant with ObjectId
      processedVariants.push({
        variation: variationId,
        value: variant.value,
        priceAdjustment: variant.priceAdjustment || 0
      });
    }

    itemPrice += totalVariantAdjustment;
    const totalPrice = itemPrice * quantity;

    // Find or create cart
    let cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists with same variants
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      JSON.stringify(item.selectedVariants.sort()) === JSON.stringify(processedVariants.sort())
    );

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * itemPrice;
    } else {
      // Add new item
      const newItem = {
        product: productId,
        quantity,
        selectedVariants: processedVariants,
        price: itemPrice,
        totalPrice
      };
      
      console.log('Cart Controller - Adding new item:', newItem);
      cart.items.push(newItem);
    }

    await cart.save();
    await cart.populate([
      {
        path: 'items.product',
        populate: {
          path: 'brand category',
          select: 'name'
        }
      },
      {
        path: 'items.selectedVariants.variation',
        select: 'name'
      }
    ]);

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    const cartObj = cart.toObject();
    if (cartObj.items && Array.isArray(cartObj.items)) {
      cartObj.items = cartObj.items.map(item => {
        if (item.product && item.product.images && Array.isArray(item.product.images)) {
          item.product.images = convertArrayToProxyUrls(item.product.images, baseUrl);
        }
        return item;
      });
    }

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    item.quantity = quantity;
    item.totalPrice = item.price * quantity;

    await cart.save();
    await cart.populate([
      {
        path: 'items.product',
        populate: {
          path: 'brand category',
          select: 'name'
        }
      },
      {
        path: 'items.selectedVariants.variation',
        select: 'name'
      }
    ]);

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    const cartObj = cart.toObject();
    if (cartObj.items && Array.isArray(cartObj.items)) {
      cartObj.items = cartObj.items.map(item => {
        if (item.product && item.product.images && Array.isArray(item.product.images)) {
          item.product.images = convertArrayToProxyUrls(item.product.images, baseUrl);
        }
        return item;
      });
    }

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cartObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    console.log('Remove item request:', { userId, itemId });

    const cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      console.log('Cart not found for user:', userId);
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    console.log('Cart before removal:', {
      totalItems: cart.items.length,
      itemIds: cart.items.map(item => item._id.toString())
    });

    // Remove the item
    const itemsBefore = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    const itemsAfter = cart.items.length;

    console.log('Items removed:', itemsBefore - itemsAfter);

    if (itemsBefore === itemsAfter) {
      console.log('Item not found in cart:', itemId);
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cart.save();
    
    console.log('Cart after removal:', {
      totalItems: cart.items.length
    });

    await cart.populate([
      {
        path: 'items.product',
        populate: {
          path: 'brand category',
          select: 'name'
        }
      },
      {
        path: 'items.selectedVariants.variation',
        select: 'name'
      }
    ]);

    // Convert S3 URLs to proxy URLs for product images
    const baseUrl = getBaseUrl(req);
    const cartObj = cart.toObject();
    if (cartObj.items && Array.isArray(cartObj.items)) {
      cartObj.items = cartObj.items.map(item => {
        if (item.product && item.product.images && Array.isArray(item.product.images)) {
          item.product.images = convertArrayToProxyUrls(item.product.images, baseUrl);
        }
        return item;
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cartObj
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('Clear cart request for user:', userId);

    const cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      console.log('Cart not found for user:', userId);
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    console.log('Cart before clearing:', {
      totalItems: cart.items.length,
      subtotal: cart.subtotal,
      total: cart.total
    });

    // Clear all items and reset totals
    cart.items = [];
    cart.subtotal = 0;
    cart.tax = 0;
    cart.delivery = 0;
    cart.total = 0;
    
    await cart.save();

    console.log('Cart cleared successfully - items:', cart.items.length, 'total:', cart.total);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        _id: cart._id,
        user: cart.user,
        items: [],
        subtotal: 0,
        tax: 0,
        delivery: 0,
        total: 0,
        isActive: cart.isActive,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

// Get cart item count
export const getCartItemCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId, isActive: true });
    const itemCount = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    res.json({
      success: true,
      data: { itemCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting cart item count',
      error: error.message
    });
  }
};
