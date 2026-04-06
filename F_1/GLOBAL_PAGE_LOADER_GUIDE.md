# Global Page Loader - Implementation Guide

A global page loading system that displays a centered loading spinner on every page load.

## 📦 Components & Hooks

### 1. **LoadingContext** (`src/context/LoadingContext.jsx`)
Manages global loading state across the entire application.

**Available Methods:**
- `startLoading(message)` - Start showing loader with optional message
- `stopLoading()` - Hide loader
- `isPageLoading` - Boolean state
- `loadingMessage` - Current loading message

### 2. **GlobalPageLoader** (`src/components/common/GlobalPageLoader.jsx`)
The visual loader component that displays as a centered modal overlay.

**Features:**
- Fixed positioning (doesn't affect layout)
- Backdrop blur effect
- Animated spinner
- Customizable message

### 3. **usePageLoading Hook** (`src/hooks/usePageLoading.js`)
Convenient hook for managing page loading state in components.

**Usage:**
```jsx
const { startLoading, stopLoading } = usePageLoading('Loading data...');
```

---

## 🚀 Usage Examples

### Example 1: Basic Page Loading
```jsx
import { usePageLoading } from '../hooks';

export default function MyPage() {
  const { startLoading, stopLoading } = usePageLoading('Loading page...');

  useEffect(() => {
    // Your page setup code
    setTimeout(() => stopLoading(), 2000);
  }, []);

  return (
    <PageTransition>
      {/* Your content */}
    </PageTransition>
  );
}
```

### Example 2: With Data Fetching
```jsx
import { usePageLoading } from '../hooks';

export default function Marketplace() {
  const { startLoading, stopLoading } = usePageLoading('Loading products...');
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const data = await fetchCropsAPI();
        setCrops(data);
      } finally {
        stopLoading();
      }
    };

    fetchCrops();
  }, []);

  return (
    <PageTransition>
      {/* Your content */}
    </PageTransition>
  );
}
```

### Example 3: Manual Control
```jsx
import { useLoading } from '../context/LoadingContext';

export default function Form() {
  const { startLoading, stopLoading } = useLoading();

  const handleSubmit = async (data) => {
    startLoading('Saving...');
    try {
      await submitForm(data);
      // Success
    } finally {
      stopLoading();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 🎯 Best Practices

1. **Always Pair startLoading with stopLoading**
   - Use try/finally to ensure stopLoading is called
   - Even if an error occurs, hide the loader

2. **Meaningful Messages**
   - Use specific messages: "Loading products..." instead of generic "Loading..."
   - Keep messages short and user-friendly

3. **Use usePageLoading Hook**
   - Simpler than importing useLoading directly
   - Automatically stops loader when component unmounts
   - Prevents memory leaks

4. **Set Appropriate Delays**
   - For quick operations (< 500ms), you may not need a loader
   - For slow operations, always show the loader
   - Minimum safe delay: 300ms

---

## 📋 Files Modified

✅ `src/context/LoadingContext.jsx` - New context
✅ `src/components/common/GlobalPageLoader.jsx` - New component
✅ `src/hooks/usePageLoading.js` - New hook
✅ `src/hooks/index.js` - Export new hook
✅ `src/main.jsx` - Added LoadingProvider
✅ `src/App.jsx` - Added GlobalPageLoader component
✅ `src/context/RouterContext.jsx` - Updated (optional improvements)

---

## 🔄 How It Works

1. **LoadingProvider** wraps the entire app in `main.jsx`
2. **GlobalPageLoader** component displays the overlay when `isPageLoading` is true
3. **usePageLoading hook** or `useLoading` context methods control the loading state
4. When any component calls `startLoading()`, the overlay appears
5. When `stopLoading()` is called, the overlay disappears
6. All animations are handled by Tailwind CSS and custom keyframes

---

## 🎨 Customization

### Change Loader Size:
Edit `GlobalPageLoader.jsx`:
```jsx
<LoadingSpinner size="lg" text="" />  // sm, md, or lg
```

### Change Overlay Appearance:
Edit the backdrop blur or background:
```jsx
<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm ...">
```

### Change Loading Message:
Use different messages in `startLoading()`:
```jsx
startLoading('Saving your order...');
startLoading('Processing payment...');
```

---

## ✨ Features

- ✅ Global loading state management
- ✅ Beautiful animated spinner
- ✅ Backdrop blur effect
- ✅ Customizable messages
- ✅ Works on all pages
- ✅ Prevents user interaction during loading
- ✅ No page layout shift
- ✅ Auto-cleanup on component unmount
