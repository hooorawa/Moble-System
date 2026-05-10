import React, { useState, useEffect } from 'react';
import './Home.css';
import ApiService from '../../../../services/api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ApiService.request('/product/');
      
      if (data.success && data.products) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      setError('Failed to load products. Please ensure the server is running.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">All Products</h1>
        
        {error && <div className="home-error">{error}</div>}
        
        {loading ? (
          <div className="home-loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="home-empty">No products available yet.</div>
        ) : (
          <div className="home-products-grid">
            {products.map((product) => (
              <div
                key={product._id}
                className="home-product-card"
                onClick={() => handleProductClick(product._id)}
              >
                <div className="home-product-image">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="home-product-placeholder">
                      No Image
                    </div>
                  )}
                </div>
                <div className="home-product-info">
                  <h3 className="home-product-name">{product.name}</h3>
                  <p className="home-product-category">
                    {product.category?.name || 'Uncategorized'}
                  </p>
                  <p className="home-product-brand">
                    {product.brand?.name || ''}
                  </p>
                  <div className="home-product-price">
                    Rs {product.price?.toFixed(2) || '0.00'}
                  </div>
                  {/* <p className="home-product-description">
                    {product.description?.substring(0, 100)}
                    {product.description?.length > 100 ? '...' : ''}
                  </p> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
