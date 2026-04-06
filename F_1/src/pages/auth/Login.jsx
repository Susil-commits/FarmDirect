import { useState, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, Github } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PageTransition from '../../components/common/PageTransition.jsx';
import ForgotPassword from './ForgotPassword';

export default function Login() {
  const { navigate } = useRouter();
  const { login, redirectPath, clearRedirectPath, initiateGoogleLogin, initiateGitHubLogin } = useAuth();
  const { addToast } = useToast();
  const formRef = useRef(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
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
    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      addToast('Login successful! Redirecting...', 'success');

      // Clear form data immediately after successful login
      setFormData({ email: '', password: '' });
      setErrors({});
      
      // Clear the form ref to remove data from DOM
      if (formRef.current) {
        formRef.current.reset();
      }

      // Check verification status and route accordingly
      setTimeout(() => {
        const verificationStatus = response.user?.kycStatus || 'pending';
        
        // If user is not verified, redirect to verification page
        if (verificationStatus !== 'verified') {
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
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      addToast(error?.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/auth/register');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 relative">
        <Card variant="deep" className="w-full max-w-md animate-scale-in relative z-10 bg-white/20 backdrop-blur-lg border border-white/10 shadow-2xl">
          <div className="p-10">
            {/* Logo */}
            {!showForgotPassword && (
              <div className="flex justify-center mb-8">
                <div className="w-12 h-12 bg-linear-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
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

                {/* Divider */}
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-500 text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button
                    type="button"
                    onClick={initiateGoogleLogin}
                    className="py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition font-medium text-sm cursor-pointer flex items-center justify-center gap-2 group text-gray-900"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={initiateGitHubLogin}
                    className="py-2.5 px-4 bg-gray-900 hover:bg-gray-800 rounded-lg transition font-medium text-sm cursor-pointer flex items-center justify-center gap-2 text-white group"
                  >
                    <Github size={20} />
                    GitHub
                  </button>
                </div>

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

