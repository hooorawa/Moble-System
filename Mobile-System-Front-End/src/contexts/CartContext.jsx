import { API_BASE_URL } from './../config';
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

// Get API base URL from environment or fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_BASE_URL + 'api'));

// Cart Context
const CartContext = createContext();

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_CART':
      return { 
        ...state, 
        cart: action.payload,
        itemCount: action.payload?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        loading: false 
      };
    
    case 'ADD_TO_CART':
      return {
        ...state,
        cart: action.payload,
        itemCount: action.payload?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        showToast: true,
        toastMessage: 'Item added to cart!'
      };
    
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: action.payload,
        itemCount: action.payload?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: action.payload,
        itemCount: action.payload?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        showToast: true,
        toastMessage: 'Item removed from cart!'
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: { items: [], subtotal: 0, tax: 0, delivery: 0, total: 0 },
        itemCount: 0,
        showToast: true,
        toastMessage: 'Cart cleared!'
      };
    
    case 'HIDE_TOAST':
      return { ...state, showToast: false };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    default:
      return state;
  }
};

// Initial State - Load from localStorage immediately
const getInitialCart = () => {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Error loading initial cart:', error);
  }
  return { items: [], subtotal: 0, tax: 0, delivery: 0, total: 0 };
};

const initialState = {
  cart: getInitialCart(), // Load instantly from localStorage
  itemCount: getInitialCart().items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
  loading: false, // No loading needed since we have localStorage data
  error: null,
  showToast: false,
  toastMessage: ''
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [userId, setUserId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Define error message state

  // Migrate cart data from old user ID to new user ID
  const migrateCartData = async (oldUserId, newUserId) => {
    try {
      console.log(`Migrating cart from ${oldUserId} to ${newUserId}`);
      
      // First try to get cart from localStorage (faster)
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart);
          if (cartData.items && cartData.items.length > 0) {
            console.log(`Found ${cartData.items.length} items in localStorage, migrating...`);
            
            // Migrate each item from localStorage to new user ID
            for (const item of cartData.items) {
              if (item.product && item.product._id) {
                await fetch(`${API_BASE_URL}/cart/${newUserId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    productId: item.product._id,
                    quantity: item.quantity,
                    selectedVariants: item.selectedVariants || []
                  })
                });
                console.log(`Migrated item: ${item.product.name}`);
              }
            }
            console.log('Cart data migrated successfully from localStorage');
            return;
          }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Network error - silently continue
        return;
      }
      console.error('Error parsing localStorage cart:', error);
    }
      }
    
    // Fallback: Fetch cart from old user ID in database
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${oldUserId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.items.length > 0) {
          console.log(`Found ${data.data.items.length} items in database, migrating...`);
          
          // Migrate each item to new user ID
          for (const item of data.data.items) {
            if (item.product && item.product._id) {
              try {
                await fetch(`${API_BASE_URL}/cart/${newUserId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    productId: item.product._id,
                    quantity: item.quantity,
                    selectedVariants: item.selectedVariants || []
                  })
                });
                console.log(`Migrated item: ${item.product.name}`);
              } catch (itemError) {
                // Silently continue on individual item migration errors
              }
            }
          }
          console.log('Cart data migrated successfully from database');
        }
      }
    } catch (error) {
      // Silently handle connection errors
      if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
        console.error('Error migrating cart data:', error);
      }
    }
    } catch (error) {
      // Silently handle connection errors
      if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
        console.error('Error migrating cart data:', error);
      }
    }
  };

  // Initialize user ID - use logged-in user's email if available
  useEffect(() => {
    const userEmail = localStorage.getItem('email');
    const savedCartUserId = localStorage.getItem('cartUserId');
    
    if (userEmail) {
      // If user is logged in, use their email as cart user ID
      setUserId(userEmail);
      localStorage.setItem('cartUserId', userEmail);
      
      // If there was a previous guest cart, migrate it
      if (savedCartUserId && savedCartUserId !== userEmail) {
        migrateCartData(savedCartUserId, userEmail);
      }
    } else if (savedCartUserId) {
      // If not logged in but have saved cart user ID, use it
      setUserId(savedCartUserId);
    } else {
      // Generate new guest user ID
      const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cartUserId', newUserId);
      setUserId(newUserId);
    }
    setIsInitialized(true);
  }, []);

  // Update cart user ID when user logs in/out
  useEffect(() => {
    const userEmail = localStorage.getItem('email');
    const savedCartUserId = localStorage.getItem('cartUserId');
    
    if (userEmail && savedCartUserId !== userEmail) {
      // User logged in - update cart user ID to their email
      setUserId(userEmail);
      localStorage.setItem('cartUserId', userEmail);
    } else if (!userEmail && savedCartUserId && savedCartUserId.includes('@')) {
      // User logged out - generate new guest cart user ID
      const newGuestId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUserId(newGuestId);
      localStorage.setItem('cartUserId', newGuestId);
    }
  }, []);

  // Background sync with database (optional, delayed)
  useEffect(() => {
    if (!isInitialized || !userId || hasLoadedOnce) return;

    // Delay database sync to not block UI
    const syncTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: AbortSignal.timeout(3000) // Shorter timeout
        });

        const contentType = response.headers.get('Content-Type');
        if (response.status === 403) {
          console.error('Access denied. You can only access your own cart.');
          const errorText = await response.text();
          console.error('Response body:', errorText);
          setErrorMessage('Access denied. Please log in with the correct account.');
        } else if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.success && data.data.items.length > 0) {
            // Only update if there's actual data
            dispatch({ type: 'SET_CART', payload: data.data });
          } else if (!data.success) {
            console.error('Failed to sync cart:', data.message);
            setErrorMessage(data.message || 'Failed to sync cart');
          }
        } else {
          console.error('Failed to sync cart or invalid response format');
          const errorText = await response.text();
          console.error('Response body:', errorText);
          setErrorMessage('Failed to sync cart');
        }
      } catch (error) {
        console.error('Error syncing cart:', error);
        setErrorMessage('Error syncing cart. Please try again.');
      } finally {
        setHasLoadedOnce(true);
      }
    }, 3000); // Sync after 3 seconds

    return () => clearTimeout(syncTimeout);
  }, [isInitialized, userId, hasLoadedOnce]);

  // Save cart to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isInitialized && state.cart && state.cart.items) {
      localStorage.setItem('cart', JSON.stringify(state.cart));
    }
  }, [state.cart, isInitialized]);

  // API Functions
  const fetchCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addToCart = async (productId, quantity = 1, selectedVariants = []) => {
    try {
      console.log('CartContext - addToCart called with:', { productId, quantity, selectedVariants });
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`${API_BASE_URL}/cart/${userId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity,
          selectedVariants
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('CartContext - Add to cart successful:', data.data);
        console.log('CartContext - New item variants:', data.data.items?.slice(-1)[0]?.selectedVariants);
        dispatch({ type: 'ADD_TO_CART', payload: data.data });
        return { success: true };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message });
        return { success: false, message: data.message };
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${userId}/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'UPDATE_CART_ITEM', payload: data.data });
        return { success: true };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message });
        return { success: false, message: data.message };
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  };

  // Local update function for immediate UI updates
  const updateCartItemLocal = (itemId, quantity) => {
    const newCart = { ...state.cart };
    const itemIndex = newCart.items.findIndex(item => item._id === itemId);
    
    if (itemIndex !== -1) {
      newCart.items[itemIndex].quantity = quantity;
      newCart.items[itemIndex].totalPrice = newCart.items[itemIndex].price * quantity;
      
      // Recalculate totals
      newCart.subtotal = newCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      newCart.tax = newCart.subtotal * 0.1;
      newCart.shipping = newCart.subtotal > 100 ? 0 : 10;
      newCart.total = newCart.subtotal + newCart.tax + newCart.shipping;
      
      dispatch({ type: 'UPDATE_CART_ITEM', payload: newCart });
      return { success: true };
    }
    return { success: false, message: 'Item not found' };
  };

  const removeFromCart = async (itemId) => {
    console.log('Removing item from cart:', { itemId, userId });
    
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${userId}/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('Remove response status:', response.status);
      
      const data = await response.json();
      console.log('Remove response data:', data);
      
      if (data.success) {
        dispatch({ type: 'REMOVE_FROM_CART', payload: data.data });
        console.log('Item removed successfully from database');
        return { success: true };
      } else {
        console.error('Failed to remove item:', data.message);
        dispatch({ type: 'SET_ERROR', payload: data.message });
        return { success: false, message: data.message };
      }
    } catch (error) {
      // Silently fail on network errors when backend is offline
      if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
        console.error('Error removing item from cart:', error);
      }
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  };

  const clearCart = async () => {
    console.log('Clearing cart for user:', userId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${userId}/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('Clear cart response status:', response.status);
      
      const data = await response.json();
      console.log('Clear cart response data:', data);
      
      if (data.success) {
        // Clear localStorage immediately
        const emptyCart = { items: [], subtotal: 0, tax: 0, delivery: 0, total: 0 };
        localStorage.setItem('cart', JSON.stringify(emptyCart));
        
        dispatch({ type: 'CLEAR_CART', payload: data.data });
        console.log('Cart cleared successfully from database and localStorage');
        return { success: true };
      } else {
        console.error('Failed to clear cart:', data.message);
        dispatch({ type: 'SET_ERROR', payload: data.message });
        return { success: false, message: data.message };
      }
    } catch (error) {
      // Silently fail on network errors when backend is offline
      if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
        console.error('Error clearing cart:', error);
      }
      // Even if API fails, clear localStorage
      const emptyCart = { items: [], subtotal: 0, tax: 0, delivery: 0, total: 0 };
      localStorage.setItem('cart', JSON.stringify(emptyCart));
      dispatch({ type: 'CLEAR_CART', payload: emptyCart });
      return { success: false, message: error.message };
    }
  };

  const hideToast = () => {
    dispatch({ type: 'HIDE_TOAST' });
  };

  // Local remove function for immediate UI updates
  const removeFromCartLocal = (itemId) => {
    const newCart = { ...state.cart };
    newCart.items = newCart.items.filter(item => item._id !== itemId);
    
    // Recalculate totals
    newCart.subtotal = newCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    newCart.tax = newCart.subtotal * 0.1;
    newCart.shipping = newCart.subtotal > 100 ? 0 : 10;
    newCart.total = newCart.subtotal + newCart.tax + newCart.shipping;
    
    dispatch({ type: 'REMOVE_FROM_CART', payload: newCart });
    return { success: true };
  };

  // Local clear function for immediate UI updates
  const clearCartLocal = () => {
    const emptyCart = { items: [], subtotal: 0, tax: 0, delivery: 0, total: 0 };
    localStorage.setItem('cart', JSON.stringify(emptyCart));
    dispatch({ type: 'CLEAR_CART', payload: emptyCart });
    return { success: true };
  };

  // Local storage fallback functions (for offline functionality)
  const addToCartLocal = (product, quantity = 1, selectedVariants = []) => {
    // Convert selectedVariants to the format expected by the cart
    const processedVariants = selectedVariants.map(variant => {
      if (typeof variant === 'object' && variant.variation) {
        return variant; // Already in correct format
      } else if (typeof variant === 'object') {
        // Convert {key: value} format to {variation: key, value: value}
        return Object.entries(variant).map(([key, value]) => ({
          variation: key,
          value: value,
          priceAdjustment: 0
        })).flat();
      }
      return variant;
    }).flat();

    const existingItemIndex = state.cart.items.findIndex(item => 
      item.product._id === product._id &&
      JSON.stringify(item.selectedVariants.sort()) === JSON.stringify(processedVariants.sort())
    );

    let newCart = { ...state.cart };
    
    if (existingItemIndex > -1) {
      newCart.items[existingItemIndex].quantity += quantity;
      newCart.items[existingItemIndex].totalPrice = newCart.items[existingItemIndex].quantity * newCart.items[existingItemIndex].price;
    } else {
      const itemPrice = product.price + processedVariants.reduce((sum, variant) => sum + (variant.priceAdjustment || 0), 0);
      newCart.items.push({
        _id: Date.now().toString(),
        product: product,
        quantity,
        selectedVariants: processedVariants,
        price: itemPrice,
        totalPrice: itemPrice * quantity
      });
    }

    // Recalculate totals
    newCart.subtotal = newCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    newCart.tax = newCart.subtotal * 0.1;
    newCart.shipping = newCart.subtotal > 100 ? 0 : 10;
    newCart.total = newCart.subtotal + newCart.tax + newCart.shipping;

    dispatch({ type: 'ADD_TO_CART', payload: newCart });
    return { success: true };
  };

  const value = {
    ...state,
    fetchCart,
    addToCart,
    addToCartLocal,
    updateCartItem,
    updateCartItemLocal,
    removeFromCart,
    removeFromCartLocal,
    clearCart,
    clearCartLocal,
    hideToast
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
