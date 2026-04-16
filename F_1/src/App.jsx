import { useRouter } from './context/RouterContext';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import GlobalPageLoader from './components/common/GlobalPageLoader';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import CropDetail from './pages/CropDetail';
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
import Wishlist from './pages/Wishlist';
import UserProfile from './pages/UserProfile';
import OrderTracking from './pages/OrderTracking';
import ProductComparison from './pages/ProductComparison';
import PendingVerification from './pages/PendingVerification';
import AdminProfile from './pages/AdminProfile';
import AdminDashboardStats from './pages/dashboards/AdminDashboardStats';
import AdminUsers from './pages/dashboards/AdminUsers';
import AdminCrops from './pages/dashboards/AdminCrops';
import FarmerDashboard from './pages/dashboards/FarmerDashboard';
import BuyerDashboard from './pages/dashboards/BuyerDashboard';
import FarmerVerification from './pages/verification/FarmerVerification';
import BuyerVerification from './pages/verification/BuyerVerification';
import VerificationProgress from './pages/verification/VerificationProgress';
import AdminVerification from './pages/admin/AdminVerification';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import Pricing from './pages/Pricing';
import Support from './pages/Support';
import HowItWorks from './pages/HowItWorks';
import RoutingTest from './pages/RoutingTest';
import { useEffect } from 'react';

function App() {
  const { currentRoute, navigate } = useRouter();
  const { user, logout, loading } = useAuth();

  // Log whenever the route changes
  useEffect(() => {
    console.log('✅ App re-rendered with currentRoute:', currentRoute);
  }, [currentRoute]);

  const renderPage = () => {
    // Don't render anything while loading auth state on initial mount/refresh
    if (loading) {
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
    
    // Get verification status from localStorage or user object
    const verificationStatus = localStorage.getItem('verificationStatus') || user?.kycStatus;
    
    // Redirect unverified users to verification page (except for auth routes and specific routes)
    // NOTE: Admin users do NOT need verification - they verify others
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/google/callback', '/auth/github/callback', '/', '/about', '/contact'];
    const isPublicRoute = publicRoutes.includes(currentRoute);
    
    // Only require verification for farmers and buyers, NOT for admin
    if (user && user.role !== 'admin' && verificationStatus !== 'verified' && !isPublicRoute && currentRoute !== '/verification/progress') {
      return <VerificationProgress />;
    }

    // Show verification page to unverified buyers (legacy check)
    if (user?.role === 'buyer' && !user.verified && currentRoute !== '/profile' && currentRoute !== '/auth/logout') {
      return <PendingVerification />;
    }

    switch (currentRoute) {
      case '/':
        return <Home />;
      case '/marketplace':
        return <Marketplace />;
      case '/crop/:id':
        return <CropDetail />;
      case '/farmer/:farmerId':
        return <FarmerProfile />;
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
        return <Checkout />;
      case '/order-confirmation':
        return <OrderConfirmation />;
      case '/wishlist':
        return <Wishlist />;
      case '/orders':
        return <OrderTracking />;
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
      case '/farmer/dashboard':
        return user?.role === 'farmer' ? <FarmerDashboard /> : <Home />;
      case '/farmer/verification':
        return user?.role === 'farmer' ? <FarmerVerification /> : <Home />;
      case '/buyer/dashboard':
        return user?.role === 'buyer' ? <BuyerDashboard /> : <Home />;
      case '/buyer/verification':
        return user?.role === 'buyer' ? <BuyerVerification /> : <Home />;
      case '/admin/dashboard':
        return user?.role === 'admin' ? <AdminDashboardStats /> : <Home />;
      case '/admin/users':
        return user?.role === 'admin' ? <AdminUsers /> : <Home />;
      case '/admin/crops':
        return user?.role === 'admin' ? <AdminCrops /> : <Home />;
      case '/admin/profile':
        return user?.role === 'admin' ? <AdminProfile /> : <Home />;
      case '/admin/verification':
        return user?.role === 'admin' ? <AdminVerification /> : <Home />;
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
      default:
        return <Home />;
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <CartProvider>
      <WishlistProvider>
        <ToastProvider>
          <GlobalPageLoader />
          <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <main className="flex-1">
              {renderPage()}
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
