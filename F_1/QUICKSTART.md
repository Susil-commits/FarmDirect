# Quick Start Guide - FarmDirect

## 📦 Installation

### 1. Install Required Dependencies
Run this command to install Lucide React icons (already in package.json are React, Tailwind, Vite):

```bash
npm install lucide-react
```

### 2. Start Development Server
```bash
npm run dev
```

The application will start at `http://localhost:5173` (or the next available port).

---

## 🎯 What's Included

### ✅ Completed Components & Pages

#### Layout Components (shared/)
- ✅ **Navbar** - Sticky header with role-based navigation and mobile menu
- ✅ **Footer** - Complete footer with links and social icons

#### Reusable Components (common/)
- ✅ **Button** - 4 variants (primary, secondary, danger, outline) + 3 sizes
- ✅ **Card** - Container with hover effects
- ✅ **Input** - Form field with label, error state, validation
- ✅ **Modal** - Dialog box with title, body, close button
- ✅ **Badge** - Status indicators (5 variants)
- ✅ **Timeline** - Delivery/order tracking steps

#### Pages
- ✅ **Home** (`/`) - Hero, search, featured crops, features, testimonials, CTA
- ✅ **Marketplace** (`/marketplace`) - Filterable crop listings with sidebar filters
- ✅ **CropDetail** (`/crop/:id`) - Full crop page with reviews, specifications, farmer profile, order form
- ✅ **Login** (`/auth/login`) - Email/password login with social options
- ✅ **Register** (`/auth/register`) - Role-based signup (Farmer/Buyer)
- ✅ **FarmerDashboard** (`/farmer/dashboard`) - 4 tabs: overview, add crop, manage listings, orders
- ✅ **BuyerDashboard** (`/buyer/dashboard`) - 3 tabs: active orders, history, wishlist
- ✅ **AdminDashboard** (`/admin/dashboard`) - 5 tabs: overview, users, listings, orders, analytics

#### System Components
- ✅ **AuthContext** - Global user authentication state
- ✅ **RouterContext** - Client-side routing/navigation
- ✅ **App.jsx** - Main router with page rendering
- ✅ **main.jsx** - Provider setup (Auth + Router)

---

## 🗺️ Navigation Map

Click these links to navigate (after starting the dev server):

1. **Home** → `/`
2. **Marketplace** → `/marketplace`
3. **Crop Details** → `/crop/:id` (click "View Details" on any crop card)
4. **Login** → `/auth/login`
5. **Register** → `/auth/register` (choose Farmer or Buyer)
6. **Farmer Dashboard** (after login as farmer) → `/farmer/dashboard`
7. **Buyer Dashboard** (after login as buyer) → `/buyer/dashboard`
8. **Admin Dashboard** (after login as admin) → `/admin/dashboard`

---

## 💡 Key Features

### Responsive Design
- Mobile-first approach
- Works on all screen sizes (sm: 640px, md: 768px, lg: 1024px)
- Responsive navigation with hamburger menu on mobile

### Agriculture Theme
- Green & earthy color palette (green-600, green-700, gray-900)
- Emoji icons for crops (🌾, 🍅, 🥬, 🥕, etc.)
- Farm-friendly typography and copy

### Multiple User Roles
1. **Farmer**: Can list crops, manage inventory, track orders, view earnings
2. **Buyer**: Can browse, order, track deliveries, save favorites
3. **Admin**: Can manage users, moderate listings, monitor orders, view analytics

### Order Tracking
- Timeline visualization with completed/pending steps
- Delivery status badges (Pending, Accepted, Shipped, Delivered)

### Accessible & Clean UI
- Proper form validation UI
- Keyboard navigation
- Clear visual feedback
- Semantic HTML

---

## 📂 File Organization

```
src/
├── components/common/          # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Modal.jsx
│   ├── Badge.jsx
│   └── Timeline.jsx
├── components/shared/          # Layout components
│   ├── Navbar.jsx
│   └── Footer.jsx
├── context/                    # State management
│   ├── AuthContext.jsx
│   └── RouterContext.jsx
├── pages/                      # Page components
│   ├── Home.jsx
│   ├── Marketplace.jsx
│   ├── CropDetail.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   └── dashboards/
│       ├── FarmerDashboard.jsx
│       ├── BuyerDashboard.jsx
│       └── AdminDashboard.jsx
├── App.jsx                     # Main router
├── main.jsx                    # Entry point
└── index.css                   # Tailwind directives
```

---

## 🔧 Tech Stack

- **React** 19.2.4
- **Vite** 8.0.1
- **Tailwind CSS** 4.2.2 (with @tailwindcss/vite)
- **Lucide React** (icons)
- **No external UI libraries** - Built 100% with Tailwind utilities

---

## 🚀 To Use the Dashboards

Since authentication is client-side only for now, you can simulate login:

1. Open **Login** page → `/auth/login`
2. Instead of real login, go directly to:
   - **As Farmer**: `/farmer/dashboard`
   - **As Buyer**: `/buyer/dashboard`
   - **As Admin**: `/admin/dashboard`

In a real app, these would be protected by authentication middleware.

---

## 📝 Customization

### Change Colors
Edit `src/index.css` or use Tailwind color utilities directly in components.

### Add More Pages
1. Create new file in `src/pages/`
2. Add route in `App.jsx` switch statement
3. Update navigation in `Navbar.jsx`

### Modify Components
All components use **Tailwind utility classes only** - no CSS files. Props control styling variants.

### Add Icons
Import from lucide-react:
```javascript
import { Heart, ShoppingCart, Menu } from 'lucide-react';
```

---

## 🔌 API Integration (Next Step)

Currently, the app is UI-only. To connect to a backend:

1. Create a `services/` folder for API calls
2. Use `fetch()` or `axios` in component useEffect hooks
3. Store data in useState or Context
4. Update loading/error states

Example:
```javascript
useEffect(() => {
  fetch('/api/listings')
    .then(res => res.json())
    .then(data => setListings(data));
}, []);
```

---

## 📊 Data Models (For Backend)

See `ARCHITECTURE.md` for complete data models and API contracts.

---

## 🎯 Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📚 Documentation

- Full architecture docs: `ARCHITECTURE.md`
- Component guide: See each component's props/usage in JSX comments
- Tailwind docs: https://tailwindcss.com
- React docs: https://react.dev

---

## 🤔 FAQ

**Q: Why no React Router?**  
A: Used Context API for simplicity. For a production app, upgrade to React Router v6.

**Q: How to add real authentication?**  
A: Implement JWT tokens in AuthContext's login/logout methods and store in localStorage.

**Q: How to connect to MongoDB?**  
A: Build a Node.js/Express backend with API endpoints. Update fetch calls in components.

**Q: How to style pagination or complex tables?**  
A: Use Tailwind's table classes or integrate TanStack Table (headless table library).

**Q: Can I add dark mode?**  
A: Yes! Tailwind supports `dark:` prefix. Add theme selector in Navbar.

---

## 💬 Support

For issues or questions:
1. Check `ARCHITECTURE.md` for full documentation
2. Review component props in JSX files
3. Refer to Tailwind and React official docs

---

**Happy Farming! 🌾**
