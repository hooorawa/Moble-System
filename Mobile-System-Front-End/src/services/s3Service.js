import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

class S3Service {
  // Get S3 configuration
  async getConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/upload/config`);
      return response.data;
    } catch (error) {
      console.error('Error getting S3 config:', error);
      throw error;
    }
  }

  // Generate pre-signed upload URL
  async generateUploadUrl(fileName, fileType, userId, userRole = 'customers') {
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/generate-upload-url`, {
        fileName,
        fileType,
        userId,
        userRole
      });
      return response.data;
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw error;
    }
  }

  // Upload file directly to S3 using pre-signed URL
  async uploadFileToS3(uploadUrl, file, onProgress) {
    try {
      const response = await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });
      return response;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  // Upload file through server (with optimization)
  async uploadFileThroughServer(file, userId, userRole = 'customers') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('userRole', userRole);

      const response = await axios.post(`${API_BASE_URL}/upload/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${progress}%`);
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file through server:', error);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFile(fileKey) {
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/delete`, {
        fileKey
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Get download URL for file
  async getDownloadUrl(fileKey) {
    try {
      const response = await axios.get(`${API_BASE_URL}/upload/download-url`, {
        params: { fileKey }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  // Complete upload flow with direct S3 upload
  async uploadImage(file, userId, userRole = 'customers', onProgress) {
    try {
      // Step 1: Get pre-signed URL
      const urlResponse = await this.generateUploadUrl(
        file.name,
        file.type,
        userId,
        userRole
      );

      if (!urlResponse.success) {
        throw new Error(urlResponse.message || 'Failed to get upload URL');
      }

      // Step 2: Upload to S3
      await this.uploadFileToS3(urlResponse.uploadUrl, file, onProgress);

      // Step 3: Return file information
      const fileUrl = `${urlResponse.bucketUrl}/${urlResponse.key}`;
      
      return {
        success: true,
        fileUrl,
        key: urlResponse.key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };
    } catch (error) {
      console.error('Error in upload flow:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Validate file before upload
  validateFile(file, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']) {
    const errors = [];

    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only images are allowed.');
    }

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get optimized image URL (for different sizes)
  getOptimizedImageUrl(originalUrl, size = 'medium') {
    if (!originalUrl || !originalUrl.includes('raxwo-mobile-system.s3.eu-north-1.amazonaws.com')) {
      return originalUrl;
    }

    // For now, return the original URL
    // In the future, you can implement different sizes by modifying the S3 key
    return originalUrl;
  }

  // Check if URL is from S3
  isS3Url(url) {
    return url && url.includes('raxwo-mobile-system.s3.eu-north-1.amazonaws.com');
  }

  // Extract S3 key from URL
  extractS3Key(url) {
    if (!this.isS3Url(url)) return null;
    
    const parts = url.split('raxwo-mobile-system.s3.eu-north-1.amazonaws.com/');
    return parts[1] || null;
  }
}

export default new S3Service();

