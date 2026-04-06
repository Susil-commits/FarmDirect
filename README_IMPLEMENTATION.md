# FaRm - Rural Farmer Marketplace

A complete MERN stack application connecting rural farmers directly with buyers, eliminating middlemen and ensuring fair pricing for fresh produce.

## 🚀 Project Structure

### Backend (`/backend`)
- **Technology**: Node.js + Express.js + MongoDB
- **Key Features**:
  - JWT-based authentication with role-based access control
  - Complete REST API for all operations
  - Real-time notifications
  - Multi-farmer order support
  - KYC verification system for farmers
  - Admin dashboard and controls

### Frontend (`/F_1`)
- **Technology**: React 18 + Vite + Tailwind CSS
- **Key Features**:
  - Responsive design optimized for mobile and desktop
  - Context API for state management
  - Custom hooks for common operations
  - Real-time notifications
  - Advanced search and filtering
  - User dashboards (Farmer, Buyer, Admin)

## 📋 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas connection)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (`.env` file already exists):
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

4. Run the development server:
```bash
npm run dev
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd F_1
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (if needed):
```
VITE_API_URL=http://localhost:5000/api
```

4. Run the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🔑 Key Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password

### Crops/Products
- `GET /api/crops` - Get all crops
- `GET /api/crops/:id` - Get crop details
- `POST /api/crops` - Create crop listing (farmer)
- `PUT /api/crops/:id` - Update crop listing (farmer)
- `DELETE /api/crops/:id` - Delete crop listing (farmer)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status

### Reviews
- `POST /api/reviews/:cropId` - Add review
- `GET /api/reviews/crop/:cropId` - Get crop reviews
- `DELETE /api/reviews/:id` - Delete review

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/addresses` - Get saved addresses
- `POST /api/users/address` - Add address

### Admin (Protected Routes)
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/crops` - Get all crops
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/kyc/pending` - Get pending KYC approvals

## 📁 Project Features Implemented

### Backend
- ✅ Complete authentication system with JWT
- ✅ User management (Farmer, Buyer, Admin roles)
- ✅ Crop listing management
- ✅ Order management with multiple items
- ✅ Review and rating system
- ✅ Wishlist functionality
- ✅ Notification system
- ✅ KYC verification for farmers
- ✅ Admin dashboard and controls
- ✅ Error handling middleware
- ✅ Input validation
- ✅ MongoDB integration

### Frontend
- ✅ Authentication pages (Login, Register)
- ✅ Home page with featured products
- ✅ Marketplace with search and filters
- ✅ Product detail page
- ✅ Shopping cart with localStorage
- ✅ Wishlist with localStorage
- ✅ User profile management
- ✅ API service layer
- ✅ Context API for state management
- ✅ Custom hooks (useFetch, useForm, useAuth)
- ✅ Utility functions (formatters, validators)
- ✅ Responsive design with Tailwind CSS

## 🔐 User Roles & Permissions

### Farmer
- Create and manage crop listings
- View orders received
- Manage farm profile and KYC
- View earnings and analytics
- Respond to customer inquiries

### Buyer
- Browse and search products
- Place orders
- Add to wishlist
- Write reviews and ratings
- Track orders
- Manage profile and addresses

### Admin
- Manage all users (suspend, ban)
- Approve/reject crop listings
- Review and approve farmer KYC
- Monitor orders and transactions
- View system analytics
- Send announcements

## 📊 Database Models

- **User**: Account information, roles, KYC status
- **CropListing**: Product details, pricing, images
- **Order**: Order details, items, status tracking
- **Review**: Ratings and feedback on crops
- **Wishlist**: User's saved products
- **Notification**: System and user notifications

## 🛠️ Development Guidelines

### Component Structure
```
src/
├── components/
│   ├── common/ (Button, Card, Input, Modal, etc.)
│   ├── shared/ (Navbar, Footer, Layout)
│   └── [feature]/ (Feature-specific components)
├── pages/ (Page components)
├── context/ (Global state management)
├── hooks/ (Custom React hooks)
├── services/ (API service layer)
└── utils/ (Helper functions, constants)
```

### Best Practices
1. Use custom hooks for API calls
2. Leverage context API for global state
3. Implement error boundaries
4. Use Tailwind CSS for styling
5. Keep components reusable and focused
6. Validate all user inputs
7. Handle loading and error states

## 🚀 Next Steps

### Priority Features to Implement
1. Payment gateway integration (Razorpay)
2. Image upload to Cloudinary
3. Real-time chat between farmers and buyers
4. Advanced search with filters
5. Analytics dashboard for farmers
6. Email notifications
7. SMS notifications for orders
8. Recommendation engine

### Testing
- Write unit tests for utilities
- Write integration tests for API endpoints
- Write component tests with React Testing Library
- E2E testing with Cypress

### Deployment
- Deploy backend to Render/Railway
- Deploy frontend to Vercel
- Setup CI/CD pipeline with GitHub Actions
- Monitor with error tracking service

## 📝 API Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` configuration
- Check if port 5000 is available

### Frontend won't connect to backend
- Ensure backend is running on port 5000
- Check CORS settings in `.env`
- Verify firewall is not blocking connections

### Database connection issues
- Verify MongoDB connection string
- Check network connectivity
- Ensure database user has correct permissions

## 📞 Support

For issues or questions, please create an issue in the repository or contact the development team.

## 📄 License

This project is licensed under the ISC License.

## 🎯 Version

Current Version: 1.0.0 (Beta)

Last Updated: 2024

---

**Made with ❤️ for Rural Farmers**
