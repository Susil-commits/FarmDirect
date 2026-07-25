import ScrollAnimation from '../../components/common/ScrollAnimation';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import { Loader2, Info } from 'lucide-react';

export default function CommunitySection({ stats, statsLoading }) {
  const statCards = [
    {
      title: "Active Farmers",
      desc: "Growing their business with fair prices",
      value: stats?.farmers,
      icon: "🌾",
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50/50 to-emerald-50/50"
    },
    {
      title: "Happy Customers",
      desc: "Trust us for quality produce",
      value: stats?.customers,
      icon: "👥",
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50/50 to-cyan-50/50"
    },
    {
      title: "Crop Varieties",
      desc: "Various fresh produce",
      value: stats?.varieties,
      icon: "🥬",
      gradient: "from-orange-500 to-amber-600",
      bgGradient: "from-orange-50/50 to-amber-50/50"
    },
    {
      title: "Total Orders",
      desc: "Successful transactions",
      value: stats?.orders,
      icon: "📦",
      gradient: "from-red-500 to-rose-600",
      bgGradient: "from-red-50/50 to-rose-50/50"
    }
  ];

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Our Growing Community
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Real farmers, real customers, real impact
          </p>
        </ScrollAnimation>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statCards.map((card, i) => (
            <ScrollAnimation key={i} className="h-full" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`bg-gradient-to-br ${card.bgGradient} backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 h-full flex flex-col relative overflow-hidden`}>
                <div className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r relative z-10" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                  <span className={`bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                    <AnimatedNumber 
                      value={card.value} 
                      duration={2000}
                      suffix={card.value != null ? "+" : ""}
                    />
                  </span>
                </div>
                <p className="text-gray-900 font-bold text-xl mb-2 relative z-10 tracking-tight">{card.title}</p>
                <p className="text-gray-600 text-sm font-medium relative z-10 mb-8">{card.desc}</p>
                
                <div className="mt-auto flex justify-between items-end relative z-10">
                  <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform duration-300 transform origin-bottom-left group-hover:-rotate-12">
                    {card.icon}
                  </span>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>

        {/* Backend loading notice */}
        {statsLoading ? (
          <div className="mt-12 flex items-center justify-center gap-2 text-gray-500 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-green-500" />
            <span>Syncing live stats...</span>
          </div>
        ) : (
          <div className="mt-12 flex items-start justify-center gap-3 text-gray-400 text-sm max-w-xl mx-auto bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/60">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
            <p className="leading-relaxed">
              Our backend is hosted on Render's free tier and may take a few seconds to wake up
              (cold start), so the counts above may briefly show fallback values while live data loads.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
