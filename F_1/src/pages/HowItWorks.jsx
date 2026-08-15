import React, { useState } from 'react';
import { CheckCircle2, Users, TrendingUp, Award, Zap, Shield, Sparkles, ArrowRight, ShieldCheck, Sprout } from 'lucide-react';

import { motion } from 'framer-motion';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition';
import DynamicFloatingNavbar from '../components/landing/DynamicFloatingNavbar';
import GiantBrandFooter from '../components/common/GiantBrandFooter';

export default function HowItWorks() {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('farmer'); 

  const farmerSteps = [
    { step: '01', title: 'Register & Verify KYC', icon: Users, desc: 'Create account and verify farmer identity with Government ID & land records.' },
    { step: '02', title: 'List Produce via Voice/Form', icon: TrendingUp, desc: 'List your crops with pricing, quantity, harvest dates & photos in seconds.' },
    { step: '03', title: 'Receive Direct Orders', icon: Zap, desc: 'Buyers place direct orders or negotiate via fair-price contract offers.' },
    { step: '04', title: 'Get Paid Direct to Bank', icon: Award, desc: 'Instant 24-hour payout upon dispatch with zero commission markups.' }
  ];

  const buyerSteps = [
    { step: '01', title: 'Explore Regional Crops', icon: Users, desc: 'Search 100+ fresh organic veggies, fruits & grains directly from local farms.' },
    { step: '02', title: 'Transparent Pricing & Offer', icon: TrendingUp, desc: 'Buy at farm-gate prices or make direct bulk contract offers to farmers.' },
    { step: '03', title: 'Express Field Transport', icon: Zap, desc: 'Harvested fresh at dawn and dispatched straight to your door in 4 to 12 hours.' },
    { step: '04', title: 'Quality Guarantee & Review', icon: Award, desc: 'Inspect batch purity with QR traceability and build long-term farm relationships.' }
  ];

  const activeSteps = activeTab === 'farmer' ? farmerSteps : buyerSteps;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body selection:bg-[#D97736] selection:text-white">
        <DynamicFloatingNavbar activeSection="cream" onNavigate={navigate} />

        {}
        <section className="pt-32 pb-16 px-4 md:px-8 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-[#F4EFE6] border border-[#132E20]/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#132E20] mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
            <span>TRANSPARENT DIRECT PROTOCOL</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif-display text-5xl sm:text-6xl md:text-7xl font-normal leading-[0.98] tracking-tight max-w-4xl mx-auto"
          >
            Built around how <span className="italic text-[#D97736] font-normal">farming actually works.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans-body text-base md:text-lg text-[#132E20]/75 mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Connecting local growers directly with households, chefs, and institutions with zero middleman commissions and 100% harvest traceability.
          </motion.p>

          {}
          <div className="inline-flex items-center bg-[#F4EFE6] p-1.5 rounded-full border border-[#132E20]/10 mt-8">
            <button
              onClick={() => setActiveTab('farmer')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'farmer'
                  ? 'bg-[#132E20] text-[#FBF8F3] shadow-md'
                  : 'text-[#132E20]/70 hover:text-[#132E20]'
              }`}
            >
              🌱 For Farmers
            </button>
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'buyer'
                  ? 'bg-[#D97736] text-white shadow-md'
                  : 'text-[#132E20]/70 hover:text-[#132E20]'
              }`}
            >
              🛒 For Buyers
            </button>
          </div>
        </section>

        {}
        <section className="py-12 px-4 md:px-8 max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeSteps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-white/90 border border-[#132E20]/12 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">{item.step}</span>
                      <div className="w-10 h-10 rounded-2xl bg-[#132E20]/5 text-[#132E20] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-serif-display text-2xl font-bold text-[#132E20] mb-2">{item.title}</h3>
                    <p className="font-sans-body text-xs text-[#132E20]/75 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {}
        <section className="bg-[#132E20] text-[#FBF8F3] py-20 px-4 md:px-8 rounded-t-[60px] md:rounded-t-[80px] shadow-2xl">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/15 px-3.5 py-1.5 rounded-full border border-[#D97736]/30">
                PROVEN ADVANTAGES
              </span>
              <h2 className="font-serif-display text-4xl sm:text-5xl font-normal mt-4">
                Why direct farm trade <span className="italic text-[#E29578]">wins.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-[#1B3B2B] border border-white/15 rounded-3xl p-8 shadow-xl space-y-4">
                <h3 className="font-serif-display text-3xl font-bold text-[#FBF8F3]">For Farmers</h3>
                <div className="space-y-3 pt-2">
                  {[
                    '85%+ invoice value paid directly to farmer account',
                    'Set your own crop prices without distributor cuts',
                    'Voice dictation for instant crop listing in local language',
                    'Guaranteed 24h payout upon batch dispatch',
                    'Direct buyer relationship building for repeat contracts'
                  ].map((b, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-[#FBF8F3]/85">
                      <CheckCircle2 className="w-4 h-4 text-[#D97736] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1B3B2B] border border-white/15 rounded-3xl p-8 shadow-xl space-y-4">
                <h3 className="font-serif-display text-3xl font-bold text-[#FBF8F3]">For Buyers</h3>
                <div className="space-y-3 pt-2">
                  {[
                    'Field-fresh produce delivered in 4 to 12 hours from harvest',
                    'Zero distributor inflation — save 20% to 40% on bulk produce',
                    'QR soil & pesticide testing reports on every batch',
                    'Buyer protection & secure escrow payment processing',
                    'Direct chat & offer negotiations with verified growers'
                  ].map((b, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-[#FBF8F3]/85">
                      <CheckCircle2 className="w-4 h-4 text-[#84A98C] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="border-t border-white/10 pt-12 text-center">
              <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#FBF8F3]/60 block mb-6">
                ENTERPRISE COMPLIANCE & SECURITY
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#1B3B2B]/60 border border-white/10 p-6 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-[#D97736] mx-auto mb-2" />
                  <h4 className="font-serif-display text-xl font-bold">FSSAI & Organic Certified</h4>
                  <p className="font-sans-body text-[11px] text-[#FBF8F3]/70 mt-1">Verified farm-gate quality standards</p>
                </div>
                <div className="bg-[#1B3B2B]/60 border border-white/10 p-6 rounded-2xl">
                  <Shield className="w-8 h-8 text-[#84A98C] mx-auto mb-2" />
                  <h4 className="font-serif-display text-xl font-bold">256-Bit Escrow Security</h4>
                  <p className="font-sans-body text-[11px] text-[#FBF8F3]/70 mt-1">Encrypted payments & buyer protection</p>
                </div>
                <div className="bg-[#1B3B2B]/60 border border-white/10 p-6 rounded-2xl">
                  <Users className="w-8 h-8 text-[#E29578] mx-auto mb-2" />
                  <h4 className="font-serif-display text-xl font-bold">Strict Farmer KYC</h4>
                  <p className="font-sans-body text-[11px] text-[#FBF8F3]/70 mt-1">Government ID & land record verification</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <GiantBrandFooter onNavigate={navigate} />
      </div>
    </PageTransition>
  );
}
