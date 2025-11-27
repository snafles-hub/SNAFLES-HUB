import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ProductProvider } from './contexts/ProductContext'
import { OrderProvider } from './contexts/OrderContext'

// Layout Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// Pages
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Vendors from './pages/Vendors'
import VendorShop from './pages/VendorShop'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import ProfileSettings from './pages/ProfileSettings'
// Settings page now uses the new UserSettings component
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Wishlist from './pages/Wishlist'

// Vendor Pages
import VendorDashboard from './pages/VendorDashboard'
import VendorLogin from './pages/VendorLogin'
import VendorRegister from './pages/VendorRegister'

// Admin Pages
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'

// Review Pages
import Reviews from './pages/Reviews'
import VendorProfile from './pages/VendorProfile'
import VerifyEmail from './pages/VerifyEmail'
import ShoppingMascotDemo from './pages/ShoppingMascotDemo'
import OrderSuccess from './pages/OrderSuccess'
import OrderTracking from './pages/OrderTracking'
import Refund from './pages/Refund'
import Exchange from './pages/Exchange'
import HelpCenter from './pages/HelpCenter'
import ShippingInfo from './pages/ShippingInfo'
import Contact from './pages/Contact'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import AuthGuard from './components/routing/AuthGuard'
import NotFound from './pages/NotFound'
import TitleManager from './components/routing/TitleManager'
import SecondHand from './pages/SecondHand'
import ReturnsPolicy from './pages/ReturnsPolicy'
import HelperPointsPage from './pages/HelperPoints'
import CookiePolicy from './pages/CookiePolicy'
import UserSettings from './pages/UserSettings'
import NetworkStatusBanner from './components/common/NetworkStatusBanner'

function App() {
  console.log('App component rendering...')
  
  return (
    <Router>
        <TitleManager />
        <NetworkStatusBanner />
        <AuthProvider>
          <CartProvider>
            <ProductProvider>
              <OrderProvider>
              <div className="min-h-screen gradient-app">
              <Navbar />
                  <main>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:token" element={<ResetPassword />} />
                      <Route path="/verify-email/:token" element={<VerifyEmail />} />
                      
                      {/* Guest Allowed Routes - Can browse without login */}
                      <Route path="/products" element={
                        <AuthGuard requireAuth={false} guestAllowed={true}>
                          <Products />
                        </AuthGuard>
                      } />
                      <Route path="/product/:id" element={
                        <AuthGuard requireAuth={false} guestAllowed={true}>
                          <ProductDetail />
                        </AuthGuard>
                      } />
                      <Route path="/vendors" element={
                        <AuthGuard requireAuth={false} guestAllowed={true}>
                          <Vendors />
                        </AuthGuard>
                      } />
                      <Route path="/pre-loved" element={
                        <AuthGuard requireAuth={false} guestAllowed={true}>
                          <SecondHand />
                        </AuthGuard>
                      } />
                      <Route path="/second-hand" element={<Navigate to="/pre-loved" replace />} />
                      <Route path="/vendor/:id" element={
                        <AuthGuard requireAuth={false} guestAllowed={true}>
                          <VendorShop />
                        </AuthGuard>
                      } />
                      <Route path="/cart" element={
                        <AuthGuard requireAuth={false} guestAllowed={true}>
                          <Cart />
                        </AuthGuard>
                      } />
                      <Route path="/checkout" element={
                        <AuthGuard requireAuth={true}>
                          <Checkout />
                        </AuthGuard>
                      } />
                      <Route path="/orders" element={
                        <AuthGuard requireAuth={true}>
                          <Orders />
                        </AuthGuard>
                      } />
                      <Route path="/order-success/:orderId" element={
                        <AuthGuard requireAuth={true}>
                          <OrderSuccess />
                        </AuthGuard>
                      } />
                      <Route path="/track-order" element={<OrderTracking />} />
                      <Route path="/track-order/:orderId" element={<OrderTracking />} />
                      <Route path="/refund" element={
                        <AuthGuard requireAuth={true}>
                          <Refund />
                        </AuthGuard>
                      } />
        <Route path="/exchange" element={
          <AuthGuard requireAuth={true}>
            <Exchange />
          </AuthGuard>
        } />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/shipping-info" element={<ShippingInfo />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/policies/returns" element={<ReturnsPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
                      <Route path="/profile" element={
                        <AuthGuard requireAuth={true}>
                          <Profile />
                        </AuthGuard>
                      } />
                      <Route path="/profile-settings" element={
                        <AuthGuard requireAuth={true}>
                          <ProfileSettings />
                        </AuthGuard>
                      } />
                      <Route path="/settings" element={
                        <AuthGuard requireAuth={true}>
                          <UserSettings />
                        </AuthGuard>
                      } />
                      <Route path="/wishlist" element={
                        <AuthGuard requireAuth={true}>
                          <Wishlist />
                        </AuthGuard>
                      } />
                      <Route path="/helper-points" element={
                        <AuthGuard requireAuth={true}>
                          <HelperPointsPage />
                        </AuthGuard>
                      } />
                      
                      <Route path="/reviews" element={
                        <AuthGuard requireAuth={true}>
                          <Reviews />
                        </AuthGuard>
                      } />
                      <Route path="/reviews/:type/:id" element={
                        <AuthGuard requireAuth={true}>
                          <Reviews />
                        </AuthGuard>
                      } />
                  
                  {/* Vendor Routes */}
                  <Route path="/dashboard/vendor" element={
                    <AuthGuard requireAuth={true} allowedRoles={['vendor', 'admin']}>
                      <VendorDashboard />
                    </AuthGuard>
                  } />
                  <Route path="/vendor-login" element={<VendorLogin />} />
                  <Route path="/vendor-register" element={<VendorRegister />} />
                  <Route path="/vendor/:id/profile" element={
                    <AuthGuard requireAuth={true}>
                      <VendorProfile />
                    </AuthGuard>
                  } />
                  
                  {/* Admin Routes */}
                  <Route path="/dashboard/admin" element={
                    <AuthGuard requireAuth={true} allowedRoles={['admin']}>
                      <AdminDashboard />
                    </AuthGuard>
                  } />
                  <Route path="/dashboard/customer" element={
                    <AuthGuard requireAuth={true} allowedRoles={['customer','vendor','admin']}>
                      <Profile />
                    </AuthGuard>
                  } />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  
                  {/* Demo Routes */}
                  <Route path="/shopping-mascot-demo" element={<ShoppingMascotDemo />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <Toaster position="top-right" />
              </div>
              </OrderProvider>
            </ProductProvider>
          </CartProvider>
        </AuthProvider>
    </Router>
    )
  }

export default App
