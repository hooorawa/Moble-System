import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";
import employerModel from "../models/employerModel.js";

const adminAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.token) token = req.headers.token;

    if (!token) return res.status(401).json({ success: false, message: "Not Authorized. No token." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check user type from token
    if (decoded.type === 'admin') {
      const admin = await adminModel.findById(decoded.id).select("-password");
      if (admin) {
        req.admin = admin;
        req.isEmployer = false;
        next();
        return;
      }
    } else if (decoded.type === 'employer') {
      const employer = await employerModel.findById(decoded.id).select("-password");
      if (employer && employer.isActive) {
        req.admin = employer; // Use admin field for compatibility
        req.isEmployer = true;
        next();
        return;
      }
    }
    
    // Fallback: try to find user without type (for backward compatibility)
    const admin = await adminModel.findById(decoded.id).select("-password");
    if (admin) {
      req.admin = admin;
      req.isEmployer = false;
      next();
      return;
    }
    
    const employer = await employerModel.findById(decoded.id).select("-password");
    if (employer && employer.isActive) {
      req.admin = employer;
      req.isEmployer = true;
      next();
      return;
    }
    
    return res.status(401).json({ success: false, message: "Not Authorized" });
  } catch (err) {
    console.error("adminAuth error:", err);
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

export default adminAuth;
