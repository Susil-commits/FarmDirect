# Cloudinary Setup Quick Reference

## 🔑 Credentials Needed

Get from: https://cloudinary.com/console/settings/api

```env
CLOUDINARY_CLOUD_NAME=****             # Your unique cloud name
CLOUDINARY_API_KEY=****                # API Key for authentication
CLOUDINARY_API_SECRET=****             # API Secret (keep secret!)
CLOUDINARY_UPLOAD_PRESET=farm_uploads  # (Optional) Preset for uploads
```

---

## 📂 File Structure After Setup

```
FaRm/
├── backend/
│   ├── config/
│   │   └── cloudinary.js              ✅ NEW
│   │
│   ├── middleware/
│   │   ├── cloudinaryUpload.js        ✅ NEW
│   │   └── uploadMiddleware.js        (OLD - can be deprecated)
│   │
│   ├── controllers/
│   │   └── cropController.js          (Updated to use Cloudinary)
│   │
│   ├── routes/
│   │   └── cropRoutes.js              (Updated with new middleware)
│   │
│   ├── examples/
│   │   ├── cloudinaryExample.js       ✅ NEW
│   │   └── cloudinaryRoutes.js        ✅ NEW
│   │
│   ├── .env                           (Updated with Cloudinary keys)
│   └── package.json                   (cloudinary package added)
│
└── F_1/
    └── src/
        ├── services/
        │   └── uploadService.js       ✅ NEW
        │
        └── components/
            └── common/
                └── ImageUploadComponent.jsx  ✅ NEW
```

---

## 🔄 Data Flow Diagram

### Option 1: Backend Upload (Recommended for Security)

```
┌──────────────────┐
│   User Browser   │
│                  │
│ ┌──────────────┐ │
│ │ Select Files │ │
│ └──────┬───────┘ │
│        │         │
│        ▼         │
│ ┌──────────────┐ │
│ │ Show Preview │ │
│ └──────┬───────┘ │
└────────┼──────────┘
         │
         │ FormData with files
         │
         ▼
┌─────────────────────────────────┐
│    Your Backend Server          │
│    /api/crops/with-images       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 1. Validate files           │ │
│ │ 2. Check size & type        │ │
│ │ 3. Check authentication     │ │
│ └──────┬──────────────────────┘ │
│        │                         │
│        ▼                         │
│ ┌─────────────────────────────┐ │
│ │ Upload to Cloudinary        │ │
│ │ (via cloudinary SDK)        │ │
│ └──────┬──────────────────────┘ │
└────────┼──────────────────────────┘
         │
         │ HTTPS
         │
         ▼
┌─────────────────────────────────┐
│    Cloudinary Cloud             │
│                                 │
│ ✓ Auto-optimize images          │
│ ✓ Auto-compress                 │
│ ✓ Store securely                │
│ ✓ Generate URL                  │
│ → Returns: Secure URL + ID      │
└────────┬──────────────────────────┘
         │
         │ Response with URLs
         │
         ▼
┌──────────────────┐
│   Your Backend   │
│                  │
│ ✓ Receive URLs   │
│ ✓ Save to DB     │
│ ✓ Return URLs    │
└────────┬─────────┘
         │
         │ Response JSON
         │
         ▼
┌──────────────────┐
│   User Browser   │
│                  │
│ ✓ Display URLs   │
│ ✓ Show images    │
│ ✓ Store in form  │
└──────────────────┘
```

### Option 2: Direct Upload (Faster, For Non-Sensitive)

```
┌──────────────────┐
│   User Browser   │
│                  │
│  [Select Files]  │
│        │         │
│        ▼         │
│ [Upload Preset]  │
└────────┼──────────┘
         │
         │ Direct HTTPS
         │
         ▼
┌──────────────────────────────────┐
│       Cloudinary Cloud           │
│                                  │
│ 1. Validate with Preset          │
│ 2. Auto-optimize                 │
│ 3. Store on CDN                  │
│ → Returns: URL + ID              │
└────────┬─────────────────────────┘
         │
         │ Response
         │
         ▼
┌──────────────────┐
│   User Browser   │
│                  │
│  [Display URLs]  │
│  [Send to Sever] │
└──────────────────┘
```

---

## 📡 API Endpoints After Setup

### Create Crop with Images
```
POST /api/crops/with-images
Content-Type: multipart/form-data
Authorization: Bearer token

FormData:
  - files[]  (images)
  - cropName (text)
  - category (text)
  - price    (number)
  - ...other fields

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "cropName": "Tomatoes",
    "images": [
      "https://res.cloudinary.com/farm/image/upload/v1234567890/farm/crops/tomato_abc123.jpg",
      "https://res.cloudinary.com/farm/image/upload/v1234567891/farm/crops/tomato_def456.jpg"
    ],
    "imagePublicIds": ["farm/crops/tomato_abc123", "farm/crops/tomato_def456"]
  }
}
```

### Update Crop Images
```
PUT /api/crops/:cropId/images
Content-Type: multipart/form-data
Authorization: Bearer token

FormData:
  - files[] (new images)

Response: Updated crop with new image URLs
```

### Delete Crop (Cleans Up Cloudinary)
```
DELETE /api/crops/:cropId
Authorization: Bearer token

→ Deletes from MongoDB
→ Deletes images from Cloudinary
```

---

## 🎨 Image Transformations

Use these in your templates to generate optimized URLs:

### In React Components
```jsx
// Original image URL from Cloudinary
const imageUrl = "https://res.cloudinary.com/farm/image/upload/farm/crops/tomato.jpg";

// Thumbnail (300x300)
const thumbnail = imageUrl.replace(
  '/image/upload/',
  '/image/upload/w_300,h_300,c_fill/'
);

// Mobile optimized (640x480, auto quality)
const mobile = imageUrl.replace(
  '/image/upload/',
  '/image/upload/w_640,h_480,q_auto,f_auto/'
);

// Display
<img src={thumbnail} alt="Crop" />
```

### Pre-defined Transformation Helper
```javascript
// In your component
import { getThumbnailUrl } from '../../services/uploadService';

const thumbnail = getThumbnailUrl(crop.imagePublicIds[0]);
<img src={thumbnail} alt="thumbnail" />
```

---

## 🛡️ Security Checklist

- [ ] Never expose API_SECRET in frontend code
- [ ] Always validate file types on backend
- [ ] Set max file size limits (50MB)
- [ ] Use HTTPS for all uploads
- [ ] Authenticate users before allowing uploads
- [ ] Store public_id to enable deletion
- [ ] Rate limit upload endpoints
- [ ] Use upload presets for restricting uploads
- [ ] Implement virus scanning for production

---

## 📊 Folder Structure on Cloudinary

```
Cloudinary Dashboard → Media Library

farm/
├── profiles/
│   ├── user_123.jpg
│   ├── user_456.jpg
│   └── ...
│
├── crops/
│   ├── tomato_abc.jpg
│   ├── tomato_def.jpg
│   ├── apple_ghi.jpg
│   └── ...
│
├── kyc/
│   ├── farmer_123_aadhaar.pdf
│   ├── farmer_123_pancard.pdf
│   └── ...
│
├── orders/
│   ├── order_123_invoice.pdf
│   ├── order_456_receipt.pdf
│   └── ...
│
└── reviews/
    ├── review_123_img1.jpg
    ├── review_123_img2.jpg
    └── ...
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "401 Unauthorized" | Wrong API credentials | Check .env, regenerate keys |
| "Upload failed 413" | File too large | Check size limits (50MB default) |
| "CORS error" | Frontend blocked | Add domain to Cloudinary settings |
| "Cannot read property url" | Upload response structure | Check Cloudinary SDK version |
| "Old images still showing" | Caching issue | Add `?cache-bust=${Date.now()}` |

---

## 📞 Support Resources

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Node.js SDK:** https://cloudinary.com/documentation/node_integration
- **Image Transformations:** https://cloudinary.com/documentation/image_transformations
- **Community:** https://community.cloudinary.com

---

## 💡 Pro Tips

1. **Global CDN:** Users worldwide get fast image delivery
2. **Auto-format:** Images converted to optimal format per browser
3. **Quality optimization:** Reduced file size without quality loss
4. **On-the-fly transformations:** Generate thumbnails without storing multiple copies
5. **Free tier:** 25GB storage perfect for starting out
6. **Alias URLs:** Create readable URLs for your images

---

## 🚀 Next Steps After Setup

1. ✅ Add Cloudinary credentials to .env
2. ✅ Update your first route to use new middleware
3. ✅ Test upload with Postman or frontend
4. ✅ Monitor Cloudinary dashboard for uploads
5. ✅ Deploy to production when ready
6. ✅ Implement image optimization in templates

---

**All set? Start uploading! 🚀**
