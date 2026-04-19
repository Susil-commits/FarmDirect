import { CheckCircle, Sparkles } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

export default function CongratulationModal() {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const handleContinue = () => {
    // Clear the congratulation flag
    if (user?.id) {
      localStorage.removeItem(`showCongratulation_${user.id}`);
    }
    
    // Navigate to appropriate dashboard
    if (user?.role === 'farmer') {
      navigate('/farmer/dashboard');
    } else if (user?.role === 'buyer') {
      navigate('/marketplace');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <Sparkles className="w-8 h-8 text-white mx-auto mb-3 animate-pulse" />
            <h1 className="text-3xl font-bold text-white mb-2">Congratulations!</h1>
            <p className="text-green-50 text-sm">Your account has been verified</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-green-50 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Verified!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been approved by our admin team. You now have full access to {user?.role === 'farmer' ? 'list and manage your crops' : 'browse and purchase products'}.
            </p>
            
            {/* Success Details */}
            <div className="bg-green-50 rounded-lg p-4 text-left mb-6 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3">You can now:</h3>
              <ul className="space-y-2 text-sm text-green-800">
                {user?.role === 'farmer' ? (
                  <>
                    <li>✓ Upload and manage your crop listings</li>
                    <li>✓ View customer orders</li>
                    <li>✓ Track your earnings</li>
                    <li>✓ Access the farmer dashboard</li>
                  </>
                ) : (
                  <>
                    <li>✓ Browse all available crops</li>
                    <li>✓ Place orders and make purchases</li>
                    <li>✓ Save favorite items to wishlist</li>
                    <li>✓ Access the marketplace</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Button */}
          <Button
            onClick={handleContinue}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Start Using Platform
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Thank you for joining our community!
          </p>
        </div>
      </div>
    </div>
  );
}
