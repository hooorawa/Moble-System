/**
 * Universal Variant Capture System
 * Dynamically captures all selected variants from any product page
 */

class VariantCapture {
  constructor() {
    this.variantSelectors = [
      'select[data-variant-key]',
      'input[type="radio"][data-variant-key]:checked',
      'input[type="checkbox"][data-variant-key]:checked',
      'button[data-variant-key][data-variant-value]',
      '.variant-option[data-variant-key][data-variant-value].selected',
      '.variant-option[data-variant-key][data-variant-value].active'
    ];
  }

  /**
   * Capture all selected variants from the current page
   * @returns {Object} Object with variant key-value pairs
   */
  captureVariants() {
    const variants = {};
    
    this.variantSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        const key = element.getAttribute('data-variant-key');
        let value = null;
        
        if (element.tagName === 'SELECT') {
          value = element.value;
        } else if (element.type === 'radio' || element.type === 'checkbox') {
          value = element.value;
        } else if (element.hasAttribute('data-variant-value')) {
          value = element.getAttribute('data-variant-value');
        } else if (element.textContent) {
          value = element.textContent.trim();
        }
        
        if (key && value && value !== '') {
          variants[key] = value;
        }
      });
    });
    
    return variants;
  }

  /**
   * Capture variants from a specific container
   * @param {string|HTMLElement} container - Container selector or element
   * @returns {Object} Object with variant key-value pairs
   */
  captureVariantsFromContainer(container) {
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!containerElement) return {};
    
    const variants = {};
    
    this.variantSelectors.forEach(selector => {
      const elements = containerElement.querySelectorAll(selector);
      
      elements.forEach(element => {
        const key = element.getAttribute('data-variant-key');
        let value = null;
        
        if (element.tagName === 'SELECT') {
          value = element.value;
        } else if (element.type === 'radio' || element.type === 'checkbox') {
          value = element.value;
        } else if (element.hasAttribute('data-variant-value')) {
          value = element.getAttribute('data-variant-value');
        } else if (element.textContent) {
          value = element.textContent.trim();
        }
        
        if (key && value && value !== '') {
          variants[key] = value;
        }
      });
    });
    
    return variants;
  }

  /**
   * Set up automatic variant capture for add to cart buttons
   */
  setupAutoCapture() {
    // Find all add to cart buttons
    const addToCartButtons = document.querySelectorAll('[data-add-to-cart]');
    
    addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const productId = button.getAttribute('data-product-id');
        const quantity = this.getQuantity(button);
        const variants = this.captureVariants();
        
        // Dispatch custom event with variant data
        const event = new CustomEvent('addToCartWithVariants', {
          detail: {
            productId,
            quantity,
            variants
          }
        });
        
        document.dispatchEvent(event);
      });
    });
  }

  /**
   * Get quantity from quantity input or default to 1
   * @param {HTMLElement} button - Add to cart button
   * @returns {number} Quantity
   */
  getQuantity(button) {
    const quantityInput = button.closest('form')?.querySelector('input[name="quantity"]') ||
                         button.closest('.product-details')?.querySelector('input[name="quantity"]') ||
                         document.querySelector('input[name="quantity"]');
    
    return quantityInput ? parseInt(quantityInput.value) || 1 : 1;
  }

  /**
   * Create variant display string for UI
   * @param {Object} variants - Variant object
   * @returns {string} Formatted variant string
   */
  formatVariantsForDisplay(variants) {
    return Object.entries(variants)
      .map(([key, value]) => `${this.capitalizeFirst(key)}: ${value}`)
      .join(', ');
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Create global instance
window.variantCapture = new VariantCapture();

// Auto-setup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.variantCapture.setupAutoCapture();
  });
} else {
  window.variantCapture.setupAutoCapture();
}

export default VariantCapture;
