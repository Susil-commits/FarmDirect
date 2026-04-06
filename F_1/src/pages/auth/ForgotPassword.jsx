import { useState } from 'react';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { passwordResetService } from '../../services/passwordResetService';
import { useToast } from '../../context/ToastContext';

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { addToast } = useToast();

  const validateEmail = () => {
    const newErrors = {};
    if (!email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      await passwordResetService.requestReset(email);
      setIsSubmitted(true);
      addToast('Password reset link sent to your email!', 'success');
    } catch (error) {
      addToast(error?.message || 'Failed to send reset link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h3>
          <p className="text-gray-600 text-sm">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>
        <p className="text-gray-500 text-xs">
          The link expires in 1 hour. If you don't receive it, check your spam folder.
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => {
            setIsSubmitted(false);
            setEmail('');
          }}
        >
          Send Another Email
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-green-600 hover:underline font-semibold"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
      </div>

      <p className="text-gray-600 text-sm">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({});
            }}
            placeholder="your.email@example.com"
            className={`w-full pl-12 pr-4 py-3 backdrop-blur focus:outline-none focus:ring-2 rounded-xl transition bg-white text-gray-900 placeholder-gray-500 ${
              errors.email
                ? 'border-red-400 focus:ring-red-400'
                : 'glass-input border-white/30 focus:ring-green-400'
            }`}
            required
          />
        </div>
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </Button>
    </form>
  );
}

