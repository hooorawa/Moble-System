import { SERVER_URL } from './../../../../config';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../../../contexts/CartContext';
import ApiService from '../../../../services/api';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCartLocal } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getOrder(orderId);
      console.log('Order data received:', data.data);
      console.log('Order products:', data.data.orderProducts);
      console.log('Order items:', data.data.items);
      
      // Debug images
      if (data.data.items && data.data.items.length > 0) {
        console.log('First item images:', {
          productSnapshot: data.data.items[0].productSnapshot?.images,
          productId: data.data.items[0].productId?.images
        });
      }
      if (data.data.orderProducts && data.data.orderProducts.length > 0) {
        console.log('First orderProduct images:', {
          product: data.data.orderProducts[0].product?.images,
          productSnapshot: data.data.orderProducts[0].productSnapshot?.images
        });
      }
      
      // Debug variants for troubleshooting
      if (data.data.orderProducts) {
        data.data.orderProducts.forEach((product, index) => {
          console.log(`Product ${index}: ${product.product?.name}`);
          console.log(`  - Selected Variants:`, product.selectedVariants);
          if (product.selectedVariants && product.selectedVariants.length > 0) {
            product.selectedVariants.forEach((variant, vIndex) => {
              console.log(`    Variant ${vIndex}: ${variant.variation?.name || 'No name'}: ${variant.value}`);
            });
          }
        });
      }
      
      setOrder(data.data);
      
      // Clear cart after successful order confirmation
      console.log('Order confirmed - clearing cart');
      clearCartLocal();
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      processing: '#007bff',
      shipped: '#6f42c1',
      delivered: '#28a745',
      cancelled: '#dc3545',
      refunded: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '',
      confirmed: '',
      processing: '',
      shipped: '',
      delivered: '',
      cancelled: '',
      refunded: ''
    };
    return icons[status] || '';
  };

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-container">
          <div className="error-state">
            <h2>Order Not Found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <div className="order-confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon"></div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase. Your order has been successfully placed.</p>
        </div>

        {/* Order Summary Card */}
        <div className="order-summary-card">
          <div className="order-header">
            <div className="order-info">
              <h2>Order #{order.orderNumber}</h2>
              <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="order-status">
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="order-details">
            <div className="detail-section">
              <h3>Order Items</h3>
              <div className="order-items">
                {(order.items || order.orderProducts || []).map((item, index) => {
                  // Handle both direct items (with variants Map) and orderProducts (with selectedVariants array)
                  const isDirectItem = item.variants && typeof item.variants === 'object' && !Array.isArray(item.variants);
                  const product = isDirectItem ? item.productId : item.product;
                  const productName = isDirectItem ? item.productName : item.product?.name;
                  const variants = isDirectItem ? item.variants : item.selectedVariants;
                  
                  // Get image URL from product or productSnapshot
                  const imageUrl = product?.images?.[0] || item.productSnapshot?.images?.[0];
                  
                  // Debug logging
                  if (index === 0) {
                    console.log('[ORDER CONFIRMATION] First item image debug:', {
                      isDirectItem,
                      hasProduct: !!product,
                      productImages: product?.images,
                      productSnapshotImages: item.productSnapshot?.images,
                      imageUrl
                    });
                  }
                  
                  // Check if image is base64, full URL, or relative path
                  const imageSrc = imageUrl?.startsWith('data:') 
                    ? imageUrl 
                    : imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')
                    ? imageUrl
                    : imageUrl 
                    ? `${SERVER_URL}${imageUrl}` 
                    : '/placeholder-product.png';
                  
                  return (
                    <div key={item._id || index} className="order-item">
                      <div className="item-image">
                        <img 
                          src={imageSrc} 
                          alt={productName}
                          onError={(e) => e.target.src = '/placeholder-product.png'}
                        />
                      </div>
                      <div className="item-details">
                        <h4>{productName}</h4>
                        <p className="item-brand">
                          {product?.brand?.name} • {product?.category?.name}
                        </p>
                        
                        {/* Display variants from direct items (Map format) */}
                        {isDirectItem && variants && Object.keys(variants).length > 0 && (
                          <div className="item-variants">
                            {Object.entries(variants).map(([key, value], idx) => (
                              <span key={idx} className="variant-tag">
                                {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Display variants from orderProducts (Array format) */}
                        {!isDirectItem && variants && variants.length > 0 && (
                          <div className="item-variants">
                            {variants.map((variant, idx) => (
                              <span key={idx} className="variant-tag">
                                {variant.variation?.name || variant.variation || 'Variant'}: {variant.value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Fallback for unpopulated variants */}
                        {!isDirectItem && variants && variants.length > 0 && (!variants[0]?.variation?.name) && (
                          <div className="item-variants">
                            {variants.map((variant, idx) => (
                              <span key={idx} className="variant-tag">
                                Variant {idx + 1}: {variant.value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <p className="item-quantity">Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* <div className="detail-section">
              <h3>Shipping Address</h3>
              <div className="address-details">
                {order.deliveryAddress ? (
                  <>
                    <p><strong>{order.deliveryAddress.name}</strong></p>
                    <p>{order.deliveryAddress.address}</p>
                    <p>{order.deliveryAddress.city}, {order.deliveryAddress.postalCode}</p>
                    <p>Phone: {order.deliveryAddress.phoneNumber}</p>
                  </>
                ) : (
                  <p>Delivery address not available</p>
                )}
              </div>
            </div> */}

            <div className="detail-section">
              <h3>Billing Address</h3>
              <div className="address-details">
                {order.billingAddress ? (
                  <>
                    <p><strong>{order.billingAddress.name}</strong></p>
                    <p>{order.billingAddress.address}</p>
                    <p>{order.billingAddress.city}, {order.billingAddress.postalCode}</p>
                    <p>Phone: {order.billingAddress.phoneNumber}</p>
                  </>
                ) : (
                  <p>Same as shipping address</p>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>Payment Information</h3>
              <div className="payment-details">
                <p><strong>Payment Method:</strong> {
                  order.paymentMethod?.type === 'cash_on_delivery' ? 'Cash on Delivery' :
                  order.paymentMethod?.type === 'credit_card' ? 'Credit Card' :
                  order.paymentMethod?.type === 'bank_transfer' ? 'Bank Transfer' :
                  order.paymentMethod?.type || 'Not specified'
                }</p>
                <p><strong>Payment Status:</strong> 
                  <span className={`payment-status ${order.paymentStatus || 'pending'}`}>
                    {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending'}
                  </span>
                </p>
              </div>
            </div>

            {order.notes && (
              <div className="detail-section">
                <h3>Order Notes</h3>
                <p className="order-notes">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="order-totals">
            <div className="total-line">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="total-line">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="total-line total">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={() => navigate('/orders')} 
            className="btn-secondary"
          >
            View All Orders
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
          >
            Continue Shopping
          </button>
        </div>

        {/* Order Tracking Info */}
        {/* <div className="tracking-info">
          <h3>What's Next?</h3>
          <div className="tracking-steps">
            <div className={`tracking-step ${order.status === 'pending' ? 'active' : order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'completed' : ''}`}>
              <div className="step-icon"></div>
              <div className="step-content">
                <h4>Order Placed</h4>
                <p>Your order has been received and is being processed</p>
              </div>
            </div>
            <div className={`tracking-step ${order.status === 'confirmed' || order.status === 'processing' ? 'active' : order.status === 'shipped' || order.status === 'delivered' ? 'completed' : ''}`}>
              <div className="step-icon"></div>
              <div className="step-content">
                <h4>Order Confirmed</h4>
                <p>Your order has been confirmed and is being prepared</p>
              </div>
            </div>
            <div className={`tracking-step ${order.status === 'shipped' ? 'active' : order.status === 'delivered' ? 'completed' : ''}`}>
              <div className="step-icon"></div>
              <div className="step-content">
                <h4>Shipped</h4>
                <p>Your order is on its way to you</p>
                {order.trackingNumber && (
                  <p className="tracking-number">Tracking: {order.trackingNumber}</p>
                )}
              </div>
            </div>
            <div className={`tracking-step ${order.status === 'delivered' ? 'completed' : ''}`}>
              <div className="step-icon"></div>
              <div className="step-content">
                <h4>Delivered</h4>
                <p>Your order has been delivered successfully</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default OrderConfirmation;
