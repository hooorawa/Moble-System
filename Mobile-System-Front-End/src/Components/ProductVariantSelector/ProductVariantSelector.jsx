import React, { useState, useEffect } from 'react';
import './ProductVariantSelector.css';

const ProductVariantSelector = ({ productId, productPrice, onVariantChange, allowAddingValues = false }) => {
  const [variants, setVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableVariations, setAvailableVariations] = useState([]);
  const [addFormData, setAddFormData] = useState({
    variationId: '',
    value: '',
    priceAdjustment: 0
  });

  useEffect(() => {
    if (productId) {
      fetchProductVariants();
      if (allowAddingValues) {
        fetchAvailableVariations();
      }
    }
  }, [productId, allowAddingValues]);

  const fetchProductVariants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/product-variant/product/${productId}/grouped`);
      
      if (response.ok) {
        const data = await response.json();
        setVariants(data.variants || []);
        
        // Initialize selected variants with first available option for each variation
        const initialSelection = {};
        data.variants.forEach(variantGroup => {
          if (variantGroup.values && variantGroup.values.length > 0) {
            initialSelection[variantGroup.variationId] = variantGroup.values[0].id;
          }
        });
        setSelectedVariants(initialSelection);
        
        // Calculate initial price and notify parent
        if (onVariantChange) {
          const totalPriceAdjustment = calculateTotalPriceAdjustment(data.variants, initialSelection);
          
          // Convert initial selections to array format for cart
          const selectedVariantsArray = Object.entries(initialSelection).map(([varId, valId]) => {
            const variantGroup = data.variants.find(v => v.variationId === varId);
            const selectedValue = variantGroup?.values.find(v => v.id === valId);
            
            return {
              variation: varId,
              variationName: variantGroup?.variationName || 'Unknown',
              value: selectedValue?.value || valId,
              priceAdjustment: selectedValue?.priceAdjustment || 0
            };
          });
          
          console.log('ProductVariantSelector - Initial variant selection:', {
            selectedVariants: initialSelection,
            selectedVariantsArray: selectedVariantsArray,
            priceAdjustment: totalPriceAdjustment,
            finalPrice: productPrice + totalPriceAdjustment
          });
          
          onVariantChange({
            selectedVariants: initialSelection,
            selectedVariantsArray: selectedVariantsArray,
            priceAdjustment: totalPriceAdjustment,
            finalPrice: productPrice + totalPriceAdjustment
          });
        }
      } else {
        setError('Failed to load product variants');
      }
    } catch (error) {
      console.error('Error fetching product variants:', error);
      setError('Error loading product variants');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVariations = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/product-variant/product/${productId}/available`);
      
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

  const calculateTotalPriceAdjustment = (variants, selections) => {
    let totalAdjustment = 0;
    
    variants.forEach(variantGroup => {
      const selectedValueId = selections[variantGroup.variationId];
      if (selectedValueId) {
        const selectedValue = variantGroup.values.find(v => v.id === selectedValueId);
        if (selectedValue) {
          totalAdjustment += selectedValue.priceAdjustment || 0;
        }
      }
    });
    
    return totalAdjustment;
  };

  const handleVariantChange = (variationId, valueId) => {
    const newSelections = {
      ...selectedVariants,
      [variationId]: valueId
    };
    
    setSelectedVariants(newSelections);
    
    if (onVariantChange) {
      const totalPriceAdjustment = calculateTotalPriceAdjustment(variants, newSelections);
      
      // Convert selections to array format for cart
      const selectedVariantsArray = Object.entries(newSelections).map(([varId, valId]) => {
        const variantGroup = variants.find(v => v.variationId === varId);
        const selectedValue = variantGroup?.values.find(v => v.id === valId);
        
        return {
          variation: varId, // This should be the variation ObjectId
          variationName: variantGroup?.variationName || 'Unknown',
          value: selectedValue?.value || valId,
          priceAdjustment: selectedValue?.priceAdjustment || 0
        };
      });
      
      console.log('ProductVariantSelector - Calling onVariantChange with:', {
        selectedVariants: newSelections,
        selectedVariantsArray: selectedVariantsArray,
        priceAdjustment: totalPriceAdjustment,
        finalPrice: productPrice + totalPriceAdjustment
      });
      
      onVariantChange({
        selectedVariants: newSelections,
        selectedVariantsArray: selectedVariantsArray,
        priceAdjustment: totalPriceAdjustment,
        finalPrice: productPrice + totalPriceAdjustment
      });
    }
  };

  const handleAddValue = async (e) => {
    e.preventDefault();
    
    if (!addFormData.variationId || !addFormData.value.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/product-variant/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variationId: addFormData.variationId,
          value: addFormData.value.trim(),
          priceAdjustment: addFormData.priceAdjustment
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setAddFormData({ variationId: '', value: '', priceAdjustment: 0 });
        setShowAddForm(false);
        setError(null);
        fetchProductVariants();
        fetchAvailableVariations();
      } else {
        setError(data.message || 'Failed to add variant value');
      }
    } catch (error) {
      console.error('Error adding variant value:', error);
      setError('Error adding variant value. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: name === 'priceAdjustment' ? parseFloat(value) || 0 : value
    }));
  };

  const getSelectedVariantInfo = () => {
    const selectedInfo = {};
    
    variants.forEach(variantGroup => {
      const selectedValueId = selectedVariants[variantGroup.variationId];
      if (selectedValueId) {
        const selectedValue = variantGroup.values.find(v => v.id === selectedValueId);
        if (selectedValue) {
          selectedInfo[variantGroup.variationName] = {
            value: selectedValue.value,
            priceAdjustment: selectedValue.priceAdjustment
          };
        }
      }
    });
    
    return selectedInfo;
  };

  if (loading && variants.length === 0) {
    return (
      <div className="variant-selector loading">
        <div className="loading-spinner"></div>
        <p>Loading variants...</p>
      </div>
    );
  }

  if (error && variants.length === 0) {
    return (
      <div className="variant-selector error">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!variants || variants.length === 0) {
    if (allowAddingValues && availableVariations.length > 0) {
      return (
        <div className="variant-selector">
          <div className="variant-selector-header">
            <h3>Add Product Options</h3>
            {!showAddForm && (
              <button 
                className="add-value-btn"
                onClick={() => setShowAddForm(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Values
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="add-value-form">
              <div className="form-header">
                <h4>Add New Option Value</h4>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddFormData({ variationId: '', value: '', priceAdjustment: 0 });
                    setError(null);
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddValue}>
                {error && (
                  <div className="error-message">{error}</div>
                )}
                
                <div className="form-group">
                  <label htmlFor="addVariationId">Option Type</label>
                  <select
                    id="addVariationId"
                    name="variationId"
                    value={addFormData.variationId}
                    onChange={handleAddFormChange}
                    required
                  >
                    <option value="">Select option type</option>
                    {availableVariations.map((variation) => (
                      <option key={variation._id} value={variation._id}>
                        {variation.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="addValue">Option Value</label>
                  <input
                    type="text"
                    id="addValue"
                    name="value"
                    value={addFormData.value}
                    onChange={handleAddFormChange}
                    placeholder="e.g., Red, 128GB, Large"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="addPriceAdjustment">Price Adjustment (Optional)</label>
                  <input
                    type="number"
                    id="addPriceAdjustment"
                    name="priceAdjustment"
                    value={addFormData.priceAdjustment}
                    onChange={handleAddFormChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                  <small>Positive value increases price, negative decreases</small>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddFormData({ variationId: '', value: '', priceAdjustment: 0 });
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Value'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      );
    }
    return null; // Don't show anything if no variants and no ability to add
  }

  return (
    <div className="variant-selector">
      <div className="variant-selector-header-refined">
        <h3>Available Options</h3>
        <p className="variant-subtitle">Configure your product preferences</p>
      </div>

      {showAddForm && (
        <div className="add-value-form">
          <div className="form-header">
            <h4>Add New Option Value</h4>
            <button 
              className="close-btn"
              onClick={() => {
                setShowAddForm(false);
                setAddFormData({ variationId: '', value: '', priceAdjustment: 0 });
                setError(null);
              }}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleAddValue}>
            {error && (
              <div className="error-message">{error}</div>
            )}
            
            <div className="form-group">
              <label htmlFor="addVariationId">Option Type</label>
              <select
                id="addVariationId"
                name="variationId"
                value={addFormData.variationId}
                onChange={handleAddFormChange}
                required
              >
                <option value="">Select option type</option>
                {availableVariations.map((variation) => (
                  <option key={variation._id} value={variation._id}>
                    {variation.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="addValue">Option Value</label>
              <input
                type="text"
                id="addValue"
                name="value"
                value={addFormData.value}
                onChange={handleAddFormChange}
                placeholder="e.g., Red, 128GB, Large"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="addPriceAdjustment">Price Adjustment (Optional)</label>
              <input
                type="number"
                id="addPriceAdjustment"
                name="priceAdjustment"
                value={addFormData.priceAdjustment}
                onChange={handleAddFormChange}
                placeholder="0.00"
                step="0.01"
              />
              <small>Positive value increases price, negative decreases</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setAddFormData({ variationId: '', value: '', priceAdjustment: 0 });
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Value'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="variant-groups">
        {variants.map(variantGroup => (
          <div key={variantGroup.variationId} className="variant-group">
            <div className="variant-group-header">
              <label className="variant-group-label">
                {variantGroup.variationName}
              </label>
            </div>
            
            <div className="variant-select-container">
              <select
                className="variant-select"
                value={selectedVariants[variantGroup.variationId] || ''}
                onChange={(e) => handleVariantChange(variantGroup.variationId, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.target.focus();
                  }
                }}
                aria-label={`Select ${variantGroup.variationName.toLowerCase()}`}
                aria-describedby={`${variantGroup.variationId}-description`}
                role="combobox"
              >
                <option value="" disabled>Choose an option</option>
                {variantGroup.values.map(value => (
                  <option key={value.id} value={value.id}>
                    {value.value}
                    {value.priceAdjustment !== 0 && 
                      ` (${value.priceAdjustment > 0 ? '+' : ''}LKR ${value.priceAdjustment.toFixed(2)})`
                    }
                  </option>
                ))}
              </select>
              <div 
                id={`${variantGroup.variationId}-description`} 
                className="variant-description"
                aria-live="polite"
              >
                {variantGroup.values.length} {variantGroup.variationName.toLowerCase()} option{variantGroup.values.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Configuration - Refined */}
      <div className="selected-configuration-refined">
        <h4>Selected Specifications</h4>
        <div className="config-card">
          {Object.entries(getSelectedVariantInfo()).map(([variationName, info], index) => (
            <div key={variationName} className="config-item">
              <span className="config-label">{variationName}</span>
              <span className="config-value">{info.value}</span>
              {info.priceAdjustment !== 0 && (
                <span className={`config-price ${
                  info.priceAdjustment > 0 ? 'positive' : 'negative'
                }`}>
                  {info.priceAdjustment > 0 ? '+' : ''}LKR {info.priceAdjustment.toFixed(2)}
                </span>
              )}
              {index < Object.entries(getSelectedVariantInfo()).length - 1 && <div className="config-divider"></div>}
            </div>
          ))}
          
          {/* Show "Not selected" for variants with no selection */}
          {variants
            .filter(variantGroup => !selectedVariants[variantGroup.variationId])
            .map((variantGroup, index, array) => (
              <div key={variantGroup.variationId} className="config-item">
                <span className="config-label">{variantGroup.variationName}</span>
                <span className="config-value not-selected">Not selected</span>
                {index < array.length - 1 && <div className="config-divider"></div>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProductVariantSelector;