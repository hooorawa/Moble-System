import React, { useState, memo, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import cart_icon from '../../Assets/cart.png';
import './AddToCartButton.css';
import VariantCapture from '../../utils/variantCapture';
import { isCustomerSessionActive } from '../../utils/authSession';

const AddToCartButton = memo(({ 
  product, 
  selectedVariants = [], 
  className = '', 
  showQuantity = true,
  size = 'medium',
  autoCaptureVariants = true
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [capturedVariants, setCapturedVariants] = useState({});
  const { addToCart, addToCartLocal } = useCart();

  // Capture variants when component mounts or variants change
  useEffect(() => {
    if (autoCaptureVariants && window.variantCapture) {
      const variants = window.variantCapture.captureVariants();
      setCapturedVariants(variants);
    }
  }, [autoCaptureVariants, selectedVariants]);

  // Listen for variant changes
  useEffect(() => {
    const handleVariantChange = () => {
      if (autoCaptureVariants && window.variantCapture) {
        const variants = window.variantCapture.captureVariants();
        setCapturedVariants(variants);
      }
    };

    // Listen for variant selection changes
    document.addEventListener('change', handleVariantChange);
    document.addEventListener('click', handleVariantChange);

    return () => {
      document.removeEventListener('change', handleVariantChange);
      document.removeEventListener('click', handleVariantChange);
    };
  }, [autoCaptureVariants]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if user is logged in
    const isLoggedIn = isCustomerSessionActive();
    if (!isLoggedIn) {
      alert('Please sign in to add items to your cart!');
      return;
    }
    
    // Check stock availability
    if (product.quantity === 0) {
      alert('This product is out of stock!');
      return;
    }
    
    if (product.quantity < quantity) {
      alert(`Only ${product.quantity} items available in stock!`);
      return;
    }
    
    // Capture current variants
    let finalVariants = selectedVariants;
    if (autoCaptureVariants && window.variantCapture) {
      const captured = window.variantCapture.captureVariants();
      if (Object.keys(captured).length > 0) {
        // Convert captured variants to the format expected by the cart
        finalVariants = Object.entries(captured).map(([key, value]) => ({
          variation: key, // This will be the variation name/key
          value: value,
          priceAdjustment: 0 // You can calculate this based on your pricing logic
        }));
      }
    }
    
    // Debug: Log what we're sending to cart
    console.log('AddToCartButton - Product ID:', product._id);
    console.log('AddToCartButton - Quantity:', quantity);
    console.log('AddToCartButton - Selected Variants:', selectedVariants);
    console.log('AddToCartButton - Captured Variants:', capturedVariants);
    console.log('AddToCartButton - Final Variants:', finalVariants);
    
    setIsAdding(true);
    
    try {
      // Try API first, fallback to local storage
      const result = await addToCart(product._id, quantity, finalVariants);
      
      if (result.success) {
        // Show success feedback
        setTimeout(() => setIsAdding(false), 1000);
      } else {
        // Fallback to local storage if API fails
        const localResult = addToCartLocal(product, quantity, finalVariants);
        if (localResult.success) {
          setTimeout(() => setIsAdding(false), 1000);
        } else {
          setIsAdding(false);
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Fallback to local storage
      const localResult = addToCartLocal(product, quantity, finalVariants);
      if (localResult.success) {
        setTimeout(() => setIsAdding(false), 1000);
      } else {
        setIsAdding(false);
      }
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  if (!product) return null;

  // Check if user is logged in
  const isLoggedIn = isCustomerSessionActive();

  return (
    <div className={`add-to-cart-container ${className} ${size}`}>
      {showQuantity && isLoggedIn && (
        <div className="quantity-selector">
          <button 
            type="button"
            className="quantity-btn quantity-decrease"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            className="quantity-input"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            min="1"
            max="99"
            aria-label="Quantity"
          />
          <button 
            type="button"
            className="quantity-btn quantity-increase"
            onClick={incrementQuantity}
            disabled={quantity >= 99}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      )}
      
      <button
        className={`add-to-cart-btn ${isAdding ? 'adding' : ''} ${product.quantity === 0 ? 'out-of-stock' : ''} ${!isLoggedIn ? 'sign-in-required' : ''}`}
        onClick={handleAddToCart}
        disabled={isAdding || product.quantity === 0}
        aria-label={`Add ${product.name} to cart`}
      >
        {isAdding ? (
          <>
            <span className="btn-spinner"></span>
            Adding...
          </>
        ) : !isLoggedIn ? (
          'Sign In to Add to Cart'
        ) : product.quantity === 0 ? (
          'Out of Stock'
        ) : (
          <>
            <img 
              src={cart_icon} 
              alt="Cart" 
              className="cart-icon-image"
            />
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
});

AddToCartButton.displayName = 'AddToCartButton';

export default AddToCartButton;
