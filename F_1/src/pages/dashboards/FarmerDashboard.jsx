import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { AlertCircle } from 'lucide-react';
import FarmerAnalytics from '../../components/farmer/FarmerAnalytics';

export default function FarmerDashboard() {
  const { user, verificationStatus } = useAuth();
  const { navigate } = useRouter();

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect non-farmers
  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">Access Denied: Only farmers can view this dashboard</p>
            <Button onClick={() => navigate('/')} variant="primary">
              Go To Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Redirect unverified farmers to verification page
  if (verificationStatus !== 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Account Pending Verification</h2>
            <p className="text-gray-600 mb-6">
              {verificationStatus === 'rejected' 
                ? 'Your documents were rejected. Please resubmit for verification.'
                : 'Please complete the verification process to access your dashboard.'}
            </p>
            <Button onClick={() => navigate('/verification/progress')} variant="primary" className="w-full">
              Complete Verification
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render new analytics dashboard
  return <FarmerAnalytics />;
}
