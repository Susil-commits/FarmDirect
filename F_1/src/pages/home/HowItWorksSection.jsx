import ScrollAnimation from '../../components/common/ScrollAnimation';
import Card from '../../components/common/Card';

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-4 relative z-10 bg-white/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto relative z-10">
        <ScrollAnimation className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            A seamless process whether you are buying fresh produce or selling your harvest.
          </p>
        </ScrollAnimation>

        {/* For Buyers */}
        <div className="mb-24">
          <ScrollAnimation className="mb-12">
            <h3 className="text-2xl md:text-3xl font-black text-emerald-600 text-center flex items-center justify-center gap-3">
              <span>👥</span> For Buyers
            </h3>
          </ScrollAnimation>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <ScrollAnimation className="h-full">
              <div className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-md relative z-10 transform group-hover:rotate-6 transition-transform duration-300">
                  1
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 relative z-10">Sign Up Instantly</h4>
                <div className="space-y-3 text-gray-600 font-medium relative z-10">
                  <div className="flex gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Create a buyer account</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>No technical knowledge needed</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Step 2 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.1s' }}>
              <div className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-md relative z-10 transform group-hover:rotate-6 transition-transform duration-300">
                  2
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 relative z-10">Browse & Select</h4>
                <div className="space-y-3 text-gray-600 font-medium relative z-10">
                  <div className="flex gap-3">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>View fresh, local produce</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Check farmer ratings</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Add to your digital cart</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Step 3 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.2s' }}>
              <div className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-md relative z-10 transform group-hover:rotate-6 transition-transform duration-300">
                  3
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 relative z-10">Checkout & Delivery</h4>
                <div className="space-y-3 text-gray-600 font-medium relative z-10">
                  <div className="flex gap-3">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Secure your payment</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Track your fresh order</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Delivered in 48 hours</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>

        {/* For Farmers */}
        <div>
          <ScrollAnimation className="mb-12">
            <h3 className="text-2xl md:text-3xl font-black text-emerald-600 text-center flex items-center justify-center gap-3">
              <span>🌾</span> For Farmers
            </h3>
          </ScrollAnimation>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Farmer Step 1 */}
            <ScrollAnimation className="h-full">
              <div className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-md relative z-10 transform group-hover:rotate-6 transition-transform duration-300">
                  1
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 relative z-10">Register Farm</h4>
                <div className="space-y-3 text-gray-600 font-medium relative z-10">
                  <div className="flex gap-3">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Create a farmer profile</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Add location details</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Quick 24h verification</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Farmer Step 2 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.1s' }}>
              <div className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-md relative z-10 transform group-hover:rotate-6 transition-transform duration-300">
                  2
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 relative z-10">List Products</h4>
                <div className="space-y-3 text-gray-600 font-medium relative z-10">
                  <div className="flex gap-3">
                    <span className="text-pink-500 font-bold">•</span>
                    <span>Set your own price</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-pink-500 font-bold">•</span>
                    <span>Add crop quantities</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-pink-500 font-bold">•</span>
                    <span>Upload farm photos</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Farmer Step 3 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.2s' }}>
              <div className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-md relative z-10 transform group-hover:rotate-6 transition-transform duration-300">
                  3
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 relative z-10">Earn Directly</h4>
                <div className="space-y-3 text-gray-600 font-medium relative z-10">
                  <div className="flex gap-3">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Receive direct orders</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Arrange simple logistics</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Keep 100% of profit</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </section>
  );
}
