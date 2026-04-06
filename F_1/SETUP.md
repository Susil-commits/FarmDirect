# Installation & Setup Instructions

## ⚡ Quick Setup (30 seconds)

```bash
# 1. Install Lucide React icons
npm install lucide-react

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:5173 (or the port shown in terminal)
```

Done! ✅ The marketplace is now running.

---

## 📚 Documentation Files

Read these files in order:

1. **README.md** - Project overview and quick start _(START HERE)_
2. **QUICKSTART.md** - Feature overview and demo instructions
3. **ARCHITECTURE.md** - Complete technical architecture, data models
4. **COMPONENTS.md** - Component API reference with examples _(Developers)_

---

## 🗂️ Project Files Structure

```
F_1/
├── README.md                      # Main project documentation
├── QUICKSTART.md                  # Getting started guide
├── ARCHITECTURE.md                # Technical architecture
├── COMPONENTS.md                  # Component API reference
├── package.json                   # Dependencies (add lucide-react!)
├── index.html                     # HTML entry point
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # Linting configuration
│
└── src/
    ├── App.jsx                    # Main router component
    ├── main.jsx                   # Entry point with providers
    ├── App.css                    # (Legacy - can remove)
    ├── index.css                  # Tailwind directives ✨ Tailwind v4 only
    │
    ├── components/
    │   ├── common/                # Reusable UI components
    │   │   ├── Button.jsx         # ✨ (primary|secondary|danger|outline)
    │   │   ├── Card.jsx           # Container with hover
    │   │   ├── Input.jsx          # Form field with validation
    │   │   ├── Modal.jsx          # Dialog box
    │   │   ├── Badge.jsx          # Status indicator
    │   │   └── Timeline.jsx       # Order tracking
    │   │
    │   └── shared/                # Layout components
    │       ├── Navbar.jsx         # ✨ Sticky header with nav
    │       └── Footer.jsx         # Footer with links
    │
    ├── pages/
    │   ├── Home.jsx               # ✨ Homepage (hero, search, featured)
    │   ├── Marketplace.jsx        # ✨ Browse crops with filters
    │   ├── CropDetail.jsx         # ✨ Single crop + reviews + order form
    │   │
    │   ├── auth/                  # Authentication pages
    │   │   ├── Login.jsx          # ✨ Email/password login
    │   │   └── Register.jsx       # ✨ Farmer/Buyer signup
    │   │
    │   └── dashboards/            # Role-specific dashboards
    │       ├── FarmerDashboard.jsx    # ✨ Stats, listings, orders, earnings
    │       ├── BuyerDashboard.jsx     # ✨ Orders, history, wishlist
    │       └── AdminDashboard.jsx     # ✨ Users, moderation, analytics
    │
    ├── context/                   # State management
    │   ├── AuthContext.jsx        # ✨ Authentication state
    │   └── RouterContext.jsx      # ✨ Client-side routing
    │
    ├── hooks/                     # Custom React hooks (empty - ready for use)
    ├── utils/                     # Helper functions (empty - ready for use)
    └── assets/                    # Images, logos, etc.
```

**Legend**: ✨ = Key file to explore

---

## 🚀 Commands Reference

```bash
# Development
npm run dev              # Start Vite dev server on http://localhost:5173

# Build & Deploy
npm run build           # Create optimized production build
npm run preview         # Preview the production build locally

# Code Quality
npm run lint           # Run ESLint

# Dependencies
npm install            # Install all deps from package.json
npm install lucide-react  # ⚠️ DO THIS FIRST!
```

---

## ✅ What You Get

### Pages Created (9 total)
- [x] Home page (hero, search, featured, features, testimonials, CTA)
- [x] Marketplace (filters, crop grid, responsive)
- [x] Crop Detail (full product page, reviews, order form)
- [x] Login (email, password, remember me, socials)
- [x] Register (role selection, validation)
- [x] Farmer Dashboard (stats, add crop, manage, orders)
- [x] Buyer Dashboard (active orders, history, wishlist)
- [x] Admin Dashboard (users, moderation, orders, analytics)
- [x] Plus partials for CropDetail, Farmer Profile, etc.

### Components Created (14 total)
- [x] Layout: Navbar, Footer
- [x] UI: Button (4 variants), Card, Input, Modal, Badge, Timeline

### Features
- [x] Client-side routing (no external lib)
- [x] Auth state management
- [x] Responsive mobile design
- [x] Tailwind CSS v4 (no CSS files!)
- [x] Lucide React icons
- [x] Agriculture theme (green, earthy colors)
- [x] Multiple user roles (Farmer, Buyer, Admin)

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Run `npm install lucide-react`
2. ✅ Run `npm run dev`
3. ✅ Explore all pages and components
4. ✅ Read ARCHITECTURE.md for full details

### This Week
1. Connect to Express backend (API integration)
2. Implement real authentication (JWT)
3. Integrate MongoDB database
4. Add payment processing (Stripe/Razorpay)

### This Month
1. Real-time updates (Socket.IO)
2. Email notifications
3. File uploads for images
4. Production deployment (Vercel/Netlify)

---

## 🆘 Troubleshooting

**Q: npm run dev fails?**  
A: Make sure Node.js 16+ is installed. Run `node -v` to check.

**Q: Missing icons?**  
A: Run `npm install lucide-react` first!

**Q: Tailwind not styling?**  
A: Check that `index.css` has `@import "tailwindcss";`

**Q: Port 5173 already in use?**  
A: Vite will automatically use the next port (5174, 5175, etc.)

**Q: How to navigate to a page?**  
A: Use `navigate('/path')` from `useRouter()` hook, not `<a>` tags.

---

## 📖 Learning Resources

- [React 19 Docs](https://react.dev)
- [Vite Docs](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Lucide React Icons](https://lucide.dev)

---

## 💾 File Organization Tips

**Adding a new page?**
1. Create `src/pages/MyPage.jsx`
2. Add case in `App.jsx` switch
3. Update `Navbar.jsx` with link
4. Use `useRouter()` to navigate

**Adding a new component?**
1. If reusable → `src/components/common/`
2. If layout → `src/components/shared/`
3. Export default function
4. Accept `className` prop for styling

**Importing correctly?**
- From same folder: `import Button from './Button.jsx'`
- From parent: `import Button from '../../components/common/Button'`
- From root: `import { useAuth } from './context/AuthContext'`

---

## 🎨 Design System Quick Reference

```javascript
// Colors (use in className)
// Primary: bg-green-600, text-green-600, border-green-600
// Success: bg-green-500, text-green-500
// Danger: bg-red-600, text-red-600
// Warning: bg-yellow-500, text-yellow-500
// Neutral: bg-gray-100, text-gray-700

// Spacing
// 8px: 2, 16px: 4, 24px: 6, 32px: 8, 48px: 12

// Breakpoints
// Mobile: default
// Tablet: md:
// Desktop: lg:
// Example: <div className="w-full md:w-1/2 lg:w-1/3">

// Buttons
<Button variant="primary" size="lg">Click me</Button>

// Cards
<Card hover className="p-6">Content here</Card>

// Inputs
<Input label="Email" type="email" required error={errorMsg} />

// Badges
<Badge label="Active" variant="success" size="md" />
```

---

## 📞 Support

- Check **ARCHITECTURE.md** for technical details
- Review **COMPONENTS.md** for component usage
- Examine component source files for examples
- Refer to official Tailwind & React documentation

---

**Happy coding! 🚀 Your farmer marketplace is ready to build!**
