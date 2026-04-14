# Implementation Guide & Backend Setup Instructions

## 1. Project Setup

### 1.1 Prerequisites

```bash
# Required
- Node.js v16+ and npm/yarn
- MongoDB (Atlas or Local)
- Git
- VS Code or any code editor

# Recommended Tools
- Postman (for API testing)
- MongoDB Compass (for database management)
- NoSQL Booster (MongoDB IDE)
```

### 1.2 Initialize Backend Project

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize Node project
npm init -y

# Install core dependencies
npm install express dotenv cors mongoose helmet express-validator bcryptjs jsonwebtoken multer

# Install development dependencies
npm install --save-dev nodemon

# Create .gitignore
echo "node_modules
.env
.env.local
.DS_Store
*.log" > .gitignore
```

### 1.3 Create .env File

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farm_marketplace
MONGODB_LOCAL=mongodb://localhost:27017/farm_marketplace

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=900
JWT_REFRESH_EXPIRE=604800

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary (For Images)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
FRONTEND_PROD=https://yourdomain.com

# Admin Email
ADMIN_EMAIL=admin@farmersmarket.com
```

### 1.4 Initialize Frontend Project

```bash
# Create frontend using Vite
npm create vite@latest F_1 -- --template react
cd F_1

# Install dependencies
npm install

# Install required packages
npm install axios react-router-dom react-context-api formik yup
npm install @tanstack/react-query socket.io-client
npm install tailwindcss postcss autoprefixer

# Initialize Tailwind (optional but recommended)
npx tailwindcss init -p

# Create .env.local
echo "VITE_API_URL=http://localhost:5000/api/v1
VITE_FILE_UPLOAD_SIZE=5242880
VITE_APP_NAME=Farm Marketplace" > .env.local
```

---

## 2. Backend Folder Structure Creation

```bash
# Create folder structure
mkdir -p backend/{config,controllers,models,routes,middleware,utils,socket,services}

# Create base files
touch backend/server.js
touch backend/config/db.js
touch backend/config/constants.js

# Create example files for each module
touch backend/controllers/{authController,cropController,orderController}.js
touch backend/models/{User,Crop,Order}.js
touch backend/routes/{authRoutes,cropRoutes,orderRoutes}.js
touch backend/middleware/{auth,authorization,validation,errorHandler}.js
```

---

## 3. Core Backend Implementation

### 3.1 Server Setup (server.js)

```javascript
// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/crops', require('./routes/cropRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3.2 Database Connection (config/db.js)

```javascript
// backend/config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_URI 
        : process.env.MONGODB_LOCAL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 3.3 User Model (models/User.js)

```javascript
// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  role: { 
    type: String, 
    enum: ['farmer', 'buyer', 'admin'], 
    required: true 
  },
  
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  
  profilePicture: String,
  bio: String,
  
  address: {
    streetAddress: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number
  },
  
  // Farmer-specific
  farmName: String,
  farmSize: Number,
  cropsGrown: [String],
  
  // KYC
  kycStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected'],
    default: 'pending'
  },
  
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true }
  },
  
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### 3.4 Crop Model (models/Crop.js)

```javascript
// backend/models/Crop.js

const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  tags: [String],
  
  quantity: { type: Number, required: true },
  quantityUnit: String,
  pricePerUnit: { type: Number, required: true },
  
  images: [String], // Cloudinary URLs
  
  status: {
    type: String,
    enum: ['available', 'sold_out', 'coming_soon'],
    default: 'available'
  },
  
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  location: {
    city: String,
    state: String,
    latitude: Number,
    longitude: Number
  },
  
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for search and filtering
cropSchema.index({ name: 'text', description: 'text' });
cropSchema.index({ farmerId: 1 });
cropSchema.index({ category: 1 });
cropSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('Crop', cropSchema);
```

### 3.5 Order Model (models/Order.js)

```javascript
// backend/models/Order.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  items: [{
    cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    cropName: String,
    quantity: Number,
    pricePerUnit: Number,
    itemTotal: Number
  }],
  
  subtotal: Number,
  taxAmount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  totalAmount: Number,
  
  status: {
    type: String,
    enum: [
      'created', 'pending', 'accepted', 'shipped', 
      'delivered', 'completed', 'cancelled', 'rejected', 'disputed'
    ],
    default: 'created'
  },
  
  deliveryAddress: {
    name: String,
    phone: String,
    streetAddress: String,
    city: String,
    pincode: String
  },
  
  payment: {
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    method: String,
    transactionId: String,
    transactionDate: Date
  },
  
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    description: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
```

---

## 4. Authentication Implementation

### 4.1 JWT Utility (utils/jwt.js)

```javascript
// backend/utils/jwt.js

const jwt = require('jsonwebtoken');

const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
  
  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateTokens, verifyToken };
```

### 4.2 Auth Middleware (middleware/auth.js)

```javascript
// backend/middleware/auth.js

const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

module.exports = authenticate;
```

### 4.3 Authorization Middleware (middleware/authorization.js)

```javascript
// backend/middleware/authorization.js

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = { authorizeRole };
```

### 4.4 Auth Controller (controllers/authController.js)

```javascript
// backend/controllers/authController.js

const User = require('../models/User');
const { generateTokens } = require('../utils/jwt');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;
    
    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role
    });
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email, user.role);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email, user.role);
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

## 5. Frontend Setup

### 5.1 API Service (src/services/api.js)

```javascript
// src/services/api.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 5.2 Auth Service (src/services/authService.js)

```javascript
// src/services/authService.js

import api from './api';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken })
};

export default authService;
```

### 5.3 Auth Context (src/context/AuthContext.jsx)

```javascript
// src/context/AuthContext.jsx

import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);
  
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { data } = response;
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data));
      
      setUser(data);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 5.4 useAuth Hook (src/hooks/useAuth.js)

```javascript
// src/hooks/useAuth.js

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default useAuth;
```

---

## 6. Package.json Scripts

### Backend (package.json)

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```

### Frontend (package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src"
  }
}
```

---

## 7. Development Workflow

### Step 1: Start Backend
```bash
cd backend
npm install
npm run dev
# Server running on http://localhost:5000
```

### Step 2: Start Frontend
```bash
cd F_1
npm install
npm run dev
# App running on http://localhost:5173
```

### Step 3: Test APIs with Postman
- Import API collection
- Test endpoints with auth tokens
- Verify request/response formats

### Step 4: Implement Features
- Follow TDD approach
- Write tests first
- Implement features
- Test in browser

---

## 8. Deployment Checklist

### Before Deployment

- [ ] All environment variables set
- [ ] Database backups configured
- [ ] HTTPS certificates ready
- [ ] API rate limiting enabled
- [ ] Error logging configured
- [ ] CORS properly configured
- [ ] JWT secrets changed
- [ ] Admin account created
- [ ] Email service configured
- [ ] File upload service ready
- [ ] Payment gateway credentials loaded
- [ ] Database migrations done

### Deployment Options

**Backend:**
- Render (free tier available)
- Railway
- Heroku
- AWS EC2
- DigitalOcean

**Frontend:**
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

**Database:**
- MongoDB Atlas (recommended)
- AWS DocumentDB
- Self-hosted MongoDB

**Storage:**
- Cloudinary (images)
- AWS S3
- Firebase Storage

---

## 9. Testing

### Backend Unit Tests
```bash
npm install --save-dev jest supertest
npm test
```

### Frontend Component Tests
```bash
npm install --save-dev @testing-library/react vitest
npm run test
```

---

## 10. Monitoring & Logs

```javascript
// Simple logging utility
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`)
};

// Use in code
logger.info('User registered successfully');
logger.error('Database connection failed');
```

This implementation guide provides a complete roadmap for building the marketplace platform from scratch.
