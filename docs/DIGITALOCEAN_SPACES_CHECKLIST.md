# DigitalOcean Spaces Configuration Checklist

Quick reference for setting up image storage for FaRm Marketplace.

---

## **Phase 1: GitHub Student Pack** ✅

- [ ] Go to https://education.github.com/benefits
- [ ] Verify student status with GitHub
- [ ] Claim DigitalOcean $200 benefit
- [ ] Receive coupon code via email
- [ ] Redeem at https://cloud.digitalocean.com/registrations/new

---

## **Phase 2: DigitalOcean Setup**

### API Token
- [ ] Login to https://cloud.digitalocean.com
- [ ] Go to **Settings → Applications & API**
- [ ] Click **Generate New Token**
- [ ] Name: `Farm-Marketplace-API`
- [ ] Copy **Access Key** and **Secret Key**
- [ ] Store safely in password manager

### Create Space
- [ ] Dashboard → **Spaces** → **Create Space**
- [ ] **Name:** `marketplace-assets`
- [ ] **Region:** `nyc3` (New York - fastest for US)
- [ ] Skip CDN for now
- [ ] Click **Create Space**

---

## **Phase 3: Backend Configuration**

### Environment Setup
- [ ] Open `backend/.env`
- [ ] Add your DigitalOcean credentials:
  ```env
  DIGITALOCEAN_SPACES_KEY=your_key
  DIGITALOCEAN_SPACES_SECRET=your_secret
  DIGITALOCEAN_SPACES_NAME=marketplace-assets
  DIGITALOCEAN_SPACES_REGION=nyc3
  DIGITALOCEAN_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
  ```
- [ ] Save `.env` (don't commit!)

### Install Dependencies
- [ ] `cd backend`
- [ ] Run: `npm install aws-sdk multer`
- [ ] Verify installation: `npm list aws-sdk multer`

### Create Files
- [ ] ✅ `backend/utils/digitaloceanSpaces.js` - Upload/delete helper
- [ ] ✅ `backend/middleware/uploadMiddleware.js` - Multer configuration
- [ ] Create `backend/temp-uploads/` directory (auto-created)

### Update Models
- [ ] Update `CropListing.js` schema:
  - Add `imageUrl` (String, URL to image)
  - Add `imageKey` (String, for deletion)
- [ ] Update `User.js` schema:
  - Add `profilePhoto` (String, URL)
  - Add `profilePhotoKey` (String, for deletion)

### Update Controllers
- [ ] Modify `cropController.js`:
  - Import `uploadToSpaces` and `deleteFromSpaces`
  - Update `createCrop()` to upload
  - Update `deleteCrop()` to delete from Spaces
- [ ] Modify `userController.js`:
  - Add `uploadProfilePhoto()` endpoint
  - Delete old photo before uploading new

### Update Routes
- [ ] Add upload route to `cropRoutes.js`:
  ```javascript
  router.post('/', auth, upload.single('image'), createCrop);
  ```
- [ ] Add profile photo route to `userRoutes.js`:
  ```javascript
  router.post('/profile-photo', auth, upload.single('image'), uploadProfilePhoto);
  ```

---

## **Phase 4: Frontend Configuration**

### Setup
- [ ] `cd F_1`
- [ ] Run: `npm install axios`
- [ ] Create `.env.local` if needed:
  ```
  REACT_APP_API_URL=http://localhost:5000
  ```

### Create Components
- [ ] ✅ `F_1/src/components/common/ImageUpload.jsx` - Upload component
- [ ] ✅ `F_1/src/styles/ImageUpload.css` - Styling

### Integrate in Forms
- [ ] Import `ImageUpload` in Crop creation form
- [ ] Add to JSX:
  ```javascript
  <ImageUpload 
    onUploadSuccess={(url) => setImageUrl(url)}
    folder="crops"
  />
  ```
- [ ] Import in User profile component for profile photo

---

## **Phase 5: Testing**

### Local Testing
- [ ] Start backend: `cd backend && npm start` (should run on :5000)
- [ ] Start frontend: `cd F_1 && npm run dev` (should run on :5173)
- [ ] Test crop image upload
- [ ] Test profile photo upload
- [ ] Verify images appear in DigitalOcean Console

### Verification
- [ ] ✅ File uploaded to `marketplace-assets` Space
- [ ] ✅ Image URL returned to frontend
- [ ] ✅ URL stored in database (check MongoDB)
- [ ] ✅ Image displays in frontend component
- [ ] ✅ Delete functionality removes from Spaces

---

## **Phase 6: Production Setup**

### Domain & CDN (Optional)
- [ ] Enable CDN in DigitalOcean Space settings
- [ ] (Optional) Configure Namecheap SSL for custom domain

### Environment Variables
- [ ] Update production `.env` with credentials
- [ ] Test on staging environment

### Database
- [ ] Run migration (if needed) to update existing records
- [ ] Backup MongoDB before migration

---

## **Quick Commands**

```bash
# Test DigitalOcean connection
curl -I https://marketplace-assets.nyc3.digitaloceanspaces.com/

# Check backend logs
npm start

# Test API endpoint (after backend runs)
curl -X POST http://localhost:5000/api/upload \
  -F "image=@test.jpg"

# Monitor uploads
tail -f backend/logs.txt
```

---

## **Troubleshooting Quick Fixes**

| Problem | Solution |
|---------|----------|
| **401 Unauthorized** | Check API keys in .env |
| **Bucket not found** | Verify bucket name is 'marketplace-assets' |
| **File too large** | Check max size (5MB in middleware) |
| **CORS errors** | Check backend CORS config |
| **CDN not found** | Wait 15 minutes after enabling, clear cache |

---

## **File Locations**

```
📦 Project Root
├── backend/
│   ├── .env (← ADD credentials here)
│   ├── middleware/uploadMiddleware.js (✅ NEW)
│   ├── utils/digitaloceanSpaces.js (✅ NEW)
│   ├── controllers/cropController.js (✏️ MODIFY)
│   ├── controllers/userController.js (✏️ MODIFY)
│   ├── models/CropListing.js (✏️ MODIFY)
│   ├── models/User.js (✏️ MODIFY)
│   ├── routes/cropRoutes.js (✏️ MODIFY)
│   └── routes/userRoutes.js (✏️ MODIFY)
│
├── F_1/
│   ├── .env.local (optional)
│   └── src/
│       ├── components/common/ImageUpload.jsx (✅ NEW)
│       └── styles/ImageUpload.css (✅ NEW)
│
└── docs/
    └── DIGITALOCEAN_SPACES_SETUP.md (✅ Complete guide)
```

---

## **Cost Tracking**

| Year | Service | Cost |
|------|---------|------|
| 1 | GitHub Student + DigitalOcean | **$0** (using $200 credit) |
| 2+ | DigitalOcean Spaces minimum | **~$5/month** |

---

## **Success Indicators** ✅

When everything works:
1. File upload completes without errors
2. Image appears in DigitalOcean Console
3. URL is stored in MongoDB
4. Image displays in React component
5. No local files take up disk space
6. Delete removes from Spaces too

---

## **Next Steps After Complete Setup**

1. Deploy backend to production
2. Deploy frontend to production  
3. Update production .env with credentials
4. Enable CDN for faster global delivery
5. Set up monitoring/logging
6. Consider backup strategy

---

## **Support Resources**

- DigitalOcean Docs: https://docs.digitalocean.com/products/spaces/
- AWS SDK: https://docs.aws.amazon.com/sdk-for-javascript/
- Multer: https://github.com/expressjs/multer
- GitHub Student Pack: https://education.github.com/benefits

---

**Last Updated:** April 14, 2026  
**Status:** Ready for Implementation
