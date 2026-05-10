import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import CartIcon from '../CartIcon/CartIcon';
import SearchBar from '../SearchBar/SearchBar';
import './navbar.css';
import user_icon from '../../Assets/user.png';
import logo from '../../pages/Client/Assets/Logo.png';
import bell_icon from '../../Assets/bell.png';
import { isAnySessionActive, clearAllSessions } from '../../utils/authSession';

const Navbar = ({ SetShowLogin }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showMobileProfileDropdown, setShowMobileProfileDropdown] = useState(false);
  const [mobileExpandedCategories, setMobileExpandedCategories] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryBrands, setCategoryBrands] = useState({});
  const [billingRecords, setBillingRecords] = useState([]);
  const isLoggedIn = isAnySessionActive();
  const navigate = useNavigate();
  
  // Refs for dropdowns
  const categoriesDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const mobileCategoriesDropdownRef = useRef(null);

  // Fetch categories and brands on component mount
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    if (isLoggedIn) {
      fetchBillingRecords();
    }
  }, [isLoggedIn]);

  // Fetch categories from admin panel
  const fetchCategories = async () => {
    try {
      const data = await ApiService.getCategories();
      const validCategories = (data.categories || []).filter(category => 
        category && category._id && typeof category === 'object'
      );
      setCategories(validCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch brands from admin panel
  const fetchBrands = async () => {
    try {
      const data = await ApiService.getBrands();
      const validBrands = (data.brands || []).filter(brand => 
        brand && brand._id && typeof brand === 'object'
      );
      setBrands(validBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Fetch billing records
  const fetchBillingRecords = async () => {
    try {
      const response = await ApiService.getMyPaymentRecords();
      if (response.success) {
        // Get only the latest 3 records
        const records = (response.data || []).slice(0, 3);
        setBillingRecords(records);
      }
    } catch (error) {
      console.error('Error fetching billing records:', error);
    }
  };

  // Fetch brands for a specific category
  const fetchCategoryBrands = async (categoryId) => {
    try {
      console.log('Fetching brands for category:', categoryId);
      const data = await ApiService.getBrandsByCategory(categoryId);
      console.log('Brands fetched successfully:', data);
      setCategoryBrands(prev => ({
        ...prev,
        [categoryId]: data.brands || []
      }));
    } catch (error) {
      console.error('Error fetching category brands:', error);
    }
  };

  // Handle category hover
  const handleCategoryHover = (categoryId) => {
    setHoveredCategory(categoryId);
    if (!categoryBrands[categoryId]) {
      fetchCategoryBrands(categoryId);
    }
  };

  // Handle category hover end
  const handleCategoryHoverEnd = () => {
    setHoveredCategory(null);
  };

  const handleLogout = () => {
    clearAllSessions();
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  // Handle search functionality
  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
    // Navigate to search results page or implement search logic
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const goToAddressBook = () => {
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    navigate('/account/address');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setShowDropdown(false);
  };

  const handleCategoriesClick = () => {
    setShowCategoriesDropdown(!showCategoriesDropdown);
    setShowDropdown(false); // Close profile dropdown when opening categories
  };

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
    setShowCategoriesDropdown(false); // Close categories dropdown when opening profile
  };

  const handleMobileProfileClick = (event) => {
    event.stopPropagation();
    setShowMobileProfileDropdown(!showMobileProfileDropdown);
    setShowCategoriesDropdown(false); // Close categories dropdown when opening profile
  };

  const handleMobileCategoryClick = (categoryId, event) => {
    event.stopPropagation(); // Prevent event bubbling
    console.log('Mobile category clicked:', categoryId);
    console.log('Current expanded categories:', mobileExpandedCategories);
    console.log('Current category brands:', categoryBrands);
    
    setMobileExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        console.log('Collapsing category:', categoryId);
        newSet.delete(categoryId);
      } else {
        console.log('Expanding category:', categoryId);
        newSet.add(categoryId);
        // Fetch brands for this category if not already loaded
        if (!categoryBrands[categoryId]) {
          console.log('Fetching brands for category:', categoryId);
          fetchCategoryBrands(categoryId);
        } else {
          console.log('Brands already loaded for category:', categoryId, categoryBrands[categoryId]);
        }
      }
      return newSet;
    });
  };

  // Helper for navigating and closing dropdowns
  const handleCategoryNavigate = (path) => {
    navigate(path);
    setShowCategoriesDropdown(false);
    setIsMobileMenuOpen(false);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on mobile category items or mobile profile items
      const isMobileCategoryClick = event.target.closest('.mobile-category-item') || 
                                   event.target.closest('.mobile-brand-item') ||
                                   event.target.closest('.mobile-category-brands-inline');
      const isMobileProfileClick = event.target.closest('.mobile-profile-info') ||
                                  event.target.closest('.mobile-profile-dropdown');
      
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target)) {
        setShowCategoriesDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileCategoriesDropdownRef.current && !mobileCategoriesDropdownRef.current.contains(event.target) && !isMobileCategoryClick) {
        setShowCategoriesDropdown(false);
      }
    };

    const handleScroll = () => {
      setShowCategoriesDropdown(false);
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <img src={logo} alt="Logo" className="logo" />
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Desktop Menu */}
        <ul className="navbar-menu desktop-menu">
          <li className="navbar-item">
            <span className="navbar-link" onClick={() => navigate('/')}>Home</span>
          </li>

          {/* Categories Dropdown */}
          <li className="navbar-item compact-dropdown-container" ref={categoriesDropdownRef}>
            <span 
              className="navbar-link compact-dropdown-trigger"
              onClick={handleCategoriesClick}
            >
              Categories
              <svg 
                className={`compact-dropdown-arrow ${showCategoriesDropdown ? 'rotated' : ''}`}
                width="10" 
                height="10" 
                viewBox="0 0 12 12" 
                fill="currentColor"
              >
                <path d="M2 4l4 4 4-4H2z"/>
              </svg>
            </span>
            <div className={`compact-dropdown-menu ${showCategoriesDropdown ? 'show' : ''}`}>
              <div className="compact-dropdown-header">
                {/* <span className="compact-dropdown-title">Categories</span> */}
              </div>
              <div className="compact-dropdown-content">
                <div 
                  onClick={() => handleCategoryNavigate('/all-categories')} 
                  className="compact-dropdown-item"
                >
                  <span className="compact-item-text">All Categories</span>
                </div>
                {categories.map((category) => (
                  <div 
                    key={category._id} 
                    className="compact-dropdown-item compact-category-item"
                    onMouseEnter={() => handleCategoryHover(category._id)}
                    onMouseLeave={handleCategoryHoverEnd}
                    onClick={() => handleCategoryNavigate(`/category/${category._id}`)}
                  >
                    <span className="compact-category-name">{category.name}</span>
                    <svg className="compact-category-arrow" width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M4 2l4 4-4 4V2z"/>
                    </svg>
                    {hoveredCategory === category._id && categoryBrands[category._id] && (
                      <div className="compact-category-brands">
                        <div className="compact-brands-header">
                          {/* <span className="compact-brands-title">{category.name} Brands</span> */}
                        </div>
                        <div className="compact-brands-list">
                          {categoryBrands[category._id].map((brand) => (
                            <div 
                              key={brand._id} 
                              className="compact-brand-item"
                              onClick={() => handleCategoryNavigate(`/category/${category._id}/brand/${brand._id}`)}
                            >
                              <img 
                                src={brand.logo || '/placeholder-logo.png'} 
                                alt={brand.name || 'Brand Logo'} 
                                className="compact-brand-logo"
                                onError={(e) => {
                                  e.target.src = '/placeholder-logo.png';
                                }}
                              />
                              <span className="compact-brand-name">{brand.name || 'Unnamed Brand'}</span>
                            </div>
                          ))}
                          {categoryBrands[category._id].length === 0 && (
                            <div className="compact-no-brands">No brands available</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </li>

          <li className="navbar-item">
            <span className="navbar-link">Contact Us</span>
          </li>
        </ul>


        {/* Desktop Auth Section */}
        <div className="navbar-right desktop-auth">
          <CartIcon className="desktop-cart-icon" />
          {isLoggedIn && (
            <div className="notification-icon" onClick={() => navigate('/notifications')}>
              <img src={bell_icon} alt="Notifications" className="notification-icon-img" />
            </div>
          )}
          {!isLoggedIn ? (
            <div className="auth-buttons">
              <button className="signup-btn" onClick={() => SetShowLogin(true, 'signup')}>
                Sign up
              </button>
              <button className="signin-btn" onClick={() => SetShowLogin(true, 'signin')}>
                Sign in
              </button>
            </div>
          ) : (
            <div className="profile-area" ref={profileDropdownRef}>
              <img
                src={user_icon}
                alt="User"
                className="profile-icon"
                onClick={handleProfileClick}
              />
              {showDropdown && (
                <div className="compact-profile-dropdown show">
                  <div className="compact-dropdown-header">
                    {/* <span className="compact-dropdown-title">Account</span> */}
                  </div>
                  <div className="compact-dropdown-content">
                    <div className="compact-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span className="compact-item-text">View Profile</span>
                    </div>
                    {/* Settings option - commented out for now, may be used later */}
                    {/* <div className="compact-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/settings'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                      <span className="compact-item-text">Settings</span>
                    </div> */}
                    <div className="compact-dropdown-item" onClick={goToAddressBook}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span className="compact-item-text">Address Book</span>
                    </div>
                    <div className="compact-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/orders'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                      </svg>
                      <span className="compact-item-text">My Orders</span>
                    </div>
                    <div
                      className="compact-dropdown-item billing-dropdown-item"
                      onClick={() => { setShowDropdown(false); navigate('/billing'); }}
                    >
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                      <span className="compact-item-text">Billing & Invoice</span>
                    </div>
                    {billingRecords.length > 0 && (
                      <div className="billing-inline-preview">
                        <div className="billing-submenu-header">Recent Invoices</div>
                        {billingRecords.map((record) => (
                          <div
                            key={record._id}
                            className="billing-submenu-item"
                            onClick={() => { setShowDropdown(false); navigate('/billing'); }}
                          >
                            <div className="billing-submenu-numbers">
                              <span className="billing-label">Bill:</span> <strong>{record.invoice?.billNumber || 'N/A'}</strong>
                            </div>
                            <div className="billing-submenu-numbers">
                              <span className="billing-label">Invoice:</span> <strong>{record.invoice?.invoiceNumber || 'N/A'}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="compact-dropdown-divider"></div>
                    <div className="compact-dropdown-item compact-logout-item" onClick={handleLogout}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                      <span className="compact-item-text">Log Out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">

          {/* Mobile Search Bar */}
          <div className="mobile-search-container">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Mobile Menu Items */}
          <ul className="mobile-menu-items">
            <li className="mobile-menu-item">
              <span onClick={() => handleCategoryNavigate('/')}>Home</span>
            </li>
            
            <li className="mobile-menu-item" ref={mobileCategoriesDropdownRef}>
              <span 
                className="mobile-categories-trigger"
                onClick={handleCategoriesClick}
              >
                Categories
                <svg 
                  className={`mobile-dropdown-arrow ${showCategoriesDropdown ? 'rotated' : ''}`}
                  width="10" 
                  height="10" 
                  viewBox="0 0 12 12" 
                  fill="currentColor"
                >
                  <path d="M2 4l4 4 4-4H2z"/>
                </svg>
              </span>
              <div className={`mobile-categories-dropdown ${showCategoriesDropdown ? 'show' : ''}`}>
                <div className="compact-dropdown-header">
                  {/* <span className="compact-dropdown-title">Categories</span> */}
                </div>
                <div className="compact-dropdown-content">
                  <div 
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCategoryNavigate('/all-categories');
                    }} 
                    className="compact-dropdown-item"
                  >
                    <span className="compact-item-text">All Categories</span>
                  </div>
                  {categories.map((category) => (
                    <div key={category._id} className="mobile-category-wrapper">
                      <div 
                        className="compact-dropdown-item mobile-category-item"
                        onClick={(event) => handleMobileCategoryClick(category._id, event)}
                      >
                        <span className="compact-category-name">{category.name}</span>
                        <svg 
                          className={`mobile-category-arrow ${mobileExpandedCategories.has(category._id) ? 'rotated' : ''}`}
                          width="8" 
                          height="8" 
                          viewBox="0 0 12 12" 
                          fill="currentColor"
                        >
                          <path d="M2 4l4 4 4-4H2z"/>
                        </svg>
                        {mobileExpandedCategories.has(category._id) && (
                          <div className="mobile-category-brands-inline">
                            <div className="mobile-brands-list">
                              {categoryBrands[category._id] && categoryBrands[category._id].length > 0 ? (
                                categoryBrands[category._id].map((brand) => (
                                  <div 
                                    key={brand._id} 
                                    className="mobile-brand-item"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleCategoryNavigate(`/category/${category._id}/brand/${brand._id}`);
                                    }}
                                  >
                                    <img 
                                      src={brand.logo || '/placeholder-logo.png'} 
                                      alt={brand.name || 'Brand Logo'} 
                                      className="mobile-brand-logo"
                                      onError={(e) => {
                                        e.target.src = '/placeholder-logo.png';
                                      }}
                                    />
                                    <span className="mobile-brand-name">{brand.name || 'Unnamed Brand'}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="mobile-no-brands">Loading brands...</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </li>
            
            <li className="mobile-menu-item">
              <span>Contact Us</span>
            </li>
          </ul>

          {/* Mobile Auth */}
          <div className="mobile-auth">
            <div className="mobile-cart-section">
              <CartIcon className="mobile-cart-icon" />
              {isLoggedIn && (
                <div className="mobile-notification-icon" onClick={() => { setIsMobileMenuOpen(false); navigate('/notifications'); }}>
                  <img src={bell_icon} alt="Notifications" className="mobile-notification-icon-img" />
                </div>
              )}
            </div>
            {!isLoggedIn ? (
              <div className="mobile-auth-buttons">
                <button 
                  className="mobile-signup-btn" 
                  onClick={() => {
                    SetShowLogin(true, 'signup');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign up
                </button>
                <button 
                  className="mobile-signin-btn" 
                  onClick={() => {
                    SetShowLogin(true, 'signin');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign in
                </button>
              </div>
            ) : (
              <div className="mobile-profile">
                <div className="mobile-profile-info" onClick={(event) => handleMobileProfileClick(event)}>
                  <img
                    src={user_icon}
                    alt="User"
                    className="mobile-profile-icon"
                  />
                  <span>Profile</span>
                  <svg 
                    className={`mobile-dropdown-arrow ${showMobileProfileDropdown ? 'rotated' : ''}`}
                    width="10" 
                    height="10" 
                    viewBox="0 0 12 12" 
                    fill="currentColor"
                  >
                    <path d="M2 4l4 4 4-4H2z"/>
                  </svg>
                </div>
                <div className={`mobile-profile-dropdown ${showMobileProfileDropdown ? 'show' : ''}`}>
                  <div className="mobile-dropdown-content">
                    <div className="compact-dropdown-item" onClick={(event) => { event.stopPropagation(); setIsMobileMenuOpen(false); setShowMobileProfileDropdown(false); navigate('/profile'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span className="compact-item-text">View Profile</span>
                    </div>
                    {/* Settings option - commented out for now, may be used later */}
                    {/* <div className="compact-dropdown-item" onClick={(event) => { event.stopPropagation(); setIsMobileMenuOpen(false); setShowMobileProfileDropdown(false); navigate('/settings'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                      <span className="compact-item-text">Setting</span>
                    </div> */}
                    <div className="compact-dropdown-item" onClick={(event) => { event.stopPropagation(); setIsMobileMenuOpen(false); setShowMobileProfileDropdown(false); navigate('/account/address'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span className="compact-item-text">Address Book</span>
                    </div>
                    <div className="compact-dropdown-item" onClick={(event) => { event.stopPropagation(); setIsMobileMenuOpen(false); setShowMobileProfileDropdown(false); navigate('/orders'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                      </svg>
                      <span className="compact-item-text">My Orders</span>
                    </div>
                    <div className="compact-dropdown-item" onClick={(event) => { event.stopPropagation(); setIsMobileMenuOpen(false); setShowMobileProfileDropdown(false); navigate('/billing'); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                      <span className="compact-item-text">Billing & Invoice</span>
                      {billingRecords.length > 0 && <span className="billing-count-badge">{billingRecords.length}</span>}
                    </div>
                    {billingRecords.length > 0 && (
                      <div className="mobile-billing-preview">
                        {billingRecords.map((record) => (
                          <div 
                            key={record._id} 
                            className="mobile-billing-item"
                            onClick={(event) => { event.stopPropagation(); setIsMobileMenuOpen(false); setShowMobileProfileDropdown(false); navigate('/billing'); }}
                          >
                            <div className="mobile-billing-numbers">
                              <span>Bill: <strong>{record.invoice?.billNumber || 'N/A'}</strong></span>
                              <span>Invoice: <strong>{record.invoice?.invoiceNumber || 'N/A'}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="compact-dropdown-divider"></div>
                    <div className="compact-dropdown-item compact-logout-item" onClick={(event) => { event.stopPropagation(); setShowMobileProfileDropdown(false); handleLogout(); }}>
                      <svg className="compact-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                      <span className="compact-item-text">Log Out</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;