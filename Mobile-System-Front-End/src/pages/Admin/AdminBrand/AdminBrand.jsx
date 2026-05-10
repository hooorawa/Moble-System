import React, { useState, useEffect } from 'react';
import './AdminBrand.css';
import brand_icon from '../../../Assets/brand.png';

const AdminBrand = () => {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: ''
  });
  const [updateFormData, setUpdateFormData] = useState({
    name: '',
    logo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch brands and categories on component mount
  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
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

        // Filter out any invalid brands (null, undefined, or missing _id)
        const validBrands = (data.brands || []).filter(brand => 
          brand && 
          brand._id && 
          typeof brand === 'object'
        );

        console.log('Valid brands after filtering:', validBrands);
        setBrands(validBrands);
      } else {
        console.error('Failed to fetch brands or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    } finally {
      setLoading(false);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          logo: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        setUpdateFormData(prev => ({
          ...prev,
          logo: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.logo) {
      setErrorMessage('Please enter brand name and select a logo');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(''); // Clear any previous error
      
      const response = await fetch('${API_BASE_URL}/brand/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          logo: formData.logo
        })
      });

      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        console.log('Added brand:', data);
        setBrands(prev => [...prev, data.brand]);
        setFormData({ name: '', logo: '' });
        setShowAddForm(false);
        setErrorMessage(''); // Clear error on success
        alert('Brand added successfully!');
      } else {
        console.log('Error response:', data);
        setErrorMessage(data.message || 'Failed to add brand');
        // Don't show alert for validation errors, just show error message
      }
    } catch (error) {
      console.error('Error adding brand:', error);
      setErrorMessage('Error adding brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brand/delete/${brandId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Deleted brand:', data);
        setBrands(prev => prev.filter(brand => brand._id !== brandId));
        alert('Brand deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Error deleting brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBrand = async (e) => {
    e.preventDefault();
    
    if (!updateFormData.name.trim()) {
      setErrorMessage('Please enter brand name');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${API_BASE_URL}/brand/update/${editingBrand._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updateFormData.name.trim(),
          logo: updateFormData.logo || editingBrand.logo // Keep existing logo if no new one provided
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setBrands(prev => prev.map(brand => 
          brand._id === editingBrand._id ? { ...brand, name: updateFormData.name.trim(), logo: updateFormData.logo || brand.logo } : brand
        ));
        setUpdateFormData({ name: '', logo: '' });
        setShowUpdateForm(false);
        setEditingBrand(null);
        setErrorMessage('');
        alert('Brand updated successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to update brand');
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      setErrorMessage('Error updating brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setUpdateFormData({ 
      name: brand.name, 
      logo: '' // Don't pre-fill logo, let user choose to keep existing or upload new
    });
    setShowUpdateForm(true);
    setErrorMessage('');
  };

  const handleCancelUpdate = () => {
    setUpdateFormData({ name: '', logo: '' });
    setShowUpdateForm(false);
    setEditingBrand(null);
    setErrorMessage('');
  };

  const handleCancel = () => {
    setFormData({ name: '', logo: '' });
    setShowAddForm(false);
    setErrorMessage('');
  };

  const handleManageCategories = async (brand) => {
    if (!brand || !brand._id) {
      console.warn('Invalid brand provided to handleManageCategories:', brand);
      return;
    }
    
    // Initialize brand with empty categories array
    const brandWithCategories = {
      ...brand,
      categories: brand.categories || []
    };
    setSelectedBrand(brandWithCategories);
    setShowCategoryManagement(true);
    
    // Fetch brand categories
    try {
      const response = await fetch(`${API_BASE_URL}/brand/${brand._id}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched brand categories:', data);
        setSelectedBrand(data.brand);
      } else {
        console.error('Failed to fetch brand categories');
        // Keep the brand with empty categories if fetch fails
        setSelectedBrand(brandWithCategories);
      }
    } catch (error) {
      console.error('Error fetching brand categories:', error);
      // Keep the brand with empty categories if fetch fails
      setSelectedBrand(brandWithCategories);
    }
  };

  const handleCloseCategoryManagement = () => {
    setSelectedBrand(null);
    setShowCategoryManagement(false);
  };

  const handleAddCategoryToBrand = async (categoryId) => {
    if (!selectedBrand) return;

    try {
      setLoading(true);
      const response = await fetch('${API_BASE_URL}/brand/add-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandId: selectedBrand._id,
          categoryId: categoryId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Added category to brand:', data);
        
        // Update the selected brand with new categories
        setSelectedBrand(data.brand);
        
        // Update brands list
        setBrands(prev => prev.map(brand => 
          brand._id === selectedBrand._id ? data.brand : brand
        ));
        
        alert('Category added to brand successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add category to brand');
      }
    } catch (error) {
      console.error('Error adding category to brand:', error);
      alert('Error adding category to brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCategoryFromBrand = async (categoryId) => {
    if (!selectedBrand) return;

    try {
      setLoading(true);
      const response = await fetch('${API_BASE_URL}/brand/remove-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandId: selectedBrand._id,
          categoryId: categoryId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Removed category from brand:', data);
        
        // Update the selected brand
        setSelectedBrand(data.brand);
        
        // Update brands list
        setBrands(prev => prev.map(brand => 
          brand._id === selectedBrand._id ? data.brand : brand
        ));
        
        alert('Category removed from brand successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to remove category from brand');
      }
    } catch (error) {
      console.error('Error removing category from brand:', error);
      alert('Error removing category from brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableCategories = () => {
    if (!selectedBrand) return categories;
    const brandCategoryIds = (selectedBrand.categories || []).map(cat => cat._id);
    return categories.filter(cat => !brandCategoryIds.includes(cat._id));
  };

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand =>
    brand.name && brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-brand-page">
      <div className="admin-brand-container">
        <div className="admin-brand-header">
          <div className="admin-brand-title-section">
            <img src={brand_icon} alt="Brand" className="admin-brand-header-icon" />
            <h1>Brand Management</h1>
          </div>
          <button 
            className="admin-brand-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add Brand
          </button>
        </div>

        {showAddForm && (
          <div className="admin-brand-form-container">
            <div className="admin-brand-form">
              <div className="admin-brand-form-header">
                <h2>Add New Brand</h2>
                <button 
                  className="admin-brand-close-form-btn"
                  onClick={handleCancel}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddBrand} className="admin-brand-form">
                {errorMessage && (
                  <div className="admin-brand-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-brand-form-group">
                  <label htmlFor="name">Brand Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => {
                      handleInputChange(e);
                      setErrorMessage(''); // Clear error when user types
                    }}
                    placeholder="Enter brand name"
                    required
                  />
                </div>

                <div className="admin-brand-form-group">
                  <label htmlFor="logo">Brand Logo</label>
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  {formData.logo && (
                    <div className="admin-brand-logo-preview">
                      <img src={formData.logo} alt="Logo preview" />
                    </div>
                  )}
                </div>

                <div className="admin-brand-form-actions">
                  <button 
                    type="button" 
                    className="admin-brand-cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-brand-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Brand'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUpdateForm && (
          <div className="admin-brand-form-container">
            <div className="admin-brand-form">
              <div className="admin-brand-form-header">
                <h2>Update Brand</h2>
                <button 
                  className="admin-brand-close-form-btn"
                  onClick={handleCancelUpdate}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateBrand} className="admin-brand-form">
                {errorMessage && (
                  <div className="admin-brand-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-brand-form-group">
                  <label htmlFor="updateName">Brand Name</label>
                  <input
                    type="text"
                    id="updateName"
                    name="name"
                    value={updateFormData.name}
                    onChange={(e) => {
                      handleUpdateInputChange(e);
                      setErrorMessage(''); // Clear error when user types
                    }}
                    placeholder="Enter brand name"
                    required
                  />
                </div>

                <div className="admin-brand-form-group">
                  <label htmlFor="updateLogo">Brand Logo (Optional - leave empty to keep current)</label>
                  <input
                    type="file"
                    id="updateLogo"
                    accept="image/*"
                    onChange={handleUpdateFileChange}
                  />
                  {updateFormData.logo && (
                    <div className="admin-brand-logo-preview">
                      <img src={updateFormData.logo} alt="New logo preview" />
                    </div>
                  )}
                  {editingBrand && !updateFormData.logo && (
                    <div className="admin-brand-current-logo">
                      <p>Current logo:</p>
                      <img src={editingBrand.logo} alt="Current logo" />
                    </div>
                  )}
                </div>

                <div className="admin-brand-form-actions">
                  <button 
                    type="button" 
                    className="admin-brand-cancel-btn"
                    onClick={handleCancelUpdate}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-brand-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Brand'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-brand-brands-list">
          <div className="admin-brand-search-section">
            <h2>Brands ({filteredBrands.length})</h2>
            <div className="admin-brand-search-container">
              <input
                type="text"
                placeholder="Search brands by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-brand-search-input"
              />
            </div>
          </div>
          
          {loading && brands.length === 0 ? (
            <div className="admin-brand-loading">Loading brands...</div>
          ) : filteredBrands.length === 0 ? (
            <div className="admin-brand-no-brands">
              <p>{searchTerm ? `No brands found matching "${searchTerm}"` : 'No brands found. Add your first brand above.'}</p>
            </div>
          ) : (
            <div className="admin-brand-brands-grid">
              {filteredBrands
                .filter(brand => brand && brand._id) // Filter out invalid brands
                .map((brand) => (
                  <div key={brand._id} className="admin-brand-card">
                    <div className="admin-brand-header">
                      <div className="admin-brand-logo">
                        <img 
                          src={brand.logo || '/placeholder-logo.png'} 
                          alt={brand.name || 'Brand Logo'} 
                          onError={(e) => {
                            e.target.src = '/placeholder-logo.png';
                          }}
                        />
                      </div>
                      <div className="admin-brand-info">
                        <h3>{brand.name || 'Unnamed Brand'}</h3>
                      {/* <span className="admin-brand-count">
                        {(brand.categories || []).length} categories
                      </span> */}
                    </div>
                  </div>
                  
                  <div className="admin-brand-actions">
                    <button 
                      className="admin-brand-edit-btn"
                      onClick={() => handleEditBrand(brand)}
                      title="Edit brand"
                    >
                      Edit
                    </button>
                    <button 
                      className="admin-brand-manage-btn"
                      onClick={() => handleManageCategories(brand)}
                    >
                      Manage Categories
                    </button>
                    <button 
                      className="admin-brand-delete-btn"
                      onClick={() => handleDeleteBrand(brand._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Management Modal */}
        {showCategoryManagement && selectedBrand && (
          <div className="admin-brand-category-management-modal">
            <div className="admin-brand-category-management-content">
              <div className="admin-brand-modal-header">
                <h2>Manage Categories for :- {selectedBrand.name}</h2>
                <button 
                  className="admin-brand-close-modal-btn"
                  onClick={handleCloseCategoryManagement}
                >
                  ×
                </button>
              </div>

              <div className="admin-brand-info-modal">
                <div className="admin-brand-logo-modal">
                  <img src={selectedBrand.logo} alt={selectedBrand.name} />
                </div>
                <div className="admin-brand-details">
                  <h3>{selectedBrand.name}</h3>
                  <p>{(selectedBrand.categories || []).length} categories assigned</p>
                </div>
              </div>

              <div className="admin-brand-category-management-sections">
                {/* Current Categories */}
                <div className="admin-brand-current-categories-section">
                  <h3>Current Categories ({(selectedBrand.categories || []).length})</h3>
                  {(selectedBrand.categories || []).length > 0 ? (
                    <div className="admin-brand-categories-list">
                      {(selectedBrand.categories || []).map((category) => (
                        <div key={category._id} className="admin-brand-category-item">
                          <span>{category.name}</span>
                          <button 
                            className="admin-brand-remove-btn"
                            onClick={() => handleRemoveCategoryFromBrand(category._id)}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No categories assigned to this brand.</p>
                  )}
                </div>

                {/* Available Categories */}
                <div className="admin-brand-available-categories-section">
                  <h3>Available Categories ({getAvailableCategories().length})</h3>
                  {getAvailableCategories().length > 0 ? (
                    <div className="admin-brand-categories-list">
                      {getAvailableCategories().map((category) => (
                        <div key={category._id} className="admin-brand-category-item">
                          <span>{category.name}</span>
                          <button 
                            className="admin-brand-add-btn"
                            onClick={() => handleAddCategoryToBrand(category._id)}
                            disabled={loading}
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>All categories are already assigned to this brand.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBrand;
