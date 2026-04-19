import { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PageTransition from '../../components/common/PageTransition.jsx';
import BackButton from '../../components/common/BackButton';
import ForgotPassword from './ForgotPassword';

export default function Login() {
  const { navigate } = useRouter();
  const { login, redirectPath, clearRedirectPath } = useAuth();
  const { addToast } = useToast();
  const formRef = useRef(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Valid email format required (example@domain.com)';
    }
    
    if (!formData.password || !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('Please fix the errors in the form', 'error');
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('🔐 Attempting login with email:', formData.email);
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      if (!response || !response.user) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Login successful! User:', response.user);
      addToast('Login successful!', 'success');

      // Clear form immediately
      setFormData({ email: '', password: '' });
      if (formRef.current) {
        formRef.current.reset();
      }

      // Give auth context time to update state (100ms) then navigate
      const verificationStatus = response.user?.kycStatus || 'pending';
      
      if (verificationStatus !== 'verified') {
        console.log('⏳ User not verified, redirecting to verification');
        navigate('/verification/progress');
      } else if (redirectPath) {
        console.log('🔗 Redirecting to saved path:', redirectPath);
        clearRedirectPath();
        navigate(redirectPath);
      } else if (response.user?.role === 'farmer') {
        console.log('🌾 Farmer user, redirecting to dashboard');
        navigate('/farmer/dashboard');
      } else if (response.user?.role === 'admin') {
        console.log('⚙️ Admin user, redirecting to admin panel');
        navigate('/admin/dashboard');
      } else {
        console.log('🛒 Buyer user, redirecting to marketplace');
        navigate('/marketplace');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      
      let errorMessage = 'Login failed';
      
      // Parse different error formats from backend
      const errorData = error?.response?.data || error;
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Specific error handling
      if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('not found')) {
        errorMessage = 'Email or password is incorrect. Please try again.';
      } else if (errorMessage.toLowerCase().includes('unverified') || errorMessage.toLowerCase().includes('verification')) {
        errorMessage = 'Your account is pending verification. Please check your email.';
      }
      
      console.log('📢 Showing error to user:', errorMessage);
      addToast(errorMessage, 'error');
      setErrors({ submit: errorMessage });
    }
  };

  const handleRegisterClick = () => {
    navigate('/auth/register');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 relative">
        <Card variant="deep" className="w-full max-w-md animate-scale-in relative z-10 bg-white/20 backdrop-blur-lg border border-white/10 shadow-2xl">
          <div className="p-10">
            {/* Back Button */}
            <div className="mb-6">
              <BackButton label="Go Back" />
            </div>

            {/* Logo */}
            {!showForgotPassword && (
              <div className="flex justify-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🌾</span>
                </div>
              </div>
            )}

            {showForgotPassword ? (
              <>
                <ForgotPassword onBack={() => setShowForgotPassword(false)} />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">Welcome Back</h1>
                <p className="text-gray-600 text-center mb-8 text-sm">Sign in to your FarmDirect account</p>

                <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    error={errors.email}
                    glass={true}
                    autoComplete="off"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        className={`w-full px-4 py-3 backdrop-blur focus:outline-none focus:ring-2 pr-10 transition rounded-xl ${
                          errors.password
                            ? 'border-red-400 focus:ring-red-400'
                            : 'glass-input border-white/30 focus:ring-green-400'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div className="flex justify-between items-center mt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded cursor-pointer" />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-green-600 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full mt-8"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>



                {/* Register Link */}
                <p className="text-center text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={handleRegisterClick}
                    className="text-green-600 font-semibold hover:underline cursor-pointer"
                  >
                    Sign up here
                  </button>
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

