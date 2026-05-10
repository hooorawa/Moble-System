import { API_BASE_URL, SERVER_URL } from './../../../config';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminOrderDetail.css';
import ApiService from '../../../services/api';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    totalPrice: '',
    paidPrice: '',
    paymentPlanType: 'full',
    advancePaidPrice: '0',
    monthlyInstallment: '0',
    totalInstallments: '0',
    paidInstallments: '0',
    remainingMonths: '0',
    remainingBalance: '0',
    customerMobile: '',
    billNumber: '',
    invoiceNumber: '',
    customerNocNumber: '',
    invoiceIssueDate: new Date().toISOString().slice(0, 10),
    discountAmount: '0',
    cashPayable: '',
    dueAmount: '',
    paidAmount: '',
    balanceAmount: '',
    warrantyMonths: '6',
    invoiceNotes: ''
  });

  const generateAutoRef = (type) => {
    // Generate preview with timestamp-based number
    // Bills start at 10001, Invoices start at 20001
    const now = new Date();
    const baseNumber = type === 'BILL' ? 10000 : 20000;
    const uniqueNumber = baseNumber + parseInt(String(now.getTime()).slice(-4));
    return String(uniqueNumber);
  };

  const calculateRemainingMonths = (totalInstallments, paidInstallments) => {
    const total = parseInt(totalInstallments, 10) || 0;
    const paid = parseInt(paidInstallments, 10) || 0;
    return Math.max(total - paid, 0);
  };

  const recalcInvoiceFinancials = (nextForm) => {
    const total = parseFloat(nextForm.totalPrice) || 0;
    const discount = Math.max(parseFloat(nextForm.discountAmount) || 0, 0);
    const cashPayable = Math.max(total - discount, 0);
    const isInstallment = nextForm.paymentPlanType === 'installment';
    const advancePaid = Math.max(parseFloat(nextForm.advancePaidPrice) || 0, 0);
    const paidAmount = isInstallment
      ? advancePaid
      : (parseFloat(nextForm.paidAmount ?? nextForm.paidPrice) || 0);
    const remainingBalance = isInstallment
      ? Math.max(cashPayable - advancePaid, 0)
      : Math.max(cashPayable - paidAmount, 0);
    const remainingMonths = calculateRemainingMonths(nextForm.totalInstallments, nextForm.paidInstallments);

    return {
      ...nextForm,
      paidPrice: String(paidAmount),
      paidAmount: String(paidAmount),
      cashPayable: String(cashPayable),
      dueAmount: String(cashPayable),
      balanceAmount: String(remainingBalance),
      remainingBalance: String(remainingBalance),
      remainingMonths: String(remainingMonths)
    };
  };

  const handlePaymentFieldChange = (field, value) => {
    setPaymentFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'paymentPlanType') {
        if (value === 'installment') {
          next.advancePaidPrice = next.advancePaidPrice || '0';
          next.monthlyInstallment = next.monthlyInstallment || '0';
          next.totalInstallments = next.totalInstallments || '0';
          next.paidInstallments = next.paidInstallments || '0';
        } else {
          const total = parseFloat(next.totalPrice) || 0;
          next.advancePaidPrice = '0';
          next.monthlyInstallment = '0';
          next.totalInstallments = '0';
          next.paidInstallments = '0';
          next.remainingMonths = '0';
          next.remainingBalance = '0';
          next.paidPrice = String(total);
          next.paidAmount = String(total);
        }
      }

      if (field === 'advancePaidPrice' && next.paymentPlanType === 'installment') {
        next.paidPrice = value;
        next.paidAmount = value;
      }

      if (field === 'paidPrice') {
        next.paidAmount = value;
      }
      if (field === 'paidAmount') {
        next.paidPrice = value;
      }

      if (field === 'totalInstallments' || field === 'paidInstallments') {
        next.remainingMonths = String(calculateRemainingMonths(next.totalInstallments, next.paidInstallments));
      }

      if (
        [
          'totalPrice',
          'discountAmount',
          'paidAmount',
          'paidPrice',
          'paymentPlanType',
          'advancePaidPrice',
          'monthlyInstallment',
          'totalInstallments',
          'paidInstallments'
        ].includes(field)
      ) {
        return recalcInvoiceFinancials(next);
      }
      return next;
    });
  };

  const orderStatuses = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled', 'refunded'];

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use admin-specific order endpoint
      const response = await fetch(`${API_BASE_URL}/admin/order/${orderId}`, {
        credentials: 'include'
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setOrder(data.data);
          setTrackingNumber(data.data.trackingNumber || '');
          setNotes(data.data.notes || '');
        } else {
          setError(data.message);
        }
      } else {
        console.error('Failed to fetch order details or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setError('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    // If confirming the order, show payment modal first
    if (newStatus === 'confirmed') {
      handleConfirmPayment();
      return;
    }

    if (!window.confirm(`Update order status to "${newStatus}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      const response = await ApiService.updateOrderStatus(orderId, {
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
        notes: notes || undefined
      });

      if (response.success) {
        setOrder(response.data);
        alert('Order status updated successfully');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    try {
      setUpdating(true);
      const response = await ApiService.updateOrderStatus(orderId, {
        trackingNumber,
        notes
      });

      if (response.success) {
        setOrder(response.data);
        alert('Tracking information updated successfully');
      }
    } catch (error) {
      console.error('Error updating tracking:', error);
      alert('Failed to update tracking information');
    } finally {
      setUpdating(false);
    }
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

  const handleConfirmPayment = () => {
    // Pre-fill form with order data
    const orderTotal = Number(order.total || 0);
    const generatedBillNumber = generateAutoRef('BILL');
    const generatedInvoiceNumber = generateAutoRef('INV');
    setPaymentFormData({
      totalPrice: orderTotal.toString(),
      paidPrice: orderTotal.toString(),
      paymentPlanType: 'full',
      advancePaidPrice: '0',
      monthlyInstallment: '0',
      totalInstallments: '0',
      paidInstallments: '0',
      remainingMonths: '0',
      remainingBalance: '0',
      customerMobile: order.customer?.phoneNumber || order.deliveryAddress?.phoneNumber || '',
      billNumber: generatedBillNumber,
      invoiceNumber: generatedInvoiceNumber,
      customerNocNumber: '',
      invoiceIssueDate: new Date().toISOString().slice(0, 10),
      discountAmount: '0',
      cashPayable: orderTotal.toString(),
      dueAmount: orderTotal.toString(),
      paidAmount: orderTotal.toString(),
      balanceAmount: '0',
      warrantyMonths: '6',
      invoiceNotes: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentModalSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!paymentFormData.totalPrice) {
      alert('Please fill in total price');
      return;
    }

    const isInstallment = paymentFormData.paymentPlanType === 'installment';
    const totalPrice = parseFloat(paymentFormData.totalPrice);
    const paidPrice = parseFloat(
      isInstallment ? paymentFormData.advancePaidPrice : paymentFormData.paidPrice
    );

    if (isNaN(totalPrice) || isNaN(paidPrice) || totalPrice <= 0 || paidPrice < 0) {
      alert('Please enter valid prices');
      return;
    }

    const monthlyInstallment = parseFloat(paymentFormData.monthlyInstallment || 0);
    const totalInstallments = parseInt(paymentFormData.totalInstallments || 0, 10);
    const paidInstallments = parseInt(paymentFormData.paidInstallments || 0, 10);

    if (isInstallment) {
      if (monthlyInstallment <= 0 || totalInstallments <= 0) {
        alert('For installment payment, monthly installment and total installments are required.');
        return;
      }

      if (paidInstallments < 0 || paidInstallments > totalInstallments) {
        alert('Paid installments must be between 0 and total installments.');
        return;
      }
    }

    try {
      setUpdating(true);
      
      // Update order status to confirmed if not already
      if (order.status !== 'confirmed') {
        await ApiService.updateOrderStatus(orderId, {
          status: 'confirmed',
          trackingNumber: trackingNumber || undefined,
          notes: notes || undefined
        });
      }

      // Create payment record with additional fields
      const paymentResponse = await ApiService.createPaymentRecord(orderId, {
        notes: notes || '',
        totalPrice: totalPrice,
        paidPrice: paidPrice,
        paymentPlanType: paymentFormData.paymentPlanType,
        advancePaidPrice: isInstallment ? (parseFloat(paymentFormData.advancePaidPrice) || 0) : 0,
        monthlyInstallment: isInstallment ? monthlyInstallment : 0,
        remainingBalance: isInstallment ? (parseFloat(paymentFormData.remainingBalance) || 0) : 0,
        totalInstallments: isInstallment ? totalInstallments : 0,
        paidInstallments: isInstallment ? paidInstallments : 0,
        remainingMonths: isInstallment
          ? calculateRemainingMonths(totalInstallments, paidInstallments)
          : 0,
        customerMobile: paymentFormData.customerMobile,
        billNumber: paymentFormData.billNumber,
        invoiceNumber: paymentFormData.invoiceNumber,
        customerNocNumber: paymentFormData.customerNocNumber,
        invoiceIssueDate: paymentFormData.invoiceIssueDate,
        discountAmount: parseFloat(paymentFormData.discountAmount || 0),
        cashPayable: parseFloat(paymentFormData.cashPayable || 0),
        dueAmount: parseFloat(paymentFormData.dueAmount || 0),
        paidAmount: parseFloat(
          isInstallment
            ? (paymentFormData.advancePaidPrice || paymentFormData.paidAmount || paidPrice)
            : (paymentFormData.paidAmount || paidPrice)
        ),
        balanceAmount: parseFloat(paymentFormData.balanceAmount || 0),
        warrantyMonths: parseInt(paymentFormData.warrantyMonths || 0, 10),
        invoiceNotes: paymentFormData.invoiceNotes
      });

      if (paymentResponse.success) {
        setShowPaymentModal(false);
        await fetchOrderDetails();
        alert('Payment confirmed and record created');
        navigate('/admin/dashboard?section=payment-records');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMsg = error?.message || error?.data?.message || 'Failed to confirm payment';
      alert(errorMsg);
    } finally {
      setUpdating(false);
    }
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

  if (loading) {
    return (
      <div className="admin-order-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="admin-order-detail-error">
        <p>{error || 'Order not found'}</p>
        <button onClick={() => navigate('/admin/dashboard?section=orders')}>Back to Orders</button>
      </div>
    );
  }

  return (
    <div className="admin-order-detail-container">
      {/* Top Navigation Bar */}
      <div className="detail-top-nav">
        <button className="back-button" onClick={() => navigate('/admin/dashboard?section=orders')}>
          ← Back to Orders
        </button>
        <div className="order-header-info">
          <h1 className="order-detail-title">Order {order.orderNumber}</h1>
          <span 
            className="order-detail-status"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column */}
        <div className="detail-left-column">
          {/* Order Overview Card */}
          <div className="overview-card">
            <div className="overview-header">
              <div className="overview-label">Order Date</div>
              <div className="overview-value">{formatDate(order.createdAt)}</div>
            </div>
            <div className="overview-stats">
              <div className="stat-item">
                <span className="stat-label">Items</span>
                <span className="stat-value">{order.orderProducts?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Subtotal</span>
                <span className="stat-value">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tax</span>
                <span className="stat-value">{formatCurrency(order.tax)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Delivery</span>
                <span className="stat-value">{order.delivery === 0 ? 'FREE' : formatCurrency(order.delivery)}</span>
              </div>
            </div>
            <div className="overview-total">
              <span>Total Amount</span>
              <span className="total-price">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Customer Card */}
          <div className="info-card">
            <h3>Customer</h3>
            <div className="customer-info-section">
              <div className="customer-avatar-large">
                {order.customer?.name?.charAt(0) || 'G'}
              </div>
              <div className="customer-info-details">
                <div className="customer-name-large">{order.customer?.name || 'Guest'}</div>
                <div className="customer-email-large">{order.customer?.email || 'N/A'}</div>
                <div className="customer-phone-large">{order.customer?.phoneNumber || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Delivery Info Card */}
          <div className="info-card">
            <h3>Delivery Address</h3>
            <div className="address-box">
              <div className="address-name">{order.deliveryAddress?.name}</div>
              <div className="address-line">{order.deliveryAddress?.address}</div>
              <div className="address-line">
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.postalCode}
              </div>
              <div className="address-phone">📞 {order.deliveryAddress?.phoneNumber}</div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="info-card">
            <h3>Payment Information</h3>
            <div className="payment-info-box">
              <div className="payment-row">
                <span>Method:</span>
                <span className="payment-method">{order.paymentMethod?.type || 'N/A'}</span>
              </div>
              <div className="payment-row">
                <span>Status:</span>
                <span 
                  className="payment-status-label"
                  style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus) }}
                >
                    {order.paymentStatus || 'pending'}
                </span>
              </div>
              {order.paymentStatus !== 'paid' && (
                <button
                  className="update-btn"
                  onClick={handleConfirmPayment}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Confirm Payment'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="detail-right-column">

        {/* Order Items */}
        <div className="detail-card">
          <h3>Order Items</h3>
          <div className="order-items-list">
            {order.orderProducts && order.orderProducts.length > 0 ? (
              order.orderProducts.map((item, index) => {
                const imageUrl = item.product?.images?.[0] || item.productSnapshot?.images?.[0];
                
                // Check if image is base64, full URL, or relative path
                const imageSrc = imageUrl?.startsWith('data:') 
                  ? imageUrl 
                  : imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')
                  ? imageUrl
                  : imageUrl 
                  ? `${SERVER_URL}${imageUrl}` 
                  : null;
                
                return (
                <div key={index} className="order-item">
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
                  <div className="item-details">
                    <h4>{item.product?.name || item.productSnapshot?.name || 'Product'}</h4>
                    <p className="item-sku">SKU: {item.product?.sku || item.productSnapshot?.sku || 'N/A'}</p>
                    
                    {/* Display EMI Number (Admin Only) */}
                    {(item.product?.emiNumber || item.productSnapshot?.emiNumber) && (
                      <p className="item-emi">
                        <strong>EMI Number:</strong> {item.product?.emiNumber || item.productSnapshot?.emiNumber}
                      </p>
                    )}
                    
                    {/* Display variants */}
                    {item.selectedVariants && item.selectedVariants.length > 0 && (
                      <div className="item-variants">
                        {item.selectedVariants.map((variant, vIndex) => (
                          <span key={vIndex} className="variant-tag">
                            {variant.variation?.name || 'Variant'}: {variant.value}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="item-pricing">
                      <span>Quantity: {item.quantity}</span>
                      <span>Price: {formatCurrency(item.unitPrice)}</span>
                      {/* <span className="item-total">Total: {formatCurrency(item.totalPrice)}</span> */}
                    </div>
                  </div>
                </div>
              );
              })
            ) : (
              <p>No items found</p>
            )}
          </div>

          {/* Order Totals */}
          <div className="order-totals">
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

        {/* Status Management */}
        <div className="detail-card">
          <h3>Order Management</h3>
          
          <div className="status-buttons">
            {orderStatuses.map(status => (
              <button
                key={status}
                className={`status-btn ${order.status === status ? 'active' : ''}`}
                style={{ 
                  backgroundColor: order.status === status ? getStatusColor(status) : '#ecf0f1',
                  color: order.status === status ? 'white' : '#2c3e50'
                }}
                onClick={() => handleStatusUpdate(status)}
                disabled={updating || order.status === status}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="tracking-section">
            <div className="input-group">
              <label>Tracking Number:</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>

            <div className="input-group">
              <label>Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this order"
                rows="3"
              />
            </div>

            <button
              className="update-btn"
              onClick={handleUpdateTracking}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Tracking Info'}
            </button>
          </div>
        </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="detail-card">
              <h3>Order Notes</h3>
              <p className="order-notes">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h2>Confirm Payment</h2>
              <button 
                className="payment-modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePaymentModalSubmit} className="payment-modal-body">
              <div className="payment-modal-info payment-form-group-full">
                <p><strong>Order:</strong> {order.orderNumber}</p>
                <p><strong>Customer:</strong> {order.customer?.name || 'Guest'}</p>
              </div>

              <div className="payment-form-group">
                <label>Installment Payment:</label>
                <label className="payment-plan-toggle">
                  <input
                    type="checkbox"
                    checked={paymentFormData.paymentPlanType === 'installment'}
                    onChange={(e) => handlePaymentFieldChange('paymentPlanType', e.target.checked ? 'installment' : 'full')}
                  />
                  <span>
                    {paymentFormData.paymentPlanType === 'installment'
                      ? 'Monthly installment selected'
                      : 'Full payment selected'}
                  </span>
                </label>
              </div>

              <div className="payment-form-group">
                <label>Customer Mobile Number</label>
                <input
                  type="text"
                  value={paymentFormData.customerMobile}
                  onChange={(e) => setPaymentFormData({...paymentFormData, customerMobile: e.target.value})}
                  placeholder="Enter customer mobile number"
                />
              </div>

              <div className="payment-form-group">
                <label>Bill Number</label>
                <input
                  type="text"
                  value={paymentFormData.billNumber}
                  readOnly
                />
              </div>

              <div className="payment-form-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={paymentFormData.invoiceNumber}
                  readOnly
                />
              </div>

              <div className="payment-form-group">
                <label>Customer NOC Number</label>
                <input
                  type="text"
                  value={paymentFormData.customerNocNumber}
                  onChange={(e) => handlePaymentFieldChange('customerNocNumber', e.target.value)}
                  placeholder="Enter customer NOC number"
                />
              </div>

              <div className="payment-form-group">
                <label>Invoice Date</label>
                <input
                  type="date"
                  value={paymentFormData.invoiceIssueDate}
                  onChange={(e) => setPaymentFormData({...paymentFormData, invoiceIssueDate: e.target.value})}
                />
              </div>

              <div className="payment-form-group">
                <label>Total Price <span className="required">*</span></label>
                <input
                  type="text"
                  value={paymentFormData.totalPrice}
                  onChange={(e) => handlePaymentFieldChange('totalPrice', e.target.value)}
                  placeholder="Enter total price"
                  required
                />
              </div>

              {paymentFormData.paymentPlanType === 'full' ? (
                <div className="payment-form-group">
                  <label>Cash Paid <span className="required">*</span></label>
                  <input
                    type="text"
                    value={paymentFormData.paidPrice}
                    onChange={(e) => handlePaymentFieldChange('paidPrice', e.target.value)}
                    placeholder="Enter cash paid"
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="payment-form-group">
                    <label>Advance Paid Price <span className="required">*</span></label>
                    <input
                      type="text"
                      value={paymentFormData.advancePaidPrice}
                      onChange={(e) => handlePaymentFieldChange('advancePaidPrice', e.target.value)}
                      placeholder="Enter advance payment"
                      required
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Monthly Installment <span className="required">*</span></label>
                    <input
                      type="text"
                      value={paymentFormData.monthlyInstallment}
                      onChange={(e) => handlePaymentFieldChange('monthlyInstallment', e.target.value)}
                      placeholder="Enter monthly installment"
                      required
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Total Installments <span className="required">*</span></label>
                    <input
                      type="number"
                      min="0"
                      value={paymentFormData.totalInstallments}
                      onChange={(e) => handlePaymentFieldChange('totalInstallments', e.target.value)}
                      placeholder="Enter total installments"
                      required
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Paid Installments</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentFormData.paidInstallments}
                      onChange={(e) => handlePaymentFieldChange('paidInstallments', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Remaining Months</label>
                    <input
                      type="number"
                      value={paymentFormData.remainingMonths}
                      readOnly
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Remaining Balance</label>
                    <input
                      type="text"
                      value={paymentFormData.remainingBalance}
                      readOnly
                    />
                  </div>
                </>
              )}

              <div className="payment-form-group">
                <label>Discount Amount</label>
                <input
                  type="text"
                  value={paymentFormData.discountAmount}
                  onChange={(e) => handlePaymentFieldChange('discountAmount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="payment-form-group">
                <label>Cash Payable</label>
                <input
                  type="text"
                  value={paymentFormData.cashPayable}
                  readOnly
                  placeholder="0.00"
                />
              </div>

              <div className="payment-form-group">
                <label>Paid Amount</label>
                <input
                  type="text"
                  value={paymentFormData.paidAmount}
                  onChange={(e) => handlePaymentFieldChange('paidAmount', e.target.value)}
                  readOnly={paymentFormData.paymentPlanType === 'installment'}
                  placeholder="0.00"
                />
              </div>

              <div className="payment-form-group">
                <label>Balance Amount</label>
                <input
                  type="text"
                  value={paymentFormData.balanceAmount}
                  readOnly
                  placeholder="0.00"
                />
              </div>

              <div className="payment-form-group">
                <label>Warranty (Months)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentFormData.warrantyMonths}
                  onChange={(e) => setPaymentFormData({...paymentFormData, warrantyMonths: e.target.value})}
                  placeholder="6"
                />
              </div>

              <div className="payment-form-group payment-form-group-full">
                <label>Invoice Notes</label>
                <textarea
                  value={paymentFormData.invoiceNotes}
                  onChange={(e) => setPaymentFormData({...paymentFormData, invoiceNotes: e.target.value})}
                  placeholder="Optional invoice notes"
                  rows="3"
                />
              </div>

              <div className="payment-modal-footer payment-form-group-full">
                <button 
                  type="button"
                  className="payment-modal-cancel"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="payment-modal-confirm"
                  disabled={updating}
                >
                  {updating ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;

