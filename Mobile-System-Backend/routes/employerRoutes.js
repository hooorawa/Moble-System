import express from "express";
import { 
  getAllEmployers, 
  addEmployer, 
  updateEmployer, 
  deleteEmployer,
  employerLogin,
  getEmployerProfile,
  updateEmployerPermissions
} from "../controllers/employerController.js";
import adminAuth from "../middleware/adminAuth.js";
import adminOnlyAuth from "../middleware/adminOnlyAuth.js";
import employerAuth from "../middleware/employerAuth.js";

const router = express.Router();

// Public routes
router.post("/login", employerLogin);

// Protected routes (admin and employer can view, only admin can manage)
router.get("/", adminAuth, getAllEmployers);
router.post("/add", adminOnlyAuth, addEmployer);
router.put("/update/:id", adminOnlyAuth, updateEmployer);
router.put("/permissions/:id", adminOnlyAuth, updateEmployerPermissions);
router.delete("/delete/:id", adminOnlyAuth, deleteEmployer);

// Protected routes (employer only)
router.get("/profile", employerAuth, getEmployerProfile);

export default router;
