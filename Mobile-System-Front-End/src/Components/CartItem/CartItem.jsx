import React, { useState, memo } from 'react';
import { useCart } from '../../contexts/CartContext';
import './CartItem.css';

const CartItem = memo(({ item }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { updateCartItem, updateCartItemLocal, removeFromCart, removeFromCartLocal } = useCart();

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    
    setIsUpdating(true);
    setQuantity(newQuantity);
    
    try {
      // Try API first
      const result = await updateCartItem(item._id, newQuantity);
      if (!result.success) {
        // Fallback to local update
        updateCartItemLocal(item._id, newQuantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Fallback to local update
      updateCartItemLocal(item._id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    
    try {
      // Try API first
      const result = await removeFromCart(item._id);
      if (!result.success) {
        // Fallback to local removal
        setTimeout(() => {
          removeFromCartLocal(item._id);
        }, 300);
      } else {
        // API success, just wait for animation
        setTimeout(() => {}, 300);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Fallback to local removal 
      setTimeout(() => {
        removeFromCartLocal(item._id);
      }, 300);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const formatVariants = (variants) => {
    if (!variants || variants.length === 0) return '';
    return variants.map(variant => {
      const variantName = variant.variationName || variant.variation?.name || variant.variation || 'Option';
      const variantValue = variant.value || 'Unknown';
      return `${variantName}: ${variantValue}`;
    }).join(' • ');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);
  };

  const getImageUrl = () => {
    if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
      return item.product.images[0];
    }
    if (item.product?.image) {
      return item.product.image;
    }
    return '/placeholder-product.jpg';
  };

  if (!item || !item.product) return null;

  return (
    <div className={`cart-item modern-cart-item ultra-compact ${isUpdating ? 'updating' : ''} ${isRemoving ? 'removing' : ''}`}>
      <div className="cart-item-image">
        <div className="image-container ultra-compact">
          <img 
            src={getImageUrl()} 
            alt={item.product.name}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/placeholder-product.jpg';
            }}
          />
          {isUpdating && (
            <div className="image-overlay">
              <div className="loading-spinner-small"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="cart-item-details">
        <div className="product-info ultra-compact">
          <h3 className="cart-item-name">{item.product.name}</h3>
          
          {item.product.brand && (
            <p className="cart-item-brand">{item.product.brand.name}</p>
          )}
          
          <div className="cart-item-price">
            <span className="price-current">{formatPrice(item.product.price)}</span>
            {item.price !== item.product.price && (
              <span className="price-original">{formatPrice(item.product.price)}</span>
            )}
          </div>
        </div>
        
        {/* Display selected variants - Clean Production Version */}
        <div className="cart-item-variants ultra-compact">
          <div className="variants-label">Selected Options:</div>
          <div className="variants-list">
            {item.selectedVariants && item.selectedVariants.length > 0 ? (
              item.selectedVariants.map((variant, index) => {
                const variantName = variant.variation?.name || variant.variationName || 'Option';
                const variantValue = variant.value || 'Unknown';
                return (
                  <span key={index} className="variant-tag ultra-compact">
                    {variantName}: {variantValue}
                  </span>
                );
              })
            ) : (
              <span className="variant-tag ultra-compact no-variants">
                No options selected
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="cart-item-controls ultra-compact">
        <div className="quantity-section">
          <div className="quantity-controls ultra-compact">
            <button
              className="quantity-btn quantity-decrease modern-btn ultra-compact"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || isUpdating}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="quantity-display">{quantity}</span>
            <button
              className="quantity-btn quantity-increase modern-btn ultra-compact"
              onClick={incrementQuantity}
              disabled={quantity >= 99 || isUpdating}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="price-section">
          <div className="cart-item-total">
            <span className="total-amount">{formatPrice((item.product.price || 0) * quantity)}</span>
          </div>
        </div>
        
        <button
          className="remove-btn modern-btn danger-btn ultra-compact"
          onClick={handleRemove}
          disabled={isUpdating || isRemoving}
          aria-label="Remove item from cart"
          title="Remove item"
        >
          ×
        </button>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;