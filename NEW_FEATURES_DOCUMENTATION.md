# Backend OAuth Integration Endpoints

Add the following endpoints to your backend API to support the new social authentication and features:

## Authentication Endpoints

### Google OAuth Callback
```
POST /api/auth/google/callback
Body: { code: "authorization_code" }
Response: { token, user }
```

### GitHub OAuth Callback
```
POST /api/auth/github/callback
Body: { code: "authorization_code" }
Response: { token, user }
```

### Forgot Password
```
POST /api/auth/forgot-password
Body: { email: "user@example.com" }
Response: { message: "Reset link sent" }
```

### Reset Password
```
POST /api/auth/reset-password
Body: { token: "reset_token", newPassword: "password" }
Response: { token, user }
```

### Change Password (Auth Required)
```
POST /api/auth/change-password
Headers: Authorization: Bearer {token}
Body: { oldPassword: "current", newPassword: "new" }
Response: { message: "Password updated" }
```

## Order Tracking Endpoints

### Get User Orders
```
GET /api/orders/my-orders
Headers: Authorization: Bearer {token}
Response: { data: [orders] }
```

### Get Order Details
```
GET /api/orders/{orderId}
Headers: Authorization: Bearer {token}
Response: { data: order }
```

### Cancel Order
```
POST /api/orders/{orderId}/cancel
Headers: Authorization: Bearer {token}
Body: { reason: "cancellation_reason" }
Response: { message: "Order cancelled" }
```

### Get Order Tracking Timeline
```
GET /api/orders/{orderId}/tracking
Headers: Authorization: Bearer {token}
Response: { data: timeline }
```

### Request Return
```
POST /api/orders/{orderId}/return
Headers: Authorization: Bearer {token}
Body: { reason: "return_reason", items: [itemIds] }
Response: { data: return_request }
```

## Product Comparison Endpoints

### Compare Crops
```
POST /api/crops/compare
Body: { cropIds: ["id1", "id2", "id3"] }
Response: { data: comparison_data }
```

### Get Comparison Fields
```
GET /api/crops/comparison-fields
Response: { data: [fields] }
```

### Save Comparison
```
POST /api/comparisons
Headers: Authorization: Bearer {token}
Body: { cropIds: ["id1", "id2"], name: "My Comparison" }
Response: { data: comparison }
```

### Get Saved Comparisons
```
GET /api/comparisons
Headers: Authorization: Bearer {token}
Response: { data: [comparisons] }
```

### Delete Comparison
```
DELETE /api/comparisons/{comparisonId}
Headers: Authorization: Bearer {token}
Response: { message: "Deleted" }
```

### Export Comparison
```
GET /api/comparisons/{comparisonId}/export
Headers: Authorization: Bearer {token}
Response: PDF file
```

## Environment Configuration

### Frontend (.env)
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (.env)
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost:5173
```

## Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback`
6. Copy Client ID and Client Secret to .env

## Set Up GitHub OAuth

1. Go to [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in Application details:
   - Authorization callback URL: `http://localhost:5173/auth/github/callback`
4. Copy Client ID and Client Secret to .env

## Database Schema Updates

### User Model
Added fields:
```javascript
{
  verified: Boolean,
  password: { required: false }, // Optional for social auth users
  socialAuth: {
    provider: String,
    providerId: String
  }
}
```

## New Pages Added

1. **GoogleCallback** (`/src/pages/auth/GoogleCallback.jsx`)
   - Handles Google OAuth callback
   - Route: `/auth/google/callback`

2. **GitHubCallback** (`/src/pages/auth/GitHubCallback.jsx`)
   - Handles GitHub OAuth callback
   - Route: `/auth/github/callback`

3. **ForgotPassword** (`/src/pages/auth/ForgotPassword.jsx`)
   - Password recovery component
   - Integrated into Login page

4. **OrderTracking** (`/src/pages/OrderTracking.jsx`)
   - View and track orders
   - Route: `/orders`

5. **ProductComparison** (`/src/pages/ProductComparison.jsx`)
   - Compare crops side-by-side
   - Route: `/compare`

## New Services Added

1. **socialAuthService** (`/src/services/socialAuthService.js`)
   - Google and GitHub OAuth integration
   - OAuth callback handling

2. **passwordResetService** (`/src/services/passwordResetService.js`)
   - Password reset requests
   - Token verification
   - Password update

3. **orderTrackingService** (`/src/services/orderTrackingService.js`)
   - Fetch user orders
   - Cancel orders
   - Track shipments
   - Request returns

4. **productComparisonService** (`/src/services/productComparisonService.js`)
   - Compare crops
   - Save comparisons
   - Export to PDF
   - Share comparisons

## Next Steps

1. Implement backend endpoints for all services
2. Add email service for password resets
3. Set up OAuth apps (Google & GitHub)
4. Add payment gateway integration
5. Implement real-time order tracking
6. Add email notifications for order status
