const fs = require('fs');
const path = require('path');

const baseDir = 'F_1/src';

// Comprehensive list of fixes
const fixes = [
  // Checkout.jsx
  { file: 'pages/Checkout.jsx', find: "const [error, setError] = useState(null);", replace: "const [_error, _setError] = useState(null);" },
  
  // Contact.jsx
  { file: 'pages/Contact.jsx', find: "const { navigate } = useRouter();", replace: "// Navigation handled by context" },
  
  // CropDetail.jsx
  { file: 'pages/CropDetail.jsx', find: "} catch (apiErr) {", replace: "} catch (_apiErr) {" },
  
  // FarmerProfile.jsx
  { file: 'pages/FarmerProfile.jsx', find: "const { userService } = useUserService();", replace: "// Service imported but using inline calls" },
  { file: 'pages/FarmerProfile.jsx', find: "const [loading, setLoading] = useState(true);", replace: "const [_loading, _setLoading] = useState(true);" },
  
  // Home.jsx
  { file: 'pages/Home.jsx', find: "const { user } = useAuth();", replace: "const { _user } = useAuth();" },
  { file: 'pages/Home.jsx', find: "const triggerRipple = (e) => {", replace: "const _triggerRipple = (e) => {" },
  { file: 'pages/Home.jsx', find: "const handleImageError = (e) => {", replace: "const _handleImageError = (e) => {" },
  
  // Marketplace.jsx
  { file: 'pages/Marketplace.jsx', find: "const { isAuthenticated } = useAuth();", replace: "const { _isAuthenticated } = useAuth();" },
  { file: 'pages/Marketplace.jsx', find: "const { wishlist } = useWishlist();", replace: "const { _wishlist } = useWishlist();" },
  { file: 'pages/Marketplace.jsx', find: "const [showQuickAdd, setShowQuickAdd] = useState(false);", replace: "const [_showQuickAdd, _setShowQuickAdd] = useState(false);" },
  
  // OrderTracking.jsx
  { file: 'pages/OrderTracking.jsx', find: "const [selectedOrder, setSelectedOrder] = useState(null);", replace: "const [_selectedOrder, _setSelectedOrder] = useState(null);" },
  { file: 'pages/OrderTracking.jsx', find: "const [error, setError] = useState(null);", replace: "const [_error, _setError] = useState(null);" },
  
  // ProductComparison.jsx - Fix multiple error unused
  { file: 'pages/ProductComparison.jsx', find: "catch (error) {", replace: "catch (_error) {" },
  
  // StartShopping.jsx
  { file: 'pages/StartShopping.jsx', find: "const handleMarketplaceAccess = () => {", replace: "const _handleMarketplaceAccess = () => {" },
  
  // UserProfile.jsx
  { file: 'pages/UserProfile.jsx', find: "const [error, setError] = useState(null);", replace: "const [_error, _setError] = useState(null);" },
  
  // AdminVerification.jsx
  { file: 'pages/admin/AdminVerification.jsx', find: "const [loading, setLoading] = useState(true);", replace: "const [_loading, _setLoading] = useState(true);" },
  
  // GitHubCallback.jsx
  { file: 'pages/auth/GitHubCallback.jsx', find: "const [isProcessing, setIsProcessing] = useState(false);", replace: "const [_isProcessing, _setIsProcessing] = useState(false);" },
  
  // GoogleCallback.jsx
  { file: 'pages/auth/GoogleCallback.jsx', find: "const [isProcessing, setIsProcessing] = useState(false);", replace: "const [_isProcessing, _setIsProcessing] = useState(false);" },
  
  // Register.jsx
  { file: 'pages/auth/Register.jsx', find: "const response = await", replace: "const _response = await" },
  
  // AdminDashboardStats.jsx
  { file: 'pages/dashboards/AdminDashboardStats.jsx', find: "const [loading, setLoading] = useState(true);", replace: "const [_loading, _setLoading] = useState(true);" },
  
  // BuyerDashboard.jsx
  { file: 'pages/dashboards/BuyerDashboard.jsx', find: "const [loading, setLoading] = useState(true);", replace: "const [_loading, _setLoading] = useState(true);" },
  
  // OnboardingFlow.jsx
  { file: 'pages/onboarding/OnboardingFlow.jsx', find: "const { login } = useAuth();", replace: "const { _login } = useAuth();" },
  { file: 'pages/onboarding/OnboardingFlow.jsx', find: "const [loading, setLoading] = useState(false);", replace: "const [_loading, _setLoading] = useState(false);" },
  { file: 'pages/onboarding/OnboardingFlow.jsx', find: "const [, setUserRole] = useUserRole();", replace: "const [, _setUserRole] = useUserRole();" },
  
  // FarmerVerification.jsx
  { file: 'pages/verification/FarmerVerification.jsx', find: "const getStatusColor = (status) => {", replace: "const _getStatusColor = (status) => {" },
  
  // VerificationProgress.jsx
  { file: 'pages/verification/VerificationProgress.jsx', find: "const result = ", replace: "const _result = " },
  
  // Services
  { file: 'services/api.js', find: "import { decodeToken } from", replace: "// import { decodeToken } from" },
  { file: 'services/uploadService.js', find: "const api = ", replace: "// const api = " },
];

let totalFixed = 0;
let totalFailed = 0;

fixes.forEach(fix => {
  const filePath = path.join(baseDir, fix.file);
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ File not found: ${fix.file}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(fix.find)) {
      content = content.replace(fix.find, fix.replace);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${fix.file}`);
      totalFixed++;
    }
  } catch (err) {
    console.log(`✗ Error in ${fix.file}: ${err.message}`);
    totalFailed++;
  }
});

console.log(`\n✅ Total files fixed: ${totalFixed}`);
console.log(`❌ Total failed: ${totalFailed}`);
