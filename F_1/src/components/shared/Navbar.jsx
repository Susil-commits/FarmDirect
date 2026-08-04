import { useState } from 'react';
import { Menu, X, ShoppingCart, Heart, User, LogOut, Search, Bell, Home, Grid, Settings, Compass, CheckCircle, MessageCircle, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useNotifications } from '../../hooks/useNotifications';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../hooks/useSocket';
import Avatar from '../common/Avatar';
import MiniCart from '../MiniCart';
import SearchBar from '../SearchBar';
import EmptyCartWishlistModal from '../common/EmptyCartWishlistModal';
import NotificationEmptyModal from '../common/NotificationEmptyModal';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import NotificationPanel from '../common/NotificationPanel';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [emptyModalType, setEmptyModalType] = useState('cart'); // 'cart' or 'wishlist'
  const [showNotificationEmpty, setShowNotificationEmpty] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { navigate, currentRoute } = useRouter();
  const { user, logout } = useAuth();
  const { getTotalItems: getCartTotal } = useCart();
  const { wishlist } = useWishlist();
  const { unreadCount } = useNotifications();
  const { unreadCount: chatUnreadCount } = useChat();
  const { connected } = useSocket();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
  const toggleMiniCart = () => setIsMiniCartOpen(!isMiniCartOpen);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
    setIsUserMenuOpen(false);
    setIsMiniCartOpen(false);
  };

  const handleLogout = async () => {
    // Show confirmation modal instead of logging out directly
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Special handler for marketplace access with verification check
  const handleMarketplaceAccess = () => {
    if (!user) {
      // Not logged in - redirect to login with return path
      navigate('/auth/login?next=/marketplace');
      setIsOpen(false);
      setIsUserMenuOpen(false);
      return;
    }

    // Logged in - check role and verification status
    if (user.role === 'buyer' && user.kycStatus === 'verified') {
      handleNavigate('/marketplace');
    } else if (user.role === 'buyer') {
      // Buyer but not verified - redirect to verification page
      console.warn('Please complete KYC verification to access marketplace');
      handleNavigate('/verification/progress'); // Redirect to proper verification page
    } else {
      // Other roles cannot access marketplace as buyers
      console.warn('Only verified buyers can access the marketplace');
    }
  };

  const cartTotal = getCartTotal();

  // Navigation items based on user role
  const getNavItems = () => {
    if (!user) {
      // Public navigation - NO marketplace for unauthenticated users
      return [
        { id: 'about', label: 'About', path: '/about' },
        { id: 'contact', label: 'Contact', path: '/contact' },
      ];
    }

    if (user.role === 'farmer') {
      return [
        { id: 'dashboard', label: 'Dashboard', path: '/farmer/dashboard' },
        { id: 'crops', label: 'My Crops', path: '/farmer/dashboard' },
        { id: 'orders', label: 'Orders Received', path: '/farmer/dashboard' },
      ];
    }

    if (user.role === 'buyer') {
      // Hide marketplace link on verification pages
      const isVerificationPage = currentRoute && (
        currentRoute.includes('/verification') || currentRoute.startsWith('/verify')
      );
      const items = [];
      if (!isVerificationPage) {
        items.push({ id: 'marketplace', label: 'Marketplace', path: '/marketplace' });
      }
      items.push({ id: 'orders', label: 'My Orders', path: '/buyer/dashboard' });
      return items;
    }

    if (user.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
        { id: 'users', label: 'Users', path: '/admin/users' },
        { id: 'crops', label: 'Crops', path: '/admin/crops' },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="fixed top-0 left-0 w-full z-50 pt-4 px-4 pointer-events-none transition-all duration-300">
      <nav className="max-w-6xl mx-auto bg-white/95 backdrop-blur-2xl border-2 border-slate-100 shadow-md rounded-full pointer-events-auto transition-all duration-300 hover:shadow-lg">
        <div className="flex justify-between items-center h-16 px-6 sm:px-8">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer shrink-0 group" 
            onClick={() => {
              navigate('/');
              setIsOpen(false);
              setIsUserMenuOpen(false);
              setIsMiniCartOpen(false);
            }}
          >
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-8 h-8 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-sm tracking-tighter">FD</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Farm<span className="text-green-600">Direct</span></h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 flex-1 px-8">
            {navItems?.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  // Use special handler for marketplace
                  if (item.id === 'marketplace') {
                    handleMarketplaceAccess();
                  } else {
                    handleNavigate(item.path);
                  }
                }}
                className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  currentRoute === item.path
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search Bar - Desktop (hidden on verification pages) */}
          {user?.role === 'buyer' &&
           currentRoute &&
           !currentRoute.includes('/verification') &&
           !currentRoute.startsWith('/verify') && (
            <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
              <SearchBar />
            </div>
          )}

          {/* Right Section - Icons & User */}
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Security Session & Realtime indicators (authenticated users only) */}
            {user && (
              <div className="hidden md:flex items-center gap-2 mr-2 border-r border-slate-200 pr-3">
                <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  <ShieldCheck size={14} />
                  Secure
                </span>
                <span
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold transition-colors"
                  title={connected ? 'Real-time connection active' : 'Reconnecting…'}
                  style={{ color: connected ? '#16a34a' : '#d97706' }}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}
                  />
                  <span>{connected ? 'Live' : 'Offline'}</span>
                </span>
              </div>
            )}

            {/* Wishlist Icon - Buyers and Farmers Only */}
            {(!user || user.role === 'buyer' || user.role === 'farmer') && (
              <button
                onClick={() => {
                  if (!user) {
                    setEmptyModalType('wishlist');
                    setShowEmptyModal(true);
                  } else {
                    handleNavigate('/wishlist');
                  }
                }}
                className="relative p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition duration-200 cursor-pointer"
                aria-label={user ? `Wishlist with ${wishlist.length} items` : "Browse and save items"}
              >
                <Heart size={20} fill={user && wishlist.length > 0 ? "currentColor" : "none"} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
                    {wishlist.length > 99 ? '99+' : wishlist.length}
                  </span>
                )}
              </button>
            )}

            {/* Cart Icon - Buyers and Farmers Only */}
            {(!user || user.role === 'buyer' || user.role === 'farmer') && (
              <button
                onClick={() => {
                  if (!user) {
                    setEmptyModalType('cart');
                    setShowEmptyModal(true);
                  } else {
                    toggleMiniCart();
                  }
                }}
                className="relative p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200 cursor-pointer"
                aria-label={user ? `Shopping cart with ${cartTotal} items` : "Start shopping in marketplace"}
              >
                <ShoppingCart size={20} />
                {cartTotal > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 animate-pulse">
                    {cartTotal > 99 ? '99+' : cartTotal}
                  </span>
                )}
              </button>
            )}

            {/* Notifications - All authenticated users */}
            {user && (
              <button
                onClick={() => handleNavigate('/messages')}
                className="relative p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition duration-200 cursor-pointer"
                title={chatUnreadCount > 0 ? `${chatUnreadCount} unread message${chatUnreadCount > 1 ? 's' : ''}` : "View messages"}
                aria-label={chatUnreadCount > 0 ? `View ${chatUnreadCount} messages` : "View messages"}
              >
                <MessageCircle size={20} />
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 animate-pulse">
                    {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications - All authenticated users */}
            {user && (
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition duration-200 cursor-pointer"
                title={unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : "View notifications"}
                aria-label={unreadCount > 0 ? `View ${unreadCount} notifications` : "View notifications"}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Desktop Auth Buttons - Show when NOT logged in */}
            {!user && (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => handleNavigate('/auth/login')}
                  className="px-4 py-2 text-green-600 font-medium hover:text-green-700 transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigate('/auth/register')}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Home Icon - Show when logged in and NOT on home page */}
            {user && currentRoute !== '/' && (
              <button
                onClick={() => handleNavigate('/')}
                className="hidden sm:inline-flex p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200 cursor-pointer"
                aria-label="Go to Home Page"
              >
                <Home size={20} className="text-green-600" />
              </button>
            )}

            {/* Status Icon on Home Page ONLY - Show ONLY when logged in and on home page / */}
            {user && currentRoute === '/' && (
              <button
                onClick={() => {
                  window.history.back();
                }}
                className="hidden sm:inline-flex p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200 cursor-pointer"
                title="Go Back to Previous Page"
                aria-label="Go back to previous page"
              >
                <CheckCircle size={20} className="text-green-600" />
              </button>
            )}

            {/* User Menu - Show when logged in on all pages */}
            {user && (
              <div className="relative hidden sm:block">
                <button
                  onClick={toggleUserMenu}
                  className="rounded-full hover:ring-2 hover:ring-green-400 ring-offset-1 transition duration-200 cursor-pointer"
                  title={user.name || 'Profile'}
                  aria-label={user.name ? `User Menu for ${user.name}` : 'User Menu'}
                >
                  <Avatar user={user} size="sm" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                      <Avatar user={user} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNavigate(user.role === 'admin' ? '/admin/profile' : '/profile')}
                      className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-green-50 hover:text-green-600 transition cursor-pointer text-sm font-medium flex items-center gap-2"
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </button>
                    {user.role === 'buyer' && (
                      <button
                        onClick={() => handleNavigate('/buyer/dashboard')}
                        className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-green-50 hover:text-green-600 transition cursor-pointer text-sm font-medium flex items-center gap-2"
                      >
                        <span>📊</span>
                        <span>My Dashboard</span>
                      </button>
                    )}
                    {user.role === 'farmer' && (
                      <button
                        onClick={() => handleNavigate('/farmer/dashboard')}
                        className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-green-50 hover:text-green-600 transition cursor-pointer text-sm font-medium flex items-center gap-2"
                      >
                        <span>🌾</span>
                        <span>My Farm</span>
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleNavigate('/admin/dashboard')}
                        className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer text-sm font-medium flex items-center gap-2"
                      >
                        <span>⚙️</span>
                        <span>Admin Dashboard</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition flex items-center gap-2 cursor-pointer text-sm font-medium border-t border-gray-200 mt-1"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Modern Hamburger Dropdown from Top */}
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            ></div>

            {/* Hamburger Menu Panel - Dropdown from Top */}
            <div className="absolute left-0 right-0 top-16 w-full max-h-[90vh] bg-white/70 backdrop-blur-xl border-b-2 border-white/60 shadow-2xl animate-slide-down overflow-y-auto">
              {/* Header */}
              <div className="px-6 py-4 border-b-2 border-white/60 bg-white/60">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              </div>

              {/* Main Navigation */}
              <div className="px-0 py-4 space-y-1">
                {/* Home */}
                <button
                  onClick={() => handleNavigate('/')}
                  className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-green-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                >
                  <Home size={22} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Home</span>
                </button>

                {/* Search - hidden on verification pages */}
                {!(currentRoute && (currentRoute.includes('/verification') || currentRoute.startsWith('/verify'))) && (
                  <button
                    onClick={() => handleNavigate('/marketplace')}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-green-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                  >
                    <Search size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Search</span>
                  </button>
                )}

                {/* Categories - hidden on verification pages */}
                {!(currentRoute && (currentRoute.includes('/verification') || currentRoute.startsWith('/verify'))) && (
                  <button
                    onClick={() => handleNavigate('/marketplace')}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-green-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                  >
                    <Grid size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Categories</span>
                  </button>
                )}

                {/* Marketplace / Browse - hidden on verification pages */}
                {!user && !(currentRoute && (currentRoute.includes('/verification') || currentRoute.startsWith('/verify'))) && (
                  <button
                    onClick={handleMarketplaceAccess}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-green-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                  >
                    <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Start Shopping</span>
                  </button>
                )}

                {user?.role === 'buyer' && !(currentRoute && (currentRoute.includes('/verification') || currentRoute.startsWith('/verify'))) && (
                  <button
                    onClick={() => handleNavigate('/marketplace')}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-green-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                  >
                    <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Marketplace</span>
                  </button>
                )}

                {user?.role === 'farmer' && (
                  <button
                    onClick={() => handleNavigate('/farmer/dashboard')}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-green-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                  >
                    <Grid size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">My Farm</span>
                  </button>
                )}

                {/* Wishlist */}
                {user && (
                  <button
                    onClick={() => handleNavigate('/wishlist')}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-red-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                  >
                    <Heart size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">
                      Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
                    </span>
                  </button>
                )}

                {/* Settings / Profile */}
                {user && (
                  <button
                    onClick={() => handleNavigate(user.role === 'admin' ? '/admin/profile' : '/profile')}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-700 hover:text-green-600 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                  >
                    <User size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">My Profile</span>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="my-2 border-t-2 border-white/60"></div>

              {/* Secondary Navigation */}
              <div className="px-0 py-4 space-y-1">
                {/* About & Contact */}
                {!user && (
                  <>
                    <button
                      onClick={() => handleNavigate('/about')}
                      className="w-full px-6 py-3 flex items-center gap-4 text-gray-600 hover:text-green-600 hover:bg-white/10 transition-all duration-200 text-sm cursor-pointer"
                    >
                      <Compass size={20} />
                      <span className="font-medium">About Us</span>
                    </button>
                    <button
                      onClick={() => handleNavigate('/contact')}
                      className="w-full px-6 py-3 flex items-center gap-4 text-gray-600 hover:text-green-600 hover:bg-white/10 transition-all duration-200 text-sm cursor-pointer"
                    >
                      <Bell size={20} />
                      <span className="font-medium">Contact</span>
                    </button>
                    <button
                      onClick={() => handleNavigate('/auth/login')}
                      className="w-full px-6 py-3 flex items-center gap-4 text-green-600 hover:text-green-700 hover:bg-white/10 transition-all duration-200 text-sm font-medium cursor-pointer"
                    >
                      <User size={20} />
                      <span>Login</span>
                    </button>
                    <button
                      onClick={() => handleNavigate('/auth/register')}
                      className="w-full px-6 py-3 flex items-center gap-4 text-green-600 hover:text-green-700 hover:bg-white/10 transition-all duration-200 text-sm font-medium cursor-pointer"
                    >
                      <User size={20} />
                      <span>Sign Up</span>
                    </button>
                  </>
                )}

                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleNavigate('/admin/dashboard')}
                    className="w-full px-6 py-3 flex items-center gap-4 text-gray-600 hover:text-green-600 hover:bg-white/10 transition-all duration-200 text-sm cursor-pointer"
                  >
                    <Settings size={20} />
                    <span className="font-medium">Dashboard</span>
                  </button>
                )}
              </div>

              {/* Footer - Logout only when logged in */}
              {user && (
                <div className="px-6 py-4 border-t-2 border-white/60 bg-white/60">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-red-600 hover:text-red-700 font-medium transition duration-200 flex items-center justify-center gap-2 rounded-lg text-sm hover:bg-white/20"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Mini Cart Dropdown */}
      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />

      {/* Empty Cart/Wishlist Modal */}
      {showEmptyModal && (
        <EmptyCartWishlistModal
          type={emptyModalType}
          onClose={() => setShowEmptyModal(false)}
        />
      )}

      {/* Empty Notification Modal */}
      {showNotificationEmpty && (
        <NotificationEmptyModal
          onClose={() => setShowNotificationEmpty(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmationModal
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}

      {/* Notification Panel */}
      {user && (
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
