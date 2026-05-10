import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';
import path from 'path';
import { s3Config } from './awsConfig.js';

// Validate required AWS credentials - warn but don't fail so local dev works
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️  AWS credentials not configured. S3 uploads will fail. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file for production');
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Generate unique filename
const generateFileName = (req, file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(file.originalname);
  return `profiles/customers/profile-${uniqueSuffix}${extension}`;
};

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3,
  bucket: s3Config.bucketName,
  key: function (req, file, cb) {
    cb(null, generateFileName(req, file));
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?.userId || 'anonymous',
      uploadedAt: new Date().toISOString()
    });
  }
});

// Create multer upload instance for S3
export const uploadS3 = multer({
  storage: s3Storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Product images upload configuration
const generateProductFileName = (req, file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(file.originalname);
  return `products/images/product-${uniqueSuffix}${extension}`;
};

const productS3Storage = multerS3({
  s3: s3,
  bucket: s3Config.bucketName,
  // Removed acl: 'public-read' - bucket doesn't allow ACLs
  serverSideEncryption: 'AES256',
  key: function (req, file, cb) {
    cb(null, generateProductFileName(req, file));
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?.userId || 'anonymous',
      uploadedAt: new Date().toISOString(),
      type: 'product-image'
    });
  }
});

export const uploadProductS3 = multer({
  storage: productS3Storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for product images
  },
  fileFilter: fileFilter
});

// Admin/Employer profile upload configuration
const generateAdminFileName = (req, file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(file.originalname);
  const userType = req.user?.role || 'admin';
  return `profiles/${userType}s/profile-${uniqueSuffix}${extension}`;
};

const adminS3Storage = multerS3({
  s3: s3,
  bucket: s3Config.bucketName,
  key: function (req, file, cb) {
    cb(null, generateAdminFileName(req, file));
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?.userId || 'anonymous',
      uploadedAt: new Date().toISOString(),
      userType: req.user?.role || 'admin'
    });
  }
});

export const uploadAdminS3 = multer({
  storage: adminS3Storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

export default uploadS3;

