import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Clock, MapPin, ArrowRight, HeartHandshake } from 'lucide-react';

export default function FeaturesSection() {
  const featureCards = [
    {
      speed: '4x Faster',
      title: 'Field-to-door direct dispatch',
      desc: 'Crops are harvested upon your order confirmation and delivered in under 6 hours — vs traditional 4-day wholesale supply chains.',
      stat: '4h Avg Dispatch',
      badge: 'Zero Storage Decay',
    },
    {
      speed: '85%+ Payout',
      title: 'Direct farm-gate pricing',
      desc: 'Local growers receive 85%+ of invoice value compared to only 25% through multi-tier mandi agents.',
      stat: 'Fair Payout Guaranteed',
      badge: 'Transparent Invoice',
    },
  ];

  return (
    <section className="relative bg-[#132E20] text-[#FBF8F3] py-20 px-4 md:px-8 rounded-3xl my-8 mx-2 md:mx-6 shadow-2xl border border-white/10 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/15 px-3 py-1 rounded-full border border-[#D97736]/30">
            WISPR FARADIRECT SPEED & Purity PROTOCOL
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-normal mt-4 leading-tight">
            4x faster than <span className="italic text-[#E29578] font-normal">traditional supply chains</span>
          </h2>
          <p className="font-sans-body text-base text-[#FBF8F3]/75 mt-3">
            Fresh harvest that finally works for you and the farmer. FarmDirect connects you at the speed of thought.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featureCards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-[#1B3B2B]/80 border border-white/15 rounded-3xl p-8 shadow-xl flex flex-col justify-between hover:border-[#D97736]/50 transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">
                    {card.speed}
                  </span>
                  <span className="text-[10px] font-sans-body font-bold bg-[#132E20] text-[#84A98C] px-3 py-1 rounded-full border border-white/10">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-serif-display text-2xl font-bold text-[#FBF8F3] mb-2">
                  {card.title}
                </h3>
                <p className="font-sans-body text-sm text-[#FBF8F3]/75 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#84A98C]">
                <span>{card.stat}</span>
                <ArrowRight className="w-4 h-4 text-[#D97736] group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
