import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderDetail.css';
import ApiService from '../../../../services/api';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getOrder(orderId);
      
      if (response.success) {
        setOrder(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await ApiService.cancelOrder(orderId);
      
      if (response.success) {
        alert('Order cancelled successfully');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.message || 'Failed to cancel order');
    }
  };

  const handleReorder = () => {
    if (order.orderProducts && order.orderProducts.length > 0) {
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

  const getTrackingSteps = () => {
    const steps = [
      { status: 'pending', label: 'Order Placed', icon: '/src/Assets/clipboard.png' },
      { status: 'confirmed', label: 'Confirmed', icon: '/src/Assets/check.png' },
      { status: 'processing', label: 'Processing', icon: '/src/Assets/ethics.png' },
      { status: 'delivered', label: 'Delivered', icon: '/src/Assets/delivery-truck.png' }
    ];

    const currentIndex = steps.findIndex(step => step.status === order.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const canCancelOrder = () => {
    return order.status !== 'delivered' && 
           order.status !== 'cancelled';
  };

  if (loading) {
    return (
      <div className="order-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-error">
        <p>{error || 'Order not found'}</p>
        <button onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  const trackingSteps = getTrackingSteps();

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <button className="back-btn" onClick={() => navigate('/orders')}>
          ← Back to Orders
        </button>
        <div className="header-content">
          <h1>Order Details</h1>
          <div 
            className="order-status-badge header-status"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>
      </div>

      <div className="order-detail-content">

        {/* Order Tracking */}
        {order.status !== 'cancelled' && (
          <div className="detail-section order-tracking">
            <h2>Order Tracking</h2>
            <div className="tracking-timeline">
              {trackingSteps.map((step, index) => (
                <div 
                  key={step.status}
                  className={`tracking-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
                >
                  <div className="step-icon">
                    <img src={step.icon} alt={step.label} className="step-icon-img" />
                  </div>
                  <div className="step-label">{step.label}</div>
                  {index < trackingSteps.length - 1 && (
                    <div className="step-line"></div>
                  )}
                </div>
              ))}
            </div>
            
            {order.trackingNumber && (
              <div className="tracking-number-display">
                <span className="label">Tracking Number:</span>
                <span className="number">{order.trackingNumber}</span>
              </div>
            )}

            {/* {order.estimatedDelivery && order.status !== 'delivered' && (
              <div className="estimated-delivery">
                <span>Estimated Delivery: {formatDate(order.estimatedDelivery)}</span>
              </div>
            )} */}
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="detail-section cancelled-notice">
            <h2> Order Cancelled</h2>
            <p>This order has been cancelled. If you have any questions, please contact support.</p>
          </div>
        )}

        {/* Order Items */}
        <div className="detail-section order-items">
          <h2>Order Items ({order.orderProducts?.length || 0})</h2>
          <div className="items-list">
            {order.orderProducts && order.orderProducts.map((item, index) => {
              const imageUrl = item.product?.images?.[0] || item.productSnapshot?.images?.[0];
              
              // Check if image is base64, full URL, or relative path
              const imageSrc = imageUrl?.startsWith('data:') 
                ? imageUrl 
                : imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')
                ? imageUrl
                : imageUrl 
                ? `${import.meta.env.VITE_SERVER_URL || (import.meta.env.VITE_SERVER_URL || 'http://localhost:4000')}${imageUrl}` 
                : null;
              
              return (
              <div key={index} className="item-card">
                <div className="item-image">
                  {imageSrc ? (
                    <img 
                      src={imageSrc} 
                      alt={item.product?.name || item.productSnapshot?.name || 'Product'}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="no-image" style={{ display: imageSrc ? 'none' : 'flex' }}>No Image</div>
                </div>
                <div className="item-info">
                  <h3>{item.product?.name || item.productSnapshot?.name || 'Product'}</h3>
                  <p className="item-sku">SKU: {item.product?.sku || item.productSnapshot?.sku || 'N/A'}</p>
                  
                  {/* Display variants */}
                  {item.selectedVariants && item.selectedVariants.length > 0 && (
                    <div className="item-variants">
                      {item.selectedVariants.map((variant, vIndex) => (
                        <span key={vIndex} className="variant-badge">
                          {variant.variation?.name || 'Variant'}: {variant.value}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="item-pricing">
                    <span className="quantity">Qty: {item.quantity}</span>
                    <span className="unit-price">{formatCurrency(item.unitPrice)} each</span>
                  </div>
                </div>
                {/* <div className="item-total">
                  {formatCurrency(item.totalPrice)}
                </div> */}
              </div>
            );
            })}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="detail-section delivery-info">
          <h2>Delivery Information</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>Delivery Address</h3>
              <div className="address-content">
                <p><strong>{order.deliveryAddress?.name}</strong></p>
                <p>{order.deliveryAddress?.address}</p>
                <p>
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.postalCode}
                </p>
                <p>Phone: {order.deliveryAddress?.phoneNumber}</p>
              </div>
            </div>
            
            <div className="info-card">
              <h3>Payment Method</h3>
              <div className="payment-content">
                <p><strong>{order.paymentMethod?.type || 'N/A'}</strong></p>
                <p className="payment-status">
                  Status: <span className={`status ${order.paymentStatus}`}>
                    {order.paymentStatus}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Totals */}
        <div className="detail-section order-totals-section">
          <h2>Order Summary</h2>
          <div className="totals-breakdown">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="total-row">
              <span>Delivery:</span>
              <span>{order.delivery === 0 ? 'FREE' : formatCurrency(order.delivery)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="detail-section order-notes-section">
            <h2>Order Notes</h2>
            <p>{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="detail-section order-actions">
          {canCancelOrder() && (
            <button className="btn-cancel" onClick={handleCancelOrder}>
              Cancel Order
            </button>
          )}
          
          {order.status === 'delivered' && (
            <button className="btn-reorder" onClick={handleReorder}>
              Reorder
            </button>
          )}
          
          <button className="btn-help" onClick={() => navigate('/orders')}>
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

