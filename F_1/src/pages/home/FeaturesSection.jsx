import { Leaf, TrendingUp, Users, MapPin } from 'lucide-react';
import ScrollAnimation from '../../components/common/ScrollAnimation';

export default function FeaturesSection() {
  const features = [
    { icon: <Leaf className="w-8 h-8 text-green-600" />, title: 'Fresh Produce', desc: 'Direct from farms to your doorstep' },
    { icon: <TrendingUp className="w-8 h-8 text-green-600" />, title: 'Better Prices', desc: 'No middlemen, farmers get more' },
    { icon: <Users className="w-8 h-8 text-green-600" />, title: 'Community', desc: 'Support local farmers & agriculture' },
    { icon: <MapPin className="w-8 h-8 text-green-600" />, title: 'Local Supply', desc: 'Know where your food comes from' },
  ];

  return (
    <section id="features" className="py-20 px-4 relative overflow-hidden">
      {/* Video Background - hidden on mobile to avoid 12.8MB download lag */}
      <div className="absolute inset-0 z-0 hidden md:block">
        {/* Gradient fallback shown in place of heavy video */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50 via-amber-50 to-green-100"></div>
      </div>
      {/* Lightweight static gradient for mobile (replaces heavy video) */}
      <div className="absolute inset-0 z-0 md:hidden bg-gradient-to-br from-green-50 via-amber-50 to-green-100"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollAnimation className="scroll-slide mb-12">
          <h2 className="text-4xl font-bold text-gray-900 text-center animate-slide-in-down drop-shadow-md">
            Why Choose FarmDirect?
          </h2>
          <p className="text-gray-800 text-center text-lg mt-3 max-w-2xl mx-auto font-medium">
            Experience the difference of buying directly from farmers
          </p>
        </ScrollAnimation>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, i) => (
            <div
              key={i}
              className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-8 text-center hover:bg-white/70 hover:scale-105 transition-all duration-300 shadow-lg group"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100/80 rounded-xl group-hover:bg-green-200/80 transition-colors">
                  {feat.icon}
                </div>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3 drop-shadow-sm">{feat.title}</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
