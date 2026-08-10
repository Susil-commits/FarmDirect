import { useState, useRef } from 'react';
import { Mail, Lock, User, Phone, MapPin, Home, Building2, MapPinned, Hash, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PageTransition from '../../components/common/PageTransition.jsx';

export default function Register() {
  const { navigate } = useRouter();
  const { register } = useAuth();
  const { addToast } = useToast();
  const formRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Role, 2: Personal Details & Password, 3: Address & Location
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
  const [addressNA, setAddressNA] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length > 5) strength += 20;
    if (password.length > 7) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const handlePasswordChange = (e) => {
    handleChange(e);
    setPasswordStrength(calculatePasswordStrength(e.target.value));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.firstName || !formData.firstName.trim()) newErrors.firstName = 'First name required';
    if (!formData.lastName || !formData.lastName.trim()) newErrors.lastName = 'Last name required';
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Valid email required';
    }
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = 'Minimum 10 digits required';
    }
    if (!formData.password || !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Min 6 characters';
    }
    if (!formData.confirmPassword || !formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (role === 'farmer' && (!formData.location || !formData.location.trim())) {
      newErrors.location = 'Farm location is required';
    }
    if (!addressNA) {
      if (!formData.address || !formData.address.trim()) newErrors.address = 'Address required';
      if (!formData.city || !formData.city.trim()) newErrors.city = 'City required';
      if (!formData.state || !formData.state.trim()) newErrors.state = 'State required';
      if (!formData.pincode || !formData.pincode.trim()) {
        newErrors.pincode = 'Pincode required';
      } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
        newErrors.pincode = 'Must be 6 digits';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      } else {
        addToast('Please complete step 2 fields correctly', 'error');
      }
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) {
      addToast('Please complete location fields correctly', 'error');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
        ...(role === 'farmer' && { location: formData.location }),
        address: addressNA ? 'NA' : formData.address,
        city: addressNA ? 'NA' : formData.city,
        state: addressNA ? 'NA' : formData.state,
        pincode: addressNA ? 'NA' : formData.pincode,
      });

      addToast('Account created successfully! Redirecting...', 'success');
      navigate('/auth/login');
    } catch (error) {
      console.error('❌ Registration error:', error);
      setIsLoading(false);
      let errorMessage = 'Registration failed';
      const errorData = error?.response?.data || error;
      if (typeof errorData === 'string') errorMessage = errorData;
      else if (errorData?.message) errorMessage = errorData.message;
      else if (error?.message) errorMessage = error.message;

      if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exist')) {
        errorMessage = 'Email already registered. Try logging in.';
        setStep(2);
        setErrors({ email: 'Email already registered' });
      }
      addToast(errorMessage, 'error');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D97736]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[36px] shadow-2xl p-6 sm:p-8 relative z-10 my-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={step === 1 ? () => navigate('/') : handlePrev}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> {step === 1 ? 'Home' : 'Back'}
            </button>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-[#D97736]'
                      : s < step
                      ? 'w-4 bg-[#132E20]'
                      : 'w-4 bg-stone-200'
                  }`}
                ></div>
              ))}
            </div>

            <button
              onClick={() => navigate('/auth/login')}
              className="text-xs font-bold text-[#132E20] hover:text-[#D97736] transition cursor-pointer"
            >
              Log in →
            </button>
          </div>

          <div className="text-center mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D97736] bg-[#D97736]/10 px-3 py-1 rounded-full border border-[#D97736]/20 inline-block mb-2">
              STEP {step} OF 3
            </span>
            <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#132E20]">
              {step === 1 && <>Choose <span className="italic text-[#D97736]">account type.</span></>}
              {step === 2 && <>Personal <span className="italic text-[#D97736]">details.</span></>}
              {step === 3 && <>Location & <span className="italic text-[#D97736]">address.</span></>}
            </h1>
          </div>

          <form ref={formRef} onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div
                  onClick={() => setRole('buyer')}
                  className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    role === 'buyer'
                      ? 'bg-[#132E20] text-white border-[#132E20] shadow-xl scale-[1.02]'
                      : 'bg-stone-50 text-[#132E20] border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md ${
                      role === 'buyer' ? 'bg-[#D97736] text-white' : 'bg-emerald-100'
                    }`}>
                      🛒
                    </div>
                    <div>
                      <h3 className="font-serif-display font-bold text-lg">Buyer / Household</h3>
                      <p className={`text-xs ${role === 'buyer' ? 'text-white/80' : 'text-stone-500'}`}>Order fresh organic crops direct from local farms</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    role === 'buyer' ? 'bg-[#D97736] border-[#D97736] text-white' : 'border-stone-300'
                  }`}>
                    {role === 'buyer' && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

                <div
                  onClick={() => setRole('farmer')}
                  className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    role === 'farmer'
                      ? 'bg-[#132E20] text-white border-[#132E20] shadow-xl scale-[1.02]'
                      : 'bg-stone-50 text-[#132E20] border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md ${
                      role === 'farmer' ? 'bg-[#D97736] text-white' : 'bg-emerald-100'
                    }`}>
                      🌱
                    </div>
                    <div>
                      <h3 className="font-serif-display font-bold text-lg">Farmer / Grower</h3>
                      <p className={`text-xs ${role === 'farmer' ? 'text-white/80' : 'text-stone-500'}`}>Sell your harvest with 85%+ margin and zero middlemen</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    role === 'farmer' ? 'bg-[#D97736] border-[#D97736] text-white' : 'border-stone-300'
                  }`}>
                    {role === 'farmer' && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-6 min-h-[48px]"
                >
                  <span>Continue to Details</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    error={errors.firstName}
                    icon={User}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    error={errors.lastName}
                    icon={User}
                    required
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  error={errors.email}
                  icon={Mail}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  error={errors.phone}
                  icon={Phone}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    error={errors.password}
                    icon={Lock}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    error={errors.confirmPassword}
                    icon={Lock}
                    required
                  />
                </div>

                {formData.password && (
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase">Password Strength</span>
                      <span className="text-[10px] font-bold text-[#D97736]">{passwordStrength}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#D97736] to-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4 min-h-[48px]"
                >
                  <span>Continue to Location</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 animate-fade-in">
                {role === 'farmer' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Farm Region / Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-emerald-600" size={18} />
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">Select your farm region...</option>
                        {['Maharashtra', 'Punjab', 'Himachal Pradesh', 'Haryana', 'Karnataka', 'Uttar Pradesh', 'West Bengal', 'Delhi NCR'].map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                  </div>
                )}

                {role === 'farmer' && (
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressNA}
                      onChange={() => setAddressNA(!addressNA)}
                      className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span>Farm address not applicable / use GPS location only</span>
                  </label>
                )}

                {!addressNA && (
                  <>
                    <Input
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Plot No. 12, Farm Gate Road"
                      error={errors.address}
                      icon={Home}
                      required
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Nashik"
                        error={errors.city}
                        icon={Building2}
                        required
                      />
                      <Input
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="MH"
                        error={errors.state}
                        icon={MapPinned}
                        required
                      />
                      <Input
                        label="Pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="422001"
                        error={errors.pincode}
                        icon={Hash}
                        required
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#D97736] hover:bg-[#c06528] text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-4 min-h-[48px]"
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <Check size={18} strokeWidth={3} />
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </PageTransition>
  );
}


