import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { Search, ShoppingBag, ShieldCheck, MapPin, Sparkles, ArrowRight, RefreshCw, Calculator } from 'lucide-react';

export default function CreamValueSection({ onExploreClick, onNavigate }) {
  const [calculatorQty, setCalculatorQty] = useState(10); 
  const pricePerKgFarmer = 45; 
  const logisticsFeePerKg = 12; 
  const farmDirectTotal = (pricePerKgFarmer + logisticsFeePerKg) * calculatorQty;
  const traditionalStoreTotal = 95 * calculatorQty; 
  const savings = traditionalStoreTotal - farmDirectTotal;

  const handleStepClick = () => {
    if (onNavigate) {
      onNavigate('/how-it-works');
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Browse Live Harvests',
      desc: 'Explore real-time crop listings posted directly by verified regional farmers. View soil test results, harvest dates, and farmer voice updates.',
      icon: Search,
      badge: 'Real-time Feed',
    },
    {
      num: '02',
      title: 'Direct Smart Contract',
      desc: 'Lock in fair, transparent prices with guaranteed payout to the farmer. No distributor cut or hidden commission fees.',
      icon: ShieldCheck,
      badge: 'Transparent Payout',
    },
    {
      num: '03',
      title: 'Farm Gate Pick & Express Delivery',
      desc: 'Crops are picked at peak maturity and dispatched directly from the field in climate-controlled transport straight to your door.',
      icon: ShoppingBag,
      badge: 'Within 4-12 Hours',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative bg-[#FBF8F3] text-[#132E20] pt-24 pb-28 md:pt-32 md:pb-36 -mt-16 md:-mt-20 rounded-t-[60px] md:rounded-t-[80px] z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        {}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#F4EFE6] border border-[#132E20]/15 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#132E20]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
            <span>Seamless Direct Supply Workflow</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.02] tracking-tight"
          >
            Direct harvest ordering in{' '}
            <span className="italic text-[#D97736] block md:inline font-normal">
              three effortless steps.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans-body text-base md:text-lg text-[#132E20]/75 font-normal max-w-2xl mx-auto"
          >
            Our technology bridges local growers and conscious buyers directly — eliminating friction, delays, and unjust pricing markups.
          </motion.p>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                onClick={handleStepClick}
                className="bg-white/80 backdrop-blur-sm border border-[#132E20]/12 rounded-3xl p-8 relative shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif-display text-4xl font-bold text-[#D97736]/80">
                      {step.num}
                    </span>
                    <span className="text-[11px] font-sans-body font-bold bg-[#F4EFE6] text-[#132E20] px-3 py-1 rounded-full border border-[#132E20]/10">
                      {step.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-[#132E20] text-[#FBF8F3] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-serif-display text-2xl font-bold mb-3 text-[#132E20]">
                    {step.title}
                  </h3>

                  <p className="font-sans-body text-sm text-[#132E20]/70 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#132E20]/10 flex items-center gap-2 text-xs font-bold text-[#D97736] group-hover:translate-x-1 transition-transform">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-[#132E20] text-[#FBF8F3] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#D97736]/20 border border-[#D97736]/40 text-[#D97736] px-3 py-1 rounded-full text-xs font-bold">
                <Calculator className="w-3.5 h-3.5" />
                <span>Interactive Price Impact Calculator</span>
              </div>
              <h3 className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-normal leading-tight">
                See how much you save while{' '}
                <span className="italic text-[#E29578] font-normal">
                  paying farmers fairly.
                </span>
              </h3>
              <p className="font-sans-body text-sm text-[#FBF8F3]/75 leading-relaxed">
                Slide quantity to calculate direct farm-gate savings versus retail supermarket markups on organic crops.
              </p>

              <div className="pt-2">
                <label className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#84A98C] block mb-2">
                  Order Quantity: {calculatorQty} kg
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={calculatorQty}
                  onChange={(e) => setCalculatorQty(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D97736]"
                />
                <div className="flex justify-between text-[11px] text-[#FBF8F3]/50 mt-1">
                  <span>5 kg (Household)</span>
                  <span>50 kg (Restaurant)</span>
                  <span>100 kg (Bulk Direct)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#1B3B2B] border border-white/15 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex flex-col">
                  <span className="font-sans-body text-xs text-[#FBF8F3]/60 uppercase font-semibold">
                    FarmDirect Price
                  </span>
                  <span className="font-serif-display text-3xl font-bold text-[#FBF8F3]">
                    ₹{farmDirectTotal}
                  </span>
                  <span className="text-[10px] text-[#84A98C]">
                    (₹{pricePerKgFarmer}/kg to farmer + ₹{logisticsFeePerKg}/kg delivery)
                  </span>
                </div>

                <div className="text-right flex flex-col">
                  <span className="font-sans-body text-xs text-[#FBF8F3]/60 uppercase font-semibold">
                    Supermarket Price
                  </span>
                  <span className="font-serif-display text-2xl font-bold text-red-300 line-through">
                    ₹{traditionalStoreTotal}
                  </span>
                  <span className="text-[10px] text-red-300/80">
                    (Multi-tier middleman markup)
                  </span>
                </div>
              </div>

              <div className="bg-[#D97736]/20 border border-[#D97736]/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="font-sans-body text-xs font-bold text-[#FBF8F3] block">
                    Your Direct Savings
                  </span>
                  <span className="font-sans-body text-[11px] text-[#FBF8F3]/80">
                    Plus 85% of total value directly paid to grower
                  </span>
                </div>
                <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">
                  ₹{savings}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
