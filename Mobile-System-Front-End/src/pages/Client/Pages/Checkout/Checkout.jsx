import React, { useState, useEffect } from 'react';
import { useCart } from '../../../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../../services/api';
import './Checkout.css';

const Checkout = () => {
  const { cart, clearCartLocal } = useCart();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cash_on_delivery',
    notes: ''
  });

  useEffect(() => {
    // Require login for checkout
    const isLoggedIn = !!(localStorage.getItem('token') || localStorage.getItem('role'));
    if (!isLoggedIn) {
      alert('Please sign in to access payment page!');
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await ApiService.getAddresses();
        setSavedAddresses(data.addresses || []);
      } catch (fetchError) {
        console.error('Error fetching saved addresses:', fetchError);
        setSavedAddresses([]);
      }
    };

    fetchAddresses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (selectedAddressId) {
      setSelectedAddressId('');
    }
    setCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelect = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);

    if (!addressId) {
      return;
    }

    const selectedAddress = savedAddresses.find(address => address._id === addressId);
    if (selectedAddress) {
      setCustomerForm(prev => ({
        ...prev,
        name: selectedAddress.name || '',
        address: selectedAddress.address || '',
        city: selectedAddress.city || '',
        phoneNumber: selectedAddress.phoneNumber || '',
        postalCode: selectedAddress.postalCode || ''
      }));
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

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <h2>Your cart is empty</h2>
            <button onClick={() => navigate('/')} className="continue-shopping-btn">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Payment</h1>
          <p>Please enter your details to place the order.</p>
        </div>

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        <div className="checkout-content">
          <div className="checkout-main">
            <div className="checkout-step">
              <h2>Payment and Customer Details</h2>
              <p>Fill in your information to send the order request.</p>

              <div className="customer-details-form">
                <div className="form-group">
                  <label>Saved Address (optional)</label>
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressSelect}
                  >
                    <option value="" disabled>Add new address</option>
                    {savedAddresses.map(address => (
                      <option key={address._id} value={address._id}>
                        {address.name} - {address.address}, {address.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Name </label>
                  <input
                    type="text"
                    name="name"
                    value={customerForm.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={customerForm.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email (optional)"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={customerForm.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address </label>
                  <textarea
                    name="address"
                    value={customerForm.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows="2"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City </label>
                    <input
                      type="text"
                      name="city"
                      value={customerForm.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={customerForm.postalCode}
                      onChange={handleInputChange}
                      placeholder="Postal code"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={customerForm.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="koko_payment">KOKO Payment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    name="notes"
                    value={customerForm.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for your order..."
                    rows="2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>
              
              <div className="order-items">
                {(cart.items || []).map((item, index) => (
                  <div key={item._id || index} className="order-item">
                    <div className="item-image">
                      <img 
                        src={item.product?.images?.[0] || '/placeholder-product.png'} 
                        alt={item.product?.name}
                        onError={(e) => e.target.src = '/placeholder-product.png'}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{item.product?.name}</h4>
                      <p>Qty: {item.quantity}</p>
                      {item.selectedVariants && item.selectedVariants.length > 0 && (
                        <div className="item-variants">
                          {item.selectedVariants.map((variant, idx) => (
                            <span key={idx} className="variant-tag">
                              {variant.variation?.name}: {variant.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="item-price">
                      {formatPrice(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-totals">
                <div className="total-line">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="total-line">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="total-line total">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              <div className="checkout-actions">
                <button 
                  className="btn-primary btn-confirm"
                  onClick={async () => {
                    if (!customerForm.name || !customerForm.phoneNumber || !customerForm.address || !customerForm.city || !customerForm.postalCode) {
                      setError('Please fill in all required fields.');
                      return;
                    }

                    try {
                      setSubmitting(true);
                      setError('');

                      let deliveryAddressId = selectedAddressId;
                      let billingAddressId = selectedAddressId;

                      if (!selectedAddressId) {
                        const addressPayload = {
                          name: customerForm.name,
                          address: customerForm.address,
                          city: customerForm.city,
                          postalCode: customerForm.postalCode,
                          phoneNumber: customerForm.phoneNumber
                        };

                        const addressResponse = await ApiService.addAddress(addressPayload);

                        if (!addressResponse?.success || !addressResponse?.address?._id) {
                          setError(addressResponse?.message || 'Failed to save delivery address.');
                          setSubmitting(false);
                          return;
                        }

                        deliveryAddressId = addressResponse.address._id;
                        billingAddressId = deliveryAddressId;
                      }

                      if (!deliveryAddressId) {
                        setError('Delivery address is required.');
                        setSubmitting(false);
                        return;
                      }

                      const orderData = {
                        deliveryAddressId,
                        billingAddressId,
                        paymentMethod: {
                          type: customerForm.paymentMethod,
                          details: {}
                        },
                        notes: customerForm.notes,
                        useBillingAsDelivery: true
                      };

                      const data = await ApiService.createOrder(orderData);

                      clearCartLocal();
                      navigate(`/order-confirmation/${data.data._id}`);
                    } catch (err) {
                      console.error('Error creating order from payment page:', err);
                      const msg = err?.message || err?.data?.message || 'Failed to create order. Please try again.';
                      setError(msg);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Submit Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
