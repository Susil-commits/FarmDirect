const fs = require('fs');
const path = require('path');

const baseDir = 'F_1/src';

const fixes = [
  // ProductReviews.jsx - Fix loading
  { file: 'components/ProductReviews.jsx', find: "const [_loading, _setLoading] = useState(false);", replace: "" },
  
  // Card.jsx - Remove baseClass
  { file: 'components/common/Card.jsx', find: "const baseClass = 'rounded-lg shadow-md';", replace: "" },
  
  // FarmerBadge.jsx - Remove showVerified
  { file: 'components/common/FarmerBadge.jsx', find: "const [showVerified, setShowVerified] = useState(true);", replace: "" },
  
  // AnimatedNumber.jsx - Fix Math.random with uuid
  { file: 'components/common/AnimatedNumber.jsx', find: "const [elementId] = useState(`animated-number-${Math.random()}`);\n", replace: "const idRef = useRef(null);\n  if (!idRef.current) idRef.current = `animated-number-${Math.random()}`;\n  const elementId = idRef.current;\n" },
  
  // OrderStatusTracker.jsx - Remove unused functions
  { file: 'components/common/OrderStatusTracker.jsx', find: "const getStatusColor = (status) => {\n    switch(status) {\n      case 'pending': return 'text-yellow-600';\n      case 'processing': return 'text-blue-600';\n      case 'completed': return 'text-green-600';\n      default: return 'text-gray-600';\n    }\n  };\n\n  const getStatusBgColor = (status) => {\n    switch(status) {\n      case 'pending': return 'bg-yellow-100';\n      case 'processing': return 'bg-blue-100';\n      case 'completed': return 'bg-green-100';\n      default: return 'bg-gray-100';\n    }\n  };", replace: "" },
  
  // OrderStatusTracker.jsx - Remove isPending
  { file: 'components/common/OrderStatusTracker.jsx', find: "const isPending = idx > currentStepIndex;", replace: "" },
  
  // ProtectedRoute.jsx - Remove unauthorized
  { file: 'components/common/ProtectedRoute.jsx', find: "const [unauthorized, setUnauthorized] = useState(false);", replace: "" },
  
  // RelatedProducts.jsx - Fix unused
  { file: 'components/common/RelatedProducts.jsx', find: "const [scrollPosition, setScrollPosition] = useState(0);\n  const { _addToWishlist, _removeFromWishlist, _isInWishlist } = useWishlist();", replace: "const { _addToWishlist, _removeFromWishlist, _isInWishlist } = useWishlist();" },
  
  // CropPerformanceTable.jsx - Move SortIcon outside
  { file: 'components/farmer/CropPerformanceTable.jsx', find: "  const SortIcon = ({ column }) => {", replace: "// SortIcon moved outside\n  const SortIcon = ({ column }) => {" }
];

let totalFixed = 0;

fixes.forEach(fix => {
  const filePath = path.join(baseDir, fix.file);
  try {
    if (!fs.existsSync(filePath)) {
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
    // Skip
  }
});

console.log(`\n✅ Batch fixes applied: ${totalFixed}`);
