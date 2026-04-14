# 🌾 FaRm - Direct Farmer to Consumer Marketplace

> **Fresh Produce, Better Prices** — Buy directly from local farmers with zero middlemen!

[![GitHub License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

---

## 📋 Quick Navigation

### 👥 For Users
- **[Getting Started Guide](docs/QUICK_START_GUIDE.md)** - Start shopping and selling
- **[Features Overview](docs/FEATURES_CHECKLIST.md)** - What FaRm offers
- **[System Architecture](docs/SYSTEM_ARCHITECTURE.md)** - How it works

### 💳 Payment & Orders
- **[COD Workflow Documentation](docs/COD_WORKFLOW_DOCUMENTATION.md)** - Complete COD system guide
- **[Order Lifecycle & API](docs/IMPLEMENTATION_SUMMARY_COD.md)** - Backend implementation details
- **[Order Management](docs/ORDER_LIFECYCLE.md)** - Order tracking and status

### 🔧 Development
- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)** - Features implemented
- **[Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)** - UI/UX structure
- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - API integration

### 🏢 Admin & Operations
- **[Admin Dashboard Redesign](docs/ADMIN_DASHBOARD_REDESIGN.md)** - Admin features
- **[Verification Flow](docs/VERIFICATION_FLOW_DOCUMENTATION.md)** - Verification system
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Data model

---

## ✨ Key Features

### 🏪 For Buyers
✅ **Browse Fresh Produce** - Certified farmers listing their products
✅ **Best Prices** - Direct from farmers = no middlemen markup
✅ **Secure Checkout** - Cash on Delivery (COD) with verification
✅ **Order Tracking** - Real-time delivery updates
✅ **Quality Guarantee** - Farmer ratings and reviews
✅ **Fast Delivery** - 3-5 days standard, 1-2 days express

### 👨‍🌾 For Farmers
✅ **Sell Direct** - No commission to middlemen
✅ **Reach More Buyers** - Digital marketplace access
✅ **Fair Pricing** - Set your own prices
✅ **Order Management** - Simple dashboard
✅ **Build Trust** - Customer reviews and ratings
✅ **Premium Features** - Enhanced visibility with premium membership

### 🛡️ For Admin
✅ **Order Verification** - Call verification system
✅ **Admin Approval** - Two-step order confirmation
✅ **Charges & Fines** - Manage penalties for violations
✅ **Dispute Resolution** - Built-in fine system with rating impact
✅ **Complete Audit Trail** - All transactions logged
✅ **Analytics Dashboard** - Order and user metrics

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- React 18+
- npm or yarn

### Quick Setup

```bash
# Clone repository
git clone https://github.com/yourname/FaRm.git
cd FaRm

# Backend Setup
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend Setup (in new terminal)
cd F_1
npm install
npm run dev
```

For detailed setup instructions, see [Backend Setup](backend/BACKEND_SETUP.md) and [Frontend Setup](F_1/SETUP.md)

---

## 💳 Payment System: Cash on Delivery (COD)

### How It Works

1. **Place Order** → Customer adds items and checks out
2. **Verification Call** → Our team calls to verify address & details
3. **Admin Approval** → Admin reviews and approves order
4. **Delivery** → Order shipped with tracking
5. **Payment** → Customer pays at doorstep (COD)
6. **Additional Charges** → Optional charges for issues (doesn't affect rating)
7. **Fines** → Serious violations result in fines AND rating reduction

### Key Features
- ✅ No online payment required upfront
- ✅ Phone verification for authenticity
- ✅ Admin approval for added security
- ✅ Flexible charge system for damage/returns
- ✅ Rating-based fine system for violations

👉 **[Learn more about COD Workflow](docs/COD_WORKFLOW_DOCUMENTATION.md)**

---

## 📁 Documentation Index

| Document | Purpose |
|----------|---------|
| [Quick Start](docs/QUICK_START_GUIDE.md) | Get started in 5 minutes |
| [COD Workflow](docs/COD_WORKFLOW_DOCUMENTATION.md) | Complete Payment system guide |
| [Implementation Summary](docs/IMPLEMENTATION_SUMMARY_COD.md) | Technical implementation details |
| [Features Checklist](docs/FEATURES_CHECKLIST.md) | All implemented features |
| [System Architecture](docs/SYSTEM_ARCHITECTURE.md) | Backend & frontend architecture |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Data models and relationships |
| [API Specification](docs/API_SPECIFICATION.md) | REST API endpoints |
| [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md) | React components & structure |
| [Admin Dashboard](docs/ADMIN_DASHBOARD_REDESIGN.md) | Admin panel features |
| [Verification System](docs/VERIFICATION_FLOW_DOCUMENTATION.md) | KYC & verification |
| [Order Lifecycle](docs/ORDER_LIFECYCLE.md) | Order tracking system |
| [Integration Guide](docs/INTEGRATION_GUIDE.md) | How to integrate APIs |
| [Implementation Status](docs/IMPLEMENTATION_STATUS.md) | Current development status |

👉 **[View all docs](docs/)** | **[Detailed Index](docs/MASTER_DOCUMENTATION_INDEX.md)**

---

## 🏗️ Project Structure

```
FaRm/
├── backend/
│   ├── config/          # Database & environment config
│   ├── controllers/     # Route handlers & business logic
│   ├── middleware/      # Authentication, validation, error handling
│   ├── models/          # Mongoose schemas (User, Order, Crop, etc)
│   ├── routes/          # API route definitions
│   ├── utils/           # Helper functions (JWT, password, etc)
│   ├── server.js        # Express server entry point
│   └── package.json
│
├── F_1/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context APIs
│   │   ├── hooks/       # Custom React hooks
│   │   ├── config/      # Frontend config
│   │   ├── constants/   # Constants & enums
│   │   ├── styles/      # CSS files
│   │   ├── utils/       # Utility functions
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # React entry point
│   ├── public/          # Static assets
│   ├── package.json
│   └── vite.config.js
│
└── docs/                # All documentation files
    ├── COD_WORKFLOW_DOCUMENTATION.md
    ├── IMPLEMENTATION_SUMMARY_COD.md
    ├── QUICK_START_GUIDE.md
    ├── [...more docs]
    └── README.md        # This file
```

---

## 🔐 Security Features

### Authentication
- ✅ JWT token-based auth
- ✅ Secure password hashing (bcrypt)
- ✅ Role-based access control (RBAC)
- ✅ Protected API endpoints
- ✅ Request validation & sanitization

### Payment Security
- ✅ COD verification system
- ✅ Admin approval required
- ✅ Complete audit trail
- ✅ Zero online payment risk
- ✅ All transactions logged

### Data Protection
- ✅ MongoDB encryption
- ✅ CORS enabled
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Validation:** Joi

### Frontend
- **Library:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** Context API + React Hooks
- **HTTP Client:** Fetch API
- **Icons:** Lucide React

### DevOps
- **Version Control:** Git
- **Package Manager:** npm/yarn
- **Environment:** .env configuration

---

## 📊 Current Status

### Phase 1: ✅ Complete
- Authentication system
- User profiles (Buyer & Farmer)
- Product listing
- Cart functionality
- Basic order system

### Phase 2: ✅ Complete
- React Query integration
- Cache management
- Advanced search
- Filtering & sorting
- Performance optimization

### Phase 3: ✅ Complete
- Onboarding flow
- KYC verification
- Premium membership
- Email notifications

### Phase 4: ✅ Complete (Current)
- **COD Payment System** (NEW)
  - Verification call workflow
  - Admin approval system
  - Charges & fines system
  - Complete audit trail
  - Order tracking UI

---

## 🚄 Recent Updates (Sprint 4)

### 🎯 Cash on Delivery (COD) System - IMPLEMENTED
✅ Removed all payment methods except COD
✅ Verification call workflow for all orders
✅ Admin approval system (approve/reject/hold)
✅ Additional charges for operational costs
✅ Fine system with buyer rating reduction
✅ Complete payment tracking
✅ Order status timeline
✅ Admin management dashboard

### Components Added
- `OrderStatusTracker.jsx` - Buyer-facing order timeline
- `AdminOrderManagement.jsx` - Admin control panel

### APIs Added
- `PUT /api/orders/:id/verification-call`
- `PUT /api/orders/:id/admin-approval`
- `PUT /api/orders/:id/additional-charges`
- `PUT /api/orders/:id/issue-fine`
- `PUT /api/orders/:id/payment-received`

### Documentation Created
- Complete COD workflow documentation
- Implementation summary with examples
- Admin operation guide

---

## 📈 Usage Statistics (Sample)

```
Total Users: 1000+
Active Farmers: 250+
Monthly Orders: 5000+
Average Order Value: ₹800
Customer Satisfaction: 4.5/5.0 ⭐
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Workflow
```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

---

## 🐛 Reporting Issues

Found a bug? Have a suggestion? Open an issue on [GitHub Issues](https://github.com/yourname/FaRm/issues)

**Please include:**
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Your environment (OS, Node version, etc)

---

## 📞 Support & Help

### Documentation
- 📚 [Full Documentation Index](docs/MASTER_DOCUMENTATION_INDEX.md)
- 🚀 [Quick Start Guide](docs/QUICK_START_GUIDE.md)
- 💻 [API Documentation](docs/API_SPECIFICATION.md)

### Contact
- **Email:** support@farmdirect.com
- **Issues:** [GitHub Issues](https://github.com/yourname/FaRm/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourname/FaRm/discussions)

---

## 📄 License

This project is licensed under the ISC License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ for Indian farmers and consumers
- Icons by [Lucide React](https://lucide.dev)
- UI powered by [Tailwind CSS](https://tailwindcss.com)
- Database by [MongoDB](https://mongodb.com)

---

## 🚀 Roadmap

### Q2 2025
- [ ] Payment gateway integration (optional backup)
- [ ] SMS/Email notifications
- [ ] Automated reminders
- [ ] Analytics dashboard

### Q3 2025
- [ ] Mobile app (React Native)
- [ ] Live chat support
- [ ] Advanced search with ML
- [ ] Subscription boxes

### Q4 2025
- [ ] Voice ordering (Hindi support)
- [ ] Blockchain integration for trust
- [ ] International expansion
- [ ] B2B marketplace

---

## 📊 Quick Links

| Link | Purpose |
|------|---------|
| [GitHub](https://github.com/yourname/FaRm) | Source code |
| [Issues](https://github.com/yourname/FaRm/issues) | Bug reports & features |
| [Wiki](https://github.com/yourname/FaRm/wiki) | Community help |
| [Website](https://farmdirect.com) | Live platform |

---

**Made with 🌾 by the FaRm Team**

*Last Updated: April 2025 | Version 1.0 | Production Ready* ✅

---

### Quick Start Commands

```bash
# Development
npm run dev

# Testing
npm run test

# Build
npm run build

# Deploy
npm run deploy

# Lint
npm run lint

# Format
npm run format
```

---

**Questions?** Check the [documentation](docs/) or open an issue on GitHub!

