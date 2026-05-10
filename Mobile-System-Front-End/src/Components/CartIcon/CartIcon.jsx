import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import cart_icon from "../../Assets/cart.png";
import './CartIcon.css';
import { isCustomerSessionActive } from '../../utils/authSession';

const CartIcon = ({ className = '' }) => {
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleCartClick = () => {
    // Check if user is logged in
    const isLoggedIn = isCustomerSessionActive();
    if (!isLoggedIn) {
      alert('Please sign in to access your cart!');
      return;
    }
    navigate('/cart');
  };

  return (
    <button
      className={`cart-icon-btn ${className}`}
      onClick={handleCartClick}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <div className="cart-icon-container">
        <img 
          src={cart_icon} 
          alt="Shopping cart" 
          className="cart-icon-image"
        />
        {itemCount > 0 && (
          <span className="cart-badge">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default CartIcon;
