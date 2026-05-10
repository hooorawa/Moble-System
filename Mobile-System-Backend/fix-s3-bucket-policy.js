import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-north-1'
});

const s3 = new AWS.S3();

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'raxwo-mobile-system';

// Bucket policy to allow public read access for product images
const bucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${bucketName}/products/images/*`
    }
  ]
};

async function updateBucketPolicy() {
  try {
    console.log('Updating S3 bucket policy...');
    console.log('Bucket:', bucketName);
    console.log('Policy:', JSON.stringify(bucketPolicy, null, 2));
    
    const params = {
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    };
    
    await s3.putBucketPolicy(params).promise();
    console.log('✅ Bucket policy updated successfully!');
    console.log('Product images should now be publicly accessible.');
    
  } catch (error) {
    console.error('❌ Error updating bucket policy:', error.message);
    
    if (error.code === 'NoSuchBucket') {
      console.error('Bucket does not exist:', bucketName);
    } else if (error.code === 'AccessDenied') {
      console.error('Access denied. Please check your AWS credentials and permissions.');
    } else if (error.code === 'MalformedPolicy') {
      console.error('Policy format is invalid.');
    }
  }
}

// Run the update
updateBucketPolicy();
