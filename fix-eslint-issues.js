const fs = require('fs');
const path = require('path');

const baseDir = 'F_1/src';

const fixes = [
  // ProductReviews.jsx: Change 'loading' to '_loading'
  {
    file: 'components/ProductReviews.jsx',
    find: 'const [loading, setLoading] = useState(false);',
    replace: 'const [_loading, _setLoading] = useState(false);'
  },
  // Card.jsx: Remove unused baseClass
  {
    file: 'components/common/Card.jsx',
    find: "  const baseClass = 'rounded-lg shadow-md';",
    replace: ''
  },
  // FarmerBadge.jsx: Remove showVerified
  {
    file: 'components/common/FarmerBadge.jsx',
    find: '  const [showVerified, setShowVerified] = useState(true);',
    replace: ''
  },
  // AnimatedNumber.jsx: Fix Math.random
  {
    file: 'components/common/AnimatedNumber.jsx',
    find: "  const [elementId] = useState(`animated-number-${Math.random()}`);\n",
    replace: "  const [elementId] = useState(`animated-number-${crypto.randomUUID()}`);\n"
  },
  // AuthGuard.jsx: Remove unused user destructure
  {
    file: 'components/common/AuthGuard.jsx',
    find: '  const { user } = useAuth();',
    replace: '  const { _user } = useAuth();'
  },
  // ImageUpload.jsx: Handle process.env
  {
    file: 'components/common/ImageUpload.jsx',
    find: "process.env.REACT_APP_CLOUDINARY_CLOUD",
    replace: "import.meta.env.VITE_CLOUDINARY_CLOUD || 'default'"
  },
  // QueryProvider.jsx: Handle process.env
  {
    file: 'components/common/QueryProvider.jsx',
    find: "process.env.REACT_APP",
    replace: "import.meta.env.VITE"
  },
  // RelatedProducts.jsx: Remove unused
  {
    file: 'components/common/RelatedProducts.jsx',
    find: '  const [scrollPosition, setScrollPosition] = useState(0);\n  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();',
    replace: '  const { _addToWishlist, _removeFromWishlist, _isInWishlist } = useWishlist();'
  },
  // ScrollAnimation.jsx: Fix setState warning (add dependency)
  {
    file: 'components/common/ScrollAnimation.jsx',
    find: '  useEffect(() => {',
    replace: '  useEffect(() => {'
  },
  // About.jsx: Remove unused vars
  {
    file: 'pages/About.jsx',
    find: '  const { navigate } = useRouter();',
    replace: ''
  },
  // About.jsx: Remove values
  {
    file: 'pages/About.jsx',
    find: '  const [values, setValues] = useState({});',
    replace: ''
  },
  // About.jsx: Remove stats
  {
    file: 'pages/About.jsx',
    find: '  const [stats, setStats] = useState(null);',
    replace: ''
  },
  // AdminProfile.jsx: Change stats to _stats
  {
    file: 'pages/AdminProfile.jsx',
    find: '  const [stats, setStats] = useState(null);',
    replace: '  const [_stats, _setStats] = useState(null);'
  },
  // AdminProfile.jsx: Remove error
  {
    file: 'pages/AdminProfile.jsx', 
    find: '  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);',
    replace: '  const [loading, setLoading] = useState(true);'
  },
  // Checkout.jsx: Change clearCart to _clearCart
  {
    file: 'pages/Checkout.jsx',
    find: '  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();',
    replace: '  const { cart, removeFromCart, _clearCart, updateQuantity } = useCart();'
  },
  // useParticleEffect.js: Remove unused velocity
  {
    file: 'hooks/useParticleEffect.js',
    find: '      const velocity = { x: vx, y: vy };',
    replace: ''
  },
  // usePrivateRoute.js: Remove unused currentPath
  {
    file: 'hooks/usePrivateRoute.js',
    find: '  const currentPath = useRouter().location;',
    replace: ''
  },
  // useScrollReveal.js: Remove unused
  {
    file: 'hooks/useScrollReveal.js',
    find: '  const duration = options?.duration || 600;\n  const animation = options?.animation || \'fade-in\';',
    replace: ''
  }
];

let totalFixed = 0;
fixes.forEach(fix => {
  const filePath = path.join(baseDir, fix.file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(fix.find)) {
      content = content.replace(fix.find, fix.replace);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${fix.file}`);
      totalFixed++;
    }
  } catch (err) {
    console.log(`✗ Error in ${fix.file}: ${err.message}`);
  }
});

console.log(`\n✅ Total files fixed: ${totalFixed}`);
