import { generatePresignedUploadUrl, generatePresignedDownloadUrl, uploadToS3, deleteFromS3 } from "../config/awsConfig.js";
import { optimizeImage, validateImage, stripExifData } from "../utils/imageOptimizer.js";
import { s3Config } from "../config/awsConfig.js";

// Generate pre-signed URL for direct upload
export const generateUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, userId, userRole } = req.body;
    
    if (!fileName || !fileType) {
      return res.json({ 
        success: false, 
        message: "File name and type are required" 
      });
    }

    // Validate file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (!allowedTypes.test(fileType.toLowerCase())) {
      return res.json({ 
        success: false, 
        message: "Only image files are allowed" 
      });
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = fileName.split('.').pop();
    const key = `profiles/${userRole || 'customers'}/upload-${timestamp}-${randomSuffix}.${extension}`;

    // Generate pre-signed URL
    const result = await generatePresignedUploadUrl(key, fileType, 3600); // 1 hour expiry

    if (result.success) {
      return res.json({
        success: true,
        uploadUrl: result.uploadUrl,
        key: result.key,
        expiresIn: result.expiresIn,
        bucketUrl: s3Config.bucketUrl
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to generate upload URL",
        error: result.error
      });
    }
  } catch (error) {
    console.error('Generate upload URL error:', error);
    return res.json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Upload file directly to S3 (server-side upload)
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({
        success: false,
        message: "No file uploaded"
      });
    }

    const { userId, userRole } = req.body;
    const file = req.file;
    
    // Validate image
    const validation = await validateImage(file.buffer);
    if (!validation.isValid) {
      return res.json({
        success: false,
        message: validation.error || "Invalid image file"
      });
    }

    // Strip EXIF data for privacy
    const strippedImage = await stripExifData(file.buffer);
    if (!strippedImage.success) {
      return res.json({
        success: false,
        message: "Failed to process image"
      });
    }

    // Optimize image
    const optimizedImage = await optimizeImage(strippedImage.buffer, 'medium');
    if (!optimizedImage.success) {
      return res.json({
        success: false,
        message: "Failed to optimize image"
      });
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    const key = `profiles/${userRole || 'customers'}/profile-${timestamp}-${randomSuffix}.${extension}`;

    // Upload to S3
    const uploadResult = await uploadToS3(
      optimizedImage.buffer,
      key,
      file.mimetype
    );

    if (uploadResult.success) {
      return res.json({
        success: true,
        message: "File uploaded successfully",
        fileUrl: uploadResult.location,
        key: uploadResult.key,
        size: optimizedImage.size
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to upload file",
        error: uploadResult.error
      });
    }
  } catch (error) {
    console.error('Upload file error:', error);
    return res.json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete file from S3
export const deleteFile = async (req, res) => {
  try {
    const { fileKey } = req.body;
    
    if (!fileKey) {
      return res.json({
        success: false,
        message: "File key is required"
      });
    }

    const result = await deleteFromS3(fileKey);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "File deleted successfully"
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to delete file",
        error: result.error
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    return res.json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get file download URL
export const getDownloadUrl = async (req, res) => {
  try {
    const { fileKey } = req.query;
    
    if (!fileKey) {
      return res.json({
        success: false,
        message: "File key is required"
      });
    }

    const result = await generatePresignedDownloadUrl(fileKey, 3600); // 1 hour expiry
    
    if (result.success) {
      return res.json({
        success: true,
        downloadUrl: result.downloadUrl,
        expiresIn: result.expiresIn
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to generate download URL",
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get download URL error:', error);
    return res.json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get S3 configuration for frontend
export const getS3Config = async (req, res) => {
  try {
    return res.json({
      success: true,
      config: {
        bucketName: s3Config.bucketName,
        region: s3Config.region,
        bucketUrl: s3Config.bucketUrl
      }
    });
  } catch (error) {
    console.error('Get S3 config error:', error);
    return res.json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

