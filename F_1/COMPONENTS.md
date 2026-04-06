# Component API Reference

## 📦 Shared Layout Components

### Navbar
**Location**: `src/components/shared/Navbar.jsx`

**Props**:
- `user` (object | null) - Currently logged-in user object
- `onLogout` (function) - Callback when logout button clicked

**Features**:
- Sticky top navigation
- Mobile-responsive hamburger menu
- Role-based menu items (Farmer/Buyer/Admin)
- Notification & cart icons
- User profile dropdown

**Usage**:
```jsx
<Navbar user={user} onLogout={handleLogout} />
```

---

### Footer
**Location**: `src/components/shared/Footer.jsx`

**Props**: None

**Features**:
- 4-column grid layout (responsive)
- Brand info, quick links, legal, social
- Copyright notice

**Usage**:
```jsx
<Footer />
```

---

## 🎨 Common UI Components

### Button
**Location**: `src/components/common/Button.jsx`

**Props**:
- `variant` (string) - `'primary' | 'secondary' | 'danger' | 'outline'` - default: `'primary'`
- `size` (string) - `'sm' | 'md' | 'lg'` - default: `'md'`
- `disabled` (boolean) - default: `false`
- `children` (ReactNode) - Button text/content
- `className` (string) - Additional Tailwind classes
- `...rest` - All standard button HTML attributes

**Variants**:
```
primary:    Green background, white text
secondary:  Gray background, dark text
danger:     Red background, white text
outline:    Green border, green text
```

**Usage**:
```jsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Add to Cart
</Button>

<Button variant="outline" disabled>
  Disabled
</Button>
```

---

### Card
**Location**: `src/components/common/Card.jsx`

**Props**:
- `children` (ReactNode) - Card content
- `className` (string) - Additional Tailwind classes
- `hover` (boolean) - Enable hover shadow effect - default: `true`

**Features**:
- White background with subtle border
- Hover shadow and lift effect (optional)
- Rounded corners

**Usage**:
```jsx
<Card>
  <div className="p-6">
    <h2>Card Title</h2>
    <p>Card content here</p>
  </div>
</Card>

<Card hover={false}>
  Non-hoverable card
</Card>
```

---

### Input
**Location**: `src/components/common/Input.jsx`

**Props**:
- `label` (string) - Label text above input
- `type` (string) - HTML input type - default: `'text'`
- `placeholder` (string) - Placeholder text
- `error` (string) - Error message (shows in red if provided)
- `required` (boolean) - Shows red asterisk - default: `false`
- `...rest` - All standard input HTML attributes

**Features**:
- Associated label with required indicator
- Error state styling
- Focus ring on green color

**Usage**:
```jsx
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  required
  error={emailError}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<Input
  label="Password"
  type="password"
  placeholder="Enter password"
/>
```

---

### Modal
**Location**: `src/components/common/Modal.jsx`

**Props**:
- `isOpen` (boolean) - Show/hide modal - required
- `title` (string) - Modal title - required
- `children` (ReactNode) - Modal body content
- `onClose` (function) - Callback when close button clicked - required
- `size` (string) - `'sm' | 'md' | 'lg' | 'xl'` - default: `'md'`

**Features**:
- Dark overlay background
- Close button (X icon)
- Title header
- Responsive sizing
- Auto-scrolls to top when opened

**Usage**:
```jsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  title="Confirm Order"
  onClose={() => setIsOpen(false)}
  size="lg"
>
  <p>Are you sure you want to place this order?</p>
  <Button variant="primary">Confirm</Button>
</Modal>

<Button onClick={() => setIsOpen(true)}>Open Modal</Button>
```

---

### Badge
**Location**: `src/components/common/Badge.jsx`

**Props**:
- `label` (string) - Badge text
- `variant` (string) - `'primary' | 'secondary' | 'danger' | 'warning' | 'success'` - default: `'primary'`
- `size` (string) - `'sm' | 'md' | 'lg'` - default: `'md'`
- `className` (string) - Additional Tailwind classes

**Variants**:
```
primary:    Green background, dark text
secondary:  Gray background, dark text
danger:     Red background, dark text
warning:    Yellow background, dark text
success:    Green background, dark text
```

**Usage**:
```jsx
<Badge label="In Stock" variant="success" />

<Badge label="Pending" variant="warning" size="sm" />

<Badge label="Verified Farmer" variant="primary" size="lg" />
```

---

### Timeline
**Location**: `src/components/common/Timeline.jsx`

**Props**:
- `steps` (array) - Array of step objects

**Step Object Structure**:
```javascript
{
  title: string,           // Required: step title
  completed: boolean,      // Required: is this step done?
  description: string,     // Optional: description text
  timestamp: string        // Optional: date/time string
}
```

**Features**:
- Visual progress indicator
- Completed steps shown in green
- Pending steps in gray
- Vertical line connector between steps

**Usage**:
```jsx
const deliverySteps = [
  { title: 'Order Placed', completed: true, timestamp: '20 Mar, 2:30 PM' },
  { title: 'Confirmed', completed: true, timestamp: '20 Mar, 3:00 PM' },
  { title: 'Shipped', completed: true },
  { title: 'Out for Delivery', completed: false },
  { title: 'Delivered', completed: false },
];

<Timeline steps={deliverySteps} />
```

---

## 📄 Page Components

All page components take no props and manage their own state.

### Home
**Location**: `src/pages/Home.jsx`

**Sections**:
1. Hero - Large headline, CTAs, tagline
2. Search bar - Searchable crop input
3. Featured crops - 4-item grid showcase
4. Features - 4 benefit cards
5. Testimonials - 3 user quotes
6. CTA section - Call to action

**Usage**:
```jsx
import Home from './pages/Home';
// In router
case '/':
  return <Home />;
```

---

### Marketplace
**Location**: `src/pages/Marketplace.jsx`

**Features**:
- Sidebar filters (crop type, price, location)
- 8 crop cards in responsive grid
- Filter toggle on mobile
- Empty state message
- Results count

**Usage**:
```jsx
import Marketplace from './pages/Marketplace';
// In router
case '/marketplace':
  return <Marketplace />;
```

---

### CropDetail
**Location**: `src/pages/CropDetail.jsx`

**Params**: `cropId` (optional, default: 1)

**Sections**:
1. Main image - Large emoji/image display
2. Product info - Name, price, rating, availability
3. Specifications - Size, color, ripeness, shelf life
4. Description - Detailed info
5. Certifications - Badge list
6. Timeline - Delivery steps
7. Reviews - Customer testimonials
8. Order form - Quantity, total, buttons
9. Farmer card - Profile, bio, contact

**Usage**:
```jsx
import CropDetail from './pages/CropDetail';
// In router
case '/crop/:id':
  return <CropDetail cropId={id} />;
```

---

### Login
**Location**: `src/pages/auth/Login.jsx`

**Features**:
- Email input
- Password field with show/hide toggle
- Remember me checkbox
- Forgot password link
- Social login placeholders
- Validation UI

**Usage**:
```jsx
import Login from './pages/auth/Login';
// In router
case '/auth/login':
  return <Login />;
```

---

### Register
**Location**: `src/pages/auth/Register.jsx`

**Features**:
- Role selector (Farmer/Buyer tabs)
- Name, email, phone inputs
- Location field (farmers only)
- Password confirmation
- Terms checkbox
- Form validation

**Usage**:
```jsx
import Register from './pages/auth/Register';
// In router
case '/auth/register':
  return <Register />;
```

---

### FarmerDashboard
**Location**: `src/pages/dashboards/FarmerDashboard.jsx`

**Stats**: Earnings, active listings, sold qty, pending orders

**Tabs**:
1. Overview - Orders table, earnings chart placeholder
2. Add Crop - Form to create new listing
3. Manage Listings - Edit/delete existing crops
4. Orders - Track incoming orders

**Usage**:
```jsx
import FarmerDashboard from './pages/dashboards/FarmerDashboard';
// Protected route (check user.role === 'farmer')
```

---

### BuyerDashboard
**Location**: `src/pages/dashboards/BuyerDashboard.jsx`

**Stats**: Total orders, saved, active, completed

**Tabs**:
1. Active Orders - Current orders with timeline
2. Order History - Past purchases table
3. Wishlist - Saved crops grid

**Usage**:
```jsx
import BuyerDashboard from './pages/dashboards/BuyerDashboard';
// Protected route (check user.role === 'buyer')
```

---

### AdminDashboard
**Location**: `src/pages/dashboards/AdminDashboard.jsx`

**Stats**: Users, listings, pending reviews, revenue

**Tabs**:
1. Overview - Platform summary, quick actions
2. User Management - Users table with actions
3. Listings & Moderation - Pending listings review
4. Orders - Order monitoring table
5. Analytics - Chart placeholders

**Usage**:
```jsx
import AdminDashboard from './pages/dashboards/AdminDashboard';
// Protected route (check user.role === 'admin')
```

---

## 🎛️ Context Hooks

### useAuth()
**Location**: `src/context/AuthContext.jsx`

**Returns**:
```javascript
{
  user: {
    id: string,
    name: string,
    email: string,
    role: 'farmer' | 'buyer' | 'admin',
    phone?: string,
    location?: string,
    verified?: boolean
  } | null,
  login: (userData) => void,
  logout: () => void,
  register: (userData) => void
}
```

**Usage**:
```jsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  if (!user) {
    return <p>Not logged in</p>;
  }
  
  return (
    <>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </>
  );
}
```

---

### useRouter()
**Location**: `src/context/RouterContext.jsx`

**Returns**:
```javascript
{
  currentRoute: string,  // Current path
  navigate: (path: string) => void
}
```

**Usage**:
```jsx
import { useRouter } from './context/RouterContext';

function MyComponent() {
  const { currentRoute, navigate } = useRouter();
  
  return (
    <>
      <p>Current page: {currentRoute}</p>
      <button onClick={() => navigate('/marketplace')}>
        Go to Marketplace
      </button>
    </>
  );
}
```

---

## 🎨 Color Palette

Use Tailwind color utilities in className:

```
Primary Green:     text-green-600, bg-green-600, border-green-600
Dark Green:        text-green-700, bg-green-700
Light Green:       bg-green-50, text-green-50
Gray:              text-gray-600, bg-gray-900, border-gray-200
Red (Danger):      text-red-600, bg-red-600, border-red-500
Yellow (Warning):  text-yellow-500, bg-yellow-100
Blue (Info):       text-blue-600, bg-blue-50
```

**Example**:
```jsx
<div className="bg-green-50 text-green-700 p-4 rounded-lg">
  Success message
</div>
```

---

## 📱 Responsive Breakpoints

Use Tailwind responsive prefixes:

```
sm:  - 640px
md:  - 768px
lg:  - 1024px
xl:  - 1280px
2xl: - 1536px
```

**Example**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 col on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

## 🔍 Component Import Checklist

Copy-paste this for new pages:

```jsx
import { useState } from 'react';
import { ChevronDown, Heart, ShoppingCart } from 'lucide-react'; // Icons
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Timeline from '../../components/common/Timeline';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export default function YourPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Your page content */}
    </div>
  );
}
```

---

**Last Updated**: March 23, 2026
