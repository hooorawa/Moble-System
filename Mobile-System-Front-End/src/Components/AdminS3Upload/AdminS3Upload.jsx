import React, { useState, useRef } from 'react';
import axios from 'axios';
import './AdminS3Upload.css';

const AdminS3Upload = ({ 
  onUploadSuccess, 
  onUploadError, 
  maxSize = 10 * 1024 * 1024, // 10MB default for admin uploads
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  uploadType = 'products', // products, brands, categories
  multiple = false,
  className = '',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) {
        setError('Please select valid image files (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (file.size > maxSize) {
        setError(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
        return;
      }
    }

    setError(null);
    
    // Create preview for single file or first file for multiple
    if (files.length === 1) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(files[0]);
    }

    // Start upload
    uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const uploadPromises = files.map(file => uploadSingleFile(file));
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);

      if (successfulUploads.length > 0) {
        onUploadSuccess?.(multiple ? successfulUploads : successfulUploads[0]);
      }

      if (failedUploads.length > 0) {
        const errorMessage = failedUploads.map(f => f.error).join(', ');
        setError(`Some uploads failed: ${errorMessage}`);
        onUploadError?.(new Error(errorMessage));
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
      onUploadError?.(error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadSingleFile = async (file) => {
    try {
      // Step 1: Get pre-signed URL
      const response = await axios.post('/api/upload/generate-upload-url', {
        fileName: file.name,
        fileType: file.type,
        userId: 'admin', // Admin uploads
        userRole: 'admins'
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = response.data;

      // Step 2: Upload file directly to S3
      const uploadResponse = await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      if (uploadResponse.status === 200) {
        const fileUrl = `https://raxwo-mobile-system.s3.eu-north-1.amazonaws.com/${key}`;
        
        return {
          success: true,
          fileUrl,
          key,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        };
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Single file upload error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Upload failed'
      };
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const event = { target: { files } };
      handleFileSelect(event);
    }
  };

  return (
    <div className={`admin-s3-upload ${className}`}>
      <div
        className={`upload-area ${uploading ? 'uploading' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          multiple={multiple}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        ) : preview ? (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="preview-image" />
            <div className="preview-overlay">
              <span>Click to change</span>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📁</div>
            <p>Click to upload or drag & drop</p>
            <p className="upload-hint">
              {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}
            </p>
            <p className="upload-hint">
              Max size: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
            {multiple && <p className="upload-hint">Multiple files allowed</p>}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminS3Upload;

