import React from 'react';

import { motion } from 'framer-motion';
import { Users, Sprout, ShoppingBag, Truck } from 'lucide-react';

export default function CommunitySection({ stats, statsLoading }) {
  const statCards = [
    { label: 'Registered Farmers', value: stats?.farmers ?? '1,450+', icon: Sprout },
    { label: 'Direct Buyers', value: stats?.customers ?? '28,000+', icon: Users },
    { label: 'Crop Varieties', value: stats?.varieties ?? '120+', icon: ShoppingBag },
    { label: 'Express Delivery', value: '4-6 Hours', icon: Truck },
  ];

  return (
    <section className="relative bg-[#132E20] text-[#FBF8F3] py-20 px-4 md:px-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/15 px-3 py-1 rounded-full border border-[#D97736]/30">
            OUR IMPACT & COMMUNITY
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-normal mt-4 leading-tight">
            Growing together <span className="italic text-[#E29578] font-normal">in pure transparency.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#1B3B2B]/80 border border-white/15 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#D97736]/20 text-[#D97736] flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-serif-display text-4xl font-extrabold mb-1 text-[#FBF8F3]">
                  {statsLoading ? '...' : s.value}
                </div>
                <div className="font-sans-body text-xs font-bold text-[#84A98C]">
                  {s.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
