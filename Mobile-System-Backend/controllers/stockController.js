import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Brand from '../models/brandModel.js';

// Get all stock items
const getAllStockItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, brand, lowStock, outOfStock } = req.query;
    const query = { isActive: true };

    // Calculate stock statistics with robust query
    const totalItems = await Product.countDocuments({ 
      $or: [{ isActive: true }, { isActive: { $exists: false } }] 
    });
    const outOfStockItems = await Product.countDocuments({ 
      $and: [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { quantity: 0 }
      ]
    });
    const inStockItems = await Product.countDocuments({ 
      $and: [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { quantity: { $gt: 0 } }
      ]
    });
    const lowStockItems = await Product.countDocuments({ 
      $and: [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { quantity: { $lte: 10, $gt: 0 } }
      ]
    });

    // Add search functionality across product name, category name, and brand name
    if (search) {
      // Create search regex for case-insensitive search
      const searchRegex = new RegExp(search, 'i');
      
      // First, get all products with populated category and brand
      const allProducts = await Product.find({ isActive: true })
        .populate('category', 'name')
        .populate('brand', 'name logo');

      // Filter products based on search term
      const filteredProducts = allProducts.filter(product => {
        const productName = product.name || '';
        const categoryName = product.category?.name || '';
        const brandName = product.brand?.name || '';
        
        return searchRegex.test(productName) || 
               searchRegex.test(categoryName) || 
               searchRegex.test(brandName);
      });

      // Apply additional filters
      let finalProducts = filteredProducts;
      
      if (category) {
        finalProducts = finalProducts.filter(p => p.category?._id.toString() === category);
      }
      if (brand) {
        finalProducts = finalProducts.filter(p => p.brand?._id.toString() === brand);
      }
      if (lowStock === 'true') {
        finalProducts = finalProducts.filter(p => p.quantity <= 10 && p.quantity > 0);
      }
      if (outOfStock === 'true') {
        finalProducts = finalProducts.filter(p => p.quantity === 0);
      }

      // Sort and paginate
      finalProducts.sort((a, b) => {
        if (a.quantity !== b.quantity) {
          return a.quantity - b.quantity; // Sort by quantity (lowest first)
        }
        return a.name.localeCompare(b.name); // Then by name
      });

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = finalProducts.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        count: paginatedProducts.length,
        total: finalProducts.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(finalProducts.length / limit),
        statistics: {
          totalItems,
          lowStockItems,
          outOfStockItems,
          inStockItems
        },
        products: paginatedProducts.map(product => ({
          _id: product._id,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          category: product.category,
          brand: product.brand,
          stockStatus: getStockStatus(product.quantity),
          lastUpdated: product.updatedAt
        }))
      });
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add brand filter
    if (brand) {
      query.brand = brand;
    }

    // Add low stock filter (items with quantity <= 10)
    if (lowStock === 'true') {
      query.quantity = { $lte: 10 };
    }

    // Add out of stock filter (items with quantity = 0)
    if (outOfStock === 'true') {
      query.quantity = 0;
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .sort({ quantity: 1, name: 1 }) // Sort by quantity (lowest first), then by name
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      statistics: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        inStockItems
      },
      products: products.map(product => ({
        _id: product._id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        category: product.category,
        brand: product.brand,
        stockStatus: getStockStatus(product.quantity),
        lastUpdated: product.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock items',
      error: error.message
    });
  }
};

// Get stock item by ID
const getStockItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('brand', 'name logo');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      stockItem: {
        _id: product._id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        category: product.category,
        brand: product.brand,
        stockStatus: getStockStatus(product.quantity),
        lastUpdated: product.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock item',
      error: error.message
    });
  }
};

// Update stock quantity
const updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = product.quantity + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = product.quantity - parseInt(quantity);
        if (newQuantity < 0) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock quantity'
          });
        }
        break;
      case 'set':
      default:
        newQuantity = parseInt(quantity);
        break;
    }

    product.quantity = newQuantity;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Stock quantity updated successfully',
      stockItem: {
        _id: product._id,
        name: product.name,
        quantity: product.quantity,
        stockStatus: getStockStatus(product.quantity)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating stock quantity',
      error: error.message
    });
  }
};

// Bulk update stock quantities
const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, quantity, operation }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { productId, quantity, operation = 'set' } = update;

        const product = await Product.findById(productId);
        if (!product) {
          errors.push({
            productId,
            error: 'Product not found'
          });
          continue;
        }

        let newQuantity;
        switch (operation) {
          case 'add':
            newQuantity = product.quantity + parseInt(quantity);
            break;
          case 'subtract':
            newQuantity = product.quantity - parseInt(quantity);
            if (newQuantity < 0) {
              errors.push({
                productId,
                error: 'Insufficient stock quantity'
              });
              continue;
            }
            break;
          case 'set':
          default:
            newQuantity = parseInt(quantity);
            break;
        }

        product.quantity = newQuantity;
        await product.save();

        results.push({
          productId,
          name: product.name,
          newQuantity,
          stockStatus: getStockStatus(newQuantity)
        });
      } catch (error) {
        errors.push({
          productId: update.productId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${results.length} items successfully`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk updating stock',
      error: error.message
    });
  }
};

// Get stock statistics
const getStockStatistics = async (req, res) => {
  try {
    // Debug: Check all products first
    const allProducts = await Product.find({}).select('name quantity isActive');
    
    // Use more robust query - check for isActive field existence and value
    const totalItems = await Product.countDocuments({ 
      $or: [{ isActive: true }, { isActive: { $exists: false } }] 
    });
    const outOfStockItems = await Product.countDocuments({ 
      $and: [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { quantity: 0 }
      ]
    });
    const inStockItems = await Product.countDocuments({ 
      $and: [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { quantity: { $gt: 0 } }
      ]
    });
    const lowStockItems = await Product.countDocuments({ 
      $and: [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { quantity: { $lte: 10, $gt: 0 } }
      ]
    });
    

    // Get total inventory value and total quantity
    const inventoryValue = await Product.aggregate([
      { $match: { $or: [{ isActive: true }, { isActive: { $exists: false } }] } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Get category-wise stock
    const categoryStock = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          itemCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $project: {
          categoryName: '$categoryInfo.name',
          totalQuantity: 1,
          totalValue: 1,
          itemCount: 1
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        inStockItems,
        totalInventoryValue: inventoryValue[0]?.totalValue || 0,
        totalQuantity: inventoryValue[0]?.totalQuantity || 0,
        categoryStock
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock statistics',
      error: error.message
    });
  }
};

// Helper function to determine stock status
const getStockStatus = (quantity) => {
  if (quantity === 0) {
    return 'out_of_stock';
  } else if (quantity <= 10) {
    return 'low_stock';
  } else {
    return 'in_stock';
  }
};

export {
  getAllStockItems,
  getStockItemById,
  updateStockQuantity,
  bulkUpdateStock,
  getStockStatistics
};
