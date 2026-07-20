 import { useRouter } from './hooks/useRouter';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
 import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
 import { RealtimeProvider } from './context/RealtimeContext';
 import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import GlobalPageLoader from './components/common/GlobalPageLoader';
import PageLoader from './components/common/PageLoader';
import ErrorBoundary from './components/common/ErrorBoundary';
import { lazy, Suspense, useEffect, useRef } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const CropDetail = lazy(() => import('./pages/CropDetail'));
const CreateCrop = lazy(() => import('./pages/CreateCrop'));
const EditCrop = lazy(() => import('./pages/EditCrop'));
const FarmerProfile = lazy(() => import('./pages/FarmerProfile'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const StartShopping = lazy(() => import('./pages/StartShopping'));
const JoinAsFarmer = lazy(() => import('./pages/JoinAsFarmer'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const GoogleCallback = lazy(() => import('./pages/auth/GoogleCallback'));
const GitHubCallback = lazy(() => import('./pages/auth/GitHubCallback'));
const ShoppingCart = lazy(() => import('./pages/ShoppingCart'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ProductComparison = lazy(() => import('./pages/ProductComparison'));
const PendingVerification = lazy(() => import('./pages/PendingVerification'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const AdminDashboardStats = lazy(() => import('./pages/dashboards/AdminDashboardStats'));
const AdminApprovals = lazy(() => import('./pages/dashboards/AdminApprovals'));
const AdminManagement = lazy(() => import('./pages/dashboards/AdminManagement'));
const AdminUsers = lazy(() => import('./pages/dashboards/AdminUsers'));
const AdminCrops = lazy(() => import('./pages/dashboards/AdminCrops'));
const AdminOrders = lazy(() => import('./pages/dashboards/AdminOrders'));
const AdminNotifications = lazy(() => import('./pages/dashboards/AdminNotifications'));
const FarmerDashboardNew = lazy(() => import('./pages/FarmerDashboardNew'));
const BuyerDashboardNew = lazy(() => import('./pages/BuyerDashboardNew'));
const CheckoutNew = lazy(() => import('./pages/CheckoutNew'));
const OrderTrackingNew = lazy(() => import('./pages/OrderTrackingNew'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const FarmerVerification = lazy(() => import('./pages/verification/FarmerVerification'));
const BuyerVerification = lazy(() => import('./pages/verification/BuyerVerification'));
const VerificationProgress = lazy(() => import('./pages/verification/VerificationProgress'));
const KYCCongrats = lazy(() => import('./pages/verification/KYCCongrats'));
const KYCSorry = lazy(() => import('./pages/verification/KYCSorry'));
const AdminVerification = lazy(() => import('./pages/admin/AdminVerification'));
const AdminDocuments = lazy(() => import('./pages/admin/AdminDocuments'));
const AdminQueries = lazy(() => import('./pages/admin/AdminQueries'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Refund = lazy(() => import('./pages/Refund'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Support = lazy(() => import('./pages/Support'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const RoutingTest = lazy(() => import('./pages/RoutingTest'));
const Messages = lazy(() => import('./pages/Messages'));

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
       
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <RealtimeProvider>
                <ErrorBoundary>
                  <GlobalPageLoader />
                  <div className="min-h-screen bg-white flex flex-col">
                    <Navbar />
                    <main className="flex-1">
                      <Suspense fallback={<PageLoader message="Loading FarmDirect..." />}>
                        {renderPage()}
                      </Suspense>
                    </main>
                    <Footer />
                  </div>
                </ErrorBoundary>
              </RealtimeProvider>
            </RecentlyViewedProvider>
            </ChatProvider>
          </NotificationProvider>
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
