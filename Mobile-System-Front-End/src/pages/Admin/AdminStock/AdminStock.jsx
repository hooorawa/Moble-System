import React, { useState, useEffect } from 'react';
import allIcon from '../../../Assets/all.png';
import inStockIcon from '../../../Assets/in-stock.png';
import arrowIcon from '../../../Assets/arrow.png';
import outOfStockIcon from '../../../Assets/out-of-stock.png';
import totalIcon from '../../../Assets/total.png';
import totalItemIcon from '../../../Assets/box.png';
import './AdminStock.css';

const AdminStock = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statistics, setStatistics] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inStockItems: 0,
    totalInventoryValue: 0,
    totalQuantity: 0,
    categoryStock: []
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    lowStock: false,
    outOfStock: false
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updateOperation, setUpdateOperation] = useState('set');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/category/`, {
        credentials: 'include'
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories || []);
        }
      } else {
        console.error('Failed to fetch categories or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/brand/`, {
        credentials: 'include'
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setBrands(data.brands || []);
        }
      } else {
        console.error('Failed to fetch brands or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Fetch stock items
  const fetchStockItems = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.brand) queryParams.append('brand', filters.brand);
      if (filters.lowStock) queryParams.append('lowStock', 'true');
      if (filters.outOfStock) queryParams.append('outOfStock', 'true');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stock?${queryParams}`, {
        credentials: 'include'
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setStockItems(data.products);
        } else {
          setErrorMessage(data.message || 'Failed to fetch stock items');
        }
      } else {
        console.error('Failed to fetch stock items or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setErrorMessage('Failed to fetch stock items');
      }
    } catch (error) {
      console.error('Error fetching stock items:', error);
      setErrorMessage('Error fetching stock items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stock/statistics`, {
        credentials: 'include'
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setStatistics(data.statistics);
        } else {
          console.error('Statistics fetch failed:', data);
        }
      } else {
        console.error('Failed to fetch statistics or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Update stock quantity
  const handleUpdateStock = async () => {
    if (!selectedItem || !updateQuantity) {
      setErrorMessage('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stock/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity: parseInt(updateQuantity),
          operation: updateOperation
        })
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setShowUpdateModal(false);
          setSelectedItem(null);
          setUpdateQuantity('');
          setUpdateOperation('set');
          fetchStockItems();
          alert('Stock updated successfully!');
        } else {
          setErrorMessage(data.message || 'Failed to update stock');
        }
      } else {
        console.error('Failed to update stock or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setErrorMessage('Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      setErrorMessage('Error updating stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open update modal
  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setUpdateQuantity(item.quantity.toString());
    setUpdateOperation('set');
    setShowUpdateModal(true);
    setErrorMessage('');
  };

  // Get stock status badge
  const getStockStatusBadge = (quantity) => {
    if (quantity === 0) {
      return <span className="stock-status-badge stock-out">Out of Stock</span>;
    } else if (quantity <= 10) {
      return <span className="stock-status-badge stock-low">Low Stock</span>;
    } else {
      return <span className="stock-status-badge stock-in">In Stock</span>;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchStockItems();
  }, [filters]);

  useEffect(() => {
    fetchStatistics();
    fetchCategories();
    fetchBrands();
  }, []);

  return (
    <div className="admin-stock-container">
      <div className="admin-stock-header">
        <h1 className="admin-stock-title">Stock Management</h1>
        <button 
          className="admin-stock-refresh-btn"
          onClick={() => {
            fetchStockItems();
            fetchStatistics();
          }}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="admin-stock-statistics">
        <div className="admin-stock-stat-card">
          <div className="admin-stock-stat-icon">
            <img src={allIcon} alt="Total Items" className="stat-icon-image" />
          </div>
          <div className="admin-stock-stat-content">
            <h3 className="admin-stock-stat-number">{statistics.totalItems || 0}</h3>
            <p className="admin-stock-stat-label">Total Items</p>
          </div>
        </div>

        <div className="admin-stock-stat-card">
          <div className="admin-stock-stat-icon">
            <img src={inStockIcon} alt="In Stock" className="stat-icon-image" />
          </div>
          <div className="admin-stock-stat-content">
            <h3 className="admin-stock-stat-number">{statistics.inStockItems || 0}</h3>
            <p className="admin-stock-stat-label">In Stock</p>
          </div>
        </div>

        <div className="admin-stock-stat-card">
          <div className="admin-stock-stat-icon">
            <img src={arrowIcon} alt="Low Stock" className="stat-icon-image" />
          </div>
          <div className="admin-stock-stat-content">
            <h3 className="admin-stock-stat-number">{statistics.lowStockItems || 0}</h3>
            <p className="admin-stock-stat-label">Low Stock</p>
          </div>
        </div>

        <div className="admin-stock-stat-card">
          <div className="admin-stock-stat-icon">
            <img src={outOfStockIcon} alt="Out of Stock" className="stat-icon-image" />
          </div>
          <div className="admin-stock-stat-content">
            <h3 className="admin-stock-stat-number">{statistics.outOfStockItems || 0}</h3>
            <p className="admin-stock-stat-label">Out of Stock</p>
          </div>
        </div>

        <div className="admin-stock-stat-card">
          <div className="admin-stock-stat-icon">
            <img src={totalItemIcon} alt="Total Quantity" className="stat-icon-image" />
          </div>
          <div className="admin-stock-stat-content">
            <h3 className="admin-stock-stat-number">{statistics.totalQuantity || 0}</h3>
            <p className="admin-stock-stat-label">Total Quantity</p>
          </div>
        </div>

        <div className="admin-stock-stat-card admin-stock-stat-card-value">
          <div className="admin-stock-stat-icon">
            <img src={totalIcon} alt="Total Inventory Value" className="stat-icon-image" />
          </div>
          <div className="admin-stock-stat-content">
            <h3 className="admin-stock-stat-number">{formatCurrency(statistics.totalInventoryValue)}</h3>
            <p className="admin-stock-stat-label">Total Inventory Value</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-stock-filters">
        <div className="admin-stock-filter-group">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="admin-stock-filter-input"
          />
        </div>

        <div className="admin-stock-filter-group">
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="admin-stock-filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-stock-filter-group">
          <select
            value={filters.brand}
            onChange={(e) => setFilters({...filters, brand: e.target.value})}
            className="admin-stock-filter-select"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-stock-filter-group">
          <label className="admin-stock-checkbox-label">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => setFilters({...filters, lowStock: e.target.checked})}
              className="admin-stock-checkbox"
            />
            Low Stock Only
          </label>
        </div>

        <div className="admin-stock-filter-group">
          <label className="admin-stock-checkbox-label">
            <input
              type="checkbox"
              checked={filters.outOfStock}
              onChange={(e) => setFilters({...filters, outOfStock: e.target.checked})}
              className="admin-stock-checkbox"
            />
            Out of Stock Only
          </label>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="admin-stock-error">
          {errorMessage}
        </div>
      )}

      {/* Stock Table */}
      <div className="admin-stock-table-container">
        <table className="admin-stock-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Value</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="admin-stock-loading">
                  Loading stock items...
                </td>
              </tr>
            ) : stockItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="admin-stock-empty">
                  No stock items found
                </td>
              </tr>
            ) : (
              stockItems.map((item) => (
                <tr key={item._id} className="admin-stock-row">
                  <td className="admin-stock-product-name">
                    {item.name}
                  </td>
                  <td className="admin-stock-category">
                    {item.category?.name || 'N/A'}
                  </td>
                  <td className="admin-stock-brand">
                    {item.brand?.name || 'N/A'}
                  </td>
                  <td className="admin-stock-price">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="admin-stock-quantity">
                    <span className={`admin-stock-quantity-number ${item.quantity <= 10 ? 'low-stock' : ''} ${item.quantity === 0 ? 'out-of-stock' : ''}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="admin-stock-status">
                    {getStockStatusBadge(item.quantity)}
                  </td>
                  <td className="admin-stock-value">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                  <td className="admin-stock-updated">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="admin-stock-actions">
                    <button
                      className="admin-stock-update-btn"
                      onClick={() => openUpdateModal(item)}
                      title="Update stock quantity"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Stock Modal */}
      {showUpdateModal && selectedItem && (
        <div className="admin-stock-modal-overlay">
          <div className="admin-stock-modal">
            <div className="admin-stock-modal-header">
              <h3 className="admin-stock-modal-title">Update Stock Quantity</h3>
              <button
                className="admin-stock-modal-close"
                onClick={() => setShowUpdateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-stock-modal-body">
              <div className="admin-stock-modal-product">
                <strong>Product:</strong> {selectedItem.name}
              </div>
              <div className="admin-stock-modal-current">
                <strong>Current Quantity:</strong> {selectedItem.quantity}
              </div>

              <div className="admin-stock-modal-form">
                <div className="admin-stock-modal-form-group">
                  <label htmlFor="updateOperation">Operation:</label>
                  <select
                    id="updateOperation"
                    value={updateOperation}
                    onChange={(e) => setUpdateOperation(e.target.value)}
                    className="admin-stock-modal-select"
                  >
                    <option value="set">Set Quantity</option>
                    <option value="add">Add to Quantity</option>
                    <option value="subtract">Subtract from Quantity</option>
                  </select>
                </div>

                <div className="admin-stock-modal-form-group">
                  <label htmlFor="updateQuantity">Quantity:</label>
                  <input
                    type="number"
                    id="updateQuantity"
                    value={updateQuantity}
                    onChange={(e) => setUpdateQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    min="0"
                    step="1"
                    className="admin-stock-modal-input"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="admin-stock-modal-error">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="admin-stock-modal-footer">
              <button
                className="admin-stock-modal-cancel"
                onClick={() => setShowUpdateModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="admin-stock-modal-save"
                onClick={handleUpdateStock}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStock;
