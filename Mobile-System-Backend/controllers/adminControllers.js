import adminModel from "../models/adminModel.js";
import employerModel from "../models/employerModel.js";
import Order from "../models/orderModel.js";
import Customer from "../models/customerModel.js";
import Product from "../models/productModel.js";
import OrderProduct from "../models/orderProductModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// admin login (supports both admin and employer login)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password required" });
    }

    // First try to find admin
    let user = await adminModel.findOne({ email });
    let userType = 'admin';

    // If not found as admin, try to find as employer
    if (!user) {
      user = await employerModel.findOne({ email, isActive: true });
      userType = 'employer';
    }

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ 
      id: user._id, 
      type: userType,
      role: user.role || 'admin'
    }, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"
    });

    res.json({
      success: true,
      message: "Login successful",
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: userType,
        role: user.role || 'admin',
        permissions: user.permissions || null
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// admin logout
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// get admin profile (supports both admin and employer)
export const getAdminProfile = async (req, res) => {
  try {
    let user;
    
    // Check if it's an employer or admin based on the request
    if (req.isEmployer) {
      user = await employerModel.findById(req.admin.id).select("-password");
    } else {
      user = await adminModel.findById(req.admin.id).select("-password");
    }
    
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    res.json({ 
      success: true, 
      admin: {
        ...user.toObject(),
        type: req.isEmployer ? 'employer' : 'admin'
      }
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// add new admin
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ 
        success: false, 
        message: "Name, email, and password are required" 
      });
    }

    // Check if admin already exists
    const existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.json({ 
        success: false, 
        message: "Admin with this email already exists" 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const newAdmin = new adminModel({
      name,
      email,
      password: hashedPassword
    });

    const savedAdmin = await newAdmin.save();

    res.json({
      success: true,
      message: "Admin added successfully",
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email
      }
    });
  } catch (error) {
    console.error("Add admin error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// reset admin password (public endpoint for development - no auth required)
export const resetAdminPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.json({ 
        success: false, 
        message: "Email and new password are required" 
      });
    }

    // Find admin by email
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.json({ success: false, message: "Admin not found with this email" });
    }

    // Hash new password
    const saltRounds = 10;
    admin.password = await bcrypt.hash(newPassword, saltRounds);
    await admin.save();

    res.json({
      success: true,
      message: "Password reset successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error("Reset admin password error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// update admin credentials (email and/or password)
export const updateAdminCredentials = async (req, res) => {
  try {
    const { email, password, currentPassword } = req.body;
    const adminId = req.admin.id;

    // Find admin
    const admin = await adminModel.findById(adminId);
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    // If password is being updated, verify current password
    if (password) {
      if (!currentPassword) {
        return res.json({ success: false, message: "Current password is required to change password" });
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isCurrentPasswordValid) {
        return res.json({ success: false, message: "Current password is incorrect" });
      }

      // Hash new password
      const saltRounds = 10;
      admin.password = await bcrypt.hash(password, saltRounds);
    }

    // Update email if provided
    if (email) {
      // Check if email already exists (excluding current admin)
      const existingAdmin = await adminModel.findOne({ email, _id: { $ne: adminId } });
      if (existingAdmin) {
        return res.json({ success: false, message: "Email already exists" });
      }
      admin.email = email;
    }

    await admin.save();

    res.json({
      success: true,
      message: "Credentials updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error("Update admin credentials error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// get order details (admin endpoint - no customer profile check required)
export const getAdminOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify admin is authenticated
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    console.log('[ADMIN_GET_ORDER] Fetching order:', orderId);

    // Fetch order directly (no customer validation for admin)
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Populate the order with related data
    await order.populate([
      {
        path: 'customer',
        select: 'name email phoneNumber'
      },
      {
        path: 'deliveryAddress',
        select: 'name address city postalCode phoneNumber state country'
      },
      {
        path: 'billingAddress',
        select: 'name address city postalCode phoneNumber state country'
      },
      {
        path: 'orderProducts',
        populate: [
          {
            path: 'product',
            select: 'name images sku description emiNumber',
            populate: {
              path: 'brand category',
              select: 'name logo'
            }
          },
          {
            path: 'selectedVariants.variation',
            select: 'name type'
          }
        ]
      },
      {
        path: 'items.productId',
        select: 'name images sku description',
        populate: {
          path: 'brand category',
          select: 'name logo'
        }
      }
    ]);

    console.log('Order found:', order.orderNumber);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('[ADMIN_GET_ORDER] Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details"
    });
  }
};