import express from "express";
import { 
  generateUploadUrl, 
  uploadFile, 
  deleteFile, 
  getDownloadUrl, 
  getS3Config 
} from "../controllers/uploadController.js";
import auth from "../middleware/auth.js";
import { uploadS3 } from "../config/s3MulterConfig.js";

const uploadRouter = express.Router();

// Public routes
uploadRouter.get("/config", getS3Config);

// Protected routes
uploadRouter.post("/generate-upload-url", auth, generateUploadUrl);
uploadRouter.post("/upload", auth, uploadS3.single('file'), uploadFile);
uploadRouter.post("/delete", auth, deleteFile);
uploadRouter.get("/download-url", auth, getDownloadUrl);

export default uploadRouter;

