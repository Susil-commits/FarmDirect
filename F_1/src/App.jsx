 import { useRouter } from './context/RouterContext';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import GlobalPageLoader from './components/common/GlobalPageLoader';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import CropDetail from './pages/CropDetail';
import CreateCrop from './pages/CreateCrop';
import EditCrop from './pages/EditCrop';
import FarmerProfile from './pages/FarmerProfile';
import About from './pages/About';
import Contact from './pages/Contact';
import StartShopping from './pages/StartShopping';
import JoinAsFarmer from './pages/JoinAsFarmer';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GoogleCallback from './pages/auth/GoogleCallback';
import GitHubCallback from './pages/auth/GitHubCallback';
import ShoppingCart from './pages/ShoppingCart';
import OrderConfirmation from './pages/OrderConfirmation';
import Wishlist from './pages/Wishlist';
import UserProfile from './pages/UserProfile';
import ProductComparison from './pages/ProductComparison';
import PendingVerification from './pages/PendingVerification';
import AdminProfile from './pages/AdminProfile';
import AdminDashboardStats from './pages/dashboards/AdminDashboardStats';
import AdminApprovals from './pages/dashboards/AdminApprovals';
import AdminManagement from './pages/dashboards/AdminManagement';
import AdminUsers from './pages/dashboards/AdminUsers';
import AdminCrops from './pages/dashboards/AdminCrops';
import AdminOrders from './pages/dashboards/AdminOrders';
import AdminNotifications from './pages/dashboards/AdminNotifications';
import FarmerDashboardNew from './pages/FarmerDashboardNew';
import BuyerDashboardNew from './pages/BuyerDashboardNew';
import CheckoutNew from './pages/CheckoutNew';
import OrderTrackingNew from './pages/OrderTrackingNew';
import SearchResults from './pages/SearchResults';
import FarmerVerification from './pages/verification/FarmerVerification';
import BuyerVerification from './pages/verification/BuyerVerification';
import VerificationProgress from './pages/verification/VerificationProgress';
import KYCCongrats from './pages/verification/KYCCongrats';
import KYCSorry from './pages/verification/KYCSorry';
import AdminVerification from './pages/admin/AdminVerification';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminQueries from './pages/admin/AdminQueries';
import AdminMessages from './pages/admin/AdminMessages';
import OrderDetails from './pages/OrderDetails';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import Pricing from './pages/Pricing';
import Support from './pages/Support';
import HowItWorks from './pages/HowItWorks';
import RoutingTest from './pages/RoutingTest';
import Messages from './pages/Messages';
import { useEffect, useRef } from 'react';

function App() {
  const { currentRoute, navigate } = useRouter();
  const { user, loading, redirectPath, clearRedirectPath } = useAuth();

  // Handle redirects (e.g., when auth fails on server restart)
  // Use a ref to track if we've already handled this redirect to prevent loops
  const redirectHandledRef = useRef(false);

  useEffect(() => {
    if (redirectPath && !redirectHandledRef.current) {
      redirectHandledRef.current = true;
      console.log('🔄 Redirecting to:', redirectPath);
      navigate(redirectPath);
      clearRedirectPath();
      // Reset the flag after a small delay so it can handle new redirects
      setTimeout(() => {
        redirectHandledRef.current = false;
      }, 100);
    }
  }, [redirectPath]);

  const renderPage = () => {
    // Don't render anything while loading auth state on initial mount/refresh
    // Also suppress render when a redirect is pending to prevent page flash/wipe
    if (loading || redirectPath) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-green-600 animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    console.log('renderPage called with route:', currentRoute);
    
    // Helper function to get user role - checks both state and localStorage
    // This handles async state updates after login to prevent race conditions
    const getUserRole = () => {
      if (user?.role) return user.role;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        return userData.role;
      } catch {
        return null;
      }
    };

    const currentUserRole = getUserRole();
    
    // Get verification status from localStorage or user object
    const verificationStatus = localStorage.getItem('verificationStatus') || user?.kycStatus;
    
    // Redirect unverified users to verification page (except for auth routes and specific routes)
    // NOTE: Admin users do NOT need verification - they verify others
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/google/callback', '/auth/github/callback', '/', '/about', '/contact'];
    const isPublicRoute = publicRoutes.includes(currentRoute);
    
    // Only require verification for farmers and buyers, NOT for admin
    if (user && user.role !== 'admin' && verificationStatus !== 'verified' && !isPublicRoute) {
      // Check if this is an existing user who has already interacted with KYC
      // (has kycSubmittedAt or existing kycDocuments) - preserve old behavior for them
      const isExistingKYCUser = !!(user?.kycSubmittedAt || (user?.kycDocuments && Object.keys(user.kycDocuments).length > 0));
      
      // kycStatus 'not_submitted': Show hello/welcome page with "Submit Documents" button
      // ONLY for brand new users who have never interacted with KYC before
      if (verificationStatus === 'not_submitted' && !isExistingKYCUser && currentRoute !== '/pending-verification' && currentRoute !== '/verification/progress' && currentRoute !== '/profile' && currentRoute !== '/auth/logout') {
        return <PendingVerification />;
      }
      // kycStatus 'not_submitted' but existing KYC user: preserve old behavior → VerificationProgress
      if (verificationStatus === 'not_submitted' && isExistingKYCUser && currentRoute !== '/verification/progress' && currentRoute !== '/profile' && currentRoute !== '/auth/logout') {
        return <VerificationProgress />;
      }
      // kycStatus 'pending' or 'rejected': Show document submission page
      if ((verificationStatus === 'pending' || verificationStatus === 'rejected') && currentRoute !== '/verification/progress' && currentRoute !== '/profile' && currentRoute !== '/auth/logout') {
        return <VerificationProgress />;
      }
    }

    // First-login KYC result pages: show congrats/sorry page if kycResultSeen is false
    // This runs AFTER the verification check above, so it only triggers for verified/rejected users
    // who haven't seen their result yet
    if (user && user.role !== 'admin' && user.kycResultSeen === false && !isPublicRoute) {
      const kycResultRoutes = ['/kyc-congrats', '/kyc-sorry', '/verification/progress', '/profile', '/auth/logout'];
      if (!kycResultRoutes.includes(currentRoute)) {
        if (user.kycStatus === 'verified') {
          return <KYCCongrats />;
        }
        if (user.kycStatus === 'rejected') {
          return <KYCSorry />;
        }
      }
    }

    // Strip query strings for route matching (e.g., /admin/documents?userId=123 → /admin/documents)
    const routePath = typeof currentRoute === 'string' ? currentRoute.split('?')[0] : '/';

    // Exact-match routes
    switch (routePath) {
      case '/':
        return <Home />;
      case '/marketplace':
        return <Marketplace />;
      case '/create-crop':
        return currentUserRole === 'farmer' ? <CreateCrop /> : <Home />;
      case '/about':
        return <About />;
      case '/contact':
        return <Contact />;
      case '/start-shopping':
        return <StartShopping />;
      case '/join-farmer':
        return <JoinAsFarmer />;
      case '/cart':
        return <ShoppingCart />;
      case '/checkout':
        return user ? <CheckoutNew /> : <Login />;
      case '/order-confirmation':
        return <OrderConfirmation />;
      case '/wishlist':
        return <Wishlist />;
      case '/orders':
        return user ? <OrderTrackingNew /> : <Login />;
      case '/search':
        return <SearchResults />;
      case '/compare':
        return <ProductComparison />;
      case '/profile':
        return <UserProfile />;
      case '/auth/login':
        return <Login />;
      case '/auth/register':
        return <Register />;
      case '/auth/google/callback':
        return <GoogleCallback />;
      case '/auth/github/callback':
        return <GitHubCallback />;
      case '/pending-verification':
        return <PendingVerification />;
      case '/verification/progress':
        return user ? <VerificationProgress /> : <Home />;
      case '/kyc-congrats':
        return user ? <KYCCongrats /> : <Home />;
      case '/kyc-sorry':
        return user ? <KYCSorry /> : <Home />;
      case '/farmer/dashboard':
        return currentUserRole === 'farmer' ? <FarmerDashboardNew /> : <Home />;
      case '/farmer/verification':
        return currentUserRole === 'farmer' ? <FarmerVerification /> : <Home />;
      case '/buyer/dashboard':
        return currentUserRole === 'buyer' ? <BuyerDashboardNew /> : <Home />
      case '/buyer/verification':
        return currentUserRole === 'buyer' ? <BuyerVerification /> : <Home />;
      case '/admin/dashboard':
        return currentUserRole === 'admin' ? <AdminDashboardStats /> : <Home />;
      case '/admin/approvals':
        return currentUserRole === 'admin' ? <AdminApprovals /> : <Home />;
      case '/admin/management':
        return currentUserRole === 'admin' ? <AdminManagement /> : <Home />;
      case '/admin/users':
        return currentUserRole === 'admin' ? <AdminUsers /> : <Home />;
      case '/admin/crops':
        return currentUserRole === 'admin' ? <AdminCrops /> : <Home />;
      case '/admin/orders':
        return currentUserRole === 'admin' ? <AdminOrders /> : <Home />;
      case '/admin/profile':
        return currentUserRole === 'admin' ? <AdminProfile /> : <Home />;
      case '/admin/verification':
        return currentUserRole === 'admin' ? <AdminVerification /> : <Home />;
      case '/admin/documents':
        return currentUserRole === 'admin' ? <AdminDocuments /> : <Home />;
      case '/admin/queries':
        return currentUserRole === 'admin' ? <AdminQueries /> : <Home />;
      case '/admin/messages':
        return currentUserRole === 'admin' ? <AdminMessages /> : <Home />;
      case '/admin/notifications':
        return currentUserRole === 'admin' ? <AdminNotifications /> : <Home />;
      case '/privacy':
        return <Privacy />;
      case '/terms':
        return <Terms />;
      case '/refund':
        return <Refund />;
      case '/pricing':
        return <Pricing />;
      case '/support':
        return <Support />;
      case '/how-it-works':
        return <HowItWorks />;
      case '/routing-test':
        return <RoutingTest />;
      case '/messages':
        return user ? <Messages /> : <Login />;
      default:
        break;
    }

    // Pattern-matched routes (dynamic segments like /crop/:id)
    if (routePath.startsWith('/crop/')) {
      return <CropDetail />;
    }
    if (routePath.startsWith('/edit-crop/')) {
      return currentUserRole === 'farmer' ? <EditCrop /> : <Home />;
    }
    if (routePath.startsWith('/farmer/')) {
      return <FarmerProfile />;
    }
    if (routePath.startsWith('/order/')) {
      return user ? <OrderDetails /> : <Login />;
    }

    // Fallback
    return <Home />;
  };

  // Navigation and logout handled via useRouter and useAuth contexts

  return (
    <CartProvider>
      <WishlistProvider>
        <ToastProvider>
          <NotificationProvider>
            <ChatProvider>
              <RecentlyViewedProvider>
                <GlobalPageLoader />
                <div className="min-h-screen bg-white flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    {renderPage()}
                  </main>
                  <Footer />
                </div>
              </RecentlyViewedProvider>
            </ChatProvider>
          </NotificationProvider>
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
