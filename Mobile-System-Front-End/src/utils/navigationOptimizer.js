// Navigation Optimization Utility
// Preloads cart data to ensure instant page transitions

/**
 * Preload cart icon data for instant display
 */
export const preloadCartData = () => {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      return {
        itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        subtotal: cart.subtotal || 0,
        total: cart.total || 0
      };
    }
  } catch (error) {
    console.error('Error preloading cart:', error);
  }
  return { itemCount: 0, subtotal: 0, total: 0 };
};

/**
 * Prefetch cart page assets
 */
export const prefetchCartPage = () => {
  // Preload cart component (if using lazy loading)
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/cart';
  document.head.appendChild(link);
};

/**
 * Instant navigation to cart
 */
export const navigateToCartInstantly = (navigate) => {
  // Ensure cart data is ready
  preloadCartData();
  
  // Navigate immediately
  navigate('/cart');
};

export default {
  preloadCartData,
  prefetchCartPage,
  navigateToCartInstantly
};
