import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminRoute from './components/admin/AdminRoute';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Admin pages are loaded only when /admin is opened, so the storefront bundle never includes them.
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderConfirmation from './pages/OrderConfirmation';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import InfoPage from './pages/InfoPage';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import CartSidebar from './components/CartSidebar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

const NotFound = () => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 font-sans">
      <p className="text-6xl font-light mb-4">404</p>
      <h1 className="text-xl uppercase tracking-widest mb-3">Page not found</h1>
      <p className="text-sm text-gray-500 mb-8 break-all">There is no page at <code className="bg-gray-100 px-1.5 py-0.5">{pathname}</code></p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/home" className="bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em]">Back to Home</Link>
        <Link to="/shop" className="border border-black px-8 py-3 text-xs uppercase tracking-[0.2em]">Shop All</Link>
      </div>
    </div>
  );
};

// Customer storefront chrome (wishlist + cart drawer). Admin pages render outside it.
const StoreLayout = () => (
  <WishlistProvider>
    <CartSidebar />
    <Outlet />
  </WishlistProvider>
);

// Admin portal: its own session, separate from customers.
const AdminLayout = () => (
  <AdminAuthProvider>
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <Outlet />
    </Suspense>
  </AdminAuthProvider>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Admin portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="login" element={<AdminLogin />} />
              <Route element={<AdminRoute />}>
                <Route index element={<AdminProfile />} />
              </Route>
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            {/* Customer storefront */}
            <Route element={<StoreLayout />}>
              <Route path="/" element={<Navigate to="/home" replace />} />

              {/* Public: browsing as a guest */}
              <Route path="/home" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/category/:slug" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/pages/:slug" element={<InfoPage />} />

              {/* Account */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />

              {/* Logged-in users (employee & delivery dashboards live under /profile) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/:orderId" element={<Payment />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
              </Route>

              {/* Old addresses from the previous version → their new pages */}
              <Route path="/payment-success" element={<Navigate to="/orders" replace />} />
              <Route path="/payhere-checkout" element={<Navigate to="/orders" replace />} />
              <Route path="/category/women" element={<Navigate to="/category/womens-wear" replace />} />
              <Route path="/category/men" element={<Navigate to="/category/mens-wear" replace />} />
              <Route path="/category/kids" element={<Navigate to="/category/kids-wear" replace />} />
              <Route path="/category/new" element={<Navigate to="/shop?new=true" replace />} />
              <Route path="/category/sale" element={<Navigate to="/shop?sale=true" replace />} />
              <Route path="/category/brands" element={<Navigate to="/shop" replace />} />
              <Route path="/my-orders" element={<Navigate to="/orders" replace />} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#333', color: '#fff', fontSize: '14px', borderRadius: '4px' },
          success: { iconTheme: { primary: '#4ade80', secondary: '#333' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#333' } }
        }}
      />
    </AuthProvider>
  );
}

export default App;
