import { Leaf, TrendingUp, Users, MapPin } from 'lucide-react';
import ScrollAnimation from '../../components/common/ScrollAnimation';

export default function FeaturesSection() {
  const features = [
    { icon: Leaf, title: 'Fresh Produce', desc: 'Direct from farms to your doorstep, ensuring peak ripeness and flavor.', color: 'from-green-400 to-emerald-600' },
    { icon: TrendingUp, title: 'Better Prices', desc: 'By eliminating middlemen, farmers get paid more and you pay less.', color: 'from-emerald-400 to-teal-600' },
    { icon: Users, title: 'Community', desc: 'Support local agriculture and build lasting relationships with growers.', color: 'from-teal-400 to-cyan-600' },
    { icon: MapPin, title: 'Local Supply', desc: 'Track your food\'s journey and know exactly where it was grown.', color: 'from-cyan-400 to-blue-600' },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-transparent to-green-50/30">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Why Choose FarmDirect?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Experience the difference of transparent, direct-to-consumer agriculture.
          </p>
        </ScrollAnimation>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, i) => (
            <ScrollAnimation 
              key={i} 
              className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-300 group hover:-translate-y-2 flex flex-col items-center text-center"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white mb-6 shadow-md transform group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-300`}>
                <feat.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">{feat.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">{feat.desc}</p>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
