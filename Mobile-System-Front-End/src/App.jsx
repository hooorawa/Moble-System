import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import "./App.css";
import { CartProvider, useCart } from "./contexts/CartContext";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";
import Navbar from "./Components/Navbar/Navbar";
import Login from "./Components/Login/Login";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";
import AdminOrders from "./pages/Admin/AdminOrders/AdminOrders";
import AdminOrderDetail from "./pages/Admin/AdminOrderDetail/AdminOrderDetail";
import Home from "./pages/Client/Pages/Home/Home";
import ProductListing from './pages/Client/Pages/ProductListing/ProductListing';
import ProductDetail from './pages/Client/Pages/ProductDetail/ProductDetail';
import AddressBook from './pages/Client/Pages/AddressBook/AddressBook';
import Cart from './pages/Client/Pages/Cart/Cart';
import Checkout from './pages/Client/Pages/Checkout/Checkout';
import OrderConfirmation from './pages/Client/Pages/OrderConfirmation/OrderConfirmation';
import OrderHistory from './pages/Client/Pages/OrderHistory/OrderHistory';
import OrderDetail from './pages/Client/Pages/OrderDetail/OrderDetail';
import BillingInvoice from './pages/Client/Pages/BillingInvoice/BillingInvoice';
import DescriptionDemo from './pages/Client/Pages/DescriptionDemo/DescriptionDemo';
import Profile from './pages/Client/Pages/Profile/Profile';
import EditProfile from './pages/Client/Pages/EditProfile/EditProfile';
import ChangePassword from './pages/Client/Pages/ChangePassword/ChangePassword';
import Toast from './Components/Toast/Toast';
import { cleanupExpiredSessions } from './utils/authSession';


const AppContent = () => {
    const location = useLocation();
    const [ShowLogin, SetShowLogin] = useState(false);
    const [LoginMode, setLoginMode] = useState('signin'); // 'signin' or 'signup'
    const { showToast, toastMessage, hideToast } = useCart();

    const normalizedPath = location.pathname.toLowerCase();
    const isAdminRoute = normalizedPath.startsWith("/admin");

    // Handle login modal with mode
    const handleSetShowLogin = (show, mode = 'signin') => {
        setLoginMode(mode);
        SetShowLogin(show);
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        cleanupExpiredSessions();

        if (ShowLogin) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        // Cleanup function to remove class when component unmounts
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [ShowLogin]);

    return (
        <>
            {!isAdminRoute && (ShowLogin ? <Login SetShowLogin={handleSetShowLogin} initialMode={LoginMode} /> : null)}
            <div className={`app ${ShowLogin ? 'blur-background' : ''}`}>
                {!isAdminRoute && <Navbar SetShowLogin={handleSetShowLogin} />}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/category/:categoryId" element={<ProductListing />} />
                    <Route path="/category/:categoryId/brand/:brandId" element={<ProductListing />} />
                    <Route path="/brand/:brandId" element={<ProductListing />} />
                    <Route path="/product/:productId" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="/orders/:orderId" element={<OrderDetail />} />
                    <Route path="/billing" element={<BillingInvoice />} />
                    <Route path="/account/address" element={<AddressBook />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/profile/change-password" element={<ChangePassword />} />
                    <Route path="/description-demo" element={<DescriptionDemo />} />
                    {/* Admin login routes now redirect to home - use unified login */}
                    <Route path="/Admin" element={<Navigate to="/" replace />} />
                    <Route path="/admin" element={<Navigate to="/" replace />} />
                    <Route path="/Admin/Dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
                </Routes>
            </div>
            <Toast 
                message={toastMessage}
                show={showToast}
                onClose={hideToast}
                type="success"
            />
        </>
    );
};

const App = () => (
    <ErrorBoundary>
        <BrowserRouter>
            <CartProvider>
                <AppContent />
            </CartProvider>
        </BrowserRouter>
    </ErrorBoundary>
);

export default App;