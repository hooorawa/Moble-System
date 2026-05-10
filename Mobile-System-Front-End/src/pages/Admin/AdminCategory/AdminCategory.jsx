import React, { useState, useEffect } from 'react';
import './AdminCategory.css';
import category_icon from '../../../Assets/category.png';
import ApiService from '../../../services/api';

const AdminCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [updateCategoryName, setUpdateCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryUsage, setCategoryUsage] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchCategoryUsage();
  }, []);

  const fetchCategoryUsage = async () => {
    try {
      const data = await ApiService.request('/category/usage');
      setCategoryUsage(data.usage || {});
    } catch (error) {
      // Silently fail - category usage is not critical for page functionality
      setCategoryUsage({});
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await ApiService.request('/category/');
      
      // Filter out any invalid categories (null, undefined, or missing _id)
      const validCategories = (data.categories || []).filter(category => 
        category && 
        category._id && 
        typeof category === 'object'
      );
      
      setCategories(validCategories);
    } catch (error) {
      setErrorMessage('Failed to fetch categories. Please ensure the server is running.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setErrorMessage('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const data = await ApiService.request('/category/add', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName.trim() })
      });
      
      if (data.success) {
        setCategories(prev => [...prev, data.category]);
        setCategoryName('');
        setShowAddForm(false);
        setErrorMessage('');
        alert('Category added successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to add category');
      }
    } catch (error) {
      setErrorMessage('Error adding category. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setLoading(true);
      const data = await ApiService.request(`/category/delete/${categoryId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        setCategories(prev => prev.filter(cat => cat._id !== categoryId));
        alert('Category deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch (error) {
      alert('Error deleting category. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!updateCategoryName.trim()) {
      setErrorMessage('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const data = await ApiService.request(`/category/update/${editingCategory._id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: updateCategoryName.trim() })
      });
      
      if (data.success) {
        setCategories(prev => prev.map(cat => 
          cat._id === editingCategory._id ? { ...cat, name: updateCategoryName.trim() } : cat
        ));
        setUpdateCategoryName('');
        setShowUpdateForm(false);
        setEditingCategory(null);
        setErrorMessage('');
        alert('Category updated successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to update category');
      }
    } catch (error) {
      setErrorMessage('Error updating category. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCategoryName('');
    setShowAddForm(false);
    setErrorMessage('');
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-category-page">
      <div className="admin-category-container">
        <div className="admin-category-header">
          <div className="admin-category-title-section">
            <img src={category_icon} alt="Category" className="admin-category-header-icon" />
            <h1>Category Management</h1>
          </div>
          <button 
            className="admin-category-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add Category
          </button>
        </div>

        {showAddForm && (
          <div className="admin-category-form-container">
            <div className="admin-category-form">
              <div className="admin-category-form-header">
                <h2>Add New Category</h2>
                <button 
                  className="admin-category-close-form-btn"
                  onClick={handleCancel}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddCategory} className="admin-category-form">
                {errorMessage && (
                  <div className="admin-category-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-category-form-group">
                  <label htmlFor="categoryName">Category Name</label>
                  <input
                    type="text"
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      setErrorMessage(''); // Clear error when user types
                    }}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="admin-category-form-actions">
                  <button 
                    type="button" 
                    className="admin-category-cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-category-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUpdateForm && (
          <div className="admin-category-form-container">
            <div className="admin-category-form">
              <div className="admin-category-form-header">
                <h2>Update Category</h2>
                <button 
                  className="admin-category-close-form-btn"
                  onClick={handleCancelUpdate}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateCategory} className="admin-category-form">
                {errorMessage && (
                  <div className="admin-category-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-category-form-group">
                  <label htmlFor="updateCategoryName">Category Name</label>
                  <input
                    type="text"
                    id="updateCategoryName"
                    value={updateCategoryName}
                    onChange={(e) => {
                      setUpdateCategoryName(e.target.value);
                      setErrorMessage(''); // Clear error when user types
                    }}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="admin-category-form-actions">
                  <button 
                    type="button" 
                    className="admin-category-cancel-btn"
                    onClick={handleCancelUpdate}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-category-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-category-categories-list">
          <div className="admin-category-search-section">
            <h2>Categories ({filteredCategories.length})</h2>
            <div className="admin-category-search-container">
              <input
                type="text"
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-category-search-input"
              />
            </div>
          </div>
          
          {loading && categories.length === 0 ? (
            <div className="admin-category-loading">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="admin-category-no-categories">
              <p>{searchTerm ? `No categories found matching "${searchTerm}"` : 'No categories found. Add your first category above.'}</p>
            </div>
          ) : (
            <div className="admin-category-categories-grid">
              {filteredCategories
                .filter(category => category && category._id) // Filter out invalid categories
                .map((category) => (
                  <div key={category._id} className="admin-category-card">
                    <div className="admin-category-header">
                      <h3>{category.name || 'Unnamed Category'}</h3>
                      <span className="admin-category-count">
                        {categoryUsage[category._id] ? 
                          `Used by ${categoryUsage[category._id].length} brand(s)` : 
                          'Not used'
                        }
                      </span>
                    </div>
                  
                  {categoryUsage[category._id] && (
                    <div className="admin-category-usage">
                      <p className="admin-category-usage-text">Used by: {categoryUsage[category._id].join(', ')}</p>
                    </div>
                  )}
                  
                    <div className="admin-category-actions">
                      <button 
                        className="admin-category-edit-btn"
                        onClick={() => handleEditCategory(category)}
                        title="Edit category"
                      >
                        Edit
                      </button>
                      <button 
                        className={`admin-category-delete-btn ${categoryUsage[category._id] ? 'disabled' : ''}`}
                        onClick={() => handleDeleteCategory(category._id)}
                        disabled={!!categoryUsage[category._id]}
                        title={categoryUsage[category._id] ? 'Cannot delete - category is being used by brands' : 'Delete category'}
                      >
                        {categoryUsage[category._id] ? 'In Use' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategory;
