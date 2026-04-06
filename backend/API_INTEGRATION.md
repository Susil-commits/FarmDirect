# Backend API Integration Guide

## 🔗 Connecting Frontend to Backend

### 1. Create API Service

Create `src/services/api.js` in your frontend:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class APIService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  // Auth endpoints
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    localStorage.setItem('token', data.token);
    this.token = data.token;
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    this.token = data.token;
    return data;
  }

  async logout() {
    localStorage.removeItem('token');
    this.token = null;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Crop endpoints
  async getCrops(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/crops?${params}`);
  }

  async getCropById(id) {
    return this.request(`/crops/${id}`);
  }

  async createCrop(cropData) {
    return this.request('/crops', {
      method: 'POST',
      body: JSON.stringify(cropData),
    });
  }

  async updateCrop(id, cropData) {
    return this.request(`/crops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cropData),
    });
  }

  async deleteCrop(id) {
    return this.request(`/crops/${id}`, { method: 'DELETE' });
  }

  // Order endpoints
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/orders?${params}`);
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  // Wishlist endpoints
  async addToWishlist(cropId) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ cropId }),
    });
  }

  async getWishlist() {
    return this.request('/wishlist');
  }

  async removeFromWishlist(cropId) {
    return this.request(`/wishlist/${cropId}`, { method: 'DELETE' });
  }
}

export default new APIService();
```

### 2. Update .env.local

Add to `F_1/.env.local`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Update AuthContext to Use API

Modify `src/context/AuthContext.jsx`:

```javascript
import api from '../services/api.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, register, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. Use in Components

```javascript
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export default function Marketplace() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      try {
        const response = await api.getCrops({
          category: selectedCategory,
          minPrice,
          maxPrice,
          search
        });
        setCrops(response.crops);
      } catch (error) {
        console.error('Error fetching crops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, [selectedCategory, minPrice, maxPrice, search]);

  return (
    // Your JSX here
  );
}
```

---

## 🗂️ File Structure After Integration

```
F_1/
├── src/
│   ├── services/
│   │   └── api.js          # NEW: API client
│   ├── context/
│   │   ├── AuthContext.jsx # MODIFIED: Use API
│   │   └── RouterContext.jsx
│   ├── pages/
│   ├── components/
│   ├── App.jsx
│   └── main.jsx
├── .env.local              # NEW: VITE_API_BASE_URL
└── package.json
```

---

## 🧪 Testing API Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Farmer",
    "email": "john@farm.com",
    "password": "password123",
    "role": "farmer"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@farm.com",
    "password": "password123"
  }'

# Get Crops
curl http://localhost:5000/api/crops?category=Vegetables

# Get Protected Route
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman
1. Create Postman collection
2. Set base URL: `http://localhost:5000/api`
3. In Auth tab, select Bearer Token and paste your JWT
4. Create requests for each endpoint

---

## 📋 Environment Variables

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/farmdirect
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

---

## 🔄 Full Integration Checklist

- [ ] Create API service
- [ ] Update .env.local
- [ ] Modify AuthContext
- [ ] Update Login page to use API
- [ ] Update Register page to use API
- [ ] Update Home page marketplace section
- [ ] Update Marketplace page to fetch crops
- [ ] Update CropDetail page
- [ ] Update Dashboards to use real data
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test all endpoints
- [ ] Setup error boundaries

---

## 🚀 Running Both Frontend & Backend

**Terminal 1 - Backend**:
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd F_1
npm install
npm run dev
```

Both will now communicate using the API service!

---

## 🐛 Common Issues

### CORS Error
Make sure backend has correct CORS_ORIGIN in .env:
```
CORS_ORIGIN=http://localhost:5173
```

### 401 Unauthorized
Ensure token is stored in localStorage and sent in Authorization header.

### MongoDB Connection Error
Check MONGODB_URI points to running MongoDB instance.

---

## 📚 Next Steps

1. ✅ Backend API running
2. ✅ Frontend API service created
3. ⬜ Implement all page integrations
4. ⬜ Add form validation
5. ⬜ Add loading screens
6. ⬜ Add error notifications
7. ⬜ Implement file uploads for images
8. ⬜ Add pagination
9. ⬜ Setup real-time updates with Socket.IO

