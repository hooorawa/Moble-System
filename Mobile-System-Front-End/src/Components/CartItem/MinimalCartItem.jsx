import React, { memo } from 'react';
import './MinimalCartItem.css';

const MinimalCartItem = memo(({ item, onQuantityChange, onRemove }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);
  };

  const formatVariants = (variants) => {
    if (!variants || variants.length === 0) {
      return 'No options selected';
    }
    
    return variants.map(variant => {
      const name = variant.variation?.name || variant.variationName || 'option';
      const value = variant.value || 'unknown';
      return `${name}: ${value}`;
    }).join(', ');
  };

  const getImageUrl = () => {
    if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
      return item.product.images[0];
    }
    if (item.product?.image) {
      return item.product.image;
    }
    return 'https://via.placeholder.com/80x80/cccccc/ffffff?text=Image';
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      onQuantityChange(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  if (!item || !item.product) return null;

  return (
    <div className="minimal-cart-item">
      <img 
        src={getImageUrl()} 
        alt={item.product.name}
        className="minimal-product-image"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/80x80/cccccc/ffffff?text=Image';
        }}
      />
      
      <div className="minimal-product-details">
        <div className="minimal-product-name">{item.product.name}</div>
        <div className="minimal-product-brand">
          {item.product.brand?.name || item.product.brand || 'Unknown Brand'}
        </div>
        <div className="minimal-product-price">{formatPrice(item.unitPrice)}</div>
        <div className="minimal-selected-options">
          <div className="minimal-options-label">Selected options:</div>
          <div className="minimal-options-text">
            {formatVariants(item.selectedVariants)}
          </div>
        </div>
      </div>
      
      <div className="minimal-cart-controls">
        <div className="minimal-quantity-controls">
          <button 
            className="minimal-quantity-btn" 
            type="button"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <div className="minimal-quantity-display">{item.quantity}</div>
          <button 
            className="minimal-quantity-btn" 
            type="button"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= 99}
          >
            +
          </button>
        </div>
        
        <div className="minimal-item-total">
          {formatPrice(item.unitPrice * item.quantity)}
        </div>
        
        <button 
          className="minimal-remove-btn" 
          type="button"
          onClick={handleRemove}
        >
          Remove
        </button>
      </div>
    </div>
  );
});

MinimalCartItem.displayName = 'MinimalCartItem';

export default MinimalCartItem;
