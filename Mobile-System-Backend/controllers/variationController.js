import Variation from '../models/variationModel.js';

// Get all variations
const getAllVariations = async (req, res) => {
  try {
    const variations = await Variation.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: variations.length,
      variations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching variations',
      error: error.message
    });
  }
};

// Get variation by ID
const getVariationById = async (req, res) => {
  try {
    const { id } = req.params;
    const variation = await Variation.findById(id);
    
    if (!variation) {
      return res.status(404).json({
        success: false,
        message: 'Variation not found'
      });
    }

    res.status(200).json({
      success: true,
      variation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching variation',
      error: error.message
    });
  }
};

// Create new variation
const createVariation = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if variation already exists
    const existingVariation = await Variation.findOne({ name });
    if (existingVariation) {
      return res.status(400).json({
        success: false,
        message: 'Variation with this name already exists'
      });
    }

    const variation = new Variation({ name });
    await variation.save();

    res.status(201).json({
      success: true,
      message: 'Variation created successfully',
      variation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating variation',
      error: error.message
    });
  }
};

// Update variation
const updateVariation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if variation exists
    const variation = await Variation.findById(id);
    if (!variation) {
      return res.status(404).json({
        success: false,
        message: 'Variation not found'
      });
    }

    // Check if new name already exists (excluding current variation)
    const existingVariation = await Variation.findOne({ 
      name, 
      _id: { $ne: id } 
    });
    if (existingVariation) {
      return res.status(400).json({
        success: false,
        message: 'Variation with this name already exists'
      });
    }

    variation.name = name;
    await variation.save();

    res.status(200).json({
      success: true,
      message: 'Variation updated successfully',
      variation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating variation',
      error: error.message
    });
  }
};

// Delete variation
const deleteVariation = async (req, res) => {
  try {
    const { id } = req.params;

    const variation = await Variation.findById(id);
    if (!variation) {
      return res.status(404).json({
        success: false,
        message: 'Variation not found'
      });
    }

    await Variation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Variation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting variation',
      error: error.message
    });
  }
};

export {
  getAllVariations,
  getVariationById,
  createVariation,
  updateVariation,
  deleteVariation
};
