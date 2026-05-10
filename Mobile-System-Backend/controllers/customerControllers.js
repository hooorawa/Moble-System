import customerModel from "../models/customerModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import { s3Config, deleteFromS3 } from "../config/awsConfig.js";
import mongoose from "mongoose";

// create token 
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// register customer 
export const registerUser = async (req, res) => {
  const { name, password, email } = req.body;
  try {
    console.log("[REGISTER] Received registration request:", { name, email, hasPassword: !!password });
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error("[REGISTER] Database not connected. ReadyState:", mongoose.connection.readyState);
      return res.json({ success: false, message: "Database connection error. Please try again later." });
    }
    console.log("[REGISTER] Database connection status: Connected");
    
    if (!name || !email || !password) {
      console.log("[REGISTER] Missing fields");
      return res.json({ success: false, message: "All fields are required" });
    }

    console.log("[REGISTER] Checking if customer exists...");
    const exists = await customerModel.findOne({ email });
    if (exists) {
      console.log("[REGISTER] Customer already exists with email:", email);
      return res.json({ success: false, message: "Customer already exists" });
    }

    if (!validator.isEmail(email)) {
      console.log("[REGISTER] Invalid email format:", email);
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 8) {
      console.log("[REGISTER] Password too short");
      return res.json({ success: false, message: "Please enter strong password (>=8 chars)" });
    }

    console.log("[REGISTER] Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("[REGISTER] Creating new user model...");
    const newUser = new customerModel({
      name,
      email,
      password: hashedPassword,
      role: "customer"
    });

    console.log("[REGISTER] Saving user to database...");
    const user = await newUser.save();
    console.log("[REGISTER] User saved successfully with ID:", user._id);
    
    // Verify the user was actually saved to the database
    const verifyUser = await customerModel.findById(user._id);
    if (!verifyUser) {
      console.error("[REGISTER] CRITICAL: User was not found in database after save!");
      return res.json({ success: false, message: "Failed to save user to database" });
    }
    console.log("[REGISTER] User verification successful. Email:", verifyUser.email);
    
    const token = createToken(user._id, user.role);

    setAuthCookie(res, token);

    console.log("[REGISTER] Registration successful for:", email);
    return res.json({ success: true, token, role: user.role, name: user.name, email: user.email });
  } catch (error) {
    console.error("[REGISTER] Error during registration:", error);
    console.error("[REGISTER] Error name:", error.name);
    console.error("[REGISTER] Error message:", error.message);
    console.error("[REGISTER] Error stack:", error.stack);
    
    // Return more specific error messages
    if (error.name === 'ValidationError') {
      return res.json({ success: false, message: `Validation error: ${error.message}` });
    }
    if (error.code === 11000) {
      return res.json({ success: false, message: "Email already exists" });
    }
    if (error.name === 'MongoServerError') {
      return res.json({ success: false, message: `Database error: ${error.message}` });
    }
    
    return res.json({ success: false, message: `Server error: ${error.message || "Unknown error"}` });
  }
};

// login customer or admin
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Import admin model dynamically to check admin credentials first
    const { default: adminModel } = await import("../models/adminModel.js");
    
    // First check if email belongs to admin
    let admin = await adminModel.findOne({ email });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

      const token = createToken(admin._id, 'admin');
      setAuthCookie(res, token);

      return res.json({ 
        success: true, 
        token, 
        role: 'admin',
        name: admin.name,
        email: admin.email,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          type: 'admin',
          role: admin.role || 'admin',
          permissions: admin.permissions || null
        }
      });
    }

    // If not admin, check customer
    const user = await customerModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = createToken(user._id, user.role);

    setAuthCookie(res, token);

    return res.json({ success: true, token, role: user.role, name: user.name, email: user.email });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Server error" });
  }
};


// logout customer
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Server error" });
  }
};

// get customer profile
export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await customerModel.findById(req.body.userId).select("-password");
    if (!customer) {
      return res.json({ success: false, message: "Customer not found" });
    }
    return res.json({ success: true, customer });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Server error" });
  }
};

// update customer profile
export const updateCustomerProfile = async (req, res) => {
  try {
    const { name } = req.body;
    // Get userId from req.user (set by auth middleware, safe from multer)
    const userId = req.user?.userId || req.body.userId;

    if (!name) {
      return res.json({ success: false, message: "Name is required" });
    }

    if (!userId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    // Prepare update data
    const updateData = {
      name,
      updatedAt: new Date()
    };

    // If profile picture was uploaded, add it to update data
    if (req.file) {
      // For S3 uploads, the file location is in req.file.location
      updateData.profilePicture = req.file.location || `${s3Config.bucketUrl}/${req.file.key}`;
    }

    // Update customer profile (email cannot be changed)
    const updatedCustomer = await customerModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedCustomer) {
      return res.json({ success: false, message: "Customer not found" });
    }

    return res.json({ 
      success: true, 
      message: "Profile updated successfully",
      customer: updatedCustomer 
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Server error" });
  }
};

// change customer password
export const changeCustomerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.body.userId;

    if (!currentPassword || !newPassword) {
      return res.json({ success: false, message: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.json({ success: false, message: "New password must be at least 8 characters long" });
    }

    // Find customer with password
    const customer = await customerModel.findById(userId);
    if (!customer) {
      return res.json({ success: false, message: "Customer not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isCurrentPasswordValid) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, customer.password);
    if (isSamePassword) {
      return res.json({ success: false, message: "New password must be different from current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await customerModel.findByIdAndUpdate(
      userId,
      { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    );

    return res.json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Server error" });
  }
};