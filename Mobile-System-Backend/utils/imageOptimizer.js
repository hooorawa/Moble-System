import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image optimization configurations
const imageConfigs = {
  thumbnail: {
    width: 150,
    height: 150,
    quality: 80,
    format: 'jpeg'
  },
  medium: {
    width: 400,
    height: 400,
    quality: 85,
    format: 'jpeg'
  },
  large: {
    width: 800,
    height: 800,
    quality: 90,
    format: 'jpeg'
  }
};

// Optimize image buffer
export const optimizeImage = async (imageBuffer, config = 'medium') => {
  try {
    const settings = imageConfigs[config] || imageConfigs.medium;
    
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(settings.width, settings.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: settings.quality })
      .toBuffer();

    return {
      success: true,
      buffer: optimizedBuffer,
      size: optimizedBuffer.length,
      config: config
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create multiple sizes of an image
export const createImageSizes = async (imageBuffer) => {
  try {
    const results = {};
    
    for (const [size, config] of Object.entries(imageConfigs)) {
      const optimized = await optimizeImage(imageBuffer, size);
      if (optimized.success) {
        results[size] = optimized.buffer;
      }
    }

    return {
      success: true,
      sizes: results
    };
  } catch (error) {
    console.error('Create image sizes error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate image file
export const validateImage = async (imageBuffer) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    const validation = {
      isValid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha
    };

    // Check if image is too large
    if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB
      validation.isValid = false;
      validation.error = 'Image too large (max 10MB)';
    }

    // Check dimensions
    if (metadata.width > 4000 || metadata.height > 4000) {
      validation.isValid = false;
      validation.error = 'Image dimensions too large (max 4000x4000)';
    }

    return validation;
  } catch (error) {
    console.error('Image validation error:', error);
    return {
      isValid: false,
      error: 'Invalid image file'
    };
  }
};

// Convert image to different format
export const convertImageFormat = async (imageBuffer, targetFormat = 'jpeg', quality = 90) => {
  try {
    let sharpInstance = sharp(imageBuffer);

    let outputBuffer;
    switch (targetFormat.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
        break;
      case 'png':
        outputBuffer = await sharpInstance.png({ quality }).toBuffer();
        break;
      case 'webp':
        outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
        break;
      default:
        throw new Error(`Unsupported format: ${targetFormat}`);
    }

    return {
      success: true,
      buffer: outputBuffer,
      format: targetFormat,
      size: outputBuffer.length
    };
  } catch (error) {
    console.error('Image format conversion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate image thumbnail
export const generateThumbnail = async (imageBuffer, size = 150) => {
  try {
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return {
      success: true,
      buffer: thumbnailBuffer,
      size: thumbnailBuffer.length
    };
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Strip EXIF data for privacy
export const stripExifData = async (imageBuffer) => {
  try {
    const strippedBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      success: true,
      buffer: strippedBuffer,
      size: strippedBuffer.length
    };
  } catch (error) {
    console.error('EXIF stripping error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  optimizeImage,
  createImageSizes,
  validateImage,
  convertImageFormat,
  generateThumbnail,
  stripExifData
};

