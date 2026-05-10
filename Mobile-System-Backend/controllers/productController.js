import Product from '../models/productModel.js';
import Variation from '../models/variationModel.js';
import Category from '../models/categoryModel.js';
import Brand from '../models/brandModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { s3Config, deleteFromS3 } from '../config/awsConfig.js';
import { uploadProductS3 } from '../config/s3MulterConfig.js';
import { convertArrayToProxyUrls, getBaseUrl } from '../utils/imageUrlHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/products';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for handling multiple image uploads
const uploadMultipleImages = upload.array('images', 10); // Allow up to 10 images

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, minPrice, maxPrice, variation } = req.query;
    const query = { isActive: true };

    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Add variation filter
    if (variation) {
      query.variations = variation;
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .populate('variations', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    // Convert S3 URLs to proxy URLs for all products
    const baseUrl = getBaseUrl(req);
    const productsWithProxyUrls = products.map(product => {
      const productObj = product.toObject();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = convertArrayToProxyUrls(productObj.images, baseUrl);
      }
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      products: productsWithProxyUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .populate('variations', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Convert S3 URLs to proxy URLs
    const baseUrl = getBaseUrl(req);
    const productObj = product.toObject();
    if (productObj.images && Array.isArray(productObj.images)) {
      productObj.images = convertArrayToProxyUrls(productObj.images, baseUrl);
    }

    res.status(200).json({
      success: true,
      product: productObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('req.files:', req.files);
    console.log('req.files type:', typeof req.files);
    console.log('req.files length:', req.files?.length);
    
    if (req.files && req.files.length > 0) {
      console.log('First file keys:', Object.keys(req.files[0]));
      console.log('First file:', JSON.stringify(req.files[0], null, 2));
    }

    const { name, description, price, quantity, variations, category, brand, specifications, warranty, emiNumber } = req.body;

    console.log('Received product data:', { name, description, price, filesCount: req.files?.length, variationsCount: variations?.length, category, brand });

    if (!name || !description || !price || quantity === undefined || !category || !brand) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, quantity, category, and brand are required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Validate brand exists
    const brandExists = await Brand.findById(brand);
    if (!brandExists) {
      return res.status(400).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Validate variations if provided
    let variationIds = [];
    if (variations) {
      try {
        const parsedVariations = JSON.parse(variations);
        if (Array.isArray(parsedVariations) && parsedVariations.length > 0) {
          // Check if all variations exist
          const existingVariations = await Variation.find({ _id: { $in: parsedVariations } });
          if (existingVariations.length !== parsedVariations.length) {
            return res.status(400).json({
              success: false,
              message: 'One or more variations not found'
            });
          }
          variationIds = parsedVariations;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid variations format'
        });
      }
    }

    // Parse specifications if provided
    let parsedSpecifications = [];
    if (specifications) {
      try {
        parsedSpecifications = JSON.parse(specifications);
      } catch (error) {
        console.log('Invalid specifications format, using empty array');
        parsedSpecifications = [];
      }
    }

    // Get S3 URLs from uploaded files
    const imageUrls = req.files.map(file => {
      console.log('Received file from multer-s3:');
      console.log('- location:', file.location);
      console.log('- key:', file.key);
      console.log('- bucket:', file.bucket);
      console.log('- mimetype:', file.mimetype);
      
      // multer-s3 provides file.location which is the full URL
      const url = file.location;
      
      if (!url) {
        console.error('No location found in file object, file:', file);
        throw new Error('Failed to upload image to S3');
      }
      
      console.log('Generated image URL:', url);
      return url;
    });

    const parsedPrice = parseFloat(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number'
      });
    }

    const product = new Product({
      name,
      description,
      price: parsedPrice,
      quantity: parseInt(quantity),
      images: imageUrls, // Store S3 URLs
      category,
      brand,
      variations: variationIds,
      specifications: parsedSpecifications,
      warranty: warranty || '',
      emiNumber: emiNumber || ''
    });

    await product.save();
    await product.populate('category', 'name');
    await product.populate('brand', 'name logo');
    await product.populate('variations', 'name');

    console.log('Product created with images:', product.images);

    // Convert S3 URLs to proxy URLs before sending response
    const baseUrl = getBaseUrl(req);
    const productObj = product.toObject();
    if (productObj.images && Array.isArray(productObj.images)) {
      console.log('Converting image URLs to proxy URLs...');
      console.log('Original URLs:', productObj.images);
      productObj.images = convertArrayToProxyUrls(productObj.images, baseUrl);
      console.log('Proxy URLs:', productObj.images);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: productObj
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantity, variations, category, brand, specifications, warranty, emiNumber } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update basic fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined && price !== null) {
      const parsedPrice = parseFloat(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a non-negative number'
        });
      }
      product.price = parsedPrice;
    }
    if (quantity !== undefined && quantity !== null) {
      product.quantity = parseInt(quantity);
    }
    if (specifications) {
      try {
        product.specifications = JSON.parse(specifications);
      } catch (error) {
        console.log('Invalid specifications format, keeping existing');
      }
    }
    if (warranty !== undefined) product.warranty = warranty;
    if (emiNumber !== undefined) product.emiNumber = emiNumber;

    // Update category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      product.category = category;
    }

    // Update brand if provided
    if (brand) {
      const brandExists = await Brand.findById(brand);
      if (!brandExists) {
        return res.status(400).json({
          success: false,
          message: 'Brand not found'
        });
      }
      product.brand = brand;
    }

    // Update images if new files are uploaded
    if (req.files && req.files.length > 0) {
      // Get S3 URLs from uploaded files
      const newImageUrls = req.files.map(file => {
        console.log('Update - Received file from multer-s3:');
        console.log('- location:', file.location);
        console.log('- key:', file.key);
        
        const url = file.location;
        
        if (!url) {
          console.error('Update - No location found in file object');
          throw new Error('Failed to upload image to S3');
        }
        
        console.log('Update - Generated image URL:', url);
        return url;
      });
      product.images = newImageUrls;
    }

    // Handle variations if provided
    if (variations) {
      try {
        const parsedVariations = JSON.parse(variations);
        if (Array.isArray(parsedVariations)) {
          // Check if all variations exist
          const existingVariations = await Variation.find({ _id: { $in: parsedVariations } });
          if (existingVariations.length !== parsedVariations.length) {
            return res.status(400).json({
              success: false,
              message: 'One or more variations not found'
            });
          }

          // Update product variations array
          product.variations = parsedVariations;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid variations format'
        });
      }
    }

    await product.save();
    await product.populate('category', 'name');
    await product.populate('brand', 'name logo');
    await product.populate('variations', 'name');

    // Convert S3 URLs to proxy URLs before sending response
    const baseUrl = getBaseUrl(req);
    const productObj = product.toObject();
    if (productObj.images && Array.isArray(productObj.images)) {
      productObj.images = convertArrayToProxyUrls(productObj.images, baseUrl);
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: productObj
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Add images to product
const addProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    // Add new S3 images to existing ones
    const newImages = req.files.map(file => {
      console.log('Add images - Received file from multer-s3:');
      console.log('- location:', file.location);
      console.log('- key:', file.key);
      
      const url = file.location;
      
      if (!url) {
        console.error('Add images - No location found in file object');
        throw new Error('Failed to upload image to S3');
      }
      
      console.log('Add images - Generated image URL:', url);
      return url;
    });
    product.images = [...product.images, ...newImages];
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Images added successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding images',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete image files (both local and S3)
    for (const imagePath of product.images) {
      if (imagePath.includes(s3Config.bucketUrl)) {
        // S3 image - extract key and delete from S3
        const key = imagePath.split(`${s3Config.bucketUrl}/`)[1];
        if (key) {
          await deleteFromS3(key);
        }
      } else if (fs.existsSync(imagePath)) {
        // Local image - delete from filesystem
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Soft delete product (set isActive to false)
const softDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deactivating product',
      error: error.message
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({ 
      category: categoryId, 
      isActive: true 
    })
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .populate('variations', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ 
      category: categoryId, 
      isActive: true 
    });

    // Convert S3 URLs to proxy URLs
    const baseUrl = getBaseUrl(req);
    const productsWithProxyUrls = products.map(product => {
      const productObj = product.toObject();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = convertArrayToProxyUrls(productObj.images, baseUrl);
      }
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      products: productsWithProxyUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
};

// Get products by brand
const getProductsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({ 
      brand: brandId, 
      isActive: true 
    })
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .populate('variations', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ 
      brand: brandId, 
      isActive: true 
    });

    // Convert S3 URLs to proxy URLs
    const baseUrl = getBaseUrl(req);
    const productsWithProxyUrls = products.map(product => {
      const productObj = product.toObject();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = convertArrayToProxyUrls(productObj.images, baseUrl);
      }
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      products: productsWithProxyUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by brand',
      error: error.message
    });
  }
};

// Get products by category and brand
const getProductsByCategoryAndBrand = async (req, res) => {
  try {
    const { categoryId, brandId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({ 
      category: categoryId,
      brand: brandId, 
      isActive: true 
    })
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .populate('variations', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ 
      category: categoryId,
      brand: brandId, 
      isActive: true 
    });

    // Convert S3 URLs to proxy URLs
    const baseUrl = getBaseUrl(req);
    const productsWithProxyUrls = products.map(product => {
      const productObj = product.toObject();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = convertArrayToProxyUrls(productObj.images, baseUrl);
      }
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      products: productsWithProxyUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category and brand',
      error: error.message
    });
  }
};

// Test endpoint to check variation-product relationships
const testVariationProductRelations = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .populate('variations', 'name');
    const variations = await Variation.find();
    
    res.status(200).json({
      success: true,
      data: {
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          category: p.category ? { id: p.category._id, name: p.category.name } : null,
          brand: p.brand ? { id: p.brand._id, name: p.brand.name, logo: p.brand.logo } : null,
          variations: p.variations.map(v => ({ id: v._id, name: v.name }))
        })),
        variations: variations.map(v => ({
          id: v._id,
          name: v.name
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing relationships',
      error: error.message
    });
  }
};

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  addProductImages,
  deleteProduct,
  softDeleteProduct,
  uploadMultipleImages,
  getProductsByCategory,
  getProductsByBrand,
  getProductsByCategoryAndBrand,
  testVariationProductRelations
};
