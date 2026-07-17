import { useState, useRef } from 'react';
import { Mail, Lock, User, Phone, MapPin, Home, Building2, MapPinned, Hash } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PageTransition from '../../components/common/PageTransition.jsx';
import BackButton from '../../components/common/BackButton';

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
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [addressNA, setAddressNA] = useState(false); // For farmers who mark address as NA
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // First name validation
    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    // Last name validation
    if (!formData.lastName || !formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Email validation
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Valid email format required (example@domain.com)';
    }
    
    // Password validation
    if (!formData.password || !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword || !formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Phone validation
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }
    
    // Location validation for farmer
    if (role === 'farmer' && (!formData.location || !formData.location.trim())) {
      newErrors.location = 'Farm location is required for farmers';
    }

    // Address validation - required unless NA is checked
    if (!addressNA) {
      if (!formData.address || !formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (!formData.city || !formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!formData.state || !formData.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!formData.pincode || !formData.pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
        newErrors.pincode = 'Pincode must be 6 digits';
      }
    }

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

  const handleAddressNAToggle = () => {
    const newNA = !addressNA;
    setAddressNA(newNA);
    if (newNA) {
      // Clear address errors when marking NA
      setErrors(prev => {
        const { _address, _city, _state, _pincode, ...rest } = prev;
        return rest;
      });
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
      console.log('📝 Attempting registration for:', formData.email);
      const _response = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
        ...(role === 'farmer' && { location: formData.location }),
        // Send address fields - if NA, send "NA" as value so backend knows
        address: addressNA ? 'NA' : formData.address,
        city: addressNA ? 'NA' : formData.city,
        state: addressNA ? 'NA' : formData.state,
        pincode: addressNA ? 'NA' : formData.pincode,
      });

      console.log('✅ Registration successful!');
      addToast('Account created successfully! Redirecting to login...', 'success');
      
      // Clear form data after successful registration
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        location: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
      setAddressNA(false);
      
      // Clear the form ref to remove data from DOM
      if (formRef.current) {
        formRef.current.reset();
      }
      
      // Navigate to login page immediately
      navigate('/auth/login');
    } catch (error) {
      console.error('❌ Registration error:', error);
      setIsLoading(false);
      
      let errorMessage = 'Registration failed';
      const errorData = error?.response?.data || error;
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Parse specific errors
      if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exist') || errorMessage.toLowerCase().includes('email already')) {
        errorMessage = 'Email already exists. Try a different email.';
        setErrors({ ...errors, email: 'Email already registered' });
      } else if (errorMessage.toLowerCase().includes('validation')) {
        errorMessage = 'Please check all fields and try again.';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      console.log('📢 Showing error to user:', errorMessage);
      addToast(errorMessage, 'error');
    }
  };

  const handleLoginClick = () => {
    navigate('/auth/login');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 relative">
        <div className="absolute inset-0 premium-gradient"></div>
        <Card variant="deep" animated={false} className="w-full max-w-md animate-scale-in relative z-10 bg-white/20 backdrop-blur-lg border border-white/10 shadow-2xl">
          <div className="p-6 sm:p-10">
            {/* Back Button */}
            <div className="mb-6">
              <BackButton label="Go Back" />
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Address Section */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Home size={16} className="text-green-600" />
                    Address Details
                  </h3>
                  {role === 'farmer' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressNA}
                        onChange={handleAddressNAToggle}
                        className="rounded cursor-pointer w-4 h-4 text-green-600"
                      />
                      <span className="text-xs text-gray-500">Mark as N/A</span>
                    </label>
                  )}
                </div>

                {!addressNA && (
                  <div className="space-y-4">
                    <Input
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required={!addressNA}
                      error={errors.address}
                      glass={true}
                      autoComplete="street-address"
                      placeholder="House/Flat No., Street, Area"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required={!addressNA}
                        error={errors.city}
                        glass={true}
                        autoComplete="address-level2"
                        placeholder="Enter city"
                      />
                      <Input
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required={!addressNA}
                        error={errors.state}
                        glass={true}
                        autoComplete="address-level1"
                        placeholder="Enter state"
                      />
                    </div>
                    <Input
                      label="Pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required={!addressNA}
                      error={errors.pincode}
                      glass={true}
                      autoComplete="postal-code"
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                )}

                {addressNA && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      ⚠️ You've marked address as N/A. You'll be asked to provide these details during verification.
                    </p>
                  </div>
                )}
              </div>

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

