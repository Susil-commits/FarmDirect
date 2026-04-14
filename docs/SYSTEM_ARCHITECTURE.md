# Rural Farmer Marketplace - Complete System Architecture

## 1. Overview

A MERN-based platform connecting farmers directly with buyers, eliminating middlemen and enabling fair-trade agricultural commerce.

**Tech Stack:**
- **Frontend:** React 18+ with Vite, Context API/Redux for state management
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Atlas/Local)
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.io (WebSockets)
- **API:** RESTful with JSON

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Frontend)                     │
│  React App (SPA) - Components, Pages, Context, Routing          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   API GATEWAY & MIDDLEWARE                      │
│  JWT Auth | CORS | Validation | Error Handling | Rate Limiting  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               APPLICATION LAYER (Backend Server)                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Controllers│  │  Services  │  │  Middleware│                │
│  └────────────┘  └────────────┘  └────────────┘                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │   Routes   │  │   Models   │  │ Validators │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (MongoDB)                        │
│  Collections: User, Crop, Order, Review, Notification, etc.    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES                                    │
│  Email Service | SMS (Twilio) | File Storage (S3/Cloudinary)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Project Folder Structure

### Backend Structure
```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   ├── env.js             # Environment variables
│   └── constants.js       # App constants
├── controllers/
│   ├── authController.js
│   ├── cropController.js
│   ├── orderController.js
│   ├── userController.js
│   ├── reviewController.js
│   ├── notificationController.js
│   ├── adminController.js
│   └── wishlistController.js
├── models/
│   ├── User.js
│   ├── Crop.js
│   ├── Order.js
│   ├── Review.js
│   ├── Notification.js
│   ├── Category.js
│   └── Wishlist.js
├── routes/
│   ├── authRoutes.js
│   ├── cropRoutes.js
│   ├── orderRoutes.js
│   ├── userRoutes.js
│   ├── reviewRoutes.js
│   ├── notificationRoutes.js
│   ├── adminRoutes.js
│   └── wishlistRoutes.js
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── authorization.js   # Role-based access
│   ├── validation.js      # Input validation
│   ├── errorHandler.js    # Error handling
│   └── upload.js          # File upload
├── utils/
│   ├── jwt.js             # JWT helper functions
│   ├── password.js        # Password hashing
│   ├── email.js           # Email notifications
│   ├── validation.js      # Validation schemas
│   ├── logger.js          # Logging
│   └── constants.js       # Constants
├── socket/
│   └── socketHandler.js   # WebSocket handlers
├── server.js              # Main entry point
├── package.json
└── .env                   # Environment variables
```

### Frontend Structure
```
F_1/src/
├── pages/
│   ├── Home.jsx
│   ├── Marketplace.jsx
│   ├── CropDetail.jsx
│   ├── ShoppingCart.jsx
│   ├── UserProfile.jsx
│   ├── Wishlist.jsx
│   ├── OrderTracking.jsx
│   ├── Notifications.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   └── dashboards/
│       ├── FarmerDashboard.jsx
│       ├── BuyerDashboard.jsx
│       └── AdminDashboard.jsx
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Pagination.jsx
│   │   └── Toast.jsx
│   ├── shared/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Sidebar.jsx
│   │   └── RoleBasedNav.jsx
│   ├── farmer/
│   │   ├── AddCropForm.jsx
│   │   ├── ManageCrops.jsx
│   │   ├── OrderRequest.jsx
│   │   └── EarningsChart.jsx
│   ├── buyer/
│   │   ├── CropCard.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── SearchBar.jsx
│   │   └── ReviewForm.jsx
│   ├── admin/
│   │   ├── UserManagement.jsx
│   │   ├── ListingModeration.jsx
│   │   ├── Analytics.jsx
│   │   └── OrderMonitoring.jsx
│   ├── AdvancedSearch.jsx
│   ├── ProductReviews.jsx
│   └── PageTransition.jsx
├── context/
│   ├── AuthContext.jsx
│   ├── CartContext.jsx
│   ├── WishlistContext.jsx
│   ├── NotificationContext.jsx
│   └── ToastContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useCart.js
│   ├── useFetch.js
│   ├── useForm.js
│   └── useLocalStorage.js
├── services/
│   ├── api.js             # Axios instance & base requests
│   ├── authService.js
│   ├── cropService.js
│   ├── orderService.js
│   ├── userService.js
│   ├── reviewService.js
│   └── notificationService.js
├── utils/
│   ├── constants.js
│   ├── validation.js
│   ├── formatters.js
│   ├── storage.js
│   └── permissions.js
├── styles/
│   ├── App.css
│   ├── index.css
│   └── theme.css
├── routes/
│   └── ProtectedRoute.jsx
├── App.jsx
├── main.jsx
└── index.css
```

---

## 4. User Roles & Permissions

### Three Core Roles:

**1. Farmer**
- Register farm details
- Add/edit/delete crops
- Manage inventory
- Receive and manage orders
- Accept/reject orders
- Track earnings
- View analytics
- Manage farm profile and location

**2. Buyer**
- Browse and search crops
- Filter by location, price, category
- View crop details and reviews
- Add to wishlist and cart
- Place orders
- Track order status
- Rate and review purchases
- View order history
- Manage delivery address

**3. Admin**
- User management (approve farmers, manage accounts)
- Listing moderation (approve/reject crops)
- Order monitoring
- Analytics and reporting
- Dispute resolution
- Content management
- System monitoring
- Generate reports

---

## 5. Core Modules

### 5.1 Authentication Module
- User registration with role selection
- Email/phone verification
- JWT-based login
- Password reset/change
- Session management
- OAuth optional (Google, Facebook)

### 5.2 User Profile Module
- Profile creation and updates
- Address management (multiple addresses)
- Contact preferences
- Bank account details (for farmers)
- KYC verification (for farmers)
- Profile picture uploads

### 5.3 Crop Management Module
- Add/edit/delete crops
- Stock/inventory tracking
- Pricing management
- Image uploads (multiple images)
- Category and tags
- Batch management
- Seasonal crops

### 5.4 Marketplace Module
- Browse with pagination
- Advanced search & filters
- Category browsing
- Location-based filtering
- Price range filters
- Sorting options
- Wishlist management

### 5.5 Order Management Module
- Create orders
- Order status tracking
- Order history
- Order cancellation
- Return/refund handling
- Bulk order support
- Order confirmation

### 5.6 Delivery Module
- Multiple delivery modes (pickup/delivery)
- Pickup location management
- Delivery tracking
- Order timeline
- Delivery address management
- Delivery scheduling

### 5.7 Notification Module
- Email notifications
- SMS alerts
- In-app notifications
- Order status updates
- Marketing notifications
- Preference settings

### 5.8 Review & Rating Module
- Crop reviews (1-5 stars)
- Farmer reviews
- Review moderation (admin)
- Helpful votes
- Review images/videos
- Response to reviews

### 5.9 Admin Module
- User management dashboard
- Listing moderation panel
- Analytics dashboard
- Order monitoring
- Revenue tracking
- Report generation
- Settings management

### 5.10 Cart & Wishlist Module
- Add/remove items
- Persist cart (local + DB)
- Bulk operations
- Cart sharing
- Wishlist management

---

## 6. Authentication & Security

### JWT Token Structure
```json
{
  "userId": "mongo_id",
  "email": "user@example.com",
  "role": "farmer | buyer | admin",
  "farmerId": "farm_id (optional)",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Security Measures
- Password hashing with bcrypt (salt rounds: 10)
- CORS enabled for frontend domain
- Rate limiting on auth endpoints
- Helmet.js for HTTP headers
- SQL/NoSQL injection prevention
- XSS protection
- CSRF tokens for state-changing operations
- Environment variables for secrets
- HTTPS only in production

---

## 7. Database Collections Overview

**User**
- ID, Role, Email, Phone, Location, Verified Status, KYC Status

**Crop**
- ID, FarmerID, Name, Category, Price, Quantity, Images, Description, Ratings, Status

**Order**
- ID, BuyerID, FarmerID, CropID, Quantity, Total Price, Status, Timeline

**Review**
- ID, BuyerID, FarmerID/CropID, Rating, Comment, Images, Verified Purchase

**Notification**
- ID, UserID, Type, Status, Content, Read Status

**Wishlist**
- ID, UserID, CropIDs, Created Date

**Category**
- ID, Name, Description, Icon

---

## 8. API Communication Flow

### Request/Response Pattern
```
Client Request
    ↓
Express Router
    ↓
Auth Middleware (verify JWT)
    ↓
Authorization Middleware (check role)
    ↓
Validation Middleware (validate input)
    ↓
Controller (business logic)
    ↓
Model (database operation)
    ↓
Response with status code & data
```

### Response Format
```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

---

## 9. Frontend State Management

### Using React Context API:
- **AuthContext:** User auth state, login/logout
- **CartContext:** Shopping cart items, totals
- **WishlistContext:** Saved crops
- **NotificationContext:** Toast notifications, alerts
- **AppContext:** Global app settings, theme

### State Persistence:
- LocalStorage for cart and wishlist
- SessionStorage for temporary data
- IndexedDB for offline support (optional)

---

## 10. Real-time Features (WebSockets)

### Socket.io Integration
- Order status updates
- Live notifications
- Typing indicators (for support chat)
- Inventory updates
- Admin alerts

```javascript
// Example: Order Status Update
socket.on('order:status-changed', (orderData) => {
  // Update UI with new order status
});

socket.emit('notification:read', { notificationId });
```

---

## 11. File Upload & Storage

**Supported File Types:**
- Images: JPG, PNG, WebP (max 5MB)
- Documents: PDF (max 10MB)

**Storage Options:**
- Cloudinary for images (recommended)
- AWS S3 alternative
- Local storage (development)

---

## 12. Error Handling Strategy

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Validation Error
- 500: Server Error

### Error Response Format
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 13. Performance Optimization

- Pagination (default 10-20 items per page)
- Index database fields (email, farmerId, cropId)
- Caching with Redis (optional)
- Image optimization and CDN
- Code splitting in React
- Lazy loading of routes
- Compression of responses
- Database query optimization

---

## 14. Deployment Architecture

```
┌─────────────────────────────────────────┐
│  Vercel / Netlify (Frontend Deployment) │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────────┐  ┌──────▼────────┐
│ Render / Railway │  │  MongoDB Atlas │
│ (Backend Server) │  │   (Database)   │
└──────────────────┘  └────────────────┘
        │
        └────────────────────┬────────────┐
                             │            │
                      ┌──────▼────┐  ┌───▼────────┐
                      │ Cloudinary│  │ SendGrid/  │
                      │ (Images)  │  │ Twilio     │
                      └───────────┘  │ (Comms)    │
                                     └────────────┘
```

---

## 15. Development Workflow

1. **Local Development:** npm run dev
2. **Testing:** npm test
3. **Building:** npm run build
4. **Linting:** npm run lint
5. **Deployment:** Git push → Auto-deploy via CI/CD

---

## 16. Key Features Summary

✅ **User Management:** Registration, profiles, role-based access
✅ **Crop Marketplace:** Browse, search, filter, review
✅ **Order System:** Full lifecycle management with tracking
✅ **Payment Ready:** Stripe/Razorpay integration ready
✅ **Notifications:** Real-time updates via email/SMS/in-app
✅ **Admin Panel:** Complete user and content moderation
✅ **Analytics:** Seller earnings, order statistics
✅ **Responsive Design:** Mobile-first approach
✅ **Security:** JWT, encryption, validation
✅ **Scalability:** Modular architecture, database indexing

---

## 17. Next Steps

1. Review and customize this architecture for your needs
2. Set up environment variables and database
3. Implement authentication module first
4. Build core API endpoints
5. Create React components and pages
6. Integrate frontend with backend
7. Add real-time features
8. Testing and deployment

This architecture provides a solid foundation for a production-ready MERN marketplace application.
