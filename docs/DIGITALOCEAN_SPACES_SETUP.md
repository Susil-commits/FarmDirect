# DigitalOcean Spaces Setup Guide - Complete Process

For your **FaRm Marketplace** to store images externally (not locally).

---

## **Overview**

Using your **$200 GitHub Student Credit** on DigitalOcean to:
- Store crop images (farmer listings)
- Store user profile photos
- Store documentation images
- **Lifetime free** (after credit runs out, $5/month minimum)

---

## **Step 1: Sign Up & Get Credits**

### **1a. Verify GitHub Student Status**
1. Go to: https://education.github.com/benefits
2. Verify your student status
3. Claim DigitalOcean benefit

### **1b. Get $200 Credit Code**
- GitHub Education sends coupon code
- Redeem at: https://cloud.digitalocean.com/registrations/new
- Creates free account + $200 for 1 year

### **1c. Create API Token**
1. Login to: https://cloud.digitalocean.com
2. Go to **Settings → Applications & API**
3. Click **Generate New Token**
4. Name it: `Farm-Marketplace-API`
5. Copy: `Access Key` & `Secret Key`

---

## **Step 2: Create DigitalOcean Space**

### **2a. Create New Space**
1. Dashboard → **Spaces** → **Create Space**
2. **Configuration:**
   - **Space name:** `marketplace-assets`
   - **Region:** `New York (nyc3)` ← Fastest for US
   - **Disable CDN first** (enable later if needed)
3. Click **Create Space**

### **2b. Access Keys**
Space created with access keys from Step 1c

---

## **Step 3: Update Backend Configuration**

### **3a. Add Environment Variables**

Update `backend/.env` with:

```env
# DigitalOcean Spaces
DIGITALOCEAN_SPACES_KEY=your_access_key
DIGITALOCEAN_SPACES_SECRET=your_secret_key
DIGITALOCEAN_SPACES_NAME=marketplace-assets
DIGITALOCEAN_SPACES_REGION=nyc3
DIGITALOCEAN_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DIGITALOCEAN_SPACES_CDN_URL=https://marketplace-assets.nyc3.cdn.digitaloceanspaces.com
```

### **3b. Install Dependencies**

```bash
cd backend
npm install aws-sdk multer
```

**What these do:**
- `aws-sdk` → Connect to DigitalOcean (uses AWS API)
- `multer` → Handle file uploads from React

---

## **Step 4: Backend Integration**

### **4a. Update Crop Controller** (for product images)

In `backend/controllers/cropController.js`:

```javascript
const { uploadToSpaces, deleteFromSpaces } = require('../utils/digitaloceanSpaces');

// Create Crop with Image
exports.createCrop = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await uploadToSpaces(req.file, 'crops');
      imageUrl = uploadResult.url;
    }

    const crop = new CropListing({
      name,
      price,
      description,
      imageUrl, // Store URL, not file path
      farmerId: req.user.id,
    });

    await crop.save();
    res.json({ success: true, crop, imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Crop and Image
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await CropListing.findById(req.params.id);
    
    if (crop.imageKey) {
      await deleteFromSpaces(crop.imageKey);
    }
    
    await CropListing.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Crop deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **4b. Update User Controller** (for profile photos)

In `backend/controllers/userController.js`:

```javascript
const { uploadToSpaces, deleteFromSpaces } = require('../utils/digitaloceanSpaces');

// Upload Profile Photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const uploadResult = await uploadToSpaces(req.file, 'users');
    
    // Delete old profile photo if exists
    if (req.user.profilePhotoKey) {
      await deleteFromSpaces(req.user.profilePhotoKey);
    }

    // Update user
    await User.findByIdAndUpdate(req.user.id, {
      profilePhoto: uploadResult.url,
      profilePhotoKey: uploadResult.key,
    });

    res.json({ 
      success: true, 
      url: uploadResult.url,
      message: 'Profile photo updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **4c. Add Multer Middleware** 

Create `backend/middleware/uploadMiddleware.js`:

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Temporary local storage for processing
const uploadDir = './temp-uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only images
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
```

### **4d. Add Routes with Upload**

In `backend/routes/cropRoutes.js`:

```javascript
const express = require('express');
const cropController = require('../controllers/cropController');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Create crop with image
router.post(
  '/',
  auth,
  upload.single('image'), // 'image' is form field name
  cropController.createCrop
);

// Delete crop and image
router.delete('/:id', auth, cropController.deleteCrop);

module.exports = router;
```

---

## **Step 5: Database Schema Update**

### **Update CropListing Model**

In `backend/models/CropListing.js`:

```javascript
const cropListingSchema = new Schema({
  name: String,
  price: Number,
  description: String,
  // CHANGE THIS:
  // FROM: image: String (local file path)
  // TO: imageUrl + imageKey
  imageUrl: {
    type: String, // Full URL to DigitalOcean
    default: null,
  },
  imageKey: {
    type: String, // Path in Spaces for deletion: 'crops/filename.jpg'
    default: null,
  },
  farmerId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CropListing', cropListingSchema);
```

### **Update User Model**

In `backend/models/User.js`:

```javascript
const userSchema = new Schema({
  // ... existing fields ...
  profilePhoto: {
    type: String, // Full URL to DigitalOcean
    default: null,
  },
  profilePhotoKey: {
    type: String, // For deletion
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
```

---

## **Step 6: React Frontend Setup**

### **6a. Install Dependencies**

```bash
cd F_1
npm install axios
```

### **6b. Create Upload Component**

Create `F_1/src/components/ImageUpload.jsx`:

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = ({ onUploadSuccess, folder = 'uploads' }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      onUploadSuccess(response.data.url);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-upload">
      <form onSubmit={handleUpload}>
        <input
          type="file"
          name="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
        />
        
        {preview && (
          <img 
            src={preview} 
            alt="preview" 
            style={{ maxWidth: '200px', marginTop: '10px' }}
          />
        )}
        
        <button type="submit" disabled={loading || !preview}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ImageUpload;
```

### **6c. Use in Crop Form**

In your crop creation form:

```javascript
import ImageUpload from './ImageUpload';

const [imageUrl, setImageUrl] = useState(null);

<ImageUpload onUploadSuccess={setImageUrl} folder="crops" />
```

---

## **Step 7: Enable CDN (Optional - for faster global delivery)**

### **7a. Enable CDN in DigitalOcean**
1. Dashboard → **Spaces** → Click your space
2. **Settings** → Enable **CDN**
3. Copy CDN URL (e.g., `https://marketplace-assets.nyc3.cdn.digitaloceanspaces.com`)

### **7b. Update .env**
```env
DIGITALOCEAN_SPACES_CDN_URL=https://marketplace-assets.nyc3.cdn.digitaloceanspaces.com
```

---

## **Step 8: Test Everything**

### **8a. Backend Test**
```bash
cd backend
npm start
```

### **8b. Frontend Test**
```bash
cd F_1
npm run dev
```

### **8c. Upload a Test Image**
1. Go to crop creation form
2. Upload an image
3. Check DigitalOcean Console → Spaces → `marketplace-assets` → `crops/`
4. Verify image appears

---

## **Cost Breakdown - Your First Year**

| Service | GitHub Offer | Usage |
|---------|--------------|-------|
| **DigitalOcean Spaces** | $200/year | Full storage + bandwidth |
| **Namecheap SSL** | Free 1 year | HTTPS for images (optional) |

**Year 1:** $0
**Year 2+:** ~$5/month (Spaces minimum) OR free if under limits

---

## **Troubleshooting**

| Issue | Solution |
|-------|----------|
| `Credentials not found` | Check .env file has correct keys |
| `Access Denied` | Verify API token in DigitalOcean Console |
| `File too large` | Max 5MB - adjust in middleware |
| `CDN not working` | Wait 15 mins after enabling, clear cache |

---

## **File Structure After Setup**

```
backend/
├── .env (with DigitalOcean credentials)
├── middleware/
│   └── uploadMiddleware.js (multer config)
├── utils/
│   └── digitaloceanSpaces.js (upload/delete functions)
├── routes/
│   └── cropRoutes.js (updated with upload)
└── controllers/
    └── cropController.js (updated to use Spaces)

F_1/
└── src/components/
    └── ImageUpload.jsx (React upload component)
```

---

## **Next Steps**

1. ✅ Sign up for GitHub Student benefit (DigitalOcean)
2. ✅ Get $200 credit code
3. ✅ Create API token
4. ✅ Create Space: `marketplace-assets`
5. ✅ Update backend .env
6. ✅ Install dependencies (`aws-sdk`, `multer`)
7. ✅ Implement database schema changes
8. ✅ Add upload routes
9. ✅ Create React upload component
10. ✅ Test locally
11. ✅ Deploy to production

---

**Questions?** Check:
- DigitalOcean Docs: https://docs.digitalocean.com/products/spaces/
- AWS SDK: https://github.com/aws/aws-sdk-js
