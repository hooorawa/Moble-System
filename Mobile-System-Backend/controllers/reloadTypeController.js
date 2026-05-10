import ReloadType from '../models/reloadTypeModel.js';

// Get all active reload types
export const getReloadTypes = async (req, res) => {
  try {
    const reloadTypes = await ReloadType.find({ isActive: true }).sort({ typeName: 1 });
    res.json({
      success: true,
      data: reloadTypes,
      message: 'Reload types fetched successfully'
    });
  } catch (error) {
    console.error('Get reload types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reload types',
      error: error.message
    });
  }
};

// Create new reload type
export const createReloadType = async (req, res) => {
  try {
    const { typeName, description } = req.body;

    if (!typeName || !typeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reload type name is required'
      });
    }

    // Check if type already exists
    const existingType = await ReloadType.findOne({ typeName: typeName.trim() });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Reload type already exists'
      });
    }

    const newReloadType = new ReloadType({
      typeName: typeName.trim(),
      description: description ? description.trim() : ''
    });

    await newReloadType.save();
    res.status(201).json({
      success: true,
      data: newReloadType,
      message: 'Reload type created successfully'
    });
  } catch (error) {
    console.error('Create reload type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reload type',
      error: error.message
    });
  }
};

// Update reload type
export const updateReloadType = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeName, description, isActive } = req.body;

    if (!typeName || !typeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reload type name is required'
      });
    }

    const reloadType = await ReloadType.findById(id);
    if (!reloadType) {
      return res.status(404).json({
        success: false,
        message: 'Reload type not found'
      });
    }

    // Check if new name already exists (if changed)
    if (typeName.trim() !== reloadType.typeName) {
      const existingType = await ReloadType.findOne({ typeName: typeName.trim() });
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Reload type name already exists'
        });
      }
    }

    reloadType.typeName = typeName.trim();
    reloadType.description = description ? description.trim() : '';
    if (isActive !== undefined) {
      reloadType.isActive = isActive;
    }

    await reloadType.save();
    res.json({
      success: true,
      data: reloadType,
      message: 'Reload type updated successfully'
    });
  } catch (error) {
    console.error('Update reload type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reload type',
      error: error.message
    });
  }
};

// Delete reload type
export const deleteReloadType = async (req, res) => {
  try {
    const { id } = req.params;

    const reloadType = await ReloadType.findByIdAndDelete(id);
    if (!reloadType) {
      return res.status(404).json({
        success: false,
        message: 'Reload type not found'
      });
    }

    res.json({
      success: true,
      message: 'Reload type deleted successfully'
    });
  } catch (error) {
    console.error('Delete reload type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reload type',
      error: error.message
    });
  }
};
