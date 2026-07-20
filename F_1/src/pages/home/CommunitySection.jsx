import ScrollAnimation from '../../components/common/ScrollAnimation';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import { Loader2, Info } from 'lucide-react';

export default function CommunitySection({ stats, statsLoading }) {
  return (
    <section className="py-20 px-4 relative bg-white">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation className="scroll-slide mb-16">
          <h2 className="text-4xl font-bold text-gray-900 text-center animate-slide-in-down mb-2">Our Growing Community</h2>
          <p className="text-center text-gray-600 text-lg">Real farmers, real customers, real impact</p>
        </ScrollAnimation>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Farmers Card */}
          <ScrollAnimation className="scroll-slide">
            <div className="bg-green-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
              <div className="text-5xl font-bold text-green-600 mb-4 text-center">
                <AnimatedNumber 
                  value={stats?.farmers} 
                  duration={2000}
                  suffix={stats?.farmers != null ? "+" : ""}
                />
              </div>
              <p className="text-gray-700 font-bold text-lg text-center mb-2">Active Farmers</p>
              <p className="text-gray-600 text-sm text-center">Growing their business with fair prices</p>
              <div className="mt-4 pt-4 border-t border-green-200 text-center">
                <span className="text-2xl">🌾</span>
              </div>
            </div>
          </ScrollAnimation>

          {/* Customers Card */}
          <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.1s' }}>
            <div className="bg-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
              <div className="text-5xl font-bold text-blue-600 mb-4 text-center">
                <AnimatedNumber 
                  value={stats?.customers} 
                  duration={2000}
                  suffix={stats?.customers != null ? "+" : ""}
                />
              </div>
              <p className="text-gray-700 font-bold text-lg text-center mb-2">Happy Customers</p>
              <p className="text-gray-600 text-sm text-center">Trust us for quality produce</p>
              <div className="mt-4 pt-4 border-t border-blue-200 text-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </ScrollAnimation>

          {/* Varieties Card */}
          <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.2s' }}>
            <div className="bg-orange-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-orange-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
              <div className="text-5xl font-bold text-orange-600 mb-4 text-center">
                <AnimatedNumber 
                  value={stats?.varieties} 
                  duration={2000}
                  suffix={stats?.varieties != null ? "+" : ""}
                />
              </div>
              <p className="text-gray-700 font-bold text-lg text-center mb-2">Crop Varieties</p>
              <p className="text-gray-600 text-sm text-center">Various fresh produce</p>
              <div className="mt-4 pt-4 border-t border-orange-200 text-center">
                <span className="text-2xl">🥬</span>
              </div>
            </div>
          </ScrollAnimation>

          {/* Orders Card */}
          <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.3s' }}>
            <div className="bg-red-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
              <div className="text-5xl font-bold text-red-600 mb-4 text-center">
                <AnimatedNumber 
                  value={stats?.orders} 
                  duration={2000}
                  suffix={stats?.orders != null ? "+" : ""}
                />
              </div>
              <p className="text-gray-700 font-bold text-lg text-center mb-2">Total Orders</p>
              <p className="text-gray-600 text-sm text-center">Successful transactions</p>
              <div className="mt-4 pt-4 border-t border-red-200 text-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </ScrollAnimation>
        </div>

        {/* Backend loading notice */}
        {statsLoading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading live stats…</span>
          </div>
        ) : (
          <div className="mt-8 flex items-start justify-center gap-2 text-gray-400 text-xs max-w-xl mx-auto">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Our backend is hosted on Render's free tier and may take a few seconds to wake up
              (cold start), so the counts above may briefly show fallback values while live data loads.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
