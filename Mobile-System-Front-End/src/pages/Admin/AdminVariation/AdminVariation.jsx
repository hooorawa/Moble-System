import { API_BASE_URL } from './../../../config';
import React, { useState, useEffect } from 'react';
import './AdminVariation.css';
import variation_icon from '../../../Assets/variant.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_BASE_URL + 'api'));

const AdminVariation = () => {
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [variationName, setVariationName] = useState('');
  const [updateVariationName, setUpdateVariationName] = useState('');
  const [editingVariation, setEditingVariation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch variations on component mount
  useEffect(() => {
    fetchVariations();
  }, []);

  const fetchVariations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/variation/`, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariation = async (e) => {
    e.preventDefault();

    if (!variationName.trim()) {
      setErrorMessage('Please enter a variation name');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await fetch(`${API_BASE_URL}/variation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: variationName.trim() })
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Added variation:', data);
        setVariations(prev => [...prev, data.variation]);
        setVariationName('');
        setShowAddForm(false);
        setErrorMessage('');
        alert('Variation added successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to add variation:', errorText);
        setErrorMessage('Failed to add variation. Please try again.');
      }
    } catch (error) {
      console.error('Error adding variation:', error);
      setErrorMessage('Error adding variation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariation = async (e) => {
    e.preventDefault();

    if (!updateVariationName.trim()) {
      setErrorMessage('Please enter a variation name');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await fetch(`${API_BASE_URL}/variation/${editingVariation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: updateVariationName.trim() })
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Updated variation:', data);
        setVariations(prev => prev.map(variation => 
          variation._id === editingVariation._id ? { ...variation, name: updateVariationName.trim() } : variation
        ));
        setUpdateVariationName('');
        setShowUpdateForm(false);
        setEditingVariation(null);
        setErrorMessage('');
        alert('Variation updated successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to update variation:', errorText);
        setErrorMessage('Failed to update variation. Please try again.');
      }
    } catch (error) {
      console.error('Error updating variation:', error);
      setErrorMessage('Error updating variation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariation = async (variationId) => {
    if (!window.confirm('Are you sure you want to delete this variation?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/variation/${variationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Deleted variation:', data);
        setVariations(prev => prev.filter(variation => variation._id !== variationId));
        alert('Variation deleted successfully!');
      } else {
        console.log('Delete failed:', data);
        alert(data.message || 'Failed to delete variation');
      }
    } catch (error) {
      console.error('Error deleting variation:', error);
      alert('Error deleting variation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVariation = (variation) => {
    setEditingVariation(variation);
    setUpdateVariationName(variation.name);
    setShowUpdateForm(true);
    setErrorMessage('');
  };

  const handleCancelUpdate = () => {
    setUpdateVariationName('');
    setShowUpdateForm(false);
    setEditingVariation(null);
    setErrorMessage('');
  };

  const handleCancel = () => {
    setVariationName('');
    setShowAddForm(false);
    setErrorMessage('');
  };

  // Filter variations based on search term
  const filteredVariations = variations.filter(variation =>
    variation.name && variation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-variation-page">
      <div className="admin-variation-container">
        <div className="admin-variation-header">
          <div className="admin-variation-title-section">
            <img src={variation_icon} alt="Variation" className="admin-variation-header-icon" />
            <h1>Variation Management</h1>
          </div>
          <button 
            className="admin-variation-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add Variation
          </button>
        </div>

        {showAddForm && (
          <div className="admin-variation-form-container">
            <div className="admin-variation-form">
              <div className="admin-variation-form-header">
                <h2>Add New Variation</h2>
                <button 
                  className="admin-variation-close-form-btn"
                  onClick={handleCancel}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddVariation} className="admin-variation-form">
                {errorMessage && (
                  <div className="admin-variation-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-variation-form-group">
                  <label htmlFor="variationName">Variation Name</label>
                  <input
                    type="text"
                    id="variationName"
                    value={variationName}
                    onChange={(e) => {
                      setVariationName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter variation name"
                    required
                  />
                </div>

                <div className="admin-variation-form-actions">
                  <button 
                    type="button" 
                    className="admin-variation-cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-variation-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Variation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUpdateForm && (
          <div className="admin-variation-form-container">
            <div className="admin-variation-form">
              <div className="admin-variation-form-header">
                <h2>Update Variation</h2>
                <button 
                  className="admin-variation-close-form-btn"
                  onClick={handleCancelUpdate}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateVariation} className="admin-variation-form">
                {errorMessage && (
                  <div className="admin-variation-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-variation-form-group">
                  <label htmlFor="updateVariationName">Variation Name</label>
                  <input
                    type="text"
                    id="updateVariationName"
                    value={updateVariationName}
                    onChange={(e) => {
                      setUpdateVariationName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter variation name"
                    required
                  />
                </div>

                <div className="admin-variation-form-actions">
                  <button 
                    type="button" 
                    className="admin-variation-cancel-btn"
                    onClick={handleCancelUpdate}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-variation-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Variation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-variation-variations-list">
          <div className="admin-variation-search-section">
            <h2>Variations ({filteredVariations.length})</h2>
            <div className="admin-variation-search-container">
              <input
                type="text"
                placeholder="Search variations by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-variation-search-input"
              />
            </div>
          </div>
          
          {loading && variations.length === 0 ? (
            <div className="admin-variation-loading">Loading variations...</div>
          ) : filteredVariations.length === 0 ? (
            <div className="admin-variation-no-variations">
              <p>{searchTerm ? `No variations found matching "${searchTerm}"` : 'No variations found. Add your first variation above.'}</p>
            </div>
          ) : (
            <div className="admin-variation-variations-grid">
              {filteredVariations.map((variation) => (
                <div key={variation._id} className="admin-variation-card">
                  <div className="admin-variation-header">
                    <h3>{variation.name || 'Unnamed Variation'}</h3>
                  </div>
                  
                  <div className="admin-variation-actions">
                    <button 
                      className="admin-variation-edit-btn"
                      onClick={() => handleEditVariation(variation)}
                      title="Edit variation"
                    >
                      Edit
                    </button>
                    <button 
                      className="admin-variation-delete-btn"
                      onClick={() => handleDeleteVariation(variation._id)}
                      title="Delete variation"
                    >
                      Delete
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

export default AdminVariation;
