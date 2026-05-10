# AWS S3 Integration Implementation

This document outlines the complete AWS S3 bucket integration for the Mobile System project.

## 🚀 Implementation Overview

The project now supports AWS S3 for file storage with the following features:
- Direct S3 uploads with pre-signed URLs
- Image optimization and compression
- Multiple file type support
- Secure file handling
- Migration from local storage

## 📁 New Files Created

### Backend Files
- `config/awsConfig.js` - AWS S3 configuration and utilities
- `config/s3MulterConfig.js` - S3-specific multer configuration
- `utils/imageOptimizer.js` - Image processing and optimization
- `controllers/uploadController.js` - S3 upload endpoints
- `routes/uploadRoutes.js` - Upload API routes
- `scripts/migrateToS3.js` - Migration script for existing files

### Frontend Files
- `src/Components/S3ImageUpload/S3ImageUpload.jsx` - S3 upload component
- `src/Components/S3ImageUpload/S3ImageUpload.css` - Upload component styles
- `src/Components/S3ImageDisplay/S3ImageDisplay.jsx` - S3 image display component
- `src/Components/S3ImageDisplay/S3ImageDisplay.css` - Display component styles
- `src/Components/ProfileUpdate/ProfileUpdate.jsx` - Updated profile component
- `src/Components/ProfileUpdate/ProfileUpdate.css` - Profile component styles
- `src/services/s3Service.js` - S3 service utilities

## 🔧 Configuration

### Environment Variables
Add these to your `.env` file:
```env
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=raxwo-mobile-system
AWS_S3_BUCKET_URL=https://raxwo-mobile-system.s3.eu-north-1.amazonaws.com
```

### Dependencies Added
```json
{
  "aws-sdk": "^2.1691.0",
  "multer-s3": "^3.0.1",
  "sharp": "^0.33.0"
}
```

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd Mobile-System-Backend
npm install
```

### 2. Configure Environment
Create or update your `.env` file with the AWS credentials provided.

### 3. Test S3 Connection
```bash
npm start
```
The server will start and S3 integration will be available.

## 📡 API Endpoints

### Upload Endpoints
- `GET /api/upload/config` - Get S3 configuration
- `POST /api/upload/generate-upload-url` - Generate pre-signed upload URL
- `POST /api/upload/upload` - Upload file through server
- `POST /api/upload/delete` - Delete file from S3
- `GET /api/upload/download-url` - Get download URL

### Updated Endpoints
- `POST /api/customer/update-profile` - Now uses S3 for profile pictures

## 🔄 Migration Process

### 1. Dry Run Migration
```bash
npm run migrate-to-s3
```
This will show what files would be migrated without making changes.

### 2. Live Migration
```bash
npm run migrate-to-s3-live
```
This will actually migrate existing files to S3 and update database records.

## 🎨 Frontend Usage

### S3ImageUpload Component
```jsx
import S3ImageUpload from './Components/S3ImageUpload/S3ImageUpload';

<S3ImageUpload
  onUploadSuccess={(result) => console.log('Upload successful:', result)}
  onUploadError={(error) => console.error('Upload failed:', error)}
  userId={user._id}
  userRole="customers"
  maxSize={5 * 1024 * 1024} // 5MB
  acceptedTypes={['image/jpeg', 'image/png', 'image/gif']}
/>
```

### S3ImageDisplay Component
```jsx
import S3ImageDisplay from './Components/S3ImageDisplay/S3ImageDisplay';

<S3ImageDisplay
  src="https://raxwo-mobile-system.s3.eu-north-1.amazonaws.com/path/to/image.jpg"
  alt="Profile picture"
  fallbackSrc="/placeholder.png"
/>
```

### S3Service Usage
```javascript
import s3Service from './services/s3Service';

// Upload image
const result = await s3Service.uploadImage(file, userId, 'customers');

// Validate file
const validation = s3Service.validateFile(file, maxSize, allowedTypes);

// Check if URL is from S3
const isS3 = s3Service.isS3Url(url);
```

## 🔒 Security Features

- **Pre-signed URLs**: Secure temporary upload URLs
- **File Validation**: Server-side type and size validation
- **Image Optimization**: Automatic compression and resizing
- **EXIF Stripping**: Privacy protection by removing metadata
- **Access Control**: IAM policies for bucket access

## 📊 Performance Optimizations

- **Direct S3 Uploads**: Files uploaded directly to S3, not through server
- **Image Optimization**: Multiple sizes and compression
- **CDN Ready**: CloudFront distribution support
- **Lazy Loading**: Frontend optimization
- **Caching**: Browser and CDN caching

## 🗂️ S3 Bucket Structure

```
raxwo-mobile-system/
├── profiles/
│   ├── customers/
│   ├── admins/
│   └── employers/
├── products/
│   ├── images/
│   └── thumbnails/
└── temp/
    └── uploads/
```

## 🐛 Troubleshooting

### Common Issues

1. **AWS Credentials Error**
   - Verify credentials in `.env` file
   - Check AWS region configuration

2. **Upload Failures**
   - Check file size limits
   - Verify file type restrictions
   - Check network connectivity

3. **Migration Issues**
   - Run dry run first: `npm run migrate-to-s3`
   - Check file permissions
   - Verify database connections

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## 📈 Monitoring

- **CloudWatch**: Monitor S3 usage and costs
- **Error Logging**: Comprehensive error tracking
- **Upload Metrics**: Success/failure rates
- **Performance Metrics**: Upload speeds and optimization

## 🔄 Rollback Plan

If issues occur:
1. Revert to local storage by changing multer config
2. Update database records to use local paths
3. Keep S3 files as backup

## 📝 Next Steps

1. **Install Dependencies**: Run `npm install` in backend
2. **Configure Environment**: Add AWS credentials to `.env`
3. **Test Upload**: Use the new S3ImageUpload component
4. **Migrate Data**: Run migration script for existing files
5. **Monitor Usage**: Set up CloudWatch monitoring

## 🆘 Support

For issues or questions:
1. Check the error logs
2. Verify AWS credentials and permissions
3. Test with small files first
4. Check network connectivity to AWS

The implementation is production-ready and includes comprehensive error handling, security measures, and performance optimizations.

