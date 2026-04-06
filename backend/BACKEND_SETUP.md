# FarmDirect Backend Setup Guide

## 📋 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and update:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Change to a secure random string
- `CORS_ORIGIN` - Set to your frontend URL

### 3. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

## 📁 Backend Structure

```
backend/
├── config/           # Configuration files
│   └── db.js        # MongoDB connection
├── controllers/      # Business logic
│   ├── authController.js
│   ├── cropController.js
│   ├── orderController.js
│   └── wishlistController.js
├── models/          # MongoDB schemas
│   ├── User.js
│   ├── CropListing.js
│   ├── Order.js
│   ├── Review.js
│   └── Wishlist.js
├── routes/          # API endpoints
│   ├── authRoutes.js
│   ├── cropRoutes.js
│   ├── orderRoutes.js
│   └── wishlistRoutes.js
├── middleware/      # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── validator.js
├── utils/           # Helper functions
│   ├── jwt.js
│   └── password.js
├── server.js        # Express app setup
├── package.json
├── .env.example
└── README.md
```

---

## 🔐 API Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

### User Roles
- **farmer**: Can create/manage crops, view orders
- **buyer**: Can browse crops, place orders, add to wishlist
- **admin**: Full platform access

---

## 🚀 API Endpoints

### Authentication Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/update-profile` | ✅ | Update profile |
| POST | `/api/auth/logout` | ✅ | Logout |

### Crop Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/crops` | ❌ | Get all crops (searchable, paginated) |
| GET | `/api/crops/:id` | ❌ | Get crop details |
| GET | `/api/crops/farmer/:farmerId` | ❌ | Get farmer's crops |
| POST | `/api/crops` | ✅ (Farmer) | Create new crop |
| PUT | `/api/crops/:id` | ✅ (Farmer) | Update crop |
| DELETE | `/api/crops/:id` | ✅ (Farmer) | Delete crop |

### Order Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | ✅ (Buyer) | Create order |
| GET | `/api/orders` | ✅ | Get user's orders |
| GET | `/api/orders/:id` | ✅ | Get order details |
| PUT | `/api/orders/:id/status` | ✅ (Farmer) | Update order status |
| POST | `/api/orders/:id/review` | ✅ (Buyer) | Add review |

### Wishlist Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/wishlist` | ✅ | Add to wishlist |
| GET | `/api/wishlist` | ✅ | Get user's wishlist |
| DELETE | `/api/wishlist/:cropId` | ✅ | Remove from wishlist |
| GET | `/api/wishlist/check/:cropId` | ✅ | Check if in wishlist |

---

## 📝 Request/Response Examples

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Farmer",
  "email": "john@farm.com",
  "password": "password123",
  "role": "farmer",
  "phone": "9876543210",
  "location": "Karnataka"
}
```

**Response (201)**:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Farmer",
    "email": "john@farm.com",
    "role": "farmer"
  }
}
```

### Create Crop
```bash
POST /api/crops
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Organic Tomato",
  "category": "Vegetables",
  "price": 45,
  "quantity": 100,
  "description": "Fresh organic tomatoes from our farm",
  "specifications": {
    "size": "Medium",
    "color": "Red",
    "ripeness": "Fully ripe"
  },
  "certifications": ["Organic"],
  "harvestDate": "2024-03-20"
}
```

### Get Crops (with filters)
```bash
GET /api/crops?category=Vegetables&minPrice=30&maxPrice=100&search=tomato&page=1&limit=12
```

### Create Order
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "cropId": "507f1f77bcf86cd799439012",
  "quantity": 5,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "country": "India"
  },
  "paymentMethod": "cod"
}
```

---

## 🗄️ MongoDB Models

### User
```javascript
{
  _id,
  name,
  email,
  password (hashed),
  phone,
  role: "farmer" | "buyer" | "admin",
  location,
  avatar,
  verified,
  bio,
  rating,
  socialLinks,
  isBlocked,
  timestamps
}
```

### CropListing
```javascript
{
  _id,
  farmerId,
  name,
  category,
  price,
  quantity,
  description,
  image,
  certifications,
  specifications,
  harvestDate,
  rating,
  reviews,
  status: "active" | "inactive" | "pending_review",
  views,
  sold,
  timestamps
}
```

### Order
```javascript
{
  _id,
  orderNumber,
  buyerId,
  farmerId,
  cropId,
  quantity,
  unitPrice,
  totalPrice,
  status: "pending" | "accepted" | "shipped" | "delivered" | "cancelled",
  timeline,
  deliveryAddress,
  paymentMethod,
  paymentStatus,
  notes,
  rating,
  timestamps
}
```

### Wishlist
```javascript
{
  _id,
  userId,
  cropId,
  addedAt,
  timestamps
}
```

---

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available options.

**Required for local development**:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/farmdirect
JWT_SECRET=your_secure_secret_key
CORS_ORIGIN=http://localhost:5173
```

**For MongoDB Atlas** (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farmdirect
```

---

## 🐛 Error Handling

All errors return standard JSON format:

```json
{
  "message": "Error description",
  "errors": []  // Optional validation errors
}
```

**Common Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

---

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables
- **cors** - Cross-origin requests
- **multer** - File uploads
- **nodemailer** - Email service
- **nodemon** - Development auto-reload

---

## 🚀 Deployment

### Prerequisites
- MongoDB Atlas account or local MongoDB
- Node.js 16+

### Heroku Deployment
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create farmdirect-api

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGODB_URI=your_mongodb_uri

# Deploy
git push heroku main
```

### Docker Deployment
```bash
docker build -t farmdirect-backend .
docker run -p 5000:5000 farmdirect-backend
```

---

## 🔄 Next Steps

1. ✅ Basic API setup complete
2. ⬜ Add file upload for crop images
3. ⬜ Implement email notifications
4. ⬜ Add payment gateway integration
5. ⬜ Setup Socket.IO for real-time updates
6. ⬜ Add admin analytics endpoints
7. ⬜ Implement search filters optimization
8. ⬜ Add API rate limiting
9. ⬜ Setup logging system
10. ⬜ Write API tests

---

## 📚 Resources

- [Express Documentation](https://expressjs.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [JWT Guide](https://jwt.io)
- [REST API Best Practices](https://restfulapi.net)

---

## 💬 Support

For issues or questions, refer to the main [ARCHITECTURE.md](../F_1/ARCHITECTURE.md) file.
