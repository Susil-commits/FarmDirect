# Frontend Architecture - React Component Structure & Design

## 1. Component Hierarchy

```
<App>
  ├─ <AuthContext>
  ├─ <CartContext>
  ├─ <WishlistContext>
  ├─ <NotificationContext>
  └─ <Router>
      ├─ <Layout>
      │   ├─ <Navbar />
      │   ├─ <Sidebar />
      │   └─ <PageContent />
      │
      ├─ PUBLIC ROUTES
      │   ├─ <Home />
      │   ├─ <Marketplace />
      │   ├─ <CropDetail />
      │   ├─ <Login />
      │   ├─ <Register />
      │   └─ <ForgotPassword />
      │
      ├─ FARMER ROUTES
      │   ├─ <FarmerDashboard />
      │   │   ├─ <DashboardOverview />
      │   │   ├─ <RecentOrders />
      │   │   └─ <EarningsChart />
      │   ├─ <ManageCrops />
      │   │   ├─ <CropList />
      │   │   └─ <AddCropForm />
      │   ├─ <ReceivedOrders />
      │   │   ├─ <OrderCard />
      │   │   └─ <OrderDetails />
      │   └─ <FarmerProfile />
      │
      ├─ BUYER ROUTES
      │   ├─ <BuyerDashboard />
      │   │   ├─ <DashboardOverview />
      │   │   └─ <RecentOrders />
      │   ├─ <MyOrders />
      │   │   ├─ <OrderList />
      │   │   └─ <OrderTracking />
      │   ├─ <Wishlist />
      │   ├─ <ShoppingCart />
      │   ├─ <Checkout />
      │   └─ <BuyerProfile />
      │
      ├─ ADMIN ROUTES
      │   ├─ <AdminDashboard />
      │   │   ├─ <KPICards />
      │   │   ├─ <Charts />
      │   │   └─ <RecentActivity />
      │   ├─ <UserManagement />
      │   ├─ <ListingModeration />
      │   ├─ <OrderMonitoring />
      │   ├─ <Analytics />
      │   └─ <AdminSettings />
      │
      └─ SHARED COMPONENTS
          ├─ <Modal />
          ├─ <Toast />
          ├─ <LoadingSpinner />
          ├─ <PageTransition />
          └─ <ErrorBoundary />
```

---

## 2. Folder Structure with Details

```
src/
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── farmer-placeholder.jpg
│   │   ├── crop-placeholder.jpg
│   │   └── illustrations/
│   │       ├── empty-cart.svg
│   │       ├── no-orders.svg
│   │       └── error.svg
│   ├── icons/
│   │   ├── home.svg
│   │   ├── search.svg
│   │   ├── cart.svg
│   │   ├── user.svg
│   │   └── menu.svg
│   └── fonts/
│       ├── roboto-regular.ttf
│       └── poppins-bold.ttf
│
├── components/
│   ├── common/
│   │   ├── Button.jsx          # Reusable button component
│   │   ├── Card.jsx            # Card wrapper
│   │   ├── Modal.jsx           # Modal dialog
│   │   ├── Input.jsx           # Input field wrapper
│   │   ├── Select.jsx          # Dropdown select
│   │   ├── Badge.jsx           # Status badge
│   │   ├── Pagination.jsx      # Pagination controls
│   │   ├── LoadingSpinner.jsx  # Loading indicator
│   │   ├── Toast.jsx           # Toast notification
│   │   └── Tooltip.jsx         # Tooltip component
│   │
│   ├── shared/
│   │   ├── Navbar.jsx          # Navigation bar
│   │   ├── Sidebar.jsx         # Sidebar navigation
│   │   ├── Footer.jsx          # Footer section
│   │   ├── Layout.jsx          # Main layout wrapper
│   │   └── RoleBasedNav.jsx    # Conditional nav based on role
│   │
│   ├── farmer/
│   │   ├── AddCropForm.jsx     # Form to add/edit crops
│   │   ├── ManageCrops.jsx     # List & manage crops
│   │   ├── CropCard.jsx        # Crop card display
│   │   ├── OrderRequest.jsx    # Order request component
│   │   ├── OrderAcceptModal.jsx# Accept/reject modal
│   │   ├── EarningsChart.jsx   # Earnings visualization
│   │   ├── FarmProfile.jsx     # Farm profile display
│   │   └── analytics/
│   │       ├── SalesChart.jsx
│   │       ├── TopCrops.jsx
│   │       └── EarningsCardWithContext.jsx
│   │
│   ├── buyer/
│   │   ├── CropCard.jsx        # Crop listing card
│   │   ├── CropGrid.jsx        # Grid of crops
│   │   ├── FilterPanel.jsx     # Filter sidebar
│   │   ├── SearchBar.jsx       # Search functionality
│   │   ├── CartItem.jsx        # Cart item component
│   │   ├── ReviewForm.jsx      # Leave review form
│   │   ├── ReviewList.jsx      # Display reviews
│   │   └── OrderTimeline.jsx   # Order status timeline
│   │
│   ├── admin/
│   │   ├── UserManagement.jsx      # User management table
│   │   ├── UserRow.jsx             # User table row
│   │   ├── ListingModeration.jsx   # Moderate listings
│   │   ├── ListingCard.jsx         # Listing review card
│   │   ├── OrderMonitoring.jsx     # Monitor orders
│   │   ├── DisputeResolution.jsx   # Handle disputes
│   │   ├── Analytics.jsx           # Analytics dashboard
│   │   ├── ReportGenerator.jsx     # Generate reports
│   │   └── SystemSettings.jsx      # System configuration
│   │
│   └── ui-patterns/
│       ├── ScrollAnimation.jsx # Scroll animations
│       ├── PageTransition.jsx  # Page transition animation
│       ├── AdvancedSearch.jsx  # Advanced search UI
│       ├── Timeline.jsx        # Timeline visualization
│       └── EmptyState.jsx      # Empty state display
│
├── pages/
│   ├── Home.jsx                # Landing page
│   ├── Marketplace.jsx         # Browse crops page
│   ├── CropDetail.jsx          # Single crop details
│   ├── ShoppingCart.jsx        # Shopping cart page
│   ├── Checkout.jsx            # Checkout/payment
│   ├── OrderTracking.jsx       # Order tracking page
│   ├── Notifications.jsx       # Notifications page
│   ├── UserProfile.jsx         # User profile page
│   ├── Wishlist.jsx            # Wishlist page
│   │
│   ├── auth/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── ForgotPassword.jsx  # Password reset
│   │   └── VerifyEmail.jsx     # Email verification
│   │
│   └── dashboards/
│       ├── FarmerDashboard.jsx     # Farmer dashboard
│       ├── BuyerDashboard.jsx      # Buyer dashboard
│       └── AdminDashboard.jsx      # Admin dashboard
│
├── context/
│   ├── AuthContext.jsx         # Authentication state
│   ├── CartContext.jsx         # Shopping cart state
│   ├── WishlistContext.jsx     # Wishlist state
│   ├── NotificationContext.jsx # Toast notifications
│   └── AppContext.jsx          # Global app state
│
├── hooks/
│   ├── useAuth.js              # Auth context hook
│   ├── useCart.js              # Cart context hook
│   ├── useFetch.js             # Data fetching hook
│   ├── useForm.js              # Form handling hook
│   ├── useLocalStorage.js      # Local storage hook
│   ├── useDebounce.js          # Debounce hook
│   ├── usePagination.js        # Pagination hook
│   └── useWindowSize.js        # Window size hook
│
├── services/
│   ├── api.js                  # Axios instance & base config
│   ├── authService.js          # Auth API calls
│   ├── cropService.js          # Crop API calls
│   ├── orderService.js         # Order API calls
│   ├── reviewService.js        # Review API calls
│   ├── userService.js          # User API calls
│   ├── notificationService.js  # Notification API calls
│   └── paymentService.js       # Payment API calls
│
├── utils/
│   ├── constants.js            # App constants
│   ├── validation.js           # Form validation schemas
│   ├── formatters.js           # Data formatters (date, currency)
│   ├── storage.js              # Local/session storage helpers
│   ├── permissions.js          # Permission checking
│   ├── helpers.js              # Utility functions
│   └── errorHandler.js         # Error handling utilities
│
├── styles/
│   ├── App.css                 # App level styles
│   ├── index.css               # Global styles
│   ├── theme.css               # Color & theme variables
│   ├── responsive.css          # Responsive styles
│   ├── animations.css          # Keyframe animations
│   └── tailwind.config.js      # Tailwind config (if using Tailwind)
│
├── routes/
│   ├── ProtectedRoute.jsx      # Route protection component
│   ├── index.jsx               # Route configuration
│   └── routeConfig.js          # Route definitions
│
├── App.jsx                     # Main app component
├── main.jsx                    # Entry point
└── index.css                   # CSS entry point
```

---

## 3. Context API Structure

### AuthContext
```javascript
// src/context/AuthContext.jsx

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: UserData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Usage in component:
const { user, isAuthenticated, login, logout } = useAuth();
```

### CartContext
```javascript
// src/context/CartContext.jsx

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (cropId: string, quantity: number) => void;
  removeItem: (cropId: string) => void;
  updateQuantity: (cropId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (couponCode: string) => void;
}

// Sync with backend on sensitive operations
```

### WishlistContext
```javascript
// src/context/WishlistContext.jsx

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (cropId: string) => void;
  removeFromWishlist: (cropId: string) => void;
  isInWishlist: (cropId: string) => boolean;
  clearWishlist: () => void;
}
```

### NotificationContext
```javascript
// src/context/NotificationContext.jsx

interface NotificationContextType {
  notifications: Notification[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  showModal: (title: string, message: string) => void;
  hideModal: () => void;
}

// Usage:
const { showToast } = useNotifications();
showToast('Order placed successfully!', 'success');
```

---

## 4. Component Examples

### Common Component: Button

```javascript
// src/components/common/Button.jsx

const Button = ({
  children,
  variant = 'primary',     // primary, secondary, danger
  size = 'medium',         // small, medium, large
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = 'font-medium rounded transition duration-200';
  
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  const sizes = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };
  
  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading ? <LoadingSpinner size="small" /> : children}
    </button>
  );
};

export default Button;
```

### Page Component: Marketplace

```javascript
// src/pages/Marketplace.jsx

const Marketplace = () => {
  const [crops, setCrops] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 9999,
    city: '',
    page: 1
  });
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchCrops();
  }, [filters]);
  
  const fetchCrops = async () => {
    try {
      setLoading(true);
      const response = await cropService.getCrops(filters);
      setCrops(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      showToast('Failed to load crops', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="flex gap-4">
        <FilterPanel 
          filters={filters}
          setFilters={setFilters}
        />
        
        <div className="flex-1">
          <SearchBar 
            value={filters.search}
            onChange={(search) => setFilters({...filters, search, page: 1})}
          />
          
          {loading ? (
            <LoadingSpinner />
          ) : crops.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crops.map(crop => (
                  <CropCard key={crop._id} crop={crop} />
                ))}
              </div>
              
              <Pagination 
                current={filters.page}
                total={totalPages}
                onChange={(page) => setFilters({...filters, page})}
              />
            </>
          ) : (
            <EmptyState message="No crops found matching your criteria" />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Marketplace;
```

---

## 5. State Management Strategy

### API State Pattern
```javascript
// Using custom hook for data fetching

const useCrops = (filters) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'LOADING' });
      try {
        const data = await cropService.getCrops(filters);
        dispatch({ type: 'SUCCESS', payload: data });
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error.message });
      }
    };
    
    fetchData();
  }, [filters]);
  
  return state; // { data, loading, error }
};

// Usage
const { data: crops, loading, error } = useCrops(filters);
```

---

## 6. Page Layouts

### Dashboard Layout (Farmer)

```
┌─────────────────────────────────────────────────┐
│ NAVBAR (Logo, Search, Cart, User Menu)          │
├──────────────┬──────────────────────────────────┤
│   SIDEBAR    │          MAIN CONTENT             │
│              │                                   │
│ Dashboard    │ ┌─────────────────────────────┐   │
│ My Crops     │ │   KPI CARDS                 │   │
│ My Orders    │ ├─────────────────────────────┤   │
│ Earnings     │ │ Total Earnings │ Avg Rating │   │
│ Farm Profile │ ├─────────────────────────────┤   │
│ Settings     │ │   RECENT ORDERS TABLE       │   │
│ Logout       │ ├─────────────────────────────┤   │
│              │ │ Order │ Buyer │ Status │ ... │   │
│              │ ├─────────────────────────────┤   │
│              │ │   CHARTS                    │   │
│              │ ├─────────────────────────────┤   │
│              │ │ Sales Trend │ Top Products │   │
└──────────────┴──────────────────────────────────┘
```

### Marketplace Layout (Buyer)

```
┌─────────────────────────────────────────────────┐
│ NAVBAR (Logo, Search, Cart, Wishlist, User Menu)│
├──────┬───────────────────────────────────────────┤
│ FILTERS │          CROP LISTINGS                 │
│         │                                        │
│ Category│  ┌──────────┐  ┌──────────┐           │
│ Price   │  │Crop Card │  │Crop Card │  ...     │
│ Rating  │  └──────────┘  └──────────┘           │
│ Distance│  ┌──────────┐  ┌──────────┐           │
│         │  │Crop Card │  │Crop Card │  ...     │
│         │  └──────────┘  └──────────┘           │
│         │  [Pagination Controls]                │
└──────┴───────────────────────────────────────────┘
```

---

## 7. Page Flow Diagram

```
HOME (Landing)
  ↓
├→ LOGIN / REGISTER
│  ↓
│  ├→ FARMER DASHBOARD
│  │  ├→ Manage Crops
│  │  ├→ Received Orders
│  │  ├→ Earnings
│  │  └→ Farm Profile
│  │
│  └→ BUYER DASHBOARD
│     ├→ Browse Marketplace
│     ├→ My Orders
│     ├→ Wishlist
│     ├→ Shopping Cart
│     └→ Checkout
│
└→ MARKETPLACE (Public)
   ├→ Crop Details
   ├→ Reviews
   ├→ Add to Cart/Wishlist
   └→ Continue Shopping
```

---

## 8. Responsive Design Strategy

### Breakpoints (Tailwind CSS)
```css
sm: 640px   (tablets)
md: 768px   (small laptops)
lg: 1024px  (desktops)
xl: 1280px  (large desktops)
```

### Mobile-First Approach
```javascript
// Example responsive component
<div className="
  grid 
  grid-cols-1        /* Mobile: 1 column */
  sm:grid-cols-2     /* Tablet: 2 columns */
  lg:grid-cols-3     /* Desktop: 3 columns */
  gap-4
">
  {items.map(item => <Card key={item.id} data={item} />)}
</div>
```

---

## 9. Form Handling

### Form Hook Pattern
```javascript
const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate(values);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      await onSubmit(values);
    }
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit
  };
};
```

---

## 10. Performance Optimization

### Code Splitting
```javascript
import { lazy, Suspense } from 'react';

const FarmerDashboard = lazy(() => import('./pages/dashboards/FarmerDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard'));

// In routes
<Suspense fallback={<LoadingSpinner />}>
  <FarmerDashboard />
</Suspense>
```

### Memoization
```javascript
import { memo, useMemo } from 'react';

// Memoize expensive components
const CropCard = memo(({ crop }) => (
  <div className="crop-card">
    {/* render crop */}
  </div>
));

// Memoize computed values
const totalPrice = useMemo(() => 
  items.reduce((sum, item) => sum + item.price, 0),
  [items]
);
```

---

## 11. Component Communication Flow

```
User Action (Click, Input)
    ↓
Component Event Handler
    ↓
Context Update / API Call
    ↓
State Update
    ↓
Re-render Component
    ↓
Update DOM
    ↓
Visual Change on Screen
```

---

## 12. Error & Loading States

```javascript
// Consistent patterns across app

// Loading State
{loading && <LoadingSpinner message="Loading crops..." />}

// Error State
{error && (
  <ErrorBoundary message={error}>
    <button onClick={retry}>Try Again</button>
  </ErrorBoundary>
)}

// Empty State
{!loading && items.length === 0 && (
  <EmptyState 
    icon="empty-box"
    heading="No crops found"
    message="Try adjusting your filters"
    action={<Button>Clear Filters</Button>}
  />
)}

// Success State
{success && (
  <Toast message="Operation successful" type="success" />
)}
```

This comprehensive frontend architecture provides a scalable, maintainable structure for your React application.
