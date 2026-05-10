import employerModel from "../models/employerModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Get all employers
export const getAllEmployers = async (req, res) => {
  try {
    const employers = await employerModel.find({}).select("-password");
    res.json({ success: true, employers });
  } catch (error) {
    console.error("Get all employers error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Add new employer
export const addEmployer = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.json({ 
        success: false, 
        message: "Name, email, password, and role are required" 
      });
    }

    // Check if employer already exists
    const existingEmployer = await employerModel.findOne({ email });
    if (existingEmployer) {
      return res.json({ 
        success: false, 
        message: "Employer with this email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new employer
    const newEmployer = new employerModel({
      name,
      email,
      password: hashedPassword,
      role
    });

    const savedEmployer = await newEmployer.save();

    res.json({
      success: true,
      message: "Employer added successfully",
      employer: {
        id: savedEmployer._id,
        name: savedEmployer.name,
        email: savedEmployer.email,
        role: savedEmployer.role,
        isActive: savedEmployer.isActive
      }
    });
  } catch (error) {
    console.error("Add employer error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Update employer
export const updateEmployer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
      return res.json({ 
        success: false, 
        message: "Name, email, and role are required" 
      });
    }

    // Check if employer exists
    const employer = await employerModel.findById(id);
    if (!employer) {
      return res.json({ success: false, message: "Employer not found" });
    }

    // Check if email is being changed and if new email already exists
    if (email !== employer.email) {
      const existingEmployer = await employerModel.findOne({ email });
      if (existingEmployer) {
        return res.json({ 
          success: false, 
          message: "Employer with this email already exists" 
        });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      role
    };

    // Hash new password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedEmployer = await employerModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Employer updated successfully",
      employer: updatedEmployer
    });
  } catch (error) {
    console.error("Update employer error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Delete employer
export const deleteEmployer = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEmployer = await employerModel.findByIdAndDelete(id);
    if (!deletedEmployer) {
      return res.json({ success: false, message: "Employer not found" });
    }

    res.json({
      success: true,
      message: "Employer deleted successfully"
    });
  } catch (error) {
    console.error("Delete employer error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Employer login
export const employerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password required" });
    }

    const employer = await employerModel.findOne({ email, isActive: true });
    if (!employer) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, employer.password);
    if (!isPasswordValid) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: employer._id, role: employer.role }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Changed from 1d to 7d to match customer tokens
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // Changed from 1 day to 7 days to match customer tokens
    });

    res.json({
      success: true,
      message: "Login successful",
      employer: {
        id: employer._id,
        name: employer.name,
        email: employer.email,
        role: employer.role,
      },
    });
  } catch (error) {
    console.error("Employer login error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get employer profile
export const getEmployerProfile = async (req, res) => {
  try {
    const employer = await employerModel.findById(req.employer.id).select("-password");
    res.json({ success: true, employer });
  } catch (error) {
    console.error("Get employer profile error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Update employer permissions (admin only)
export const updateEmployerPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
      return res.json({ 
        success: false, 
        message: "Permissions are required" 
      });
    }

    // Check if employer exists
    const employer = await employerModel.findById(id);
    if (!employer) {
      return res.json({ success: false, message: "Employer not found" });
    }

    const updatedEmployer = await employerModel.findByIdAndUpdate(
      id,
      { permissions },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Employer permissions updated successfully",
      employer: updatedEmployer
    });
  } catch (error) {
    console.error("Update employer permissions error:", error);
    res.json({ success: false, message: "Server error" });
  }
};
