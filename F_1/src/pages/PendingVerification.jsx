import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition.jsx';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';

export default function PendingVerification() {
  const { navigate } = useRouter();
  const { user, logout } = useAuth();

  // Redirect if not a pending buyer
  if (!user || user.role !== 'buyer' || user.verified === true) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <Card className="border-2 border-blue-200">
            <div className="p-10 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock size={32} className="text-blue-600 animate-spin" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Verification In Progress</h1>
              
              {/* Message */}
              <div className="mb-8 space-y-4">
                <p className="text-gray-600 text-lg">
                  Welcome to <span className="font-bold text-green-600">FarmDirect</span>{' '}
                  <span className="text-2xl">{user.name}!</span>
                </p>
                <p className="text-gray-600">
                  Your account has been created successfully. Our admin team is reviewing your information to ensure platform security and quality.
                </p>
              </div>

              {/* Status Steps */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left space-y-4">
                <div className="flex gap-3">
                  <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Account Created</p>
                    <p className="text-sm text-gray-600">Your profile is registered</p>
                  </div>
                </div>
                <div className="border-l-2 border-blue-300 ml-2.5 h-3"></div>
                <div className="flex gap-3">
                  <Clock size={20} className="text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-semibold text-gray-900">Under Verification</p>
                    <p className="text-sm text-gray-600">Admin review in progress (24-48 hours)</p>
                  </div>
                </div>
                <div className="border-l-2 border-gray-300 ml-2.5 h-3"></div>
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Ready to Shop</p>
                    <p className="text-sm text-gray-600">Start browsing and ordering</p>
                  </div>
                </div>
              </div>

              {/* What's being verified */}
              <div className="mb-8 text-left">
                <h3 className="font-bold text-gray-900 mb-3">We're Verifying:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Your contact information</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Account authenticity</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Payment method (if added)</span>
                  </li>
                </ul>
              </div>

              {/* Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-green-800">
                  <span className="font-bold">💡 Tip:</span> You'll receive an email once your account is verified. Keep an eye on your inbox!
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => navigate('/profile')}
                >
                  View Your Profile
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Logout
                </Button>
              </div>

              {/* Support Text */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Questions? <a href="/contact" className="text-green-600 font-semibold hover:underline">Contact Support</a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
