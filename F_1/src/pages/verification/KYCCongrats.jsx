import { useEffect, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/appService';
import PageTransition from '../../components/common/PageTransition';
import { CheckCircle, ArrowRight, ShoppingBag, Sprout } from 'lucide-react';

export default function KYCCongrats() {
  const { user, setUser } = useAuth();
  const { navigate } = useRouter();
  const markedRef = useRef(false);

  const isFarmer = user?.role === 'farmer';

  useEffect(() => {
    // Mark KYC result as seen so this page doesn't show again
    if (!markedRef.current && user) {
      markedRef.current = true;
      adminService.markKYCResultSeen().then(() => {
        // Update local user state to reflect kycResultSeen = true
        if (setUser) {
          setUser({ ...user, kycResultSeen: true });
        }
      }).catch(err => {
        console.error('Failed to mark KYC result as seen:', err);
      });
    }
  }, [user, setUser]);

  const handleContinue = () => {
    if (isFarmer) {
      navigate('/farmer/dashboard');
    } else {
      navigate('/buyer/dashboard');
    }
  };

  const handleGoToMarketplace = () => {
    navigate('/marketplace');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Top Celebration Bar */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 sm:px-8 py-10 sm:py-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                <CheckCircle size={56} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                Congratulations!
              </h1>
              <p className="text-green-100 text-lg font-medium">
                Your KYC verification has been approved
              </p>
            </div>

            {/* Content */}
            <div className="px-5 sm:px-8 py-8 sm:py-10">
              {/* Role-specific message */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-100">
                {isFarmer ? (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sprout size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        Start Selling Your Crops!
                      </h3>
                      <p className="text-green-700 leading-relaxed">
                        Your account is now fully verified. You can now list your crops on the marketplace, 
                        set your prices, and start selling to buyers across the country. 
                        Your farm-fresh produce is ready to reach new customers!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-800 mb-2">
                        Start Exploring the Marketplace!
                      </h3>
                      <p className="text-emerald-700 leading-relaxed">
                        Your account is now fully verified. You can now browse the marketplace, 
                        discover fresh crops from verified farmers, add items to your wishlist, 
                        and place orders with confidence.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* What's Next */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {isFarmer ? "Here's what you can do now:" : "Here's what you can do now:"}
                </h3>
                <div className="space-y-3">
                  {isFarmer ? (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-bold">1</span>
                        </div>
                        <span>Post your crops with photos, descriptions, and pricing</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-bold">2</span>
                        </div>
                        <span>Manage your inventory and track orders from buyers</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-bold">3</span>
                        </div>
                        <span>Build your reputation with ratings and reviews</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-bold">1</span>
                        </div>
                        <span>Browse the marketplace for fresh, farm-direct crops</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-bold">2</span>
                        </div>
                        <span>Add crops to your wishlist and shopping cart</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-bold">3</span>
                        </div>
                        <span>Place orders and track deliveries in real-time</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleContinue}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5"
                >
                  {isFarmer ? 'Go to Farmer Dashboard' : 'Go to Buyer Dashboard'}
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={handleGoToMarketplace}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-green-700 font-bold text-lg rounded-xl border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
                >
                  <ShoppingBag size={20} />
                  Explore Marketplace
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Welcome to the FarmConnect community! We're excited to have you on board.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}