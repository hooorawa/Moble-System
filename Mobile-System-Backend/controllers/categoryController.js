import categoryModel from "../models/categoryModel.js";
import brandModel from "../models/brandModel.js";
import brandCategoryModel from "../models/brandCategoryModel.js";

// Add category
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Category name is required" });
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await categoryModel.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: "This category already added" 
      });
    }

    const newCategory = new categoryModel({
      name: name.trim()
    });

    const savedCategory = await newCategory.save();
    console.log("Added category:", savedCategory);

    res.json({ success: true, message: "Category added successfully", category: savedCategory });
  } catch (error) {
    console.error("Add category error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({});
    console.log("Found categories:", categories);
    
    res.json({ success: true, categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Category name is required" });
    }

    // Check if category exists
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    // Check if new name already exists (case-insensitive, excluding current category)
    const existingCategory = await categoryModel.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: categoryId }
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: "This category name already exists" 
      });
    }

    // Update category
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      { name: name.trim() },
      { new: true }
    );

    console.log("Updated category:", updatedCategory);
    res.json({ success: true, message: "Category updated successfully", category: updatedCategory });
  } catch (error) {
    console.error("Update category error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    console.log("Delete category request:", categoryId);

    // Check if category exists
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    // Check if category is used by any brands through junction table
    const brandCategories = await brandCategoryModel.find({ category: categoryId }).populate('brand', 'name');
    
    if (brandCategories.length > 0) {
      const brandNames = brandCategories.map(bc => bc.brand.name).join(', ');
      return res.json({ 
        success: false, 
        message: `Can't delete, already added into brands: ${brandNames}` 
      });
    }

    // If not used by any brands, proceed with deletion
    const deletedCategory = await categoryModel.findByIdAndDelete(categoryId);

    console.log("Deleted category:", deletedCategory);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get category usage (which categories are used by brands)
export const getCategoryUsage = async (req, res) => {
  try {
    const brandCategories = await brandCategoryModel.find({})
      .populate('brand', 'name')
      .populate('category', 'name');

    const usage = {};
    brandCategories.forEach(bc => {
      if (!usage[bc.category._id]) {
        usage[bc.category._id] = [];
      }
      usage[bc.category._id].push(bc.brand.name);
    });

    console.log("Category usage:", usage);
    res.json({ success: true, usage });
  } catch (error) {
    console.error("Get category usage error:", error);
    res.json({ success: false, message: "Server error" });
  }
};
