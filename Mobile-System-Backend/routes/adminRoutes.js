import express from "express";
import { adminLogin, adminLogout, getAdminProfile, updateAdminCredentials, addAdmin, resetAdminPassword, getAdminOrderDetail } from "../controllers/adminControllers.js";
import adminAuth from "../middleware/adminAuth.js";
import adminOnlyAuth from "../middleware/adminOnlyAuth.js";

const router = express.Router();

// Public routes
router.post("/login", adminLogin);
router.post("/logout", adminLogout);
router.post("/reset-password", resetAdminPassword);

// Protected routes
router.get("/profile", adminAuth, getAdminProfile);
router.put("/update-credentials", adminAuth, updateAdminCredentials);
router.post("/add", adminOnlyAuth, addAdmin);
router.get("/order/:orderId", adminAuth, getAdminOrderDetail);

export default router;
