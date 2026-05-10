import React, { useState, useEffect } from 'react';
import './AdminOrders.css';
import ApiService from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import clipboard_icon from '../../../Assets/clipboard.png';
import clock_icon from '../../../Assets/clock.png';
import ethics_icon from '../../../Assets/ethics.png';
import delivery_truck_icon from '../../../Assets/delivery-truck.png';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const orderStatuses = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled', 'refunded'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentStatus = paymentFilter;

      console.log('Fetching admin orders with params:', params);
      const response = await ApiService.getAllOrders(params);
      console.log('Admin orders response:', response);
      
      if (response.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.totalPages);
        setTotalOrders(response.data.pagination.totalOrders);
      } else {
        console.error('API returned success: false', response);
        setError(response.message || 'Failed to load orders. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error details:', error.message, error.response);
      
      // Check if it's an authentication error
      if (error.status === 401 || error.message.includes('Not Authorized')) {
        setError('Admin session expired. Redirecting to login...');
        // Clear admin data and redirect to login
        localStorage.removeItem('admin');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        setError('Failed to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await ApiService.updateOrderStatus(orderId, { status: newStatus });
      
      if (response.success) {
        // Update the order in the list
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleViewDetails = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      confirmed: '#4169E1',
      processing: '#9370DB',
      delivered: '#32CD32',
      cancelled: '#DC143C',
      refunded: '#808080'
    };
    return colors[status] || '#808080';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      paid: '#32CD32',
      failed: '#DC143C',
      refunded: '#808080'
    };
    return colors[status] || '#808080';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(search) ||
      order.customer?.name?.toLowerCase().includes(search) ||
      order.customer?.email?.toLowerCase().includes(search)
    );
  });

  if (loading && orders.length === 0) {
    return (
      <div className="admin-orders-loading">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
      {/* Top Header with Stats and Actions */}
      <div className="orders-top-bar">
        <div className="orders-header-section">
          <h1 className="orders-title">Orders</h1>
          <p className="orders-subtitle">Manage and track all customer orders</p>
        </div>
        
        <div className="orders-stats-row">
          <div className="stat-box">
            <div className="stat-icon">
              <img src={clipboard_icon} alt="Total Orders" className="stat-icon-img" />
            </div>
            <div className="stat-info">
              <span className="stat-number">{totalOrders}</span>
              <span className="stat-text">Total Orders</span>
            </div>
          </div>
          
          <div className="stat-box">
            <div className="stat-icon">
              <img src={clock_icon} alt="Pending" className="stat-icon-img" />
            </div>
            <div className="stat-info">
              <span className="stat-number">{orders.filter(o => o.status === 'pending').length}</span>
              <span className="stat-text">Pending</span>
            </div>
          </div>
          
          <div className="stat-box">
            <div className="stat-icon">
              <img src={ethics_icon} alt="Processing" className="stat-icon-img" />
            </div>
            <div className="stat-info">
              <span className="stat-number">{orders.filter(o => o.status === 'processing').length}</span>
              <span className="stat-text">Processing</span>
            </div>
          </div>
          
          <div className="stat-box">
            <div className="stat-icon">
              <img src={delivery_truck_icon} alt="Delivered" className="stat-icon-img" />
            </div>
            <div className="stat-info">
              <span className="stat-number">{orders.filter(o => o.status === 'delivered').length}</span>
              <span className="stat-text">Delivered</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-orders-error">
          {error}
          <button onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="orders-main-content">
        {/* Sidebar Filters */}
        <div className="orders-sidebar">
          <div className="sidebar-section">
            <h3>Filters</h3>
            
            <div className="sidebar-filter">
              <label>Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Statuses</option>
                {orderStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sidebar-filter">
              <label>Payment</label>
              <select 
                value={paymentFilter} 
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Payments</option>
                {paymentStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <button 
              className="sidebar-clear-btn"
              onClick={() => {
                setStatusFilter('');
                setPaymentFilter('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              Clear All
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Quick Stats</h3>
            <div className="quick-stats-list">
              {orderStatuses.map(status => (
                <div key={status} className="quick-stat-item">
                  <span className="quick-stat-label">{status}</span>
                  <span className="quick-stat-value">
                    {orders.filter(o => o.status === status).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="orders-content-area">
          <div className="orders-search-bar">
            <input
              type="text"
              placeholder="Search orders by number, customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="orders-search-input"
            />
          </div>

          <div className="orders-grid">
            {filteredOrders.length === 0 ? (
              <div className="no-orders-state">
                <div className="no-orders-icon">📭</div>
                <h3>No orders found</h3>
                <p>{searchTerm ? 'Try adjusting your search or filters' : 'No orders available'}</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order._id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-card-id">
                      <span className="order-label">Order</span>
                      <span className="order-number-text">{order.orderNumber}</span>
                    </div>
                    <span 
                      className="order-status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="order-card-body">
                    <div className="order-customer-section">
                      <div className="customer-avatar">
                        {order.customer?.name?.charAt(0) || 'G'}
                      </div>
                      <div className="customer-details">
                        <span className="customer-name-text">{order.customer?.name || 'Guest'}</span>
                        <span className="customer-email-text">{order.customer?.email || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="order-info-grid">
                      <div className="info-item">
                        <span className="info-label">Date</span>
                        <span className="info-value">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Items</span>
                        <span className="info-value">{order.orderProducts?.length || 0}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Payment</span>
                        <span 
                          className="payment-status-pill"
                          style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus) }}
                        >
                          {(order.paymentStatus || 'pending').charAt(0).toUpperCase() + (order.paymentStatus || 'pending').slice(1)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Total</span>
                        <span className="info-value-total">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="order-status-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {orderStatuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      className="order-view-btn"
                      onClick={() => handleViewDetails(order._id)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="orders-pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                ← Previous
              </button>
              
              <div className="pagination-pages">
                <span className="current-page">{currentPage}</span>
                <span className="page-separator">/</span>
                <span className="total-pages">{totalPages}</span>
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;

