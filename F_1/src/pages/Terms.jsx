import React from 'react';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition.jsx';
import DynamicFloatingNavbar from '../components/landing/DynamicFloatingNavbar';
import GiantBrandFooter from '../components/common/GiantBrandFooter';

export default function Terms() {
  const { navigate } = useRouter();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <DynamicFloatingNavbar activeSection="cream" onNavigate={navigate} />

        <section className="pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
            TERMS OF TRADE
          </span>
          <h1 className="font-serif-display text-5xl sm:text-6xl font-normal mt-4 leading-tight mb-8">
            Terms & <span className="italic text-[#D97736]">fair trade conditions.</span>
          </h1>

          <div className="bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 text-sm text-[#132E20]/80 leading-relaxed">
            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              1. Direct Marketplace Protocol
            </h3>
            <p>
              By placing an order on FarmDirect, buyers contract directly with verified local growers. FarmDirect provides the technology platform, quality verification, and direct cold-chain logistics.
            </p>

            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              2. Fair-Price Guarantee
            </h3>
            <p>
              Growers set their price based on true input costs. 85%+ of the transaction value is guaranteed to settle into the grower’s account upon delivery confirmation.
            </p>

            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              3. Delivery & Inspection
            </h3>
            <p>
              Crops must be inspected upon express delivery. Any claims regarding quality or missing produce must be reported within 24 hours for instant refund resolution.
            </p>
          </div>
        </section>

        <GiantBrandFooter onNavigate={navigate} />
      </div>
    </PageTransition>
  );
}
