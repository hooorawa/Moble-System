import ProductVariant from '../models/productVariantModel.js';
import Product from '../models/productModel.js';
import Variation from '../models/variationModel.js';

// Get all product variants for a specific product
const getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const productVariants = await ProductVariant.find({ product: productId })
      .populate('variation', 'name')
      .populate('product', 'name')
      .sort({ variation: 1, value: 1 });

    res.status(200).json({
      success: true,
      count: productVariants.length,
      productVariants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product variants',
      error: error.message
    });
  }
};

// Get product variants grouped by variation
const getProductVariantsGrouped = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // First, get the product to check which variations are linked
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get all linked variations (even if they don't have values yet)
    const linkedVariations = await Variation.find({ 
      _id: { $in: product.variations } 
    }).sort({ name: 1 });
    
    // Get existing variant values for linked variations
    const productVariants = await ProductVariant.find({ 
      product: productId,
      variation: { $in: product.variations },
      isActive: true 
    })
      .populate('variation', 'name')
      .sort({ variation: 1, value: 1 });

    // Create a map of existing values by variation
    const valuesByVariation = productVariants.reduce((acc, variant) => {
      const variationId = variant.variation._id.toString();
      if (!acc[variationId]) {
        acc[variationId] = [];
      }
      acc[variationId].push({
        id: variant._id,
        value: variant.value,
        priceAdjustment: variant.priceAdjustment
      });
      return acc;
    }, {});

    // Build grouped variants - show ALL linked variations, even if no values
    const groupedVariants = linkedVariations.map(variation => ({
      variationId: variation._id,
      variationName: variation.name,
      values: valuesByVariation[variation._id.toString()] || []
    }));

    res.status(200).json({
      success: true,
      count: productVariants.length,
      variants: groupedVariants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grouped product variants',
      error: error.message
    });
  }
};

// Create new product variant
const createProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variationId, value, priceAdjustment = 0 } = req.body;

    if (!variationId || !value) {
      return res.status(400).json({
        success: false,
        message: 'Variation and value are required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if variation exists and is linked to this product
    const variation = await Variation.findById(variationId);
    if (!variation) {
      return res.status(404).json({
        success: false,
        message: 'Variation not found'
      });
    }

    // Check if variation is linked to this product
    if (!product.variations.includes(variationId)) {
      return res.status(400).json({
        success: false,
        message: 'This variation is not linked to this product'
      });
    }

    // Check if this combination already exists
    const existingVariant = await ProductVariant.findOne({
      product: productId,
      variation: variationId,
      value: value.trim()
    });

    if (existingVariant) {
      return res.status(400).json({
        success: false,
        message: 'This variant value already exists for this product'
      });
    }

    const productVariant = new ProductVariant({
      product: productId,
      variation: variationId,
      value: value.trim(),
      priceAdjustment: parseFloat(priceAdjustment) || 0
    });

    await productVariant.save();
    await productVariant.populate('variation', 'name');
    await productVariant.populate('product', 'name');

    res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      productVariant
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This variant value already exists for this product'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating product variant',
      error: error.message
    });
  }
};

// Update product variant
const updateProductVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { value, priceAdjustment, isActive } = req.body;

    const productVariant = await ProductVariant.findById(variantId);
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Check if new value conflicts with existing variants
    if (value && value.trim() !== productVariant.value) {
      const existingVariant = await ProductVariant.findOne({
        product: productVariant.product,
        variation: productVariant.variation,
        value: value.trim(),
        _id: { $ne: variantId }
      });

      if (existingVariant) {
        return res.status(400).json({
          success: false,
          message: 'This variant value already exists for this product'
        });
      }
    }

    if (value) productVariant.value = value.trim();
    if (priceAdjustment !== undefined) productVariant.priceAdjustment = parseFloat(priceAdjustment) || 0;
    if (isActive !== undefined) productVariant.isActive = isActive;

    await productVariant.save();
    await productVariant.populate('variation', 'name');
    await productVariant.populate('product', 'name');

    res.status(200).json({
      success: true,
      message: 'Product variant updated successfully',
      productVariant
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This variant value already exists for this product'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating product variant',
      error: error.message
    });
  }
};

// Delete product variant
const deleteProductVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    const productVariant = await ProductVariant.findById(variantId);
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    await ProductVariant.findByIdAndDelete(variantId);

    res.status(200).json({
      success: true,
      message: 'Product variant deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product variant',
      error: error.message
    });
  }
};

// Get all available variations for a product (variations that can be added)
const getAvailableVariationsForProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get the product to find linked variations
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get variations linked to this product from the variations array
    const linkedVariations = await Variation.find({ 
      _id: { $in: product.variations } 
    }).sort({ name: 1 });
    
    // Get variations that already have values added to this product
    const existingVariations = await ProductVariant.find({ product: productId })
      .distinct('variation');
    
    // Filter to show only linked variations that don't have values yet
    const availableVariations = linkedVariations.filter(
      variation => !existingVariations.some(existing => existing.toString() === variation._id.toString())
    );

    res.status(200).json({
      success: true,
      count: availableVariations.length,
      variations: availableVariations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available variations',
      error: error.message
    });
  }
};

// Get variations linked to a product (for display purposes)
const getProductLinkedVariations = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get the product to find linked variations
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get variations linked to this product from the variations array
    const linkedVariations = await Variation.find({ 
      _id: { $in: product.variations } 
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: linkedVariations.length,
      variations: linkedVariations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product linked variations',
      error: error.message
    });
  }
};

export {
  getProductVariants,
  getProductVariantsGrouped,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getAvailableVariationsForProduct,
  getProductLinkedVariations
};
