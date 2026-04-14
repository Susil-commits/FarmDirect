# Role-Based Access Control (RBAC) & Permission Matrix

## 1. Role Hierarchy

```
ADMIN (Super Admin)
  └─ Can manage all aspects of the platform
  
FARMER
  └─ Can manage own crops and orders
  
BUYER
  └─ Can browse and purchase crops
```

---

## 2. Permission Matrix

### Legend
- ✅ = Full Access
- ⚠️ = Own Only (can access/modify only own data)
- ❌ = No Access
- 🔐 = With Approval

### 2.1 User Management

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| View other profiles | ❌ | ✅ (limited) | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Approve farmer KYC | ❌ | ❌ | ✅ |
| Reject farmer KYC | ❌ | ❌ | ✅ |
| Suspend user account | ❌ | ❌ | ✅ |
| Delete user account | ❌ | ❌ | ✅ (with reason) |
| View user activity | ❌ | ❌ | ✅ |
| Assign user role | ❌ | ❌ | ✅ |
| Bulk user operations | ❌ | ❌ | ✅ |

### 2.2 Crop/Product Management

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| Create crop listing | ✅ | ❌ | ✅ (impersonate) |
| View own crops | ✅ | ❌ | ✅ |
| Edit own crops | ✅ | ❌ | ✅ (if approved) |
| Delete own crops | ✅ | ❌ | ✅ (with reason) |
| View all crops | ❌ | ✅ | ✅ |
| View pending crops | ❌ | ❌ | ✅ |
| Approve crop listing | ❌ | ❌ | ✅ |
| Reject crop listing | ❌ | ❌ | ✅ |
| Feature crop | ❌ | ❌ | ✅ |
| Mark as sold out | ✅ | ❌ | ✅ |
| Modify crop price | ✅ | ❌ | ❌ |
| Bulk upload crops | ✅ | ❌ | ✅ |
| Export crop data | ✅ (own) | ❌ | ✅ |

### 2.3 Order Management

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| Create order | ❌ | ✅ | ⚠️ (for buyer) |
| View own orders | ✅ (received) | ✅ (placed) | ✅ |
| View all orders | ❌ | ❌ | ✅ |
| Accept order | ✅ | ❌ | ❌ |
| Reject order | ✅ | ❌ | ❌ |
| Update order status | ✅ (own) | ❌ | ✅ |
| Cancel order | ❌ | ✅ (own, before acceptance) | ✅ |
| Provide shipping details | ✅ | ❌ | ✅ |
| Track order | ✅ (received) | ✅ (placed) | ✅ |
| Confirm delivery | ❌ | ✅ | ✅ |
| Modify order | ❌ | ✅ (pending only) | ✅ |
| Issue refund | ❌ | ❌ | ✅ |
| Bulk process orders | ❌ | ❌ | ✅ |
| Export orders | ✅ (own) | ✅ (own) | ✅ |

### 2.4 Review & Rating

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| Create review | ❌ | ✅ (verified purchase) | ❌ |
| View reviews | ✅ (on crops) | ✅ (all) | ✅ |
| Edit own review | ❌ | ✅ (within 30 days) | ❌ |
| Delete own review | ❌ | ✅ | ✅ (with reason) |
| Respond to review | ✅ (farmer) | ❌ | ✅ |
| Report review as spam | ❌ | ✅ | ✅ |
| Approve review | ❌ | ❌ | ✅ |
| Reject review | ❌ | ❌ | ✅ |
| Flag inappropriate review | ❌ | ✅ | ✅ |
| View review analytics | ✅ (own crops) | ❌ | ✅ |

### 2.5 Payment & Transactions

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| Initiate payment | ❌ | ✅ | ❌ |
| View own transactions | ✅ (earnings) | ✅ (payments) | ✅ |
| Process refund | ❌ | ❌ | ✅ |
| Issue credit | ❌ | ❌ | ✅ |
| View payment history | ✅ (own) | ✅ (own) | ✅ |
| Modify transaction | ❌ | ❌ | ✅ (admin only) |
| Export billing data | ✅ (own) | ✅ (own) | ✅ |
| Configure payment methods | ❌ | ✅ | ✅ |
| View revenue reports | ✅ (own) | ❌ | ✅ |

### 2.6 Notifications

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| View own notifications | ✅ | ✅ | ✅ |
| Mark as read | ✅ | ✅ | ✅ |
| Delete notification | ✅ | ✅ | ✅ |
| Configure preferences | ✅ | ✅ | ✅ |
| Send notification | ❌ | ❌ | ✅ |
| Broadcast notification | ❌ | ❌ | ✅ |
| Schedule notification | ❌ | ❌ | ✅ |

### 2.7 Admin Features

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| Access admin dashboard | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |
| Generate reports | ❌ | ❌ | ✅ |
| Manage categories | ❌ | ❌ | ✅ |
| Manage FAQs | ❌ | ❌ | ✅ |
| Manage promotions | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| Manage content | ❌ | ❌ | ✅ |
| Configure settings | ❌ | ❌ | ✅ |
| Manage support tickets | ❌ | ❌ | ✅ |
| Send announcement | ❌ | ❌ | ✅ |
| Manage complaints | ❌ | ❌ | ✅ |
| Resolve disputes | ❌ | ❌ | ✅ |

### 2.8 Wishlist & Cart

| Action | Farmer | Buyer | Admin |
|--------|--------|-------|-------|
| Create wishlist | ❌ | ✅ | ❌ |
| Add to wishlist | ❌ | ✅ | ❌ |
| Remove from wishlist | ❌ | ✅ | ❌ |
| View own wishlist | ❌ | ✅ | ❌ |
| Create cart | ❌ | ✅ | ❌ |
| Add to cart | ❌ | ✅ | ❌ |
| Clear cart | ❌ | ✅ | ❌ |
| Share wishlist | ❌ | ✅ | ❌ |

---

## 3. API Route Protection

### Authentication Required Routes

#### Public Routes (No Auth)
```javascript
// Auth Routes
POST   /auth/register
POST   /auth/login
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email

// Browse Routes
GET    /crops
GET    /crops/:cropId
GET    /reviews/crop/:cropId
GET    /reviews/farmer/:farmerId
```

#### Authenticated Routes
```javascript
// Requires valid JWT token
Protected: All POST, PUT, DELETE requests
Protected: All user/profile routes
Protected: All dashboard routes
```

---

## 4. Role-Based Route Protection Middleware

### Implementation Example

```javascript
// middleware/authorization.js

// Check if user has specific role
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient permissions' 
      });
    }
    
    next();
  };
};

// Check if user owns the resource
const authorizeOwner = async (req, res, next) => {
  const resource = await getResource(req.params.id);
  
  if (resource.userId !== req.user.id &&amp; req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden: You do not own this resource' 
    });
  }
  
  next();
};

// Module exports
module.exports = {
  authorizeRole,
  authorizeOwner
};
```

### Route Protection Examples

```javascript
// src/routes/cropRoutes.js

router.post('/crops', 
  authenticate,                    // Verify JWT
  authorizeRole('farmer', 'admin'), // Only farmers and admins
  validate(cropSchema),            // Validate input
  uploadImages,                    // Handle file upload
  cropController.createCrop        // Controller
);

router.put('/crops/:cropId',
  authenticate,
  authorizeRole('farmer', 'admin'),
  authorizeOwner,                  // User must own crop
  validate(cropSchema),
  uploadImages,
  cropController.updateCrop
);

router.delete('/crops/:cropId',
  authenticate,
  authorizeRole('farmer', 'admin'),
  authorizeOwner,
  cropController.deleteCrop
);
```

---

## 5. Frontend Route Protection

### React Router Protection Component

```javascript
// src/routes/ProtectedRoute.jsx

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = [] 
}) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

export default ProtectedRoute;
```

### Route Configuration

```javascript
// src/App.jsx or routes.jsx

const routes = [
  // Public Routes
  { path: '/', element: <Home /> },
  { path: '/marketplace', element: <Marketplace /> },
  { path: '/crops/:id', element: <CropDetail /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  
  // Protected: Farmer Only
  {
    path: '/farmer/dashboard',
    element: (
      <ProtectedRoute requiredRole="farmer">
        <FarmerDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/farmer/crops',
    element: (
      <ProtectedRoute requiredRole="farmer">
        <ManageCrops />
      </ProtectedRoute>
    )
  },
  
  // Protected: Buyer Only
  {
    path: '/buyer/dashboard',
    element: (
      <ProtectedRoute requiredRole="buyer">
        <BuyerDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/buyer/orders',
    element: (
      <ProtectedRoute requiredRole="buyer">
        <MyOrders />
      </ProtectedRoute>
    )
  },
  
  // Protected: Admin Only
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute requiredRole="admin">
        <UserManagement />
      </ProtectedRoute>
    )
  },
  
  // Protected: Buyer or Admin
  {
    path: '/cart',
    element: (
      <ProtectedRoute requiredRoles={["buyer", "admin"]}>
        <ShoppingCart />
      </ProtectedRoute>
    )
  }
];
```

---

## 6. Permission Constants

### Frontend Permissions Object

```javascript
// src/utils/permissions.js

export const PERMISSIONS = {
  // Farmer Permissions
  FARMER: {
    CAN_ADD_CROPS: true,
    CAN_EDIT_CROPS: true,
    CAN_DELETE_CROPS: true,
    CAN_VIEW_ORDERS: true,
    CAN_ACCEPT_REJECT_ORDERS: true,
    CAN_UPDATE_ORDER_STATUS: true,
    CAN_VIEW_EARNINGS: true,
    CAN_RESPOND_TO_REVIEWS: true,
    CAN_VIEW_ANALYTICS: true,
    CAN_UPLOAD_BULK: true,
    DASHBOARD_TYPE: 'farmer'
  },
  
  // Buyer Permissions
  BUYER: {
    CAN_BROWSE_CROPS: true,
    CAN_SEARCH_CROPS: true,
    CAN_ADD_TO_CART: true,
    CAN_ADD_TO_WISHLIST: true,
    CAN_CREATE_ORDERS: true,
    CAN_TRACK_ORDERS: true,
    CAN_CANCEL_ORDERS: true,
    CAN_LEAVE_REVIEWS: true,
    CAN_VIEW_ORDER_HISTORY: true,
    DASHBOARD_TYPE: 'buyer'
  },
  
  // Admin Permissions
  ADMIN: {
    CAN_MANAGE_USERS: true,
    CAN_APPROVE_CROPS: true,
    CAN_REJECT_CROPS: true,
    CAN_SUSPEND_USERS: true,
    CAN_VERIFY_KYC: true,
    CAN_VIEW_ANALYTICS: true,
    CAN_MANAGE_ORDERS: true,
    CAN_MODERATE_REVIEWS: true,
    CAN_ISSUE_REFUNDS: true,
    CAN_SEND_NOTIFICATIONS: true,
    CAN_MANAGE_CONTENT: true,
    CAN_VIEW_AUDIT_LOGS: true,
    DASHBOARD_TYPE: 'admin'
  }
};

// Helper function to check permission
export const hasPermission = (userRole, permission) => {
  return PERMISSIONS[userRole]?.[permission] ?? false;
};

// Helper function to check any of multiple permissions
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(perm => hasPermission(userRole, perm));
};
```

---

## 7. Conditional Rendering Based on Role

```javascript
// Example Component

const CropActions = ({ crop, userRole, userId }) => {
  return (
    <div>
      {userRole === 'farmer' && crop.farmerId === userId && (
        <>
          <Button onClick={() => editCrop(crop._id)}>Edit</Button>
          <Button onClick={() => deleteCrop(crop._id)}>Delete</Button>
        </>
      )}
      
      {userRole === 'buyer' && (
        <>
          <Button onClick={() => addToCart(crop._id)}>Add to Cart</Button>
          <Button onClick={() => addToWishlist(crop._id)}>
            Save for Later
          </Button>
        </>
      )}
      
      {userRole === 'admin' && (
        <>
          <Button onClick={() => approveCrop(crop._id)}>Approve</Button>
          <Button onClick={() => rejectCrop(crop._id)}>Reject</Button>
          <Button onClick={() => featureCrop(crop._id)}>Feature</Button>
        </>
      )}
    </div>
  );
};
```

---

## 8. Default Data Access Levels

### Farmer Can Access:
- Own profile, own crops, own orders (as farmer), own earnings
- Crop details (read-only), farmer analytics
- Cannot access: buyer profiles, other farmer's crops/earnings

### Buyer Can Access:
- Own profile, own orders (as buyer), own wishlist, own cart
- All public crop listings, all farmer profiles (limited info)
- Order history and tracking
- Cannot access: other buyer's data, admin features

### Admin Can Access:
- All user profiles and data
- All crops, orders, and transactions
- Analytics and reports
- All moderation features
- System settings and logs

---

## 9. Session & Token Security

```javascript
// JWT Token Payload
{
  userId: "user_mongo_id",
  email: "user@example.com",
  role: "farmer|buyer|admin",
  farmerId: "farm_id_if_farmer",
  iat: 1234567890,
  exp: 1234567890 + (15 * 60 * 1000) // 15 min expiry
}
```

### Token Best Practices:
1. Access tokens valid for 15 minutes
2. Refresh tokens valid for 7 days
3. Store tokens in HTTP-only cookies (secure)
4. Verify role and permissions on every protected request
5. Revoke tokens on logout
6. Re-verify permissions on sensitive operations

---

This comprehensive RBAC ensures secure and proper access control across the entire platform for all three user roles.
