import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToS3, s3Config } from '../config/awsConfig.js';
import { optimizeImage } from '../utils/imageOptimizer.js';
import productModel from '../models/productModel.js';
import brandModel from '../models/brandModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration configuration
const MIGRATION_CONFIG = {
  dryRun: true, // Set to false to actually perform migration
  batchSize: 5,
  maxRetries: 3,
  delayBetweenBatches: 1000 // 1 second
};

// Migration statistics
let migrationStats = {
  totalFiles: 0,
  processedFiles: 0,
  successfulUploads: 0,
  failedUploads: 0,
  skippedFiles: 0,
  errors: []
};

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Process a single file
async function processFile(filePath, relativePath, fileType) {
  try {
    console.log(`Processing: ${relativePath}`);
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Validate file
    if (fileBuffer.length === 0) {
      console.log(`Skipping empty file: ${relativePath}`);
      migrationStats.skippedFiles++;
      return null;
    }

    // Optimize image
    const optimized = await optimizeImage(fileBuffer, 'medium');
    if (!optimized.success) {
      console.log(`Failed to optimize image: ${relativePath}`);
      migrationStats.failedUploads++;
      migrationStats.errors.push(`Optimization failed for ${relativePath}: ${optimized.error}`);
      return null;
    }

    // Generate S3 key
    const fileName = path.basename(relativePath);
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = path.extname(fileName);
    const s3Key = `${fileType}/${fileName.replace(extension, '')}-${timestamp}-${randomSuffix}${extension}`;

    if (MIGRATION_CONFIG.dryRun) {
      console.log(`[DRY RUN] Would upload ${relativePath} to s3://${s3Config.bucketName}/${s3Key}`);
      migrationStats.successfulUploads++;
      return {
        originalPath: relativePath,
        s3Key: s3Key,
        s3Url: `${s3Config.bucketUrl}/${s3Key}`
      };
    }

    // Upload to S3
    const uploadResult = await uploadToS3(
      optimized.buffer,
      s3Key,
      'image/jpeg'
    );

    if (uploadResult.success) {
      console.log(`Successfully uploaded: ${relativePath} -> ${s3Key}`);
      migrationStats.successfulUploads++;
      return {
        originalPath: relativePath,
        s3Key: s3Key,
        s3Url: uploadResult.location
      };
    } else {
      console.log(`Failed to upload: ${relativePath} - ${uploadResult.error}`);
      migrationStats.failedUploads++;
      migrationStats.errors.push(`Upload failed for ${relativePath}: ${uploadResult.error}`);
      return null;
    }
  } catch (error) {
    console.error(`Error processing ${relativePath}:`, error);
    migrationStats.failedUploads++;
    migrationStats.errors.push(`Error processing ${relativePath}: ${error.message}`);
    return null;
  }
}

// Update database with new S3 URLs
async function updateDatabase(updates) {
  if (MIGRATION_CONFIG.dryRun) {
    console.log(`[DRY RUN] Would update ${updates.length} database records`);
    return;
  }

  for (const update of updates) {
    try {
      const { model, filter, updateData } = update;
      await model.updateOne(filter, updateData);
      console.log(`Updated database record: ${JSON.stringify(updateData)}`);
    } catch (error) {
      console.error(`Database update error:`, error);
      migrationStats.errors.push(`Database update failed: ${error.message}`);
    }
  }
}

// Scan directory for files
function scanDirectory(dirPath, fileType) {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist: ${dirPath}`);
    return files;
  }

  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile()) {
      const relativePath = path.relative(path.join(__dirname, '..', 'uploads'), fullPath);
      files.push({
        fullPath,
        relativePath,
        fileType
      });
    } else if (stat.isDirectory()) {
      const subFiles = scanDirectory(fullPath, fileType);
      files.push(...subFiles);
    }
  }
  
  return files;
}

// Main migration function
async function migrateAdminImagesToS3() {
  console.log('Starting Admin Images S3 migration...');
  console.log(`Mode: ${MIGRATION_CONFIG.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const allFiles = [];
  
  // Scan admin upload directories
  const directories = [
    { path: path.join(uploadsDir, 'products'), fileType: 'products/images' },
    { path: path.join(uploadsDir, 'brands'), fileType: 'brands/logos' },
    { path: path.join(uploadsDir, 'categories'), fileType: 'categories/images' }
  ];
  
  for (const dir of directories) {
    const files = scanDirectory(dir.path, dir.fileType);
    allFiles.push(...files);
  }
  
  migrationStats.totalFiles = allFiles.length;
  console.log(`Found ${allFiles.length} admin files to migrate`);
  
  if (allFiles.length === 0) {
    console.log('No admin files found to migrate');
    return;
  }
  
  const databaseUpdates = [];
  
  // Process files in batches
  for (let i = 0; i < allFiles.length; i += MIGRATION_CONFIG.batchSize) {
    const batch = allFiles.slice(i, i + MIGRATION_CONFIG.batchSize);
    console.log(`Processing batch ${Math.floor(i / MIGRATION_CONFIG.batchSize) + 1}/${Math.ceil(allFiles.length / MIGRATION_CONFIG.batchSize)}`);
    
    for (const file of batch) {
      const result = await processFile(file.fullPath, file.relativePath, file.fileType);
      migrationStats.processedFiles++;
      
      if (result) {
        // Determine which model to update based on file path
        let model = null;
        let filter = {};
        let updateData = {};
        
        if (file.relativePath.includes('products')) {
          // This is a product image - find products with this image path
          const oldPath = `/uploads/${file.relativePath}`;
          const products = await productModel.find({ images: oldPath });
          
          for (const product of products) {
            const updatedImages = product.images.map(img => 
              img === oldPath ? result.s3Url : img
            );
            
            databaseUpdates.push({
              model: productModel,
              filter: { _id: product._id },
              updateData: { images: updatedImages }
            });
          }
        } else if (file.relativePath.includes('brands')) {
          // This is a brand logo - find brands with this logo path
          const oldPath = `/uploads/${file.relativePath}`;
          const brands = await brandModel.find({ logo: oldPath });
          
          for (const brand of brands) {
            databaseUpdates.push({
              model: brandModel,
              filter: { _id: brand._id },
              updateData: { logo: result.s3Url }
            });
          }
        }
      }
    }
    
    // Delay between batches
    if (i + MIGRATION_CONFIG.batchSize < allFiles.length) {
      await delay(MIGRATION_CONFIG.delayBetweenBatches);
    }
  }
  
  // Update database
  console.log(`Updating ${databaseUpdates.length} database records...`);
  await updateDatabase(databaseUpdates);
  
  // Print migration statistics
  console.log('\n=== Admin Images Migration Complete ===');
  console.log(`Total files: ${migrationStats.totalFiles}`);
  console.log(`Processed: ${migrationStats.processedFiles}`);
  console.log(`Successful uploads: ${migrationStats.successfulUploads}`);
  console.log(`Failed uploads: ${migrationStats.failedUploads}`);
  console.log(`Skipped files: ${migrationStats.skippedFiles}`);
  
  if (migrationStats.errors.length > 0) {
    console.log('\nErrors:');
    migrationStats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (MIGRATION_CONFIG.dryRun) {
    console.log('\nThis was a DRY RUN. No actual changes were made.');
    console.log('Set MIGRATION_CONFIG.dryRun = false to perform the actual migration.');
  }
}

// Run migration
migrateAdminImagesToS3().catch(console.error);

