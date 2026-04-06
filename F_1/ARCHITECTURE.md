# FarmDirect - Rural Farmer Marketplace UI/UX Architecture

## 📋 Project Overview

A complete end-to-end MERN stack application connecting farmers directly to buyers without middlemen. The platform includes multiple user roles (Farmer, Buyer, Admin) with specialized dashboards and workflows.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.2.4 with Vite 8.0.1
- **Styling**: Tailwind CSS v4 with @tailwindcss/vite
- **Icons**: Lucide React (add via `npm install lucide-react`)
- **State Management**: React Context API (auth, routing)
- **Backend**: Node.js, Express, MongoDB (to be implemented)
- **Real-time**: Socket.IO (for notifications, order updates)

---

## 📦 Project Structure

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   └── Timeline.jsx
│   └── shared/              # Layout components
│       ├── Navbar.jsx
│       └── Footer.jsx
├── pages/
│   ├── Home.jsx             # Homepage with hero, search, featured
│   ├── Marketplace.jsx      # Browse crops with filters
│   ├── CropDetail.jsx       # Single crop details & reviews
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   └── dashboards/
│       ├── FarmerDashboard.jsx
│       ├── BuyerDashboard.jsx
│       └── AdminDashboard.jsx
├── context/
│   ├── AuthContext.jsx      # Authentication state
│   └── RouterContext.jsx    # Client-side routing
├── hooks/                   # Custom React hooks (future)
├── utils/                   # Helper functions (future)
├── App.jsx                  # Main app router & layout
├── main.jsx                 # Entry point with providers
└── index.css                # Tailwind directives
```

---

## 🎨 Design System

### Color Palette
```
Primary Green:     #16a34a (green-600) - CTAs, success states
Dark Green:        #165a2b (green-700) - Headings, active states
Light Green:       #f0fdf4 (green-50) - Backgrounds
Earth/Neutral:     #f6efe6 - Secondary backgrounds
Text Dark:         #111827 (gray-900) - Body text
Text Light:        #6b7280 (gray-600) - Secondary text
```

### Typography
- **Font Family**: System UI Sans (via Tailwind)
- **Headings**: Bold, sizes 2xl-5xl (24px-48px)
- **Body**: Regular/Medium, 14px-16px
- **Mobile First**: Responsive breakpoints at sm, md, lg

### Component Guidelines
All components use Tailwind utility classes directly (no CSS files). Variants are managed via props:

**Button variants**: primary, secondary, danger, outline  
**Sizes**: sm, md, lg  
**Badge variants**: primary, secondary, danger, warning, success

---

## 🔐 Authentication Flow

### User Roles
1. **Farmer**: Can list crops, manage inventory, track orders, view earnings
2. **Buyer**: Can browse marketplace, place orders, track history, save wishlist
3. **Admin**: Can manage users, moderate listings, monitor orders, view analytics

### Auth Context (src/context/AuthContext.jsx)
```javascript
// User object structure
{
  id: string,
  name: string,
  email: string,
  role: 'farmer' | 'buyer' | 'admin',
  phone?: string,
  location?: string,
  avatar?: string,
  verified?: boolean
}
```

**Methods**:
- `login(userData)` - Authenticate user
- `logout()` - Clear session
- `register(userData)` - Create new account

---

## 🗺️ Routing Architecture

Client-side routing managed via `RouterContext`. URL patterns:

| Path | Component | Role |
|------|-----------|------|
| `/` | Home | All |
| `/marketplace` | Marketplace | All |
| `/crop/:id` | CropDetail | All |
| `/auth/login` | Login | All |
| `/auth/register` | Register | All |
| `/farmer/dashboard` | FarmerDashboard | Farmer |
| `/buyer/dashboard` | BuyerDashboard | Buyer |
| `/admin/dashboard` | AdminDashboard | Admin |

**Navigation**: Use `useRouter()` hook to call `navigate(path)`

---

## 📱 Page Specifications

### Public Pages

#### Home (src/pages/Home.jsx)
- **Hero Section**: Headline, CTA buttons, tagline
- **Search Bar**: Real-time crop search
- **Featured Listings**: 4 crop cards (image, price, farmer, location)
- **Features Grid**: 4 benefit cards (icons, copy)
- **Testimonials**: 3 quotes from users
- **CTA Section**: Encourage sign-up

#### Marketplace (src/pages/Marketplace.jsx)
- **Filters Sidebar**: Crop type, price range, location
- **Crop Cards**: 8 grid layout (responsive 1-2-3 cols)
- **Card Details**: Image, name, price, quantity, farmer, location, rating, buttons
- **Mobile**: Toggle filters via button
- **Search Results**: Show count, empty state

#### CropDetail (src/pages/CropDetail.jsx)
- **Main Image**: Large emoji/image display
- **Product Info**: Name, price, rating, availability
- **Specifications**: Size, color, ripeness, shelf life, storage
- **Description**: Detailed crop information
- **Certifications**: Badges (Organic, Pesticide-Free, etc.)
- **Timeline**: Delivery steps with icons
- **Reviews**: User testimonials with star ratings
- **Farmer Card**: Profile, bio, ratings, contact, view products
- **Order Form**: Quantity selector, total price, add to cart, wishlist

### Authentication Pages

#### Login (src/pages/auth/Login.jsx)
- Email input with validation
- Password field with show/hide toggle
- Remember me checkbox
- Forgot password link
- Social login buttons (Google, GitHub placeholders)
- Sign up link

#### Register (src/pages/auth/Register.jsx)
- Role selector (Buyer / Farmer toggle)
- Name, email, phone, password inputs
- Location field (for farmers)
- Terms & Conditions checkbox
- Form validation UI

### Dashboard Pages

#### Farmer Dashboard (src/pages/dashboards/FarmerDashboard.jsx)
**Stats Cards**: Total earnings, active listings, total sold, pending orders

**Tabs**:
1. **Overview**
   - Recent orders table
   - Monthly earnings chart placeholder

2. **Add Crop**
   - Form: crop name, category, price, quantity, description, harvest date, image upload
   - Buttons: Publish, Save as Draft

3. **Manage Listings**
   - List of active crops with edit/delete buttons
   - Status badge, price, quantity, sold count

4. **Orders**
   - Order tracking with status badges
   - Order ID, crop, farmer, date, status

#### Buyer Dashboard (src/pages/dashboards/BuyerDashboard.jsx)
**Stats Cards**: Total orders, saved items, active orders, completed orders

**Tabs**:
1. **Active Orders**
   - Order cards with farmer info, quantity, amount, date
   - Delivery timeline for each order
   - Contact farmer & track package buttons

2. **Order History**
   - Table: Order ID, crop, quantity, total, date, status (with badges)

3. **Wishlist**
   - Grid of saved crops (2 cols on mobile, responsive)
   - Option to remove or view & order

#### Admin Dashboard (src/pages/dashboards/AdminDashboard.jsx)
**Stats Cards**: Total users, active listings, pending reviews, revenue

**Tabs**:
1. **Overview**
   - Platform summary (active farmers, buyers, transactions)
   - Quick actions buttons

2. **User Management**
   - Table: Name, type (Farmer/Buyer), email, status, joined date, actions
   - View, edit, suspend buttons

3. **Listings & Moderation**
   - Pending listings cards
   - Spam flags highlighted in red
   - Approve/reject buttons with icons

4. **Orders**
   - Order monitoring table: Order ID, farmer, buyer, amount, status, date

5. **Analytics**
   - Chart placeholders (revenue, user growth, transaction volume)
   - Ready for Chart.js or Recharts integration

---

## 🧩 Reusable Components

### Button
Props: `variant` (primary|secondary|danger|outline), `size` (sm|md|lg), `disabled`, `children`

### Card
Props: `children`, `className`, `hover` (shadow on hover)

### Input
Props: `label`, `type`, `placeholder`, `error`, `required`, `...rest`

### Modal
Props: `isOpen`, `title`, `children`, `onClose`, `size` (sm|md|lg|xl)

### Badge
Props: `label`, `variant` (primary|secondary|danger|warning|success), `size` (sm|md|lg)

### Timeline
Props: `steps` (array of {title, completed, description, timestamp})

### Navbar
Props: `user` (object), `onLogout` (fn)
- Responsive mobile menu
- Navigation links based on user role
- Cart & notification badges

### Footer
- Brand info
- Quick links
- Legal links
- Social links

---

## 📊 Data Models (Backend Contracts)

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: 'farmer' | 'buyer' | 'admin',
  location: String,
  avatar: String (URL),
  verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Crop Listing
```javascript
{
  _id: ObjectId,
  farmerId: ObjectId,
  name: String,
  category: String,
  price: Number (₹ per kg),
  quantity: Number (kg available),
  description: String,
  image: String (URL),
  certifications: [String],
  specifications: Object,
  harvestDate: Date,
  rating: Number (0-5),
  reviews: [ObjectId],
  status: 'active' | 'inactive' | 'pending_review',
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  _id: ObjectId,
  buyerId: ObjectId,
  farmerId: ObjectId,
  cropId: ObjectId,
  quantity: Number,
  totalPrice: Number,
  status: 'pending' | 'accepted' | 'shipped' | 'delivered',
  timeline: [
    { event: String, timestamp: Date }
  ],
  deliveryAddress: String,
  paymentMethod: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Review
```javascript
{
  _id: ObjectId,
  cropId: ObjectId,
  userId: ObjectId,
  rating: Number (1-5),
  text: String,
  createdAt: Date
}
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 16+
- npm or yarn

### Steps

1. **Install dependencies**
   ```bash
   npm install
   npm install lucide-react  # For icons
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   npm run preview  # Preview build
   ```

### Environment Variables (future .env)
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📝 State Management Guide

### AuthContext (src/context/AuthContext.jsx)
Global auth state. Use `useAuth()` hook.

```javascript
const { user, login, logout, register } = useAuth();
```

### RouterContext (src/context/RouterContext.jsx)
Client-side routing. Use `useRouter()` hook.

```javascript
const { currentRoute, navigate } = useRouter();
navigate('/marketplace'); // Navigate to page
```

---

## 🔄 Real-Time Features (Future)

### Socket.IO Integration
- Order status updates
- Notifications for:
  - New orders (farmer)
  - Order accepted/rejected (buyer)
  - Delivery updates
  - New messages

**Setup**:
```bash
npm install socket.io-client
```

**Usage**:
```javascript
import io from 'socket.io-client';
const socket = io(import.meta.env.VITE_SOCKET_URL);

// Listen for events
socket.on('order-status-update', (data) => {
  // Update UI
});
```

---

## 🎯 Next Steps for Implementation

### Frontend (Ready to Develop)
- [x] UI components & layouts ✓
- [x] Page templates ✓
- [x] Routing system ✓
- [ ] Form validation (Zod or Yup)
- [ ] State management for cart (Context or Zustand)
- [ ] API integration (fetch / axios)
- [ ] Error handling & loading states
- [ ] Dark mode (Tailwind)
- [ ] Animations (Framer Motion optional)

### Backend (To Be Built)
- [ ] Node.js + Express server
- [ ] MongoDB database setup
- [ ] Authentication (JWT, bcrypt)
- [ ] RESTful API endpoints
- [ ] File uploads (images)
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Email notifications
- [ ] Socket.IO for real-time updates

### DevOps & Deployment
- [ ] Docker setup
- [ ] GitHub Actions CI/CD
- [ ] Vercel/Heroku deployment
- [ ] Database hosting (MongoDB Atlas)
- [ ] CDN for images (Cloudinary)

---

## 🎨 Design Tokens & Accessibility

### Spacing Scale
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

### Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

### Accessibility
- All buttons have focus states (ring-2 focus)
- Form inputs have associated labels
- Images have alt text
- Semantic HTML (buttons, inputs, nav)
- Color contrast WCAG AA compliant
- Mobile-first responsive design

---

## 📚 Resources & Documentation

- [Tailwind CSS v4 Docs](https://tailwindcss.com)
- [React Docs](https://react.dev)
- [Vite Docs](https://vite.dev)
- [Lucide React Icons](https://lucide.dev)
- [React Context API](https://react.dev/reference/react/useContext)

---

## 📝 Notes for Developers

1. **All styling uses Tailwind utilities in JSX** - no CSS files needed
2. **Icons**: Import from `lucide-react` (e.g., `import { Heart } from 'lucide-react'`)
3. **Responsive**: Use Tailwind breakpoints (hidden md:flex, grid-cols-1 md:grid-cols-2)
4. **Colors**: Use Tailwind color tokens (green-600, gray-900, etc.)
5. **Navigation**: Always use `navigate()` from `useRouter()`, not `<a>` tags
6. **Strict naming**: Component files are PascalCase, utility files are camelCase
7. **API calls**: Will be added to components via fetch/axios (placeholder comments)

---

## 🤝 Contributing

1. Create feature branches
2. Follow the component structure
3. Test responsive design on mobile, tablet, desktop
4. Use semantic HTML
5. Add comments for complex logic

---

**Last Updated**: March 23, 2026  
**Version**: 1.0.0 - Initial UI/UX Architecture
