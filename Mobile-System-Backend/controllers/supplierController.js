import Supplier from '../models/supplierModel.js';

export const createSupplier = async (req, res) => {
  try {
    const {
      date,
      reciepNo,
      brand,
      modal,
      quantity,
      buyingPrice,
      supplierName,
      address,
      mobileNumber
    } = req.body;

    const requiredFields = {
      date,
      reciepNo,
      brand,
      modal,
      quantity,
      buyingPrice,
      supplierName,
      address,
      mobileNumber
    };

    const hasMissingFields = Object.values(requiredFields).some(
      (value) => value === undefined || value === null || String(value).trim() === ''
    );

    if (hasMissingFields) {
      return res.status(400).json({
        success: false,
        message: 'All supplier fields are required'
      });
    }

    const parsedQuantity = Number(quantity);
    const parsedBuyingPrice = Number(buyingPrice);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid non-negative number'
      });
    }

    if (!Number.isFinite(parsedBuyingPrice) || parsedBuyingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Buying price must be a valid non-negative number'
      });
    }

    const createdBy = req.admin?._id;
    const createdByModel = req.isEmployer ? 'Employer' : 'Admin';

    const newSupplier = await Supplier.create({
      date: String(date).trim(),
      reciepNo: String(reciepNo).trim(),
      brand: String(brand).trim(),
      modal: String(modal).trim(),
      quantity: parsedQuantity,
      buyingPrice: parsedBuyingPrice,
      supplierName: String(supplierName).trim(),
      address: String(address).trim(),
      mobileNumber: String(mobileNumber).trim(),
      createdBy,
      createdByModel
    });

    return res.status(201).json({
      success: true,
      message: 'Supplier record created successfully',
      data: newSupplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create supplier record',
      error: error.message
    });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    return res.json({
      success: true,
      message: 'Supplier records fetched successfully',
      data: suppliers
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier records',
      error: error.message
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier record not found'
      });
    }

    return res.json({
      success: true,
      message: 'Supplier record deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete supplier record',
      error: error.message
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      reciepNo,
      brand,
      modal,
      quantity,
      buyingPrice,
      supplierName,
      address,
      mobileNumber
    } = req.body;

    const requiredFields = {
      date,
      reciepNo,
      brand,
      modal,
      quantity,
      buyingPrice,
      supplierName,
      address,
      mobileNumber
    };

    const hasMissingFields = Object.values(requiredFields).some(
      (value) => value === undefined || value === null || String(value).trim() === ''
    );

    if (hasMissingFields) {
      return res.status(400).json({
        success: false,
        message: 'All supplier fields are required'
      });
    }

    const parsedQuantity = Number(quantity);
    const parsedBuyingPrice = Number(buyingPrice);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid non-negative number'
      });
    }

    if (!Number.isFinite(parsedBuyingPrice) || parsedBuyingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Buying price must be a valid non-negative number'
      });
    }

    const updated = await Supplier.findByIdAndUpdate(
      id,
      {
        date: String(date).trim(),
        reciepNo: String(reciepNo).trim(),
        brand: String(brand).trim(),
        modal: String(modal).trim(),
        quantity: parsedQuantity,
        buyingPrice: parsedBuyingPrice,
        supplierName: String(supplierName).trim(),
        address: String(address).trim(),
        mobileNumber: String(mobileNumber).trim()
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Supplier record not found'
      });
    }

    return res.json({
      success: true,
      message: 'Supplier record updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update supplier record',
      error: error.message
    });
  }
};
