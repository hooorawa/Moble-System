import addressModel from "../models/addressModel.js";
import customerModel from "../models/customerModel.js";

// Add address for a customer
export const addAddress = async (req, res) => {
  try {
    const { name, address, city, postalCode, phoneNumber, customer } = req.body;

    if (!name || !address || !city || !postalCode || !phoneNumber) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Get customer ID from authenticated user (set by auth middleware in req.user or req.body)
    let customerId = req.user?.userId || req.body.userId || customer;
    
    // If still no customer ID, return error
    if (!customerId) {
      return res.status(401).json({ 
        success: false, 
        message: "Customer ID is required. Please login or provide a valid customer ID." 
      });
    }

    const newAddress = new addressModel({
      name,
      address,
      city,
      postalCode,
      phoneNumber,
      customer: customerId
    });

    const savedAddress = await newAddress.save();

    res.status(201).json({ success: true, message: "Address added successfully", address: savedAddress });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all addresses for a customer
export const getAddresses = async (req, res) => {
  try {
    console.log("Get addresses request");
    
    // Get customer ID from authenticated user (set by auth middleware in req.user or req.body)
    const customerId = req.user?.userId || req.body.userId;
    
    if (!customerId) {
      return res.json({ 
        success: false, 
        message: "Please login to view addresses" 
      });
    }
    
    console.log("Fetching addresses for customer:", customerId);
    
    // Get addresses only for the logged-in customer
    const addresses = await addressModel.find({ customer: customerId });
    
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get single address
export const getAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const customerId = req.user?.userId || req.body.userId; // From auth middleware

    if (!customerId) {
      return res.status(401).json({ 
        success: false, 
        message: "Please login to view address" 
      });
    }

    const address = await addressModel.findOne({ 
      _id: addressId, 
      customer: customerId 
    });

    if (!address) {
      return res.json({ success: false, message: "Address not found" });
    }

    res.json({ success: true, address });
  } catch (error) {
    console.error("Get address error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Update address
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, address, city, postalCode, phoneNumber } = req.body;
    const customerId = req.user?.userId || req.body.userId; // From auth middleware
    
    console.log("Update address request:", { addressId, name, address, city, postalCode, phoneNumber, customerId });

    if (!customerId) {
      return res.json({ 
        success: false, 
        message: "Please login to update address" 
      });
    }

    // First check if the address belongs to the logged-in customer
    const existingAddress = await addressModel.findOne({ 
      _id: addressId, 
      customer: customerId 
    });

    if (!existingAddress) {
      return res.json({ success: false, message: "Address not found or you don't have permission to update it" });
    }

    // Update the address
    const updatedAddress = await addressModel.findByIdAndUpdate(
      addressId,
      { name, address, city, postalCode, phoneNumber },
      { new: true, runValidators: true }
    );

    console.log("Updated address:", updatedAddress);
    res.json({ success: true, message: "Address updated successfully", address: updatedAddress });
  } catch (error) {
    console.error("Update address error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const customerId = req.user?.userId || req.body.userId; // From auth middleware
    
    console.log("Delete address request:", { addressId, customerId });

    if (!customerId) {
      return res.json({ 
        success: false, 
        message: "Please login to delete address" 
      });
    }

    // First check if the address belongs to the logged-in customer
    const existingAddress = await addressModel.findOne({ 
      _id: addressId, 
      customer: customerId 
    });

    if (!existingAddress) {
      return res.json({ success: false, message: "Address not found or you don't have permission to delete it" });
    }

    // Delete the address
    const address = await addressModel.findByIdAndDelete(addressId);

    console.log("Deleted address:", address);
    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.json({ success: false, message: "Server error" });
  }
};
