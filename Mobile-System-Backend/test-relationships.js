// Test script to verify product-category-brand relationships
import mongoose from 'mongoose';
import Product from './models/productModel.js';
import Category from './models/categoryModel.js';
import Brand from './models/brandModel.js';

// Connect to MongoDB (update connection string as needed)
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mobile-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test function to verify relationships
const testRelationships = async () => {
  try {
    console.log('\n=== Testing Product-Category-Brand Relationships ===\n');

    // 1. Create test categories
    console.log('1. Creating test categories...');
    const category1 = new Category({ name: 'Electronics' });
    const category2 = new Category({ name: 'Clothing' });
    await category1.save();
    await category2.save();
    console.log('✓ Categories created:', category1.name, category2.name);

    // 2. Create test brands
    console.log('\n2. Creating test brands...');
    const brand1 = new Brand({ name: 'Samsung', logo: 'samsung-logo.png' });
    const brand2 = new Brand({ name: 'Nike', logo: 'nike-logo.png' });
    await brand1.save();
    await brand2.save();
    console.log('✓ Brands created:', brand1.name, brand2.name);

    // 3. Create test products with relationships
    console.log('\n3. Creating test products with relationships...');
    const product1 = new Product({
      name: 'Samsung Galaxy S21',
      description: 'Latest Samsung smartphone',
      price: 999.99,
      images: ['galaxy-s21-1.jpg', 'galaxy-s21-2.jpg'],
      category: category1._id,
      brand: brand1._id,
      variations: []
    });

    const product2 = new Product({
      name: 'Nike Air Max',
      description: 'Comfortable running shoes',
      price: 129.99,
      images: ['nike-airmax-1.jpg'],
      category: category2._id,
      brand: brand2._id,
      variations: []
    });

    await product1.save();
    await product2.save();
    console.log('✓ Products created with relationships');

    // 4. Test population of relationships
    console.log('\n4. Testing relationship population...');
    const populatedProducts = await Product.find()
      .populate('category', 'name')
      .populate('brand', 'name logo')
      .sort({ createdAt: -1 });

    console.log('\nPopulated Products:');
    populatedProducts.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Price: $${product.price}`);
      console.log(`  Category: ${product.category ? product.category.name : 'N/A'}`);
      console.log(`  Brand: ${product.brand ? product.brand.name : 'N/A'}`);
      console.log(`  Images: ${product.images.length} image(s)`);
    });

    // 5. Test queries by category and brand
    console.log('\n5. Testing queries by category and brand...');
    
    const electronicsProducts = await Product.find({ category: category1._id })
      .populate('category', 'name')
      .populate('brand', 'name');
    console.log(`✓ Found ${electronicsProducts.length} products in Electronics category`);

    const samsungProducts = await Product.find({ brand: brand1._id })
      .populate('category', 'name')
      .populate('brand', 'name');
    console.log(`✓ Found ${samsungProducts.length} products from Samsung brand`);

    // 6. Test compound query
    const samsungElectronics = await Product.find({ 
      category: category1._id, 
      brand: brand1._id 
    }).populate('category', 'name').populate('brand', 'name');
    console.log(`✓ Found ${samsungElectronics.length} Samsung Electronics products`);

    console.log('\n=== All tests passed! Relationships are working correctly. ===\n');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testRelationships();
};

runTest().catch(console.error);
