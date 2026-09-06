import React from 'react';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition.jsx';
import { HeartHandshake, ShieldCheck, Zap, Shield, Sparkles, Sprout, ArrowRight } from 'lucide-react';

import { motion } from 'framer-motion';

export default function About() {
  const { navigate } = useRouter();

  const values = [
    {
      icon: HeartHandshake,
      title: 'Farmer-First Equity',
      description: 'We prioritize fair farm-gate pricing, giving 85%+ of invoice value directly to growers.'
    },
    {
      icon: ShieldCheck,
      title: '100% Purity Assured',
      description: 'Every batch is verified for organic freshness with QR soil & harvest traceability.'
    },
    {
      icon: Zap,
      title: 'Express 4h Dispatch',
      description: 'Picked at peak morning maturity and delivered straight to your door in hours.'
    },
    {
      icon: Shield,
      title: 'Zero Middlemen Trust',
      description: 'Transparent 1-to-1 transactions with direct buyer protection and escrow.'
    }
  ];

  const team = [
    {
      name: 'Susil Kumar Nayak',
      role: 'Lead Architect & Full Stack Engineer',
      bio: 'Pioneering direct agritech protocols, backend microservices, and fair pricing algorithms.',
    },
    {
      name: 'Dibesh Ranjan Das',
      role: 'Full Stack & Product Engineer',
      bio: 'Building real-time traceability systems, UI components, and farmer voice log dictation.',
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body selection:bg-[#D97736] selection:text-white">
        <section className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-[#F4EFE6] border border-[#132E20]/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#132E20] mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
            <span>THE FARMARDIRECT MISSION</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif-display text-5xl sm:text-6xl md:text-7xl font-normal leading-[0.98] tracking-tight max-w-4xl mx-auto"
          >
            Connecting buyers directly to the origin,{' '}
            <span className="italic text-[#D97736] block sm:inline font-normal">
              without middleman friction.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans-body text-base md:text-lg text-[#132E20]/75 mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            FarmDirect is an open agricultural marketplace built to eliminate multi-tier distributor markups, empower regional growers, and deliver uncompromised organic produce straight from local farms.
          </motion.p>
        </section>

        {}
        <section className="relative bg-[#132E20] text-[#FBF8F3] py-20 px-4 md:px-8 -mt-6 rounded-t-[60px] md:rounded-t-[80px] z-10 shadow-2xl">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/15 px-3 py-1 rounded-full border border-[#D97736]/30">
                OUR CORE VALUES
              </span>
              <h2 className="font-serif-display text-4xl sm:text-5xl font-normal mt-4">
                What drives <span className="italic text-[#E29578]">our protocol.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="bg-[#1B3B2B]/80 border border-white/15 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#D97736]/20 text-[#D97736] flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif-display text-2xl font-bold mb-2">
                        {v.title}
                      </h3>
                      <p className="font-sans-body text-xs text-[#FBF8F3]/75 leading-relaxed">
                        {v.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {}
        <section className="bg-[#FBF8F3] py-20 px-4 md:px-8 border-t border-[#132E20]/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
                THE BUILDERS
              </span>
              <h2 className="font-serif-display text-4xl sm:text-5xl font-normal mt-4">
                Meet the engineering <span className="italic text-[#D97736]">team.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 shadow-lg flex flex-col justify-between hover:border-[#D97736]/40 transition-colors"
                >
                  <div>
                    <span className="inline-block font-sans-body text-xs font-bold uppercase tracking-wider text-[#D97736] bg-[#D97736]/10 px-3 py-1 rounded-full border border-[#D97736]/25 mb-4">
                      {member.role}
                    </span>
                    <h3 className="font-serif-display text-2xl font-bold text-[#132E20] mb-2">
                      {member.name}
                    </h3>
                    <p className="font-sans-body text-sm text-[#132E20]/75 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
