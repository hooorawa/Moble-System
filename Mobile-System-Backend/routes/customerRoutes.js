import express from "express";
import {
	loginUser,
	registerUser,
	logoutUser,
	getCustomerProfile,
	updateCustomerProfile,
	changeCustomerPassword
} from "../controllers/customerControllers.js";
import auth from "../middleware/auth.js";
import upload from "../config/multerConfig.js";
import { uploadS3 } from "../config/s3MulterConfig.js";

const customerRouter = express.Router();

// Public routes
customerRouter.post("/register", registerUser);
customerRouter.post("/login", loginUser);
customerRouter.post("/logout", logoutUser);

// Protected routes
customerRouter.get("/profile", auth, getCustomerProfile);
customerRouter.post("/update-profile", auth, uploadS3.single('profilePicture'), updateCustomerProfile);
customerRouter.post("/change-password", auth, changeCustomerPassword);

export default customerRouter;
