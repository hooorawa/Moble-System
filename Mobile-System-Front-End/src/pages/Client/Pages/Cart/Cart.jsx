import React, { useEffect, useState } from 'react';
import { useCart } from '../../../../contexts/CartContext';
import CartItem from '../../../../Components/CartItem/CartItem';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import { isCustomerSessionActive } from '../../../../utils/authSession';

const Cart = () => {
  const { cart, loading, clearCart, clearCartLocal } = useCart();
  const navigate = useNavigate();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = isCustomerSessionActive();
    if (!isLoggedIn) {
      alert('Please sign in to access your cart!');
      navigate('/');
      return;
    }

    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [navigate]);

  const handleProceedToCheckout = () => {
    // Go to separate payment page
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
      setIsClearing(true);
      
      // Clear UI immediately for better UX
      clearCartLocal();
      
      try {
        // Then sync with database
        await clearCart();
      } catch (error) {
        console.error('Error syncing cart clear with database:', error);
        // UI is already cleared, so user experience is not affected
      } finally {
        setIsClearing(false);
      }
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

  // Remove loading state - cart loads instantly from localStorage
  // if (loading) {
  //   return (
  //     <div className="cart-page">
  //       <div className="cart-container">
  //         <div className="cart-loading">
  //           <div className="loading-spinner"></div>
  //           <p>Loading your cart...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-empty">
            <h2>Your cart is empty</h2>
            {/* <p>Looks like you haven't added any items to your cart yet. Start shopping to add products to your cart.</p> */}
            <button 
              className="continue-shopping-btn modern-btn"
              onClick={handleContinueShopping}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header ultra-compact">
          <h1>Your Shopping Cart: {cart.items.length}</h1>
        </div>

        <div className="cart-content">
          <div className="cart-items-section">
            <div className="cart-items-header ultra-compact">
              <div className="items-title-section">
                <h2>Items</h2>
              </div>
              {cart.items.length > 0 && (
                <button 
                  className="clear-cart-btn modern-btn danger-btn"
                  onClick={handleClearCart}
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <>
                      <div className="btn-spinner"></div>
                      Clearing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Clear Cart
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="cart-items-list">
              {cart.items.map((item, index) => (
                <CartItem key={item._id || index} item={item} />
              ))}
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="cart-summary ultra-compact">
              <h3>Summary</h3>
              
              <div className="summary-details ultra-compact">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                
                <div className="summary-line">
                  <span>Dilivery fee</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
                
                <div className="summary-line total">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>
              
              <div className="summary-actions">
                <button 
                  className="checkout-btn modern-btn primary-btn"
                  onClick={handleProceedToCheckout}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {/* <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/> */}
                  </svg>
                  Process Payment
                </button>
                  
                <button 
                  className="continue-shopping-btn modern-btn secondary-btn"
                  onClick={handleContinueShopping}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;