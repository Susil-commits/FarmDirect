import { useEffect, useRef } from 'react';
import { useRouter } from '../../hooks/useRouter';
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
    
    if (!markedRef.current && user) {
      markedRef.current = true;
      adminService.markKYCResultSeen().then(() => {
        
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
      <div className="min-h-screen bg-gradient-to-br from-[#FBF8F3] via-[#F4EFE6] to-[#FBF8F3] flex items-center justify-center px-4 pt-28 pb-12">
        <div className="max-w-2xl w-full">
          {}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#132E20]/10">
            {}
            <div className="bg-gradient-to-r from-[#132E20] via-[#1B3B2B] to-[#D97736] px-5 sm:px-8 py-10 sm:py-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                <CheckCircle size={56} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                Congratulations!
              </h1>
              <p className="text-white/90 text-lg font-medium">
                Your KYC verification has been approved
              </p>
            </div>

            {}
            <div className="px-5 sm:px-8 py-8 sm:py-10">
              {}
              <div className="bg-gradient-to-r from-[#FBF8F3] to-[#F4EFE6] rounded-2xl p-6 mb-8 border border-[#132E20]/10">
                {isFarmer ? (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#132E20] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Sprout size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#132E20] mb-2">
                        Start Selling Your Crops!
                      </h3>
                      <p className="text-[#132E20]/80 leading-relaxed">
                        Your account is now fully verified. You can now list your crops on the marketplace, 
                        set your prices, and start selling to buyers across the country. 
                        Your farm-fresh produce is ready to reach new customers!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#D97736] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <ShoppingBag size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#D97736] mb-2">
                        Start Exploring the Marketplace!
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        Your account is now fully verified. You can now browse the marketplace, 
                        discover fresh crops from verified farmers, add items to your wishlist, 
                        and place orders with confidence.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {isFarmer ? "Here's what you can do now:" : "Here's what you can do now:"}
                </h3>
                <div className="space-y-3">
                  {isFarmer ? (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-[#132E20]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#132E20] font-bold">1</span>
                        </div>
                        <span>Post your crops with photos, descriptions, and pricing</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-[#132E20]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#132E20] font-bold">2</span>
                        </div>
                        <span>Manage your inventory and track orders from buyers</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-[#132E20]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#132E20] font-bold">3</span>
                        </div>
                        <span>Build your reputation with ratings and reviews</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-[#D97736]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#D97736] font-bold">1</span>
                        </div>
                        <span>Browse the marketplace for fresh, farm-direct crops</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-[#D97736]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#D97736] font-bold">2</span>
                        </div>
                        <span>Add crops to your wishlist and shopping cart</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 bg-[#D97736]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#D97736] font-bold">3</span>
                        </div>
                        <span>Place orders and track deliveries in real-time</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleContinue}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#132E20] to-[#1B3B2B] text-white font-bold text-lg rounded-xl hover:opacity-95 transition-all duration-300 shadow-lg shadow-[#132E20]/25 transform hover:-translate-y-0.5"
                >
                  {isFarmer ? 'Go to Farmer Dashboard' : 'Go to Buyer Dashboard'}
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={handleGoToMarketplace}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-[#132E20] font-bold text-lg rounded-xl border-2 border-[#132E20]/20 hover:bg-[#FBF8F3] hover:border-[#132E20] transition-all duration-300"
                >
                  <ShoppingBag size={20} />
                  Explore Marketplace
                </button>
              </div>
            </div>
          </div>

          {}
          <p className="text-center text-gray-500 text-sm mt-6">
            Welcome to the FarmConnect community! We're excited to have you on board.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}