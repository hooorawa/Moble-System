import jwt from "jsonwebtoken";
import employerModel from "../models/employerModel.js";

const employerAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.token) token = req.headers.token;

    if (!token) return res.status(401).json({ success: false, message: "Not Authorized. No token." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employer = await employerModel.findById(decoded.id).select("-password");
    if (!employer || !employer.isActive) return res.status(401).json({ success: false, message: "Not Authorized" });

    req.employer = employer; 
    next();
  } catch (err) {
    console.error("employerAuth error:", err);
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

export default employerAuth;
