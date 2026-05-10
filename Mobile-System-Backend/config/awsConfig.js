import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Validate required AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('WARNING: AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

// Create S3 instance
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4'
});

// S3 configuration
export const s3Config = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'raxwo-mobile-system',
  region: process.env.AWS_REGION || 'eu-north-1',
  bucketUrl: `https://${process.env.AWS_S3_BUCKET_NAME || 'raxwo-mobile-system'}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com`
};

// Upload file to S3
export const uploadToS3 = async (file, key, contentType) => {
  try {
    const uploadParams = {
      Bucket: s3Config.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType
    };

    const result = await s3.upload(uploadParams).promise();
    return {
      success: true,
      location: result.Location,
      key: result.Key,
      bucket: result.Bucket
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from S3
export const deleteFromS3 = async (key) => {
  try {
    const deleteParams = {
      Bucket: s3Config.bucketName,
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();
    return { success: true };
  } catch (error) {
    console.error('S3 Delete Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate pre-signed URL for upload
export const generatePresignedUploadUrl = async (key, contentType, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: s3Config.bucketName,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    return {
      success: true,
      uploadUrl: url,
      key: key,
      expiresIn: expiresIn
    };
  } catch (error) {
    console.error('Presigned URL Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate pre-signed URL for download
export const generatePresignedDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: s3Config.bucketName,
      Key: key,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return {
      success: true,
      downloadUrl: url,
      key: key,
      expiresIn: expiresIn
    };
  } catch (error) {
    console.error('Presigned Download URL Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// List files in S3 bucket
export const listS3Files = async (prefix = '') => {
  try {
    const params = {
      Bucket: s3Config.bucketName,
      Prefix: prefix,
      MaxKeys: 1000
    };

    const result = await s3.listObjectsV2(params).promise();
    return {
      success: true,
      files: result.Contents || []
    };
  } catch (error) {
    console.error('S3 List Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default s3;

