# FarmDirect - Integration Guide for Premium Features

## 🔧 Quick Integration Steps

### 1. Adding Advanced Search to Marketplace
Add to `src/pages/Marketplace.jsx`:

```jsx
import AdvancedSearch from '../components/AdvancedSearch';

export default function Marketplace() {
  const [filters, setFilters] = useState({});

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    // Apply filters to crop list
  };

  return (
    <PageTransition>
      <div className="marketplace-page">
        <div className="container p-xl">
          <h1>Marketplace</h1>
          
          {/* Add this */}
          <AdvancedSearch onFilter={handleFilter} />
          
          {/* Your crop list here */}
        </div>
      </div>
    </PageTransition>
  );
}
```

### 2. Adding Reviews to Crop Detail
Add to `src/pages/CropDetail.jsx`:

```jsx
import ProductReviews from '../components/ProductReviews';

export default function CropDetail() {
  return (
    <PageTransition>
      <div className="crop-detail-page">
        {/* Existing crop details */}
        
        {/* Add this at the bottom */}
        <ProductReviews productId={cropId} productName={cropName} />
      </div>
    </PageTransition>
  );
}
```

### 3. Using Cart and Wishlist in Components
Add to any product card component:

```jsx
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();

  const handleAddToCart = () => {
    addToCart(product, 1);
    addToast(`${product.name} added to cart`, 'success');
  };

  const handleToggleWishlist = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      addToast('Removed from wishlist', 'info');
    } else {
      addToWishlist(product);
      addToast('Added to wishlist', 'success');
    }
  };

  return (
    <div className="product-card">
      {/* Product content */}
      <button onClick={handleAddToCart} className="btn btn-primary">
        Add to Cart
      </button>
      <button 
        onClick={handleToggleWishlist}
        className={`btn ${isInWishlist(product.id) ? 'btn-danger' : 'btn-outline'}`}
      >
        {isInWishlist(product.id) ? '❤️ ' : '🤍 '}Wishlist
      </button>
    </div>
  );
}
```

### 4. Sample Product Data Structure
Use this structure for your products:

```javascript
const products = [
  {
    id: 1,
    name: 'Organic Tomatoes',
    price: 45,
    description: 'Fresh farm-grown organic tomatoes',
    icon: '🍅',
    category: 'vegetables',
    rating: 4.5,
    reviews: 128,
  },
  {
    id: 2,
    name: 'Fresh Wheat',
    price: 120,
    description: 'High-quality wheat grains',
    icon: '🌾',
    category: 'grains',
    rating: 5,
    reviews: 89,
  },
];
```

---

## 🎯 Navigation Structure

All routes are pre-configured in App.jsx:

```
Homepage
├── Marketplace → ShoppingCart ⬅️ add products
├── Crop Detail → ProductReviews
├── Profile
│   ├── Personal Info
│   ├── Order History
│   └── Settings
├── Wishlist ⬅️ save favorites
└── Cart ⬅️ checkout
```

---

## 💡 Best Practices

### Using Toast Notifications
```jsx
const { addToast } = useToast();

// Success
addToast('Operation successful!', 'success');

// Error
addToast('Something went wrong', 'error');

// Warning
addToast('Please confirm this action', 'warning');

// Info
addToast('This is an informational message', 'info');

// With custom duration (ms)
addToast('Quick message', 'info', 2000);
```

### Managing Cart State
```jsx
const { cart, addToCart, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();

// Add single item
addToCart(product, 1);

// Add multiple items
addToCart(product, 5);

// Update quantity
updateQuantity(productId, newQuantity);

// Remove item
removeFromCart(productId);

// Get totals
const total = getTotalPrice();
const itemCount = getTotalItems();
```

### Managing Wishlist State
```jsx
const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

// Add to wishlist
addToWishlist(product);

// Remove from wishlist
removeFromWishlist(productId);

// Check if in wishlist
if (isInWishlist(productId)) {
  // Show filled heart
}

// Get all wishlist items
console.log(wishlist);
```

---

## 🎨 Customizing Styles

### Using CSS Variables
All styles use CSS variables in `App.css`:

```css
/* Access colors */
var(--primary-main)      /* #22c55e */
var(--primary-dark)      /* #0f5f2f */
var(--secondary-main)    /* #fb923c */

/* Access spacing */
var(--spacing-lg)        /* 1.5rem */
var(--spacing-xl)        /* 2rem */

/* Access effects */
var(--shadow-lg)         /* Large shadow */
var(--radius-lg)         /* Large border radius */
```

### Example: Custom Color
```css
.my-component {
  background: var(--primary-light);
  border: 2px solid var(--primary-main);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
```

---

## 📱 Responsive Breakpoints

The design is optimized for:
- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

All components automatically adapt.

---

## 🔐 Security Notes

### Cart & Wishlist
- Stored in browser's localStorage
- Not sent to server until checkout
- Clear on logout recommended

### User Profile
- Validate input on both client and server
- Use HTTPS for API calls
- Implement CSRF tokens

### Toast Notifications
- Don't display sensitive data
- Use for user feedback only

---

## 🚀 Testing Checklist

- [ ] Can add items to cart
- [ ] Cart total calculates correctly
- [ ] Can add items to wishlist
- [ ] Toast notifications appear
- [ ] Navigation links work
- [ ] Mobile menu responsive
- [ ] Search filters work
- [ ] Product reviews display
- [ ] User profile saves changes
- [ ] Responsive on mobile devices

---

## 🐛 Common Issues & Solutions

### Issue: Cart not persisting
**Solution**: Check browser's localStorage is enabled
```jsx
// Test localStorage
localStorage.setItem('test', 'value');
console.log(localStorage.getItem('test'));
```

### Issue: Toast not showing
**Solution**: Ensure ToastProvider wraps your app
```jsx
// In App.jsx
<ToastProvider>
  {/* Your app content */}
</ToastProvider>
```

### Issue: Styles not applying
**Solution**: Import CSS files in components
```jsx
import '../styles/ComponentName.css';
```

### Issue: Navigation not working
**Solution**: Verify route names in App.jsx match navigation calls
```jsx
navigate('/marketplace'); // Must match case exactly
```

---

## 📚 Additional Resources

- View the design system in `src/App.css`
- Check animations in `src/index.css`
- See component examples in `src/components/common/`

---

## 🎁 Premium Features Summary

✨ **Implemented:**
- Modern glassmorphism design
- Shopping cart with calculations
- Wishlist management
- User profile system
- Product reviews
- Advanced search & filters
- Toast notifications
- Enhanced navigation
- Responsive design
- State persistence

🔄 **Ready for Backend:**
- Cart checkout
- Payment processing
- Order management
- User authentication
- API integration

---

**Happy coding! 🌾 FarmDirect Premium is ready to use.**
