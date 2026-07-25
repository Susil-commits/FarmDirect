import { Leaf, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import ScrollAnimation from '../../components/common/ScrollAnimation';

export default function RawFactsSection() {
  const facts = [
    {
      id: 1,
      icon: Users,
      value: 0,
      suffix: '',
      title: 'Middlemen',
      description: 'We connect you directly with farmers, eliminating all intermediary costs and delays.',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      id: 2,
      icon: TrendingUp,
      value: 30,
      prefix: '+',
      suffix: '%',
      title: 'Farmer Profit',
      description: 'By selling directly, farmers earn significantly more compared to traditional wholesale markets.',
      color: 'from-green-500 to-emerald-400',
    },
    {
      id: 3,
      icon: Leaf,
      value: 100,
      suffix: '%',
      title: 'Freshness Guarantee',
      description: 'Produce goes straight from the farm to your table, ensuring maximum nutritional value.',
      color: 'from-amber-500 to-orange-400',
    },
    {
      id: 4,
      icon: ShieldCheck,
      value: 48,
      suffix: 'h',
      title: 'Harvest to Home',
      description: 'Our optimized logistics ensure most orders are delivered within 48 hours of harvest.',
      color: 'from-purple-500 to-indigo-400',
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-20 bg-white/50 backdrop-blur-3xl border-y border-white/60">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            The Direct Impact
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Why direct farm-to-table trade is better for everyone.
          </p>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {facts.map((fact, index) => (
            <ScrollAnimation 
              key={fact.id} 
              className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${fact.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
                <fact.icon className="w-7 h-7" />
              </div>
              
              <div className="mb-4">
                <h3 className="text-5xl font-black text-gray-900 tracking-tighter flex items-baseline gap-1">
                  <AnimatedNumber 
                    value={fact.value} 
                    prefix={fact.prefix}
                    suffix={fact.suffix}
                    animateOnVisible={true} 
                  />
                </h3>
                <p className="text-lg font-bold text-gray-800 mt-2">{fact.title}</p>
              </div>
              
              <p className="text-gray-600 leading-relaxed font-medium text-sm">
                {fact.description}
              </p>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
