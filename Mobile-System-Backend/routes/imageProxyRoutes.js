import AWS from 'aws-sdk';
import { Router } from 'express';
import { s3Config } from '../config/awsConfig.js';

const router = Router();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-north-1'
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'raxwo-mobile-system';

// Helper function to extract S3 key from URL or return the key as-is
const extractS3Key = (input) => {
  // If it's a full S3 URL, extract the key
  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      const url = new URL(input);
      // Remove leading slash from pathname
      return url.pathname.substring(1);
    } catch (error) {
      // If URL parsing fails, try to extract key manually
      const bucketUrlPattern = new RegExp(`https?://[^/]+/(.+)`);
      const match = input.match(bucketUrlPattern);
      if (match) {
        return decodeURIComponent(match[1]);
      }
      return input;
    }
  }
  // If it's already a key, return it
  return decodeURIComponent(input);
};

// Helper function to serve image from S3
const serveImageFromS3 = async (imageKey, res) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: imageKey
    };

    const s3Object = await s3.getObject(params).promise();
    
    // Set appropriate headers with CORS
    res.set({
      'Content-Type': s3Object.ContentType || 'image/jpeg',
      'Content-Length': s3Object.ContentLength,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': s3Object.ETag,
      'Access-Control-Allow-Origin': '*', // Allow CORS
      'Access-Control-Allow-Methods': 'GET'
    });

    // Send the image data
    res.send(s3Object.Body);
  } catch (error) {
    console.error('Error serving image from S3:', error);
    
    if (error.code === 'NoSuchKey') {
      return res.status(404).json({ error: 'Image not found', key: imageKey });
    } else if (error.code === 'AccessDenied') {
      return res.status(403).json({ error: 'Access denied to S3 bucket' });
    }
    
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Test endpoint to verify the route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Image proxy route is working', path: req.path });
});

// Image proxy endpoint - use a parameter route that captures everything
// Express 4.x supports this syntax
router.get('/:imagePath', async (req, res, next) => {
  // Check if this is the test route
  if (req.params.imagePath === 'test') {
    return next();
  }
  
  try {
    // Get the image path from params
    let imagePath = req.params.imagePath || '';
    
    // Also check for additional path segments in query or path
    if (req.path && req.path !== `/${imagePath}`) {
      // There might be more path after the parameter
      const remainingPath = req.path.replace(`/${imagePath}`, '');
      if (remainingPath) {
        imagePath = imagePath + remainingPath;
      }
    }
    
    // If path is empty, return error
    if (!imagePath || imagePath.length === 0) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    // Decode the path (handles URL encoding like %2F for slashes)
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(imagePath);
    } catch (e) {
      // If decoding fails, use the path as-is
      decodedPath = imagePath;
    }
    
    // Extract S3 key from URL or path
    const imageKey = extractS3Key(decodedPath);

    await serveImageFromS3(imageKey, res);

  } catch (error) {
    console.error('Error in image proxy:', error);
    
    if (error.code === 'NoSuchKey') {
      return res.status(404).json({ error: 'Image not found' });
    } else if (error.code === 'AccessDenied') {
      return res.status(403).json({ error: 'Access denied to S3 bucket' });
    }
    
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;
