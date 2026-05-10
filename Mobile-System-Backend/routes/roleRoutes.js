import express from "express";
import { getAllRoles, addRole, deleteRole } from "../controllers/roleController.js";
import adminOnlyAuth from "../middleware/adminOnlyAuth.js";

const router = express.Router();

// Get all roles (temporarily public for testing)
router.get("/", getAllRoles);

// Add new role (admin only)
router.post("/add", adminOnlyAuth, addRole);

// Delete role (admin only)
router.delete("/delete/:id", adminOnlyAuth, deleteRole);

export default router;
