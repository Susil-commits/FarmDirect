# Cloudinary Integration Guide for FaRm Marketplace

## 📋 Complete Process Flow

```
User selects file(s) 
    ↓
Frontend validates & creates preview
    ↓
Frontend sends to Backend (/api/crops/with-images)
    ↓
Backend validates file
    ↓
Backend uploads to Cloudinary
    ↓
Cloudinary auto-optimizes & stores
    ↓
Backend receives Cloudinary URL + public_id
    ↓
Backend saves URL to MongoDB
    ↓
Frontend receives optimized Cloudinary URL
    ↓
Display on app with CDN delivery
```

---

## 🚀 Step-by-Step Setup

### 1. Environment Variables (`.env`)

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_preset_name

# App Configuration
VITE_API_BASE_URL=http://localhost:5000/api
```

**Get these from:** [Cloudinary Dashboard](https://cloudinary.com/console)

---

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install cloudinary multer-storage-cloudinary

# Frontend (if using direct upload)
cd ../F_1
npm install cloudinary
```

---

### 3. Files Created

| File | Purpose |
|------|---------|
| `backend/config/cloudinary.js` | Cloudinary configuration & helpers |
| `backend/middleware/cloudinaryUpload.js` | Multer middleware for file handling |
| `backend/examples/cloudinaryExample.js` | Example controllers |
| `backend/examples/cloudinaryRoutes.js` | Example routes |
| `F_1/src/services/uploadService.js` | Frontend upload service |
| `F_1/src/components/common/ImageUploadComponent.jsx` | Reusable upload component |

---

## 📝 Implementation Examples

### A) Upload Crop with Images

**Backend Route:**
```javascript
// Add to your cropRoutes.js
import { uploadCropImages } from '../middleware/cloudinaryUpload.js';
import { createCropWithImages } from '../controllers/cropController.js';

router.post(
  '/crops/with-images',
  protect,
  authorize('farmer'),
  ...uploadCropImages(),
  createCropWithImages
);
```

**Frontend Component:**
```jsx
import ImageUploadComponent from '../components/common/ImageUploadComponent';

export default function CreateCropPage() {
  const handleUpload = (cloudinaryUrls) => {
    console.log('Images uploaded to Cloudinary:', cloudinaryUrls);
    // Now submit crop with these URLs to API
    submitCropForm({
      cropName: 'Tomatoes',
      price: 30,
      images: cloudinaryUrls, // Cloudinary URLs
      // ... other fields
    });
  };

  return (
    <div>
      <h1>Create New Crop Listing</h1>
      <ImageUploadComponent onUploadSuccess={handleUpload} maxFiles={5} />
    </div>
  );
}
```

---

### B) Upload Profile Picture

**Backend:**
```javascript
// Already in userRoutes.js (example)
router.put(
  '/profile-picture',
  protect,
  ...uploadProfilePicture(),
  updateProfilePicture
);
```

**Frontend:**
```jsx
import uploadService from '../../services/uploadService';

const handleProfilePictureChange = async (e) => {
  const file = e.target.files[0];
  try {
    const result = await uploadService.uploadProfilePicture(file);
    console.log('Profile picture URL:', result.data.profilePicture);
    // Update local state/context
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

return (
  <input
    type="file"
    accept="image/*"
    onChange={handleProfilePictureChange}
  />
);
```

---

### C) Upload KYC Documents (as Farmer)

**Backend:**
```javascript
// In adminRoutes or farmerRoutes
router.post(
  '/kyc/submit',
  protect,
  authorize('farmer'),
  ...uploadKYCDocuments(),
  submitKYC
);
```

**Frontend:**
```jsx
const handleKYCSubmit = async (documents, documentType) => {
  try {
    const result = await uploadService.uploadKYCDocuments(
      documents,
      documentType // 'aadhaar', 'pancard', 'bank_statement'
    );
    
    console.log('KYC documents uploaded:', result);
    showSuccessMessage('KYC documents submitted for verification');
  } catch (error) {
    showErrorMessage('KYC upload failed: ' + error.message);
  }
};
```

---

## 🎯 Cloudinary Benefits & Features

### Auto-Optimization
```javascript
// Images automatically:
✓ Compressed to ~70% smaller file size
✓ Converted to modern formats (WebP for Chrome)
✓ Resized for different devices
✓ Delivered via global CDN (fast worldwide delivery)
```

### Image Transformations (Advanced)
```javascript
// In your components, transform URLs on the fly:

// Thumbnail
https://res.cloudinary.com/[cloud]/image/upload/w_300,h_300,c_fill/crops/tomato.jpg

// Mobile optimized
https://res.cloudinary.com/[cloud]/image/upload/w_640,h_480,q_auto,f_auto/crops/tomato.jpg

// Grayscale filter
https://res.cloudinary.com/[cloud]/image/upload/e_grayscale/crops/tomato.jpg

// Watermark
https://res.cloudinary.com/[cloud]/image/upload/l_text:Arial_30:FarmDirect/crops/tomato.jpg
```

---

## 📂 Folder Organization on Cloudinary

```
farm/
├── profiles/          # User profile pictures
├── crops/             # Crop listing images
├── kyc/               # KYC documents
├── orders/            # Order invoices & receipts
├── reviews/           # Review images
└── temporary/         # Temporary uploads (auto-delete)
```

---

## 💾 MongoDB Schema Updates

### Store Cloudinary Info
```javascript
// Update your models to store both URL and public_id

// For CropListing
images: [String],                    // Array of Cloudinary URLs
imagePublicIds: [String],            // Store public IDs for deletion

// For User
profilePicture: String,              // Cloudinary URL
profilePicturePublicId: String,      // For deletion

kycDocuments: [{
  url: String,                       // Cloudinary URL
  public_id: String,                 // For deletion
  type: String,                      // 'aadhaar', 'pancard', etc.
  uploadedAt: Date
}]
```

---

## 🔐 Security Best Practices

### 1. Use Upload Presets (Recommended)
```env
# Create in Cloudinary Dashboard: Settings → Upload
# Upload Preset: farm_uploads
# Signed: FALSE (unsigned for frontend)
# Folder: farm

# Frontend can then use directly:
VITE_CLOUDINARY_UPLOAD_PRESET=farm_uploads
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 2. Validate File Types
```javascript
// Done in middleware - only allow:
✓ Images: JPEG, PNG, GIF, WebP, TIFF
✓ Documents: PDF, CSV
✓ Videos: MP4, MOV (max 50MB)
✗ Executables, scripts blocked
```

### 3. Rate Limiting
```javascript
// Add to your Express app:
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 uploads per user per 15 min
  message: 'Too many uploads, please try again later'
});

app.post('/crops/with-images', uploadLimiter, uploadCropImages(), ...);
```

---

## ✅ Checklist for Implementation

### Backend
- [ ] Install `cloudinary` package
- [ ] Create `.env` with Cloudinary credentials
- [ ] Implement `backend/config/cloudinary.js`
- [ ] Implement `backend/middleware/cloudinaryUpload.js`
- [ ] Update controllers to use uploaded file URLs
- [ ] Update routes to use upload middleware
- [ ] Update MongoDB models to store public_id
- [ ] Add delete endpoint to clean up Cloudinary files

### Frontend
- [ ] Create `uploadService.js` in services
- [ ] Create `ImageUploadComponent.jsx` reusable component
- [ ] Update crop creation form to use component
- [ ] Update profile picture upload
- [ ] Add KYC document upload flow
- [ ] Display images from Cloudinary URLs

### Testing
- [ ] Test single file upload
- [ ] Test multiple file upload
- [ ] Test file deletion
- [ ] Test image transformations
- [ ] Test with different file types
- [ ] Test error handling

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Check `.env` - ensure correct cloud name, API key, secret |
| "Upload failed 401" | Verify API Key has upload permission |
| "CORS error" | Add frontend domain to Cloudinary CORS whitelist |
| "Files too large" | Check file size limits (50MB default) |
| "Old images not deleted" | Ensure `public_id` is stored before deletion |

---

## 📊 Cost & Quotas (Free Tier)

```
✓ 25 GB storage
✓ 25 GB monthly transformation
✓ Unlimited API requests
✓ Auto-optimization included
✗ Watermark added (paid tier removes this)
```

---

## 🚀 Taking to Production

1. **Upgrade Cloudinary Plan** - Remove watermarks, increase limits
2. **Enable https** - All URLs must be HTTPS
3. **Setup CDN** - Already included with Cloudinary
4. **Add watermark** (Optional) - Branding protection
5. **Setup backup** - Regular exports from Cloudinary
6. **Monitor usage** - Avoid exceeding free tier

---

## 📚 Useful Resources

- [Cloudinary Docs](https://cloudinary.com/documentation/cloudinary_sdks)
- [Node SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Upload API](https://cloudinary.com/documentation/upload_widget)

---

## 🎁 Bonus: Direct Frontend Upload (Optional)

For faster uploads, upload directly to Cloudinary from frontend:

```jsx
import CldUploadWidget from 'next-cloudinary';

<CldUploadWidget
  uploadPreset="farm_uploads"
  onSuccess={(result) => {
    const url = result.info.secure_url;
    // Save URL to backend
  }}
>
  {({ open }) => (
    <button onClick={() => open()}>Upload Image</button>
  )}
</CldUploadWidget>
```

This bypasses your backend and uploads directly to Cloudinary (faster, fewer server resources needed).
