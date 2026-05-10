import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../../services/api';
import AddToCartButton from '../../../../Components/AddToCartButton/AddToCartButton';
import DescriptionDisplay from '../../../../Components/DescriptionDisplay/DescriptionDisplay';
import './ProductListing.css';

const ProductListing = () => {
  const { categoryId, brandId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    stockStatus: 'all',
    priceRange: { min: 0, max: 100000 },
    selectedCategories: [],
    selectedBrands: []
  });
  
  // UI states
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Current context
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentBrand, setCurrentBrand] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [categoryId, brandId]);

  useEffect(() => {
    fetchProducts();
  }, [categoryId, brandId, filters, sortBy, currentPage]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories and brands
      const [categoriesData, brandsData] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getBrands()
      ]);

      setCategories(categoriesData.categories || []);
      setBrands(brandsData.brands || []);

      // Set current category and brand context
      if (categoryId) {
        const category = categoriesData.categories?.find(cat => cat._id === categoryId);
        setCurrentCategory(category);
      }

      if (brandId) {
        const brand = brandsData.brands?.find(b => b._id === brandId);
        setCurrentBrand(brand);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load page data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const queryParams = {
        page: currentPage,
        limit: 12
      };
      
      // Add sorting
      if (sortBy !== 'default') {
        queryParams.sort = sortBy;
      }
      
      // Add filters
      if (filters.stockStatus !== 'all') {
        queryParams.inStock = filters.stockStatus === 'inStock';
      }
      
      if (filters.priceRange.min > 0) {
        queryParams.minPrice = filters.priceRange.min;
      }
      
      if (filters.priceRange.max < 100000) {
        queryParams.maxPrice = filters.priceRange.max;
      }

      let data;
      
      // Determine API endpoint based on URL parameters
      if (categoryId && brandId) {
        data = await ApiService.getProductsByCategoryAndBrand(categoryId, brandId, queryParams);
      } else if (categoryId) {
        data = await ApiService.getProductsByCategory(categoryId, queryParams);
      } else if (brandId) {
        data = await ApiService.getProductsByBrand(brandId, queryParams);
      } else {
        data = await ApiService.getProducts(queryParams);
      }

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      
      // Set context from first product if available
      if (data.products && data.products.length > 0) {
        if (!currentCategory && data.products[0].category) {
          setCurrentCategory(data.products[0].category);
        }
        if (!currentBrand && data.products[0].brand) {
          setCurrentBrand(data.products[0].brand);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const getPageTitle = () => {
    if (currentCategory && currentBrand) {
      return `${currentCategory.name} - ${currentBrand.name}`;
    } else if (currentCategory) {
      return currentCategory.name;
    } else if (currentBrand) {
      return currentBrand.name;
    }
    return 'All Products';
  };

  const getBreadcrumb = () => {
    const breadcrumbs = ['Home'];
    
    if (currentCategory) {
      breadcrumbs.push(currentCategory.name);
    }
    
    if (currentBrand) {
      breadcrumbs.push(currentBrand.name);
    }
    
    return breadcrumbs;
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading && products.length === 0) {
    return (
      <div className="product-listing">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-listing">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-listing">
      <div className="product-listing-container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav">
          <div className="breadcrumb">
            {getBreadcrumb().map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="breadcrumb-separator">›</span>}
                <span className={`breadcrumb-item ${index === getBreadcrumb().length - 1 ? 'active' : ''}`}>
                  {item}
                </span>
              </React.Fragment>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div className="main-content">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h3 className="filters-title">

                Filters
              </h3>
            </div>

            <div className="filters-content">
              {/* Stock Status Filter */}
              <div className="filter-group">
                <div className="filter-group-header">
                  <h4 className="filter-group-title">Availability</h4>
                </div>
                <div className="filter-options">
                  {[
                    { value: 'all', label: 'All Products', count: products.length },
                    { value: 'inStock', label: 'In Stock', count: products.filter(p => p.isActive).length },
                    { value: 'outOfStock', label: 'Out of Stock', count: products.filter(p => !p.isActive).length }
                  ].map(option => (
                    <label key={option.value} className="filter-option">
                      <input
                        type="radio"
                        name="stockStatus"
                        value={option.value}
                        checked={filters.stockStatus === option.value}
                        onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                      />
                      <span className="filter-option-label">
                        {option.label}
                        <span className="filter-count">({option.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories Filter */}
              <div className="filter-group">
                <div className="filter-group-header">
                  <h4 className="filter-group-title">Categories</h4>
                </div>
                <div className="filter-options">
                  {categories.map(category => (
                    <label key={category._id} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters.selectedCategories.includes(category._id)}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...filters.selectedCategories, category._id]
                            : filters.selectedCategories.filter(id => id !== category._id);
                          handleFilterChange('selectedCategories', newCategories);
                        }}
                      />
                      <span className="filter-option-label">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="filter-group">
                <div className="filter-group-header">
                  <h4 className="filter-group-title">Price Range</h4>
                </div>
                <div className="price-range-container">
                  <div className="price-inputs">
                    <div className="price-input-group">
                      <label>Min</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.priceRange.min}
                        onChange={(e) => handleFilterChange('priceRange', {
                          ...filters.priceRange,
                          min: parseInt(e.target.value) || 0
                        })}
                        className="price-input"
                      />
                    </div>
                    <div className="price-separator">to</div>
                    <div className="price-input-group">
                      <label>Max</label>
                      <input
                        type="number"
                        placeholder="100000"
                        value={filters.priceRange.max}
                        onChange={(e) => handleFilterChange('priceRange', {
                          ...filters.priceRange,
                          max: parseInt(e.target.value) || 100000
                        })}
                        className="price-input"
                      />
                    </div>
                  </div>
                  <div className="price-display">
                    LKR {filters.priceRange.min.toLocaleString()} - LKR {filters.priceRange.max.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button 
                className="clear-filters-btn"
                onClick={() => setFilters({
                  stockStatus: 'all',
                  priceRange: { min: 0, max: 100000 },
                  selectedCategories: [],
                  selectedBrands: []
                })}
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Products Section */}
          <main className="products-section">
            {/* Results Header */}
            <div className="results-header">
              <div className="results-info">
                <span className="results-count">
                  {products.length} {products.length === 1 ? 'product' : 'products'} found
                </span>
              </div>
              
              <div className="sort-controls">
                <label htmlFor="sort-select" className="sort-label">Sort by:</label>
                <select 
                  id="sort-select"
                  value={sortBy} 
                  onChange={handleSortChange} 
                  className="sort-dropdown"
                >
                  <option value="default">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="products-grid">
              {products.map(product => (
                <article 
                  key={product._id} 
                  className="product-card"
                  onClick={() => handleProductClick(product._id)}
                >
                  <div className="product-image-container">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="product-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <span>No Image</span>
                      </div>
                    )}
                    
                    {/* Stock Status Badge */}
                    {!product.isActive && (
                      <div className="stock-badge out-of-stock">
                        <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                          <path d="M13 12h3"/>
                          <path d="M8 12h3"/>
                        </svg>
                        Out of Stock
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="product-actions">
                      <button 
                        className="action-btn wishlist-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          //  Add to wishlist
                        }}
                        aria-label="Add to wishlist"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn quick-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Quick view
                        }}
                        aria-label="Quick view"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="product-info">
                    <div className="product-category">
                      {product.category?.name || 'Uncategorized'}
                    </div>
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-price">
                      <span className="price-current">LKR {product.price.toLocaleString()}</span>
                    </div>
                    <div className="product-rating">
                      {/* <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="star" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div> */}
                      {/* <span className="rating-text">(4.5)</span> */}
                    </div>
                    
                   
                    
                    {/* Add to Cart Button */}
                    {/* <div className="product-cart-section">
                      <AddToCartButton 
                        product={product}
                        size="small"
                        showQuantity={false}
                      />
                    </div> */}
                  </div>
                </article>
              ))}
            </div>

            {/* Empty State */}
            {products.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <h3 className="empty-state-title">No products found</h3>
                <p className="empty-state-description">
                  Try adjusting your filters or search terms
                </p>
                <button 
                  className="empty-state-btn"
                  onClick={() => setFilters({
                    stockStatus: 'all',
                    priceRange: { min: 0, max: 100000 },
                    selectedCategories: [],
                    selectedBrands: []
                  })}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="pagination">
                <button 
                  className="pagination-btn prev-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                  Previous
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="pagination-btn next-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              </nav>
            )}
          </main>
        </div>

      </div>
    </div>
  );
};

export default ProductListing;
