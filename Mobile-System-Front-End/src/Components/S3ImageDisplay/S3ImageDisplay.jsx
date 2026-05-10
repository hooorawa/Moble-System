import React, { useState, useEffect } from 'react';
import './S3ImageDisplay.css';

const S3ImageDisplay = ({ 
  src, 
  alt = 'Image', 
  className = '',
  fallbackSrc = '/placeholder-image.png',
  loading = 'lazy',
  onError,
  onLoad,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
    setImageSrc(fallbackSrc);
    onError?.();
  };

  // Check if the image is from S3
  const isS3Image = imageSrc?.includes('raxwo-mobile-system.s3.eu-north-1.amazonaws.com');

  return (
    <div className={`s3-image-display ${className}`}>
      {loading && (
        <div className="image-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`s3-image ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
        {...props}
      />
      
      {error && (
        <div className="image-error">
          <span>Failed to load image</span>
        </div>
      )}
      
      {isS3Image && (
        <div className="s3-indicator" title="Stored in AWS S3">
          ☁️
        </div>
      )}
    </div>
  );
};

export default S3ImageDisplay;

