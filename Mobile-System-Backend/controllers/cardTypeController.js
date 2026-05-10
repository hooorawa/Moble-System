import CardType from '../models/cardTypeModel.js';

// Get all active card types
export const getCardTypes = async (req, res) => {
  try {
    const cardTypes = await CardType.find({ isActive: true }).sort({ typeName: 1 });
    res.json({
      success: true,
      data: cardTypes,
      message: 'Card types fetched successfully'
    });
  } catch (error) {
    console.error('Get card types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch card types',
      error: error.message
    });
  }
};

// Create new card type
export const createCardType = async (req, res) => {
  try {
    const { typeName, description } = req.body;

    if (!typeName || !typeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Card type name is required'
      });
    }

    // Check if type already exists
    const existingType = await CardType.findOne({ typeName: typeName.trim() });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Card type already exists'
      });
    }

    const newCardType = new CardType({
      typeName: typeName.trim(),
      description: description ? description.trim() : ''
    });

    await newCardType.save();
    res.status(201).json({
      success: true,
      data: newCardType,
      message: 'Card type created successfully'
    });
  } catch (error) {
    console.error('Create card type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create card type',
      error: error.message
    });
  }
};

// Update card type
export const updateCardType = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeName, description, isActive } = req.body;

    if (!typeName || !typeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Card type name is required'
      });
    }

    const cardType = await CardType.findById(id);
    if (!cardType) {
      return res.status(404).json({
        success: false,
        message: 'Card type not found'
      });
    }

    // Check if new name already exists (if changed)
    if (typeName.trim() !== cardType.typeName) {
      const existingType = await CardType.findOne({ typeName: typeName.trim() });
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Card type name already exists'
        });
      }
    }

    cardType.typeName = typeName.trim();
    cardType.description = description ? description.trim() : '';
    if (isActive !== undefined) {
      cardType.isActive = isActive;
    }

    await cardType.save();
    res.json({
      success: true,
      data: cardType,
      message: 'Card type updated successfully'
    });
  } catch (error) {
    console.error('Update card type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update card type',
      error: error.message
    });
  }
};

// Delete card type
export const deleteCardType = async (req, res) => {
  try {
    const { id } = req.params;

    const cardType = await CardType.findByIdAndDelete(id);
    if (!cardType) {
      return res.status(404).json({
        success: false,
        message: 'Card type not found'
      });
    }

    res.json({
      success: true,
      message: 'Card type deleted successfully'
    });
  } catch (error) {
    console.error('Delete card type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete card type',
      error: error.message
    });
  }
};
