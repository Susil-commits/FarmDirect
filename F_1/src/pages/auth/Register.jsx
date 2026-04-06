import { useState, useRef } from 'react';
import { Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PageTransition from '../../components/common/PageTransition.jsx';

export default function Register() {
  const { navigate } = useRouter();
  const { register } = useAuth();
  const { addToast } = useToast();
  const formRef = useRef(null);
  const [role, setRole] = useState('buyer'); // buyer or farmer
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (role === 'farmer' && !formData.location.trim()) newErrors.location = 'Farm location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
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
      const response = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
        ...(role === 'farmer' && { location: formData.location })
      });

      addToast(`Welcome ${formData.firstName}! Account created successfully. Please log in to continue.`, 'success');
      
      // Clear form data after successful registration
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        location: '',
      });
      setErrors({});
      
      // Clear the form ref to remove data from DOM
      if (formRef.current) {
        formRef.current.reset();
      }
      
      // Navigate to login page - user must log in with credentials
      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      addToast(error?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/auth/login');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 relative">
        <div className="absolute inset-0 premium-gradient"></div>
        <Card variant="deep" className="w-full max-w-md animate-scale-in relative z-10 bg-white/20 backdrop-blur-lg border border-white/10 shadow-2xl">
          <div className="p-10">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🌾</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">Create Account</h1>
            <p className="text-gray-600 text-center mb-8 text-sm">Join FarmDirect and start fresh</p>

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setRole('buyer')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                  role === 'buyer'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Buyer
              </button>
              <button
                onClick={() => setRole('farmer')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                  role === 'farmer'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Farmer
              </button>
            </div>

            {/* Buyer Verification Notice */}
            {role === 'buyer' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <span className="text-blue-600 font-bold text-lg">ℹ️</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Verification Required</p>
                    <p className="text-xs text-blue-800">
                      Buyers need admin verification for platform security. You'll have full access within 24-48 hours after registration.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  error={errors.firstName}
                  glass={true}
                  autoComplete="off"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  error={errors.lastName}
                  glass={true}
                  autoComplete="off"
                />
              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                error={errors.email}
                glass={true}
                autoComplete="off"
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                error={errors.phone}
                glass={true}
                autoComplete="off"
              />

              {role === 'farmer' && (
                <Input
                  label="Farm Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  error={errors.location}
                  glass={true}
                  autoComplete="off"
                />
              )}

              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                error={errors.password}
                glass={true}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                error={errors.confirmPassword}
                glass={true}
                autoComplete="new-password"
              />

              <div className="flex items-start gap-2 pt-4">
                <input type="checkbox" id="terms" className="mt-1 cursor-pointer" required />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the Terms & Conditions
                </label>
              </div>

              <Button 
                type="submit"
                variant="primary" 
                size="md" 
                disabled={isLoading}
                className="w-full mt-8"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-gray-600 text-sm mt-8">
              Already have an account?{' '}
              <button 
                onClick={handleLoginClick}
                className="text-green-600 font-semibold hover:underline cursor-pointer"
              >
                Login
              </button>
            </p>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

