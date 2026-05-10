import React, { useState, useEffect } from 'react';
import './AdminProduct.css';
import product_icon from '../../../Assets/product.png';
import ProductVariantManager from '../../../Components/ProductVariantManager/ProductVariantManager.jsx';

const AdminProduct = () => {
  const [products, setProducts] = useState([]);
  const [variations, setVariations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    images: [], // Will store File objects
    variations: [],
    category: '',
    brand: '',
    specifications: [],
    warranty: '',
    emiNumber: ''
  });
  const [updateFormData, setUpdateFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    images: [], // Will store File objects
    variations: [],
    category: '',
    brand: '',
    specifications: [],
    warranty: '',
    emiNumber: ''
  });

  // Fetch products, variations, categories, and brands on component mount
  useEffect(() => {
    fetchProducts();
    fetchVariations();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Fetched products:', data);
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVariations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/variation/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Fetched variations:', data);
        setVariations(data.variations || []);
      } else {
        console.error('Failed to fetch variations or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setVariations([]);
      }
    } catch (error) {
      console.error('Error fetching variations:', error);
      setVariations([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/category/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Fetched categories:', data);
        setCategories(data.categories || []);
      } else {
        console.error('Failed to fetch categories or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/brand/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Fetched brands:', data);
        setBrands(data.brands || []);
      } else {
        console.error('Failed to fetch brands or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processImageFiles(files, e.target);
    }
  };

  const processImageFiles = (files, inputElement) => {
    // Check file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setErrorMessage(`Some files are too large. Maximum size is 5MB per file.`);
      return;
    }
    
    // Calculate how many more images can be added
    const remainingSlots = 5 - formData.images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    const excessFiles = files.slice(remainingSlots);
    
    if (files.length > remainingSlots) {
      setErrorMessage(`You can only add ${remainingSlots} more images. ${excessFiles.length} files will be ignored.`);
    }
    
    if (filesToProcess.length === 0) {
      setErrorMessage(`Maximum 5 images allowed. You already have ${formData.images.length} images.`);
      return;
    }
    
    setProcessingImages(true);
    setErrorMessage('');
    
    const compressedImages = filesToProcess.map(file => compressImage(file));
    
    Promise.all(compressedImages).then(compressedFiles => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...compressedFiles]
      }));
      setProcessingImages(false);
      // Clear the file input
      if (inputElement) inputElement.value = '';
    }).catch(error => {
      console.error('Error compressing images:', error);
      setErrorMessage('Error processing images. Please try again.');
      setProcessingImages(false);
      // Clear the file input even on error
      if (inputElement) inputElement.value = '';
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      processImageFiles(imageFiles, null);
    } else {
      setErrorMessage('Please drop only image files.');
    }
  };

  const handleUpdateFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processUpdateImageFiles(files, e.target);
    }
  };

  const processUpdateImageFiles = (files, inputElement) => {
    // Check file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setErrorMessage(`Some files are too large. Maximum size is 5MB per file.`);
      return;
    }
    
    // Calculate how many more images can be added
    const remainingSlots = 5 - updateFormData.images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    const excessFiles = files.slice(remainingSlots);
    
    if (files.length > remainingSlots) {
      setErrorMessage(`You can only add ${remainingSlots} more images. ${excessFiles.length} files will be ignored.`);
    }
    
    if (filesToProcess.length === 0) {
      setErrorMessage(`Maximum 5 images allowed. You already have ${updateFormData.images.length} images.`);
      return;
    }
    
    setProcessingImages(true);
    setErrorMessage('');
    
    const compressedImages = filesToProcess.map(file => compressImage(file));
    
    Promise.all(compressedImages).then(compressedFiles => {
      setUpdateFormData(prev => ({
        ...prev,
        images: [...prev.images, ...compressedFiles]
      }));
      setProcessingImages(false);
      // Clear the file input
      if (inputElement) inputElement.value = '';
    }).catch(error => {
      console.error('Error compressing images:', error);
      setErrorMessage('Error processing images. Please try again.');
      setProcessingImages(false);
      // Clear the file input even on error
      if (inputElement) inputElement.value = '';
    });
  };

  const handleVariationChange = (variationId, checked) => {
    setFormData(prev => ({
      ...prev,
      variations: checked 
        ? [...prev.variations, variationId]
        : prev.variations.filter(id => id !== variationId)
    }));
  };

  const handleUpdateVariationChange = (variationId, checked) => {
    setUpdateFormData(prev => ({
      ...prev,
      variations: checked 
        ? [...prev.variations, variationId]
        : prev.variations.filter(id => id !== variationId)
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const clearAllImages = () => {
    setFormData(prev => ({
      ...prev,
      images: []
    }));
  };

  const removeUpdateImage = (index) => {
    setUpdateFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const clearAllUpdateImages = () => {
    setUpdateFormData(prev => ({
      ...prev,
      images: []
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.price || formData.quantity === '' || formData.quantity === null || formData.quantity === undefined || !formData.category || !formData.brand) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      setErrorMessage('Please select at least one image');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('quantity', parseInt(formData.quantity));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('specifications', JSON.stringify(formData.specifications));
      formDataToSend.append('warranty', formData.warranty.trim());
      formDataToSend.append('emiNumber', formData.emiNumber.trim());
      formDataToSend.append('variations', JSON.stringify(formData.variations));
      
      // Append image files
      formData.images.forEach((imageFile, index) => {
        formDataToSend.append('images', imageFile);
      });
      
      console.log('Sending product data with files:', {
        name: formData.name,
        imagesCount: formData.images.length,
        category: formData.category,
        brand: formData.brand
      });
      
      const response = await fetch('${API_BASE_URL}/product/', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Added product:', data);
        setProducts(prev => [...prev, data.product]);
        setFormData({ name: '', description: '', price: '', quantity: '', images: [], variations: [], category: '', brand: '', specifications: [], warranty: '', emiNumber: '' });
        setShowAddForm(false);
        setErrorMessage('');
        alert('Product added successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setErrorMessage('Error adding product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!updateFormData.name.trim() || !updateFormData.description.trim() || !updateFormData.price || updateFormData.quantity === '' || updateFormData.quantity === null || updateFormData.quantity === undefined || !updateFormData.category || !updateFormData.brand) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', updateFormData.name.trim());
      formDataToSend.append('description', updateFormData.description.trim());
      formDataToSend.append('price', parseFloat(updateFormData.price));
      formDataToSend.append('quantity', parseInt(updateFormData.quantity));
      formDataToSend.append('category', updateFormData.category);
      formDataToSend.append('brand', updateFormData.brand);
      formDataToSend.append('specifications', JSON.stringify(updateFormData.specifications));
      formDataToSend.append('warranty', updateFormData.warranty.trim());
      formDataToSend.append('emiNumber', updateFormData.emiNumber.trim());
      formDataToSend.append('variations', JSON.stringify(updateFormData.variations));
      
      // Append image files if new ones are selected
      if (updateFormData.images.length > 0) {
        updateFormData.images.forEach((imageFile, index) => {
          formDataToSend.append('images', imageFile);
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/product/${editingProduct._id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setProducts(prev => prev.map(product => 
          product._id === editingProduct._id ? data.product : product
        ));
        setUpdateFormData({ name: '', description: '', price: '', quantity: '', images: [], variations: [], category: '', brand: '', specifications: [], warranty: '', emiNumber: '' });
        setShowUpdateForm(false);
        setEditingProduct(null);
        setErrorMessage('');
        alert('Product updated successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setErrorMessage('Error updating product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Deleted product:', data);
        setProducts(prev => prev.filter(product => product._id !== productId));
        alert('Product deleted successfully!');
      } else {
        console.log('Delete failed:', data);
        alert(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setUpdateFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity ? product.quantity.toString() : '0',
      images: [],
      variations: product.variations ? product.variations.map(v => v._id || v) : [],
      category: product.category ? product.category._id || product.category : '',
      brand: product.brand ? product.brand._id || product.brand : '',
      specifications: product.specifications || [],
      warranty: product.warranty || '',
      emiNumber: product.emiNumber || ''
    });
    setShowUpdateForm(true);
    setErrorMessage('');
  };

  const handleCancelUpdate = () => {
    setUpdateFormData({ name: '', description: '', price: '', images: [], variations: [], category: '', brand: '', specifications: [], warranty: '', emiNumber: '' });
    setShowUpdateForm(false);
    setEditingProduct(null);
    setErrorMessage('');
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', price: '', quantity: '', images: [], variations: [], category: '', brand: '', specifications: [], warranty: '', emiNumber: '' });
    setShowAddForm(false);
    setErrorMessage('');
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManageVariants = (product) => {
    setSelectedProductForVariants(product);
  };

  const handleCloseVariantManager = () => {
    setSelectedProductForVariants(null);
  };

  return (
    <div className="admin-product-page">
      <div className="admin-product-container">
        <div className="admin-product-header">
          <div className="admin-product-title-section">
            <img src={product_icon} alt="Product" className="admin-product-header-icon" />
            <h1>Product Management</h1>
          </div>
          <button 
            className="admin-product-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add Product
          </button>
        </div>

        {showAddForm && (
          <div className="admin-product-form-container">
            <div className="admin-product-form">
              <div className="admin-product-form-header">
                <h2>Add New Product</h2>
                <button 
                  className="admin-product-close-form-btn"
                  onClick={handleCancel}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddProduct} className="admin-product-form">
                {errorMessage && (
                  <div className="admin-product-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-product-form-group">
                  <label htmlFor="name">Product Name </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="emiNumber">EMI Number</label>
                  <input
                    type="text"
                    id="emiNumber"
                    name="emiNumber"
                    value={formData.emiNumber}
                    onChange={handleInputChange}
                    placeholder="Enter EMI number"
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="description">Description </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    rows="3"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="price">Price </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter product price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="quantity">Quantity </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Enter product quantity"
                    min="0"
                    step="1"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="category">Category </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="brand">Brand </label>
                  <select
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select a brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="specifications">Specifications (one per line)</label>
                  <textarea
                    id="specifications"
                    name="specifications"
                    value={formData.specifications.join('\n')}
                    onChange={(e) => {
                      const specs = e.target.value.split('\n').filter(spec => spec.trim());
                      setFormData(prev => ({ ...prev, specifications: specs }));
                    }}
                    placeholder="Enter specifications, one per line&#10;Example:&#10;Sleek Design: Glass back, slim bezels&#10;6.7&quot; Display: 120Hz, 1,200 nits&#10;Performance: Snapdragon 6 Gen 3, enhanced cooling"
                    rows="4"
                    className="admin-product-textarea"
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="warranty">Warranty Information</label>
                  <input
                    type="text"
                    id="warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleInputChange}
                    placeholder="e.g., 06 Months seller warranty"
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="images">Images  ({formData.images.length}/5)</label>
                  
                  <div 
                    className={`admin-product-image-dropzone ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="admin-product-dropzone-content">
                      <div className="admin-product-dropzone-icon"></div>
                      <p className="admin-product-dropzone-text">
                        {formData.images.length === 0 
                          ? "Select the images"
                          : `Add more images (${5 - formData.images.length} remaining)`
                        }
                      </p>
                      {/* <p className="admin-product-dropzone-hint">
                        Supports up to 5 images, max 5MB each
                      </p> */}
                    </div>
                    
                    <input
                      type="file"
                      id="images"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      required
                      disabled={processingImages || formData.images.length >= 5}
                      className="admin-product-file-input"
                    />
                  </div>
                  
                  {processingImages && (
                    <div className="admin-product-processing">
                      Processing images...
                    </div>
                  )}
                  
                  {formData.images.length > 0 && (
                    <div className="admin-product-images-preview">
                      <div className="admin-product-images-header">
                        {/* <span>Selected Images ({formData.images.length}/5)</span> */}
                        <button
                          type="button"
                          onClick={clearAllImages}
                          className="admin-product-clear-all-btn"
                          title="Clear all images"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="admin-product-images-grid">
                        {formData.images.map((image, index) => (
                          <div key={index} className="admin-product-image-item">
                            <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="admin-product-remove-image"
                              title="Remove image"
                            >
                              ×
                            </button>
                            <div className="admin-product-image-number">{index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.images.length > 0 && formData.images.length < 5 && (
                    <button
                      type="button"
                      className="admin-product-add-more-btn"
                      onClick={() => document.getElementById('images').click()}
                      disabled={processingImages}
                    >
                      + Add More Images
                    </button>
                  )}
                </div>

                <div className="admin-product-form-group">
                  <label>Variations</label>
                  <div className="admin-product-variations-list">
                    {variations.map((variation) => (
                      <label key={variation._id} className="admin-product-variation-item">
                        <input
                          type="checkbox"
                          checked={formData.variations.includes(variation._id)}
                          onChange={(e) => handleVariationChange(variation._id, e.target.checked)}
                        />
                        <span>{variation.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="admin-product-form-actions">
                  <button 
                    type="button" 
                    className="admin-product-cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-product-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUpdateForm && (
          <div className="admin-product-form-container">
            <div className="admin-product-form">
              <div className="admin-product-form-header">
                <h2>Update Product</h2>
                <button 
                  className="admin-product-close-form-btn"
                  onClick={handleCancelUpdate}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="admin-product-form">
                {errorMessage && (
                  <div className="admin-product-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-product-form-group">
                  <label htmlFor="updateName">Product Name </label>
                  <input
                    type="text"
                    id="updateName"
                    name="name"
                    value={updateFormData.name}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="updateEmiNumber">EMI Number</label>
                  <input
                    type="text"
                    id="updateEmiNumber"
                    name="emiNumber"
                    value={updateFormData.emiNumber}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter EMI number"
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="updateDescription">Description </label>
                  <textarea
                    id="updateDescription"
                    name="description"
                    value={updateFormData.description}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter product description"
                    rows="3"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="updatePrice">Price </label>
                  <input
                    type="number"
                    id="updatePrice"
                    name="price"
                    value={updateFormData.price}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter product price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="updateQuantity">Quantity </label>
                  <input
                    type="number"
                    id="updateQuantity"
                    name="quantity"
                    value={updateFormData.quantity}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter product quantity"
                    min="0"
                    step="1"
                    required
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="updateCategory">Category </label>
                  <select
                    id="updateCategory"
                    name="category"
                    value={updateFormData.category}
                    onChange={handleUpdateInputChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="updateBrand">Brand </label>
                  <select
                    id="updateBrand"
                    name="brand"
                    value={updateFormData.brand}
                    onChange={handleUpdateInputChange}
                    required
                  >
                    <option value="">Select a brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

              

                <div className="admin-product-form-group">
                  <label htmlFor="updateWarranty">Warranty Information</label>
                  <input
                    type="text"
                    id="updateWarranty"
                    name="warranty"
                    value={updateFormData.warranty}
                    onChange={handleUpdateInputChange}
                    placeholder="e.g., 06 Months seller warranty"
                  />
                </div>

                <div className="admin-product-form-group">
                  <label htmlFor="updateImages">Images ( Optional ) ( {updateFormData.images.length}/5 )</label>
                  
                  <div 
                    className={`admin-product-image-dropzone ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="admin-product-dropzone-content">
                      <div className="admin-product-dropzone-icon"></div>
                      <p className="admin-product-dropzone-text">
                        {updateFormData.images.length === 0 
                          ? "Select the images"
                          : `Add more images (${5 - updateFormData.images.length} remaining)`
                        }
                      </p>
                      {/* <p className="admin-product-dropzone-hint">
                        Supports up to 5 images, max 5MB each
                      </p> */}
                    </div>
                    
                    <input
                      type="file"
                      id="updateImages"
                      accept="image/*"
                      multiple
                      onChange={handleUpdateFileChange}
                      disabled={processingImages || updateFormData.images.length >= 5}
                      className="admin-product-file-input"
                    />
                  </div>
                  
                  {processingImages && (
                    <div className="admin-product-processing">
                      Processing images...
                    </div>
                  )}
                  
                  {updateFormData.images.length > 0 && (
                    <div className="admin-product-images-preview">
                      <div className="admin-product-images-header">
                        <span>New Images ({updateFormData.images.length}/5)</span>
                        <button
                          type="button"
                          onClick={clearAllUpdateImages}
                          className="admin-product-clear-all-btn"
                          title="Clear all new images"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="admin-product-images-grid">
                        {updateFormData.images.map((image, index) => (
                          <div key={index} className="admin-product-image-item">
                            <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} />
                            <button
                              type="button"
                              onClick={() => removeUpdateImage(index)}
                              className="admin-product-remove-image"
                              title="Remove image"
                            >
                              ×
                            </button>
                            <div className="admin-product-image-number">{index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {updateFormData.images.length > 0 && updateFormData.images.length < 5 && (
                    <button
                      type="button"
                      className="admin-product-add-more-btn"
                      onClick={() => document.getElementById('updateImages').click()}
                      disabled={processingImages}
                    >
                      + Add More Images
                    </button>
                  )}
                  
                  {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                    <div className="admin-product-current-images">
                      <p>Current images:</p>
                      <div className="admin-product-current-images-list">
                        {editingProduct.images.map((image, index) => (
                          <img key={index} src={image} alt={`Current ${index + 1}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="admin-product-form-group">
                  <label>Variations</label>
                  <div className="admin-product-variations-list">
                    {variations.map((variation) => (
                      <label key={variation._id} className="admin-product-variation-item">
                        <input
                          type="checkbox"
                          checked={updateFormData.variations.includes(variation._id)}
                          onChange={(e) => handleUpdateVariationChange(variation._id, e.target.checked)}
                        />
                        <span>{variation.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="admin-product-form-actions">
                  <button 
                    type="button" 
                    className="admin-product-cancel-btn"
                    onClick={handleCancelUpdate}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-product-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-product-products-list">
          <div className="admin-product-search-section">
            <h2>Products ({filteredProducts.length})</h2>
            <div className="admin-product-search-container">
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-product-search-input"
              />
            </div>
          </div>
          
          {loading && products.length === 0 ? (
            <div className="admin-product-loading">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="admin-product-no-products">
              <p>{searchTerm ? `No products found matching "${searchTerm}"` : 'No products found. Add your first product above.'}</p>
            </div>
          ) : (
            <div className="admin-product-table-container">
              <table className="admin-product-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>EMI Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="admin-product-table-row">
                      <td className="admin-product-table-image">
                        <img 
                          src={product.images && product.images.length > 0 ? 
                            product.images[0] : 
                            '/placeholder-product.png'} 
                          alt={product.name || 'Product Image'} 
                          onError={(e) => {
                            e.target.src = '/placeholder-product.png';
                          }}
                        />
                      </td>
                      <td className="admin-product-table-name">
                        {product.name || 'Unnamed Product'}
                      </td>
                      <td className="admin-product-table-price">
                        LKR {product.price ? product.price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="admin-product-table-quantity">
                        {product.quantity !== undefined ? product.quantity : 'N/A'}
                      </td>
                      <td className="admin-product-table-category">
                        {product.category ? (product.category.name || product.category) : 'N/A'}
                      </td>
                      <td className="admin-product-table-brand">
                        {product.brand ? (product.brand.name || product.brand) : 'N/A'}
                      </td>
                      <td className="admin-product-table-emi-number">
                        {product.emiNumber ? product.emiNumber : 'N/A'}
                      </td>
                      <td className="admin-product-table-actions">
                        <button 
                          className="admin-product-variant-btn"
                          onClick={() => handleManageVariants(product)}
                          title="Manage variants"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                          </svg>
                          Variants
                        </button>
                        <button 
                          className="admin-product-edit-btn"
                          onClick={() => handleEditProduct(product)}
                          title="Edit product"
                        >
                          Edit
                        </button>
                        <button 
                          className="admin-product-delete-btn"
                          onClick={() => handleDeleteProduct(product._id)}
                          title="Delete product"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>  
          )}
        </div>

        {/* Product Variant Manager */}
        {selectedProductForVariants && (
          <div className="variant-manager-modal">
            <div className="variant-manager-modal-overlay" onClick={handleCloseVariantManager}></div>
            <div className="variant-manager-modal-content">
              <div className="variant-manager-modal-header">
                <h2>Manage Variants</h2>
                <button 
                  className="variant-manager-close-btn"
                  onClick={handleCloseVariantManager}
                >
                  ×
                </button>
              </div>
              <ProductVariantManager 
                productId={selectedProductForVariants._id}
                productName={selectedProductForVariants.name}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProduct;
