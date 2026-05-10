const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Always include cookies for authentication
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error details from response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      // Silently fail for connection errors (backend offline)
      // Components will handle with user-friendly messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Network/connection error - silent fail
        throw error;
      }
      // Log other types of errors
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Categories
  async getCategories() {
    return this.request('/category/');
  }

  // Brands
  async getBrands() {
    return this.request('/brand/');
  }

  async getBrandsByCategory(categoryId) {
    return this.request(`/brand/category/${categoryId}`);
  }

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/product/?${queryString}` : '/product/';
    return this.request(endpoint);
  }

  async getProductById(productId) {
    return this.request(`/product/${productId}`);
  }

  async getProductsByCategory(categoryId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/product/category/${categoryId}?${queryString}` 
      : `/product/category/${categoryId}`;
    return this.request(endpoint);
  }

  async getProductsByBrand(brandId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/product/brand/${brandId}?${queryString}` 
      : `/product/brand/${brandId}`;
    return this.request(endpoint);
  }

  async getProductsByCategoryAndBrand(categoryId, brandId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/product/category/${categoryId}/brand/${brandId}?${queryString}` 
      : `/product/category/${categoryId}/brand/${brandId}`;
    return this.request(endpoint);
  }

  // Address Management
  async getAddresses() {
    return this.request('/address/');
  }

  async addAddress(addressData) {
    return this.request('/address/add', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
  }

  async updateAddress(addressId, addressData) {
    return this.request(`/address/update/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData)
    });
  }

  async deleteAddress(addressId) {
    return this.request(`/address/delete/${addressId}`, {
      method: 'DELETE'
    });
  }

  // Order Management
  async createOrder(orderData) {
    return this.request('/order/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getUserOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/order/user?${queryString}` 
      : '/order/user';
    return this.request(endpoint);
  }

  async getOrder(orderId) {
    return this.request(`/order/${orderId}`);
  }

  async cancelOrder(orderId) {
    return this.request(`/order/cancel/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({})
    });
  }

  async getOrderProductVariants(orderId) {
    return this.request(`/order/${orderId}/variants`);
  }

  // Admin Order Management
  async getAllOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/order/admin/all?${queryString}` 
      : `/order/admin/all`;
    return this.request(endpoint);
  }

  async updateOrderStatus(orderId, statusData) {
    return this.request(`/order/admin/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
  }

  // Payment Records Management
  async createPaymentRecord(orderId, data = {}) {
    return this.request(`/payment-record/create/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAllPaymentRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/payment-record/?${queryString}` 
      : `/payment-record/`;
    return this.request(endpoint);
  }

  async getMyPaymentRecords() {
    return this.request('/payment-record/my-records');
  }

  async getPaymentRecord(recordId) {
    return this.request(`/payment-record/${recordId}`);
  }

  async updatePaymentRecord(recordId, data) {
    return this.request(`/payment-record/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePaymentRecord(recordId) {
    return this.request(`/payment-record/${recordId}`, {
      method: 'DELETE'
    });
  }

  // Card and Reload Management
  async createCardReloadRecord(data) {
    return this.request('/card-reload/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCardReloadRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/card-reload/?${queryString}`
      : '/card-reload/';
    return this.request(endpoint);
  }

  async updateCardReloadRecord(recordId, data) {
    return this.request(`/card-reload/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCardReloadRecord(recordId) {
    return this.request(`/card-reload/${recordId}`, {
      method: 'DELETE'
    });
  }

  // Card Type Management
  async getCardTypes() {
    return this.request('/card-type/');
  }

  async createCardType(data) {
    return this.request('/card-type/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCardType(typeId, data) {
    return this.request(`/card-type/${typeId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCardType(typeId) {
    return this.request(`/card-type/${typeId}`, {
      method: 'DELETE'
    });
  }

  // Reload Type Management
  async getReloadTypes() {
    return this.request('/reload-type/');
  }

  async createReloadType(data) {
    return this.request('/reload-type/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateReloadType(typeId, data) {
    return this.request(`/reload-type/${typeId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteReloadType(typeId) {
    return this.request(`/reload-type/${typeId}`, {
      method: 'DELETE'
    });
  }

  // Services Management
  async createService(data) {
    return this.request('/service/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getServices() {
    return this.request('/service/');
  }

  async deleteService(serviceId) {
    return this.request(`/service/${serviceId}`, {
      method: 'DELETE'
    });
  }

  async updateService(serviceId, data) {
    return this.request(`/service/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Supplier Management
  async createSupplier(data) {
    return this.request('/supplier/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSuppliers() {
    return this.request('/supplier/');
  }

  async deleteSupplier(supplierId) {
    return this.request(`/supplier/${supplierId}`, {
      method: 'DELETE'
    });
  }

  async updateSupplier(supplierId, data) {
    return this.request(`/supplier/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
}

export default new ApiService();
