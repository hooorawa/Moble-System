import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";

const adminOnlyAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.token) token = req.headers.token;

    if (!token) return res.status(401).json({ success: false, message: "Not Authorized. No token." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await adminModel.findById(decoded.id).select("-password");
    if (!admin) return res.status(401).json({ success: false, message: "Not Authorized. Admin access required." });

    req.admin = admin; 
    next();
  } catch (err) {
    console.error("adminOnlyAuth error:", err);
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

export default adminOnlyAuth;
