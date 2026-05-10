import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { useNavigate, useLocation } from "react-router-dom";
import AdminCategory from "../AdminCategory/AdminCategory";
import AdminBrand from "../AdminBrand/AdminBrand";
import AdminVariation from "../AdminVariation/AdminVariation";
import AdminProduct from "../AdminProduct/AdminProduct";
import AdminOrders from "../AdminOrders/AdminOrders";
import AdminPaymentRecords from "../AdminPaymentRecords/AdminPaymentRecords";
import AdminBillingInvoice from "../AdminBillingInvoice/AdminBillingInvoice";
import AdminCardReload from "../AdminCardReload/AdminCardReload";
import AdminStock from "../AdminStock/AdminStock";
import AdminEmployer from "../AdminEmployer/AdminEmployer";
import AdminAttendance from "../AdminAttendance/AdminAttendance";
import AdminAttendanceList from "../AdminAttendanceList/AdminAttendanceList";
import AdminServices from "../AdminServices/AdminServices";
import AdminSupplies from "../AdminSupplies/AdminSupplies";
import logout_icon from "../../../Assets/logout.png";
import category_icon from "../../../Assets/category.png";
import brand_icon from "../../../Assets/brand.png";
import variation_icon from "../../../Assets/variant.png";
import product_icon from "../../../Assets/product.png";
import order_icon from "../../../Assets/checkout.png";
import records_icon from "../../../Assets/records.png";
import bill_icon from "../../../Assets/bill.png";
import stock_icon from "../../../Assets/stock.png";
import reload_icon from "../../../Assets/reload.png";
import employer_icon from "../../../Assets/employee.png";
import attendance_icon from "../../../Assets/attendance.png";
import attendance_list_icon from "../../../Assets/attendanceList.png";
import services_icon from "../../../Assets/services.png";
import supplies_icon from "../../../Assets/supplies.png";
import bell_icon from "../../../Assets/bell.png";
import { isAdminSessionActive, setAdminSession, clearAllSessions } from '../../../utils/authSession';

const AdminDashboard = () => {
  const sectionPermissionMap = {
    'categories': 'categories',
    'brands': 'brands',
    'variations': 'variations',
    'products': 'products',
    'stock': 'stock',
    'orders': 'orders',
    'payment-records': 'paymentRecords',
    'billing-invoice': 'billingInvoice',
    'card-reload': 'cardReload',
    'employers': 'employers',
    'attendance': 'attendance',
    'attendance-list': 'attendanceList',
    'services': 'services',
    'supplies': 'supplies'
  };

  const [admin, setAdmin] = useState(null);
  const [activeSection, setActiveSection] = useState('categories');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Separate function for async token verification (non-blocking)
  const verifyTokenWithServer = async (adminData) => {
    try {
      const response = await fetch('${API_BASE_URL}/admin/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        // Token is valid, update admin data from server
        const data = await response.json();
        if (data.success && data.admin) {
          // Normalize admin data structure (handle both login and profile formats)
          const normalizedAdmin = {
            id: data.admin.id || data.admin._id,
            name: data.admin.name,
            email: data.admin.email,
            type: data.admin.type || (data.admin.role === 'employer' ? 'employer' : 'admin'),
            role: data.admin.role || 'admin',
            permissions: data.admin.permissions || null
          };
          setAdmin(normalizedAdmin);
          // Update localStorage with fresh data
          setAdminSession(normalizedAdmin);
        }
      } else if (response.status === 401) {
        // ONLY on 401 (unauthorized/token expired) do we log out
        clearAllSessions();
        navigate('/admin');
      }
      // For any other status, user stays logged in with cached data
    } catch (error) {
      // Connection errors, timeouts, etc - don't log out
      // User stays logged in with cached data
      // Silently ignore - this is expected when backend is offline
    }
  };

  useEffect(() => {
    const checkAdminAuth = async () => {
      // First check localStorage
      const adminData = localStorage.getItem("admin");
      const isSessionValid = isAdminSessionActive();
      
      if (adminData && isSessionValid) {
        // Parse and immediately set admin from cache (user stays logged in)
        try {
          const parsedAdmin = JSON.parse(adminData);
          setAdmin(parsedAdmin);
        } catch (e) {
          // Invalid JSON in localStorage, log out
          clearAllSessions();
          navigate('/admin');
          return;
        }

        // Try to verify token with server (non-blocking verification)
        // If this fails, user stays logged in with cached data
        verifyTokenWithServer(adminData).catch(() => {
          // Silently fail - user stays logged in with cached data
        });
      } else {
        // No admin data in localStorage, redirect to login
        clearAllSessions();
        navigate("/admin");
      }
    };
    
    checkAdminAuth();
  }, [navigate]);

  // Handle URL parameters to set active section
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');
    const allowedSections = ['categories', 'brands', 'variations', 'products', 'stock', 'orders', 'payment-records', 'billing-invoice', 'card-reload', 'employers', 'attendance', 'attendance-list', 'services', 'supplies'];
    
    if (section && allowedSections.includes(section)) {
      // Check if user has permission for this section
      if (admin && admin.type === 'employer' && admin.permissions) {
        const permissionKey = sectionPermissionMap[section];
        if (admin.permissions[permissionKey] === true) {
          setActiveSection(section);
        } else {
          // If no permission, set to first available section
          const availableSections = getNavigationItems().map(item => item.id);
          setActiveSection(availableSections[0] || 'categories');
        }
      } else {
        setActiveSection(section);
      }
    }
  }, [location.search, admin]);

  // Set default active section when admin data loads
  useEffect(() => {
    if (admin && activeSection === 'categories') {
      const availableSections = getNavigationItems().map(item => item.id);
      if (availableSections.length > 0 && !availableSections.includes(activeSection)) {
        setActiveSection(availableSections[0]);
      }
    }
  }, [admin]);

  const handleLogout = async () => {
    try {
      await fetch("${API_BASE_URL}/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      clearAllSessions();
      navigate("/admin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setRefreshKey(prev => prev + 1);
  };

  const allNavigationItems = [
    { id: 'categories', label: 'Categories', icon: category_icon },
    { id: 'brands', label: 'Brands', icon: brand_icon },
    { id: 'variations', label: 'Variations', icon: variation_icon },
    { id: 'products', label: 'Products', icon: product_icon },
    { id: 'stock', label: 'Stock Management', icon: stock_icon },
    { id: 'orders', label: 'Orders', icon: order_icon },
    { id: 'payment-records', label: 'Payment Records', icon: records_icon },
    { id: 'billing-invoice', label: 'Billing & Invoice', icon: bill_icon },
    { id: 'card-reload', label: 'Card and Reload', icon: reload_icon },
    { id: 'employers', label: 'Employers', icon: employer_icon },
    { id: 'attendance', label: 'Attendance', icon: attendance_icon },
    { id: 'attendance-list', label: 'Attendance List', icon: attendance_list_icon },
    { id: 'services', label: 'Services', icon: services_icon },
    { id: 'supplies', label: 'Supplies', icon: supplies_icon }
  ];

  // Filter navigation items based on user type and permissions
  const getNavigationItems = () => {
    if (!admin) return allNavigationItems;
    
    // If it's an admin, show all items
    if (admin.type === 'admin') {
      return allNavigationItems;
    }
    
    // If it's an employer, filter based on permissions
    if (admin.type === 'employer') {
      if (admin.permissions) {
        return allNavigationItems.filter(item => {
          const permissionKey = sectionPermissionMap[item.id];
          return admin.permissions[permissionKey] === true;
        });
      } else {
        // If no permissions set, show no sections
        return [];
      }
    }
    
    // Default fallback
    return allNavigationItems;
  };

  const navigationItems = getNavigationItems();

  if (!admin) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'categories':
        return <AdminCategory key={refreshKey} />;
      case 'brands':
        return <AdminBrand key={refreshKey} />;
      case 'variations':
        return <AdminVariation key={refreshKey} />;
      case 'products':
        return <AdminProduct key={refreshKey} />;
      case 'stock':
        return <AdminStock key={refreshKey} />;
      case 'orders':
        return <AdminOrders key={refreshKey} />;
      case 'payment-records':
        return <AdminPaymentRecords key={refreshKey} />;
      case 'billing-invoice':
        return <AdminBillingInvoice key={refreshKey} />;
      case 'card-reload':
        return <AdminCardReload key={refreshKey} />;
      case 'employers':
        return <AdminEmployer key={refreshKey} />;
      case 'attendance':
        return <AdminAttendance key={refreshKey} />;
      case 'attendance-list':
        return <AdminAttendanceList key={refreshKey} />;
      case 'services':
        return <AdminServices key={refreshKey} />;
      case 'supplies':
        return <AdminSupplies key={refreshKey} />;
      default:
        return <AdminCategory key={refreshKey} />;
    }
  };

  return (
    <div className="modern-admin-dashboard">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            
            {!sidebarCollapsed && <span className="logo-text">Dashboard</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleSectionChange(item.id)}
            >
              <span className="nav-icon">
                <img src={item.icon} alt={item.label} className="nav-icon-img" />
              </span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">
              <img src={logout_icon} alt="Logout" className="logout-icon" />
            </span>
            {!sidebarCollapsed && <span className="nav-label">Log out</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-dashboard-main-content">
        {/* Top Header */}
        <header className="admin-dashboard-top-header">
          <div className="admin-dashboard-header-left">
            <h1 className="admin-dashboard-page-title">
              {navigationItems.find(item => item.id === activeSection)?.label || 'Categories'}
            </h1>
          </div>

          <div className="admin-dashboard-header-right">
            <div className="admin-notification-icon" onClick={() => navigate('/admin/notifications')}>
              <img src={bell_icon} alt="Notifications" className="admin-notification-icon-img" />
            </div>
            <div className="admin-dashboard-user-profile">
              <div className="admin-dashboard-profile-avatar">
                <img src="/api/placeholder/40/40" alt="Admin" />
              </div>
              <div className="admin-dashboard-profile-info">
                <span className="admin-dashboard-profile-name">{admin.name}</span>
                <span className="admin-dashboard-profile-email">{admin.email || 'admin@mobilesystem.com'}</span>
                <span className="admin-dashboard-profile-role">
                  {admin.type === 'employer' ? `${admin.role || 'Employee'}` : 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>


        {/* Main Content */}
        <main className="admin-content-area">
          {navigationItems.length === 0 && admin && admin.type === 'employer' ? (
            <div className="admin-no-permissions">
              <h2>No Access Granted</h2>
              <p>You don't have permission to access any sections. Please contact your administrator.</p>
            </div>
          ) : (
            renderMainContent()
          )}
        </main>
      </div>
    </div>
  );
};


export default AdminDashboard;
