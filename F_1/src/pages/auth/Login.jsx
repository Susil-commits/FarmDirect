import { useState, useRef } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
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
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      if (!response || !response.user) {
        throw new Error('Invalid response from server');
      }

      addToast('Login successful!', 'success');

      // Clear form immediately
      setFormData({ email: '', password: '' });
      if (formRef.current) {
        formRef.current.reset();
      }

      // Give auth context time to update state (100ms) then navigate
      const verificationStatus = response.user?.kycStatus || 'not_submitted';
      
      // Check if this is an existing user who has already interacted with KYC
      const isExistingKYCUser = !!(response.user?.kycSubmittedAt || (response.user?.kycDocuments && Object.keys(response.user.kycDocuments).length > 0));
      
      if (verificationStatus === 'not_submitted' && !isExistingKYCUser) {
        navigate('/pending-verification');
      } else if (verificationStatus === 'not_submitted' && isExistingKYCUser) {
        navigate('/verification/progress');
      } else if (verificationStatus === 'pending' || verificationStatus === 'rejected') {
        navigate('/verification/progress');
      } else if (redirectPath) {
        clearRedirectPath();
        navigate(redirectPath);
      } else if (response.user?.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (response.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/marketplace');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      
      let errorMessage = 'Login failed';
      const statusCode = error?.response?.status;
      
      // Parse different error formats from backend
      const errorData = error?.response?.data || error;
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Specific error handling based on status code
      if (statusCode === 404) {
        errorMessage = 'You are not a user. Please register first.';
      } else if (statusCode === 401) {
        errorMessage = 'Email or password is incorrect. Please try again.';
      } else if (errorMessage.toLowerCase().includes('unverified') || errorMessage.toLowerCase().includes('verification')) {
        errorMessage = 'Your account is pending verification. Please check your email.';
      }
      
      addToast(errorMessage, 'error');
      setErrors({ submit: errorMessage });
    }
  };

  const handleRegisterClick = () => {
    navigate('/auth/register');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D97736]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[36px] shadow-2xl p-6 sm:p-8 relative z-10 my-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 transition flex items-center gap-1 cursor-pointer"
            >
              ← Back to Home
            </button>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D97736] bg-[#D97736]/10 px-3 py-1 rounded-full border border-[#D97736]/20">
              SECURE PORTAL
            </span>
          </div>

          {!showForgotPassword && (
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#132E20] to-[#1B3B2B] text-white flex items-center justify-center shadow-lg text-2xl">
                🌾
              </div>
            </div>
          )}

          {showForgotPassword ? (
            <ForgotPassword onBack={() => setShowForgotPassword(false)} />
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#132E20]">
                  Welcome <span className="italic text-[#D97736]">back.</span>
                </h1>
                <p className="text-stone-500 text-xs mt-1">Sign in to your FarmDirect account</p>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  error={errors.email}
                  autoComplete="off"
                />

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-[#D97736] hover:underline font-bold cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 transition ${
                        errors.password ? 'border-red-400 focus:ring-red-400' : 'border-stone-200'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-4 min-h-[48px]"
                >
                  {isLoading ? 'Signing in...' : 'Sign In to Marketplace'}
                </Button>
              </form>

              {/* Register Link */}
              <div className="text-center mt-6 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={handleRegisterClick}
                    className="font-bold text-[#D97736] hover:underline cursor-pointer ml-1"
                  >
                    Sign up wizard →
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}


