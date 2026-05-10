import { s3Config } from '../config/awsConfig.js';

/**
 * Convert S3 URL to proxy URL for frontend access
 * @param {string} s3Url - Full S3 URL or S3 key
 * @param {string} baseUrl - Base URL of the API (default: http://localhost:4000)
 * @returns {string} - Proxy URL
 */
export const convertToProxyUrl = (s3Url, baseUrl = 'http://localhost:4000') => {
  if (!s3Url || typeof s3Url !== 'string') {
    return null;
  }
  
  // If it's already a proxy URL, return as-is
  if (s3Url.includes('/api/image/')) {
    return s3Url;
  }
  
  // If it's a full S3 URL, extract the key
  let imageKey = s3Url;
  if (s3Url.startsWith('http://') || s3Url.startsWith('https://')) {
    try {
      const url = new URL(s3Url);
      // Remove leading slash from pathname
      imageKey = url.pathname.substring(1);
    } catch (error) {
      // If URL parsing fails, try to extract key manually
      const bucketUrlPattern = new RegExp(`https?://[^/]+/(.+)`);
      const match = s3Url.match(bucketUrlPattern);
      if (match) {
        imageKey = decodeURIComponent(match[1]);
      } else {
        // If we can't parse it, return original
        return s3Url;
      }
    }
  }
  
  // Encode the key properly - encodeURIComponent handles slashes correctly
  // But we need to be careful - encodeURIComponent will encode slashes to %2F
  // So we split, encode each part, then join
  const parts = imageKey.split('/');
  const encodedParts = parts.map(part => encodeURIComponent(part));
  const encodedKey = encodedParts.join('/');
  
  // Return full URL - product pages use URLs directly, order pages check for http:// prefix
  const proxyUrl = `${baseUrl}/api/image/${encodedKey}`;
  
  // Return proxy URL
  return proxyUrl;
};

/**
 * Convert array of S3 URLs to proxy URLs
 * @param {string[]} s3Urls - Array of S3 URLs
 * @param {string} baseUrl - Base URL of the API
 * @returns {string[]} - Array of proxy URLs
 */
export const convertArrayToProxyUrls = (s3Urls, baseUrl = 'http://localhost:4000') => {
  if (!Array.isArray(s3Urls)) return [];
  return s3Urls.map(url => convertToProxyUrl(url, baseUrl)).filter(url => url !== null);
};

/**
 * Get the base URL from request
 * @param {object} req - Express request object
 * @returns {string} - Base URL
 */
export const getBaseUrl = (req) => {
  if (req) {
    return `${req.protocol}://${req.get('host')}`;
  }
  return process.env.API_BASE_URL || 'http://localhost:4000';
};

/**
 * Recursively convert all image arrays in an object to proxy URLs
 * @param {object} obj - Object to process
 * @param {string} baseUrl - Base URL of the API
 * @param {number} depth - Current recursion depth (to prevent infinite loops)
 * @returns {object} - Object with converted image URLs
 */
export const convertAllImagesInObject = (obj, baseUrl = 'http://localhost:4000', depth = 0) => {
  // Prevent infinite recursion
  if (depth > 10) {
    return obj;
  }

  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle Mongoose documents
  if (obj.toObject && typeof obj.toObject === 'function') {
    obj = obj.toObject();
  }

  // If it's an array, process each item
  if (Array.isArray(obj)) {
    return obj.map(item => convertAllImagesInObject(item, baseUrl, depth + 1));
  }

  // Handle null and Date objects
  if (obj === null || obj instanceof Date) {
    return obj;
  }

  // Create a copy of the object (handle Mongoose objects)
  const result = Array.isArray(obj) ? [...obj] : { ...obj };

  // Check if this object has an 'images' property that's an array
  if (result.images && Array.isArray(result.images) && result.images.length > 0) {
    const originalImages = [...result.images];
    result.images = convertArrayToProxyUrls(result.images, baseUrl);
    
    // Log conversion for debugging
    if (originalImages.length > 0 && originalImages[0] !== result.images[0]) {
      console.log(`[IMAGE CONVERSION] Converted ${originalImages.length} images. First: ${originalImages[0]} -> ${result.images[0]}`);
    }
  }

  // Recursively process all properties - mutate in place for nested objects
  for (const key in result) {
    // Skip special Mongoose properties and functions
    if (key === '_id' || key === '__v' || key === 'toObject' || key === 'toJSON' || typeof result[key] === 'function') {
      continue;
    }
    
    // Handle nested objects and arrays
    if (result[key] !== null && typeof result[key] === 'object') {
      // For arrays, map each item
      if (Array.isArray(result[key])) {
        result[key] = result[key].map(item => 
          typeof item === 'object' && item !== null 
            ? convertAllImagesInObject(item, baseUrl, depth + 1)
            : item
        );
      } else {
        // For objects, recursively convert
        result[key] = convertAllImagesInObject(result[key], baseUrl, depth + 1);
      }
    }
  }

  return result;
};

