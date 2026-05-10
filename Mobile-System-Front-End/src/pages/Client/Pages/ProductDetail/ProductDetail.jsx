import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../../../contexts/CartContext';
import ApiService from '../../../../services/api';
import ProductVariantSelector from '../../../../Components/ProductVariantSelector/ProductVariantSelector';
import AddToCartButton from '../../../../Components/AddToCartButton/AddToCartButton';
import DescriptionDisplay from '../../../../Components/DescriptionDisplay/DescriptionDisplay';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { cart } = useCart(); // Preload cart context
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedVariantsArray, setSelectedVariantsArray] = useState([]);
  const [variantPriceAdjustment, setVariantPriceAdjustment] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product) {
      setFinalPrice(product.price + variantPriceAdjustment);
    }
  }, [product, variantPriceAdjustment]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ApiService.getProductById(productId);
      setProduct(data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleVariantChange = (variantData) => {
    setSelectedVariants(variantData.selectedVariants);
    setSelectedVariantsArray(variantData.selectedVariantsArray || []);
    setVariantPriceAdjustment(variantData.priceAdjustment);
    setFinalPrice(variantData.finalPrice);
  };

  // Get selected variants for cart (already formatted by ProductVariantSelector)
  const getSelectedVariantsForCart = () => {
    console.log('ProductDetail - getSelectedVariantsForCart called');
    console.log('ProductDetail - selectedVariantsArray:', selectedVariantsArray);
    console.log('ProductDetail - selectedVariants:', selectedVariants);
    return selectedVariantsArray || [];
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', { 
      productId, 
      quantity, 
      selectedVariants, 
      finalPrice,
      variantPriceAdjustment 
    });
  };

  const getBreadcrumb = () => {
    if (!product) return ['Home'];
    
    const breadcrumbs = ['Home'];
    
    if (product.category) {
      breadcrumbs.push(product.category.name);
    }
    
    if (product.brand) {
      breadcrumbs.push(product.brand.name);
    }
    
    breadcrumbs.push(product.name);
    
    return breadcrumbs;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStockStatus = () => {
    if (!product || !product.isActive) return 'Out of Stock';
    if (product.quantity === 0) return 'Out of Stock';
    if (product.quantity <= 10) return `Low Stock (${product.quantity} left)`;
    return `In Stock (${product.quantity} available)`;
  };

  const getStockStatusClass = () => {
    if (!product || !product.isActive || product.quantity === 0) return 'out-of-stock';
    if (product.quantity <= 10) return 'low-stock';
    return 'in-stock';
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Product not found'}</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav">
          <div className="breadcrumb">
            {getBreadcrumb().map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="breadcrumb-separator">›</span>}
                <span 
                  className={`breadcrumb-item ${index === getBreadcrumb().length - 1 ? 'active' : 'clickable'}`}
                  onClick={() => {
                    if (index === 0) navigate('/');
                    else if (index === 1 && product.category) navigate(`/category/${product.category._id}`);
                    else if (index === 2 && product.brand) navigate(`/category/${product.category._id}/brand/${product.brand._id}`);
                  }}
                >
                  {item}
                </span>
              </React.Fragment>
            ))}
          </div>
        </nav>

        {/* Main Product Section */}
        <div className="product-main">
          {/* Product Images Gallery */}
          <div className="product-images">
            {/* Thumbnail Gallery */}
            <div className="thumbnail-gallery">
              {product.images && product.images.length > 0 ? (
                product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                    onClick={() => handleImageClick(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} view ${index + 1}`}
                      onError={(e) => {
                        e.target.src = '/placeholder-product.png';
                      }}
                    />
                  </button>
                ))
              ) : (
                <div className="no-images-placeholder">
                  <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                  <span>No Images Available</span>
                </div>
              )}
            </div>

            {/* Main Image Container */}
            <div className="main-image-container">
              <div className="main-image-wrapper">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[selectedImageIndex]} 
                    alt={product.name}
                    className="main-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-product.png';
                    }}
                  />
                ) : (
                  <div className="main-image-placeholder">
                    <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span>No Image Available</span>
                  </div>
                )}
                
                {/* Image Actions */}
                <div className="image-actions">
                  <button 
                    className="image-action-btn zoom-btn"
                    onClick={() => {
                      // TODO: Implement image zoom
                    }}
                    aria-label="Zoom image"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                      <line x1="11" y1="8" x2="11" y2="14"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </button>
                  <button 
                    className="image-action-btn fullscreen-btn"
                    onClick={() => {
                      // TODO: Implement fullscreen
                    }}
                    aria-label="View fullscreen"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="product-info">
            {/* Product Header - Compact Design */}
            <div className="product-header-compact">
              <div className="product-badges">
                {product.salePrice && product.salePrice < product.price && (
                  <div className="sale-badge-compact">
                    Sale
                  </div>
                )}
                <div className={`stock-status-compact ${getStockStatusClass()}`}>
                  {getStockStatus()}
                </div>
              </div>
            </div>
            
            {/* Product Title */}
            <h1 className="product-title">{product.name}</h1>
            
            {/* Product Meta - Compact */}
            <div className="product-meta-compact">
              <div className="meta-item">
                <span className="meta-label">Brand:</span>
                <span className="meta-value">{product.brand?.name || 'Unknown Brand'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{product.category?.name || 'Uncategorized'}</span>
              </div>
            </div>

            {/* Price Section - Compact & Refined */}
            <div className="price-section-compact">
              <div className="price-main-compact">
                <span className="price-current-compact">{formatPrice(finalPrice)}</span>
                {variantPriceAdjustment !== 0 && (
                  <span className="price-original-compact">{formatPrice(product.price)}</span>
                )}
                {product.salePrice && product.salePrice < product.price && (
                  <span className="price-original-compact">{formatPrice(product.salePrice)}</span>
                )}
              </div>
              {variantPriceAdjustment !== 0 && (
                <div className="price-adjustment-compact">
                  <span className={`adjustment-badge ${variantPriceAdjustment > 0 ? 'positive' : 'negative'}`}>
                    {variantPriceAdjustment > 0 ? '+' : ''}{formatPrice(variantPriceAdjustment)}
                  </span>
                </div>
              )}
              {product.salePrice && product.salePrice < product.price && (
                <div className="savings-compact">
                  <span className="savings-badge">Save {formatPrice(product.price - product.salePrice)}</span>
                </div>
              )}
            </div>

            {/* Product Variant Selector */}
            <ProductVariantSelector 
              productId={productId}
              productPrice={product.price}
              onVariantChange={handleVariantChange}
              allowAddingValues={false}
            />

            {/* Key Features */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="product-features">
                <h3 className="section-title">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                  </svg>
                  Key Features
                </h3>
                <ul className="features-list">
                  {product.specifications.map((spec, index) => (
                    <li key={index} className="feature-item">
                      <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add to Cart */}
            <div className="product-actions">
              <AddToCartButton 
                product={product}
                selectedVariants={getSelectedVariantsForCart()}
                size="large"
                showQuantity={true}
              />
            </div>

            {/* Warranty Information */}
            {product.warranty && product.warranty.trim() && (
              <div className="warranty-info">
                <div className="warranty-header">
                  <svg className="warranty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  <h4 className="warranty-title">Warranty Information</h4>
                </div>
                <p className="warranty-text">{product.warranty}</p>
              </div>
            )}

            {/* Product Description - Line by Line Display */}
            {product.description && (
              <DescriptionDisplay 
                description={product.description}
                className="product-description-display"
                title="Description"
                showTitle={true}
              />
            )}

            {/* Product Specifications */}
            <div className="product-specifications">
              <h3 className="section-title">
                Specifications
              </h3>
              <div className="specs-grid">
                {/* <div className="spec-item">
                  <span className="spec-label">Category </span>
                  <span className="spec-value">{product.category?.name || 'N/A'}</span>
                </div> */}
                <div className="spec-item">
                  <span className="spec-label">Brand</span>
                  <span className="spec-value">{product.brand?.name || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Price</span>
                  <span className="spec-value">{formatPrice(product.price)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Availability</span>
                  <span className={`spec-value ${getStockStatusClass()}`}>
                    {getStockStatus()}
                  </span>
                </div>
                {/* {product.variations && product.variations.length > 0 && (
                  <div className="spec-item">
                    <span className="spec-label">Variations</span>
                    <span className="spec-value">
                      {product.variations.map(variation => variation.name).join(', ')}
                    </span>
                  </div>
                )} */}
              </div>
            </div>
            <div className="product-cart-section">
                                  <AddToCartButton 
                                    product={product}
                                    selectedVariants={getSelectedVariantsForCart()}
                                    size="small"
                                    showQuantity={false}
                                  />
                                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
