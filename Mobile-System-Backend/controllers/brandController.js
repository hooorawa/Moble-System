import brandModel from "../models/brandModel.js";
import categoryModel from "../models/categoryModel.js";
import brandCategoryModel from "../models/brandCategoryModel.js";
import { s3Config, deleteFromS3 } from "../config/awsConfig.js";

// Add brand
export const addBrand = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Brand name is required" });
    }

    // Check if brand already exists (case-insensitive)
    const existingBrand = await brandModel.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingBrand) {
      return res.status(400).json({ 
        success: false, 
        message: "Brand already added" 
      });
    }

    // Handle logo upload
    let logoUrl = '';
    if (req.file) {
      logoUrl = req.file.location || `${s3Config.bucketUrl}/${req.file.key}`;
    } else {
      return res.json({ success: false, message: "Brand logo is required" });
    }

    const newBrand = new brandModel({
      name: name.trim(),
      logo: logoUrl
    });

    const savedBrand = await newBrand.save();
    console.log("Added brand:", savedBrand);

    res.json({ success: true, message: "Brand added successfully", brand: savedBrand });
  } catch (error) {
    console.error("Add brand error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get all brands
export const getBrands = async (req, res) => {
  try {
    const brands = await brandModel.find({});
    console.log("Found brands:", brands);
    
    res.json({ success: true, brands });
  } catch (error) {
    console.error("Get brands error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Brand name is required" });
    }

    // Check if brand exists
    const brand = await brandModel.findById(brandId);
    if (!brand) {
      return res.json({ success: false, message: "Brand not found" });
    }

    // Check if new name already exists (case-insensitive, excluding current brand)
    const existingBrand = await brandModel.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: brandId }
    });
    
    if (existingBrand) {
      return res.status(400).json({ 
        success: false, 
        message: "Brand name already exists" 
      });
    }

    // Prepare update data
    const updateData = { name: name.trim() };
    
    // Handle logo upload if provided
    if (req.file) {
      // Delete old logo if it's from S3
      if (brand.logo && brand.logo.includes('raxwo-mobile-system.s3.eu-north-1.amazonaws.com')) {
        const oldKey = brand.logo.split('raxwo-mobile-system.s3.eu-north-1.amazonaws.com/')[1];
        if (oldKey) {
          await deleteFromS3(oldKey);
        }
      }
      
      updateData.logo = req.file.location || `${s3Config.bucketUrl}/${req.file.key}`;
    }

    // Update brand
    const updatedBrand = await brandModel.findByIdAndUpdate(
      brandId,
      updateData,
      { new: true }
    );

    console.log("Updated brand:", updatedBrand);
    res.json({ success: true, message: "Brand updated successfully", brand: updatedBrand });
  } catch (error) {
    console.error("Update brand error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Delete brand
export const deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    
    console.log("Delete brand request:", brandId);

    // Get brand first to handle logo deletion
    const brand = await brandModel.findById(brandId);
    if (!brand) {
      return res.json({ success: false, message: "Brand not found" });
    }

    // Delete logo from S3 if it exists
    if (brand.logo && brand.logo.includes('raxwo-mobile-system.s3.eu-north-1.amazonaws.com')) {
      const logoKey = brand.logo.split('raxwo-mobile-system.s3.eu-north-1.amazonaws.com/')[1];
      if (logoKey) {
        await deleteFromS3(logoKey);
      }
    }

    // Delete all brand-category relationships first
    await brandCategoryModel.deleteMany({ brand: brandId });

    const deletedBrand = await brandModel.findByIdAndDelete(brandId);

    console.log("Deleted brand:", deletedBrand);
    res.json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Delete brand error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Add category to brand
export const addCategoryToBrand = async (req, res) => {
  try {
    const { brandId, categoryId } = req.body;

    if (!brandId || !categoryId) {
      return res.json({ success: false, message: "Brand ID and Category ID are required" });
    }

    // Check if brand exists
    const brand = await brandModel.findById(brandId);
    if (!brand) {
      return res.json({ success: false, message: "Brand not found" });
    }

    // Check if category exists
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    // Check if relationship already exists
    const existingRelation = await brandCategoryModel.findOne({ brand: brandId, category: categoryId });
    if (existingRelation) {
      return res.json({ success: false, message: "Category already added to this brand" });
    }

    // Create new brand-category relationship
    const brandCategory = new brandCategoryModel({
      brand: brandId,
      category: categoryId
    });

    await brandCategory.save();

    // Get updated brand with categories
    const brandCategories = await brandCategoryModel.find({ brand: brandId }).populate('category', 'name');
    const updatedBrand = {
      ...brand.toObject(),
      categories: brandCategories.map(bc => bc.category)
    };

    console.log("Added category to brand:", updatedBrand);
    res.json({ success: true, message: "Category added to brand successfully", brand: updatedBrand });
  } catch (error) {
    console.error("Add category to brand error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Remove category from brand
export const removeCategoryFromBrand = async (req, res) => {
  try {
    const { brandId, categoryId } = req.body;

    if (!brandId || !categoryId) {
      return res.json({ success: false, message: "Brand ID and Category ID are required" });
    }

    // Remove brand-category relationship
    const deletedRelation = await brandCategoryModel.findOneAndDelete({ brand: brandId, category: categoryId });

    if (!deletedRelation) {
      return res.json({ success: false, message: "Category not found in this brand" });
    }

    // Get updated brand with categories
    const brand = await brandModel.findById(brandId);
    const brandCategories = await brandCategoryModel.find({ brand: brandId }).populate('category', 'name');
    const updatedBrand = {
      ...brand.toObject(),
      categories: brandCategories.map(bc => bc.category)
    };

    console.log("Removed category from brand:", updatedBrand);
    res.json({ success: true, message: "Category removed from brand successfully", brand: updatedBrand });
  } catch (error) {
    console.error("Remove category from brand error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get brand categories
export const getBrandCategories = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.json({ success: false, message: "Brand ID is required" });
    }

    // Get brand with categories
    const brand = await brandModel.findById(brandId);
    if (!brand) {
      return res.json({ success: false, message: "Brand not found" });
    }

    const brandCategories = await brandCategoryModel.find({ brand: brandId }).populate('category', 'name');
    const brandWithCategories = {
      ...brand.toObject(),
      categories: brandCategories.map(bc => bc.category)
    };

    console.log("Found brand categories:", brandWithCategories);
    res.json({ success: true, brand: brandWithCategories });
  } catch (error) {
    console.error("Get brand categories error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get brands by category
export const getBrandsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    console.log("Get brands by category request:", categoryId);

    // Find all brand-category relationships for this category
    const brandCategories = await brandCategoryModel.find({ category: categoryId })
      .populate('brand', 'name logo')
      .populate('category', 'name');

    const brands = brandCategories.map(bc => bc.brand).filter(brand => brand);

    console.log("Found brands for category:", brands);
    res.json({ success: true, brands });
  } catch (error) {
    console.error("Get brands by category error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

