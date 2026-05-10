import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDB } from "./config/db.js";
import fs from "fs";

// Routes
import customerRouter from "./routes/customerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import addressRouter from "./routes/addressRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import brandRouter from "./routes/brandRoutes.js";
import variationRouter from "./routes/variationRoutes.js";
import productRouter from "./routes/productRoutes.js";
import productVariantRouter from "./routes/productVariantRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import stockRouter from "./routes/stockRoutes.js";
import employerRouter from "./routes/employerRoutes.js";
import roleRouter from "./routes/roleRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import imageProxyRouter from "./routes/imageProxyRoutes.js";
import paymentRecordRouter from "./routes/paymentRecordRoutes.js";
import cardReloadRouter from "./routes/cardReloadRoutes.js";
import cardTypeRouter from "./routes/cardTypeRoutes.js";
import reloadTypeRouter from "./routes/reloadTypeRoutes.js";
import serviceRouter from "./routes/serviceRoutes.js";
import supplierRouter from "./routes/supplierRoutes.js";
import AWS from 'aws-sdk';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// CORS Configuration
const corsOrigins = process.env.FRONTEND_URLS 
  ? process.env.FRONTEND_URLS.split(',').map(url => url.trim())
  : ["http://localhost:5173", "http://localhost:5174", "https://*.netlify.app"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = corsOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp('^' + allowedOrigin.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(cookieParser());

// Static folder for uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Connect database
connectDB();

// Image proxy handler - handle /api/image/* requests directly as middleware
// This avoids route pattern issues with Express
app.use("/api/image", async (req, res, next) => {
  try {
    // Extract image path from the request
    // req.path will be like "/products/images/product-123.jpg" when mounted at /api/image
    let imagePath = req.path;
    
    // Remove leading slash if present
    if (imagePath.startsWith('/')) {
      imagePath = imagePath.substring(1);
    }
    
    // Handle test endpoint
    if (imagePath === 'test' || !imagePath) {
      return imageProxyRouter(req, res, next);
    }
    
    // Configure AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'eu-north-1'
    });
    
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'raxwo-mobile-system';
    
    // Decode the path - Express may have already decoded it, but handle both cases
    let decodedPath = imagePath;
    try {
      // Try decoding in case it's still encoded
      decodedPath = decodeURIComponent(imagePath);
    } catch (e) {
      // If decoding fails, use as-is (might already be decoded)
      decodedPath = imagePath;
    }
    
    // Extract S3 key (handle both full URLs and keys)
    let imageKey = decodedPath;
    if (decodedPath.startsWith('http://') || decodedPath.startsWith('https://')) {
      try {
        const url = new URL(decodedPath);
        imageKey = url.pathname.substring(1);
      } catch (error) {
        const match = decodedPath.match(/https?:\/\/[^/]+\/(.+)/);
        if (match) {
          imageKey = decodeURIComponent(match[1]);
        }
      }
    }
    
    console.log('[IMAGE PROXY] Request:', {
      originalPath: req.path,
      imagePath: imagePath,
      decodedPath: decodedPath,
      imageKey: imageKey
    });
    
    // Get image from S3
    const params = {
      Bucket: bucketName,
      Key: imageKey
    };
    
    const s3Object = await s3.getObject(params).promise();
    
    // Set headers
    res.set({
      'Content-Type': s3Object.ContentType || 'image/jpeg',
      'Content-Length': s3Object.ContentLength,
      'Cache-Control': 'public, max-age=31536000',
      'ETag': s3Object.ETag,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET'
    });
    
    // Send image
    res.send(s3Object.Body);
    
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      return res.status(404).json({ error: 'Image not found' });
    } else if (error.code === 'AccessDenied') {
      return res.status(403).json({ error: 'Access denied to S3 bucket' });
    }
    // If it's not an image request or other error, let the router handle it
    return imageProxyRouter(req, res, next);
  }
});

// Routes
app.use("/api/customer", customerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/address", addressRouter);
app.use("/api/category", categoryRouter);
app.use("/api/brand", brandRouter);
app.use("/api/variation", variationRouter);
app.use("/api/product", productRouter);
app.use("/api/product-variant", productVariantRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/stock", stockRouter);
app.use("/api/employer", employerRouter);
app.use("/api/role", roleRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/payment-record", paymentRecordRouter);
app.use("/api/card-reload", cardReloadRouter);
app.use("/api/card-type", cardTypeRouter);
app.use("/api/reload-type", reloadTypeRouter);
app.use("/api/service", serviceRouter);
app.use("/api/supplier", supplierRouter);

// Test API
app.get("/", (req, res) => res.send("API Working"));
app.get("/health", (req, res) => res.json({ 
  status: "up", 
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  timestamp: new Date() 
}));

// 404 Handler - Must be after all other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Global Error Handler Middleware - Must be last
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`);
});

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}