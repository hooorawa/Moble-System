import mongoose from "mongoose";

const brandCategorySchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  }
}, { 
  timestamps: true 
});

// Create compound index to ensure unique brand-category pairs
brandCategorySchema.index({ brand: 1, category: 1 }, { unique: true });

const brandCategoryModel = mongoose.models.BrandCategory || mongoose.model("BrandCategory", brandCategorySchema);
export default brandCategoryModel;
