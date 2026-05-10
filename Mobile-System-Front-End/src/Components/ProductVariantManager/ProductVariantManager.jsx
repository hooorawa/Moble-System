import React, { useState, useEffect } from 'react';
import './ProductVariantManager.css';

const ProductVariantManager = ({ productId, productName }) => {
  const [variants, setVariants] = useState([]);
  const [availableVariations, setAvailableVariations] = useState([]);
  const [linkedVariations, setLinkedVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMultipleForm, setShowMultipleForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedVariants, setExpandedVariants] = useState({});
  const [inlineFormData, setInlineFormData] = useState({
    value: '',
    priceAdjustment: 0
  });
  const [formData, setFormData] = useState({
    variationId: '',
    value: '',
    priceAdjustment: 0
  });
  const [multipleFormData, setMultipleFormData] = useState({
    variationId: '',
    values: '',
    priceAdjustment: 0
  });

  useEffect(() => {
    if (productId) {
      fetchProductVariants();
      fetchAvailableVariations();
      fetchLinkedVariationsData();
    }
  }, [productId]);

  const fetchLinkedVariationsData = async () => {
    const linked = await fetchLinkedVariations();
    setLinkedVariations(linked);
  };

  const fetchProductVariants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/product/${productId}/grouped`);
      
      if (response.ok) {
        const data = await response.json();
        setVariants(data.variants || []);
      } else {
        console.error('Failed to fetch product variants');
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching product variants:', error);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVariations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/product/${productId}/available`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableVariations(data.variations || []);
      } else {
        console.error('Failed to fetch available variations');
        setAvailableVariations([]);
      }
    } catch (error) {
      console.error('Error fetching available variations:', error);
      setAvailableVariations([]);
    }
  };

  const fetchLinkedVariations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/product/${productId}/linked`);
      
      if (response.ok) {
        const data = await response.json();
        return data.variations || [];
      } else {
        console.error('Failed to fetch linked variations');
        return [];
      }
    } catch (error) {
      console.error('Error fetching linked variations:', error);
      return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceAdjustment' ? parseFloat(value) || 0 : value
    }));
  };

  const handleMultipleInputChange = (e) => {
    const { name, value } = e.target;
    setMultipleFormData(prev => ({
      ...prev,
      [name]: name === 'priceAdjustment' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    
    if (!formData.variationId || !formData.value.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variationId: formData.variationId,
          value: formData.value.trim(),
          priceAdjustment: formData.priceAdjustment
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setFormData({ variationId: '', value: '', priceAdjustment: 0 });
        setShowAddForm(false);
        setErrorMessage('');
        fetchProductVariants();
        fetchAvailableVariations();
      } else {
        setErrorMessage(data.message || 'Failed to add variant');
      }
    } catch (error) {
      console.error('Error adding variant:', error);
      setErrorMessage('Error adding variant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVariant = (variant) => {
    setEditingVariant(variant);
    setFormData({
      variationId: variant.variationId,
      value: variant.value,
      priceAdjustment: variant.priceAdjustment
    });
    setShowAddForm(true);
  };

  const handleAddMultipleVariants = async (e) => {
    e.preventDefault();
    
    if (!multipleFormData.variationId || !multipleFormData.values.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      // Split values by comma, semicolon, or newline
      const values = multipleFormData.values
        .split(/[,;\n]/)
        .map(value => value.trim())
        .filter(value => value.length > 0);

      if (values.length === 0) {
        setErrorMessage('Please enter at least one valid value');
        return;
      }

      // Create variants one by one
      const promises = values.map(value => 
        fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/product/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            variationId: multipleFormData.variationId,
            value: value,
            priceAdjustment: multipleFormData.priceAdjustment
          })
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(res => res.json()));

      // Check if all requests were successful
      const failedResults = results.filter(result => !result.success);
      
      if (failedResults.length === 0) {
        setMultipleFormData({ variationId: '', values: '', priceAdjustment: 0 });
        setShowMultipleForm(false);
        setErrorMessage('');
        // Show success message
        alert(`Successfully added ${values.length} variant values!`);
        fetchProductVariants();
        fetchAvailableVariations();
      } else {
        setErrorMessage(`Failed to add ${failedResults.length} out of ${values.length} values. Some values may already exist.`);
      }
    } catch (error) {
      console.error('Error adding multiple variants:', error);
      setErrorMessage('Error adding variants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariant = async (e) => {
    e.preventDefault();
    
    if (!formData.value.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/${editingVariant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: formData.value.trim(),
          priceAdjustment: formData.priceAdjustment
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setFormData({ variationId: '', value: '', priceAdjustment: 0 });
        setShowAddForm(false);
        setEditingVariant(null);
        setErrorMessage('');
        fetchProductVariants();
      } else {
        setErrorMessage(data.message || 'Failed to update variant');
      }
    } catch (error) {
      console.error('Error updating variant:', error);
      setErrorMessage('Error updating variant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant value?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/${variantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchProductVariants();
        fetchAvailableVariations();
      } else {
        alert(data.message || 'Failed to delete variant');
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Error deleting variant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ variationId: '', value: '', priceAdjustment: 0 });
    setMultipleFormData({ variationId: '', values: '', priceAdjustment: 0 });
    setInlineFormData({ value: '', priceAdjustment: 0 });
    setShowAddForm(false);
    setShowMultipleForm(false);
    setEditingVariant(null);
    setExpandedVariants({});
    setErrorMessage('');
  };

  const handleInlineAddClick = (variationId) => {
    setExpandedVariants(prev => ({
      ...prev,
      [variationId]: !prev[variationId]
    }));
    setInlineFormData({ value: '', priceAdjustment: 0 });
    setErrorMessage('');
  };

  const handleInlineInputChange = (e) => {
    const { name, value } = e.target;
    setInlineFormData(prev => ({
      ...prev,
      [name]: name === 'priceAdjustment' ? parseFloat(value) || 0 : value
    }));
  };

  const handleInlineSubmit = async (variationId) => {
    if (!inlineFormData.value.trim()) {
      setErrorMessage('Please enter a variant value');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + 'api')}/product-variant/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variationId: variationId,
          value: inlineFormData.value.trim(),
          priceAdjustment: inlineFormData.priceAdjustment
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setInlineFormData({ value: '', priceAdjustment: 0 });
        setExpandedVariants(prev => ({
          ...prev,
          [variationId]: false
        }));
        setErrorMessage('');
        fetchProductVariants();
        fetchAvailableVariations();
      } else {
        setErrorMessage(data.message || 'Failed to add variant');
      }
    } catch (error) {
      console.error('Error adding variant:', error);
      setErrorMessage('Error adding variant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineCancel = (variationId) => {
    setExpandedVariants(prev => ({
      ...prev,
      [variationId]: false
    }));
    setInlineFormData({ value: '', priceAdjustment: 0 });
    setErrorMessage('');
  };

  return (
    <div className="product-variant-manager">
      <div className="variant-manager-header">
        <h3>Product Variants - {productName}</h3>
      </div>

      {showAddForm && (
        <div className="variant-form-container">
          <div className="variant-form">
            <div className="variant-form-header">
              <h4>{editingVariant ? 'Edit Variant Value' : 'Add New Variant Value'}</h4>
              <button 
                className="close-form-btn"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={editingVariant ? handleUpdateVariant : handleAddVariant}>
              {errorMessage && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )}
              
              {!editingVariant && (
                <div className="form-group">
                  <label htmlFor="variationId">Variation Type</label>
                  <select
                    id="variationId"
                    name="variationId"
                    value={formData.variationId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select variation type</option>
                    {availableVariations.map((variation) => (
                      <option key={variation._id} value={variation._id}>
                        {variation.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="value">Variant Value</label>
                <input
                  type="text"
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder="e.g., Red, 128GB, Large"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="priceAdjustment">Price Adjustment (Optional)</label>
                <input
                  type="number"
                  id="priceAdjustment"
                  name="priceAdjustment"
                  value={formData.priceAdjustment}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                />
                <small>Positive value increases price, negative decreases</small>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingVariant ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMultipleForm && (
        <div className="variant-form-container">
          <div className="variant-form">
            <div className="variant-form-header">
              <h4>Add Multiple Variant Values</h4>
              <button 
                className="close-form-btn"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddMultipleVariants}>
              {errorMessage && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="multipleVariationId">Variation Type</label>
                <select
                  id="multipleVariationId"
                  name="variationId"
                  value={multipleFormData.variationId}
                  onChange={handleMultipleInputChange}
                  required
                >
                  <option value="">Select variation type</option>
                  {availableVariations.map((variation) => (
                    <option key={variation._id} value={variation._id}>
                      {variation.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="multipleValues">Variant Values (add multiple values at once)</label>
                <textarea
                  id="multipleValues"
                  name="values"
                  value={multipleFormData.values}
                  onChange={handleMultipleInputChange}
                  placeholder="Add multiple values for selected variant type:&#10;&#10;For Color:&#10;Red&#10;Blue&#10;Green&#10;Black&#10;White&#10;&#10;For Storage:&#10;64GB&#10;128GB&#10;256GB&#10;512GB&#10;&#10;For RAM:&#10;4GB&#10;8GB&#10;16GB&#10;32GB&#10;&#10;Separate with commas, semicolons, or new lines"
                  rows="8"
                  required
                />
                <small>Enter multiple values separated by commas, semicolons, or new lines. Each value will be added to the selected variant type.</small>
              </div>

              <div className="form-group">
                <label htmlFor="multiplePriceAdjustment">Price Adjustment for All Values (Optional)</label>
                <input
                  type="number"
                  id="multiplePriceAdjustment"
                  name="priceAdjustment"
                  value={multipleFormData.priceAdjustment}
                  onChange={handleMultipleInputChange}
                  placeholder="0.00"
                  step="0.01"
                />
                <small>This price adjustment will be applied to all values</small>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Multiple Values'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && variants.length === 0 ? (
        <div className="loading">Loading variants...</div>
      ) : linkedVariations.length === 0 ? (
        <div className="no-variants">
          <p>No variants are linked to this product. Please add variants to the product first in the product edit form.</p>
        </div>
      ) : variants.length === 0 ? (
        <div className="no-variants">
          <p>No variant values added yet. Use the + buttons below to add values for each variant type.</p>
        </div>
      ) : (
        <div className="variants-list">
          {variants.map((variantGroup) => (
            <div key={variantGroup.variationId} className="variant-group">
              <div className="variant-group-header">
                <div className="variant-group-title">
                  <button 
                    className="inline-add-btn"
                    onClick={() => handleInlineAddClick(variantGroup.variationId)}
                    title="Add new value"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <h4>{variantGroup.variationName}</h4>
                </div>
                <span className="variant-count">({variantGroup.values.length} values)</span>
              </div>

              {/* Inline Add Form */}
              {expandedVariants[variantGroup.variationId] && (
                <div className="inline-add-form">
                  {errorMessage && (
                    <div className="error-message">
                      {errorMessage}
                    </div>
                  )}
                  <div className="inline-form-row">
                    <input
                      type="text"
                      name="value"
                      value={inlineFormData.value}
                      onChange={handleInlineInputChange}
                      placeholder="Enter new value"
                      className="inline-value-input"
                      autoFocus
                    />
                    <input
                      type="number"
                      name="priceAdjustment"
                      value={inlineFormData.priceAdjustment}
                      onChange={handleInlineInputChange}
                      placeholder="Price adj."
                      step="0.01"
                      className="inline-price-input"
                    />
                    <div className="inline-form-actions">
                      <button 
                        className="inline-submit-btn"
                        onClick={() => handleInlineSubmit(variantGroup.variationId)}
                        disabled={loading || !inlineFormData.value.trim()}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      </button>
                      <button 
                        className="inline-cancel-btn"
                        onClick={() => handleInlineCancel(variantGroup.variationId)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="variant-values">
                {variantGroup.values.map((value) => (
                  <div key={value.id} className="variant-value">
                    <div className="value-info">
                      <span className="value-name">{value.value}</span>
                      {value.priceAdjustment !== 0 && (
                        <span className={`price-adjustment ${value.priceAdjustment > 0 ? 'positive' : 'negative'}`}>
                          {value.priceAdjustment > 0 ? '+' : ''}LKR {value.priceAdjustment.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="value-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditVariant({ ...value, variationId: variantGroup.variationId })}
                        title="Edit variant"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteVariant(value.id)}
                        title="Delete variant"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductVariantManager;