import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderHistory.css';
import ApiService from '../../../../services/api';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const orderStatuses = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter) params.status = statusFilter;

      const response = await ApiService.getUserOrders(params);
      
      if (response.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.totalPages);
        setTotalOrders(response.data.pagination.totalOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await ApiService.cancelOrder(orderId);
      
      if (response.success) {
        alert('Order cancelled successfully');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.message || 'Failed to cancel order');
    }
  };

  const handleReorder = (order) => {
    // Navigate to cart and add items
    if (order.orderProducts && order.orderProducts.length > 0) {
      // Store order items to add to cart
      localStorage.setItem('reorderItems', JSON.stringify(order.orderProducts));
      navigate('/cart?reorder=true');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      confirmed: '#4169E1',
      processing: '#9370DB',
      delivered: '#32CD32',
      cancelled: '#DC143C'
    };
    return colors[status] || '#808080';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '',
      confirmed: '',
      processing: '',
      delivered: '',
      cancelled: ''
    };
    return icons[status] || '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const canCancelOrder = (order) => {
    return order.status !== 'delivered' && 
           order.status !== 'cancelled';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="order-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>My Orders</h1>
        <p className="order-count">Total Orders: {totalOrders}</p>
      </div>

      {error && (
        <div className="order-history-error">
          {error}
          <button onClick={fetchOrders}>Retry</button>
        </div>
      )}

      <div className="order-filters">
        <label>Filter by status:</label>
        <select 
          value={statusFilter} 
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Orders</option>
          {orderStatuses.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon"></div>
          <h2>No orders yet</h2>
          <p>Start shopping to see your orders here!</p>
          <button onClick={() => navigate('/')}>Start Shopping</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-info">
                  <h3 className="order-number">Order {order.orderNumber}</h3>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <div 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  <span className="status-icon">{getStatusIcon(order.status)}</span>
                  <span className="status-text">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="order-card-content">
                <div className="order-items-preview">
                  {order.orderProducts && order.orderProducts.slice(0, 3).map((item, index) => {
                    const imageUrl = item.product?.images?.[0] || item.productSnapshot?.images?.[0];
                    
                    // Check if image is base64, full URL, or relative path
                    const imageSrc = imageUrl?.startsWith('data:') 
                      ? imageUrl 
                      : imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')
                      ? imageUrl
                      : imageUrl 
                      ? `http://localhost:4000${imageUrl}` 
                      : null;
                    
                    return (
                      <div key={index} className="order-item-preview">
                        {imageSrc ? (
                          <img 
                            src={imageSrc} 
                            alt={item.product?.name || item.productSnapshot?.name || 'Product'}
                            onError={(e) => {
                              console.error('Image failed to load:', imageSrc);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="no-image-placeholder"></div>
                        )}
                      </div>
                    );
                  })}
                  {order.orderProducts && order.orderProducts.length > 3 && (
                    <div className="more-items">
                      +{order.orderProducts.length - 3} more
                    </div>
                  )}
                </div>

                <div className="order-summary">
                  <div className="summary-item">
                    <span className="summary-label">Items:</span>
                    <span className="summary-value">{order.orderProducts?.length || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Products:</span>
                    <span className="summary-value product-names">
                      {order.orderProducts && order.orderProducts.length > 0 ? (
                        order.orderProducts.slice(0, 2).map((item, index) => {
                          const productName = item.product?.name || item.productSnapshot?.name;
                          let variationsText = '';
                          
                          // Check for variations in different possible formats
                          if (item.selectedVariants && item.selectedVariants.length > 0) {
                            const variations = item.selectedVariants.map(variant => {
                              // If variation name is populated, use it; otherwise just show the value
                              if (variant.variation?.name) {
                                return `${variant.variation.name}: ${variant.value}`;
                              } else {
                                // If no variation name, just show the value without ID
                                return variant.value || Object.values(variant)[0];
                              }
                            }).join(', ');
                            variationsText = ` (${variations})`;
                          } else if (item.variants && typeof item.variants === 'object') {
                            // Handle Map format stored in order items
                            const variations = Object.entries(item.variants).map(([key, value]) => {
                              // Skip if key is an ObjectId (hex string), just show value
                              if (/^[0-9a-fA-F]{24}$/.test(key)) {
                                return value;
                              }
                              return `${key}: ${value}`;
                            }).join(', ');
                            variationsText = ` (${variations})`;
                          }
                          
                          return productName + variationsText;
                        }).join(', ') + (order.orderProducts.length > 2 ? ` +${order.orderProducts.length - 2} more` : '')
                      ) : 'No items'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total:</span>
                    <span className="summary-value summary-total">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Payment:</span>
                    <span className="payment-method">{order.paymentMethod?.type || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="order-card-actions">
                <button 
                  className="btn-primary"
                  onClick={() => handleViewDetails(order._id)}
                >
                  View Details
                </button>
                
                {order.status === 'delivered' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleReorder(order)}
                  >
                    Reorder
                  </button>
                )}
                
                {canCancelOrder(order) && (
                  <button 
                    className="btn-danger"
                    onClick={() => handleCancelOrder(order._id)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {order.trackingNumber && (
                <div className="tracking-info">
                  <span className="tracking-label">Tracking:</span>
                  <span className="tracking-number">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="order-history-pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

