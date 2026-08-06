import { Clock, CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition.jsx';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';

export default function PendingVerification() {
  const { navigate } = useRouter();
  const { user, logout } = useAuth();

  // Redirect if not a pending user (buyer or farmer) or already verified
  if (!user || (user.role !== 'buyer' && user.role !== 'farmer') || user.kycStatus === 'verified') {
    return null;
  }

  const isFarmer = user.role === 'farmer';
  const roleLabel = isFarmer ? 'Farmer' : 'Buyer';
  const roleEmoji = isFarmer ? '🌾' : '🛒';

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 pt-28 pb-12">
        <div className="max-w-md w-full">
          <Card className="border-2 border-blue-200">
            <div className="p-6 sm:p-10 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock size={32} className="text-blue-600 animate-spin" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome, {user.firstName || user.name?.split(' ')[0]}! {roleEmoji}
              </h1>
              
              {/* Message */}
              <div className="mb-8 space-y-4">
                <p className="text-gray-600 text-lg">
                  Your <span className="font-bold text-green-600">{roleLabel}</span> account has been created successfully.
                </p>
                <p className="text-gray-600">
                  To get started, you'll need to submit your documents for verification. This helps us ensure platform security and quality for everyone.
                </p>
              </div>

              {/* Status Steps */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left space-y-4">
                <div className="flex gap-3">
                  <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Account Created</p>
                    <p className="text-sm text-gray-600">Your {roleLabel.toLowerCase()} profile is registered</p>
                  </div>
                </div>
                <div className="border-l-2 border-blue-300 ml-2.5 h-3"></div>
                <div className="flex gap-3">
                  <FileText size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Submit Documents</p>
                    <p className="text-sm text-gray-600">Upload your KYC documents for verification</p>
                  </div>
                </div>
                <div className="border-l-2 border-gray-300 ml-2.5 h-3"></div>
                <div className="flex gap-3">
                  <Clock size={20} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Verification Review</p>
                    <p className="text-sm text-gray-600">Admin review (typically 24-48 hours)</p>
                  </div>
                </div>
                <div className="border-l-2 border-gray-300 ml-2.5 h-3"></div>
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isFarmer ? 'Start Selling' : 'Ready to Shop'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isFarmer ? 'List your crops and start selling' : 'Start browsing and ordering'}
                    </p>
                  </div>
                </div>
              </div>

              {/* What's needed */}
              <div className="mb-8 text-left">
                <h3 className="font-bold text-gray-900 mb-3">Documents You'll Need:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Government ID (Aadhar Card, PAN, etc.)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Profile photo</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Address proof</span>
                  </li>
                  {isFarmer && (
                    <>
                      <li className="flex gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Land ownership document</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Farm registration certificate</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-green-800">
                  <span className="font-bold">💡 Tip:</span> Keep your documents ready. The process takes only a few minutes!
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => navigate('/verification/progress')}
                >
                  <Upload size={18} />
                  Submit Documents for Verification
                </Button>
                <Button
                  variant="secondary"
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
                  Questions? <button onClick={() => navigate('/contact')} className="text-green-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">Contact Support</button>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
