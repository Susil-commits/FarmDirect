import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Calculator } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';

export default function Pricing() {
  const { navigate } = useRouter();
  const [billingCycle, setBillingCycle] = useState('annual'); 
  const [teamSize, setTeamSize] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(1500);

  const calculateSavings = () => {
    const hoursSavedPerMonth = teamSize * 4.4;
    const annualSavings = Math.round(hoursSavedPerMonth * hourlyRate * 12);
    return { hoursSaved: Math.round(hoursSavedPerMonth), annualSavings };
  };

  const { hoursSaved, annualSavings } = calculateSavings();

  const plans = [
    {
      name: 'Free',
      subtitle: 'FOR INDIVIDUAL BUYERS & SMALL FARMS',
      price: '₹0',
      period: '/month',
      desc: 'Get direct farm-gate access to local crops in your region.',
      features: [
        'Direct access to 120+ verified farm listings',
        'Real-time harvest status & voice logs',
        'Standard 12h delivery dispatch window',
        'Basic order tracking',
      ],
      cta: 'Start Free Direct Order',
      isPopular: false,
      buttonBg: 'bg-[#132E20] text-white',
    },
    {
      name: 'Pro Market',
      subtitle: 'FOR REGULAR HOUSEHOLDS & CHEFS',
      price: billingCycle === 'annual' ? '₹320' : '₹390',
      period: '/user/month',
      desc: 'Everything in Free, plus express 4h dispatch and direct pricing guarantees.',
      features: [
        'Everything in Free, plus:',
        'Express 4h field-to-door direct transport',
        'Soil test & pesticide purity reports on QR',
        'Priority harvest reservation',
        'Dedicated farm account manager',
      ],
      cta: 'Get Pro Market',
      isPopular: true,
      buttonBg: 'bg-[#D97736] text-white',
    },
    {
      name: 'Enterprise Farm',
      subtitle: 'FOR RESTAURANTS, HOTELS & INSTITUTIONS',
      price: 'Contact Us',
      period: '',
      desc: 'Bulk contract sourcing directly with farming cooperatives and custom logistics.',
      features: [
        'Everything in Pro, plus:',
        'Custom farm contract cultivation & bulk delivery',
        'Enterprise SLA & dedicated cold-chain fleet',
        'Automated monthly invoicing & tax receipts',
        'SOC 2 Type II certified traceability',
      ],
      cta: 'Contact Sales',
      isPopular: false,
      buttonBg: 'bg-[#132E20] text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
      <section className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
        {}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
            TRANSPARENT PRICING
          </span>
          <h1 className="font-serif-display text-5xl sm:text-6xl md:text-7xl font-normal mt-4 leading-tight">
            Our <span className="italic text-[#D97736] font-normal">plans.</span>
          </h1>
          <p className="font-sans-body text-base text-[#132E20]/75 mt-3">
            Simple, honest pricing with zero middleman markups. Pay only for pure harvest and direct transport.
          </p>

          {}
          <div className="inline-flex items-center bg-[#F4EFE6] p-1.5 rounded-full border border-[#132E20]/10 mt-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#132E20] text-[#FBF8F3] shadow-md'
                  : 'text-[#132E20]/70 hover:text-[#132E20]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-[#D97736] text-white shadow-md'
                  : 'text-[#132E20]/70 hover:text-[#132E20]'
              }`}
            >
              <span>Annual</span>
              <span className="bg-white/20 text-white text-[9px] px-2 py-0.5 rounded-full uppercase">
                20% discount
              </span>
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className={`rounded-3xl p-8 border transition-all flex flex-col justify-between relative ${
                plan.isPopular
                  ? 'bg-[#132E20] text-[#FBF8F3] border-[#D97736]/40 shadow-2xl ring-2 ring-[#D97736]'
                  : 'bg-white/90 text-[#132E20] border-[#132E20]/12 shadow-lg'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 right-8 bg-[#D97736] text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-1 ${
                  plan.isPopular ? 'text-[#84A98C]' : 'text-[#132E20]/60'
                }`}>
                  {plan.subtitle}
                </span>

                <h3 className="font-serif-display text-3xl font-bold mb-2">
                  {plan.name}
                </h3>

                <div className="flex items-baseline gap-1 my-4">
                  <span className="font-serif-display text-4xl sm:text-5xl font-extrabold">
                    {plan.price}
                  </span>
                  <span className={`text-xs ${plan.isPopular ? 'text-[#FBF8F3]/70' : 'text-[#132E20]/60'}`}>
                    {plan.period}
                  </span>
                </div>

                <p className={`text-xs leading-relaxed mb-6 ${
                  plan.isPopular ? 'text-[#FBF8F3]/80' : 'text-[#132E20]/75'
                }`}>
                  {plan.desc}
                </p>

                <div className="space-y-3 pt-4 border-t border-current/10 mb-8">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.isPopular ? 'text-[#D97736]' : 'text-[#132E20]'
                      }`} />
                      <span className={plan.isPopular ? 'text-[#FBF8F3]' : 'text-[#132E20]'}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/marketplace')}
                className={`w-full py-3 rounded-xl font-sans-body text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${plan.buttonBg}`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>

        {}
        <div className="bg-[#132E20] text-[#FBF8F3] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden mb-20 border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#D97736]/20 text-[#D97736] px-3 py-1 rounded-full text-xs font-bold border border-[#D97736]/30">
                <Calculator className="w-3.5 h-3.5" />
                <span>ROI & DIRECT SAVINGS CALCULATOR</span>
              </div>
              <h2 className="font-serif-display text-4xl sm:text-5xl font-normal leading-tight">
                Calculate your <span className="italic text-[#E29578]">direct farm savings.</span>
              </h2>
              <p className="font-sans-body text-sm text-[#FBF8F3]/75">
                Adjust household/restaurant size and current procurement rate to estimate monthly time and money saved with FarmDirect.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#84A98C] block mb-1">
                    Monthly Harvest Volume: {teamSize} kg
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D97736]"
                  />
                </div>

                <div>
                  <label className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#84A98C] block mb-1">
                    Current Retail Price / kg: ₹{hourlyRate}
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D97736]"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#1B3B2B] border border-white/15 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="font-sans-body text-[11px] uppercase tracking-wider text-[#FBF8F3]/60 font-semibold block">
                    Time Saved / Month
                  </span>
                  <span className="font-serif-display text-3xl sm:text-4xl font-bold text-[#FBF8F3]">
                    {hoursSaved} hours
                  </span>
                </div>
                <div>
                  <span className="font-sans-body text-[11px] uppercase tracking-wider text-[#FBF8F3]/60 font-semibold block">
                    Procurement ROI
                  </span>
                  <span className="font-serif-display text-3xl sm:text-4xl font-bold text-[#84A98C]">
                    1,931%
                  </span>
                </div>
              </div>

              <div className="bg-[#D97736]/20 border border-[#D97736]/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="font-sans-body text-xs font-bold text-[#FBF8F3] block">
                    Estimated Annual Direct Savings
                  </span>
                  <span className="font-sans-body text-[10px] text-[#FBF8F3]/70">
                    Plus 85%+ directly paid to regional growers
                  </span>
                </div>
                <span className="font-serif-display text-3xl sm:text-4xl font-extrabold text-[#D97736]">
                  ₹{annualSavings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
