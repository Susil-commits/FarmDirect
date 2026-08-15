import React from 'react';

import { motion } from 'framer-motion';
import { Sprout, ArrowRight, Quote, Award, Users, TrendingUp, ShieldCheck, Heart } from 'lucide-react';

export default function DarkImpactSection({ onExploreClick, onNavigate }) {
  const stats = [
    { label: 'Direct Earnings to Farmers', value: '₹4.8 Cr+', icon: TrendingUp, detail: '+42% higher income vs mandi' },
    { label: 'Verified Local Growers', value: '1,450+', icon: Sprout, detail: 'Across 18 agricultural zones' },
    { label: 'Direct Household Buyers', value: '28,000+', icon: Users, detail: 'Fresh produce delivered daily' },
    { label: 'Average Delivery Time', value: '4 Hours', icon: Award, detail: 'Post harvest dispatch' },
  ];

  const testimonials = [
    {
      quote: "Before FarmDirect, distributors took over 65% of our mango revenues. Now I deal directly with buyers, set fair prices, and invest back into organic soil health.",
      name: "Rajendra Deshmukh",
      farm: "Ratnagiri Mango Orchards",
      crops: "Alphonso & Kesar Mangoes",
      avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80",
    },
    {
      quote: "Receiving vegetables harvested the same morning is a game changer for our farm-to-table restaurant. The flavor quality and traceability are unmatched.",
      name: "Chef Maya Sengupta",
      farm: "The Green Table Bistro",
      crops: "Organic Microgreens & Heirlooms",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    },
  ];

  return (
    <section
      id="impact"
      className="relative bg-[#0E1712] text-[#FBF8F3] pt-24 pb-24 md:pt-32 md:pb-32 -mt-16 md:-mt-20 rounded-t-[60px] md:rounded-t-[80px] z-30 shadow-[0_-25px_60px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#1B3B2B] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D97736]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        {}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#132E20] border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#84A98C]"
          >
            <Heart className="w-3.5 h-3.5 text-[#D97736]" />
            <span>Empowering Real Farmers & Conscious Buyers</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.02] tracking-tight"
          >
            Cultivating direct prosperity,{' '}
            <span className="italic text-[#E29578] block md:inline font-normal">
              one harvest at a time.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans-body text-base md:text-lg text-[#FBF8F3]/75 font-normal max-w-2xl mx-auto"
          >
            By connecting consumers straight to origin, FarmDirect builds transparent agricultural ecosystems that support rural families and deliver uncompromised food purity.
          </motion.p>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#132E20]/80 border border-white/10 rounded-2xl p-6 hover:border-[#D97736]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D97736]/20 text-[#D97736] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-serif-display text-4xl font-extrabold mb-1 text-[#FBF8F3]">
                  {stat.value}
                </div>
                <div className="font-sans-body text-xs font-bold text-[#84A98C] mb-1">
                  {stat.label}
                </div>
                <div className="font-sans-body text-[11px] text-[#FBF8F3]/60">
                  {stat.detail}
                </div>
              </motion.div>
            );
          })}
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="bg-[#132E20]/60 border border-white/10 rounded-3xl p-8 relative flex flex-col justify-between"
            >
              <Quote className="w-10 h-10 text-[#D97736]/30 mb-4" />
              <p className="font-serif-display text-xl md:text-2xl text-[#FBF8F3]/90 italic leading-relaxed mb-6">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#D97736]"
                />
                <div>
                  <h4 className="font-sans-body text-sm font-bold text-[#FBF8F3]">
                    {t.name}
                  </h4>
                  <span className="font-sans-body text-xs text-[#84A98C] block">
                    {t.farm}
                  </span>
                  <span className="font-sans-body text-[10px] text-[#FBF8F3]/60">
                    {t.crops}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-br from-[#132E20] via-[#1B3B2B] to-[#0E1712] border border-[#D97736]/40 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h3 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-normal leading-tight">
              Ready to taste the direct difference?
            </h3>
            <p className="font-sans-body text-base text-[#FBF8F3]/80">
              Join thousands of households and chefs buying directly from local farms. Pure organic quality, fair prices, and zero middlemen.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onExploreClick}
                className="font-sans-body px-8 py-4 rounded-full bg-[#D97736] hover:bg-[#C86428] text-white font-bold text-base shadow-xl transition-all duration-300 flex items-center gap-3 cursor-pointer group"
              >
                <span>Start Direct Order Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>

        {}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FBF8F3]/50 font-sans-body gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#D97736]" />
            <span>FarmDirect Protocol © 2026 • Direct Farmer Marketplace</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/privacy');
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/terms');
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Farmer Terms
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/how-it-works');
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Fair-Price Charter
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
