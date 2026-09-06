import React from 'react';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition.jsx';

export default function Privacy() {
  const { navigate: _navigate } = useRouter();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <section className="pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
            PRIVACY & DATA CONTROL
          </span>
          <h1 className="font-serif-display text-5xl sm:text-6xl font-normal mt-4 leading-tight mb-8">
            Privacy first. <span className="italic text-[#D97736]">Security always.</span>
          </h1>

          <div className="bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 text-sm text-[#132E20]/80 leading-relaxed">
            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              1. Information We Collect
            </h3>
            <p>
              FarmDirect collects minimal data necessary to fulfill direct farmer-to-buyer marketplace orders: contact details, farm plot location coordinates, soil verification certificates, and order histories.
            </p>

            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              2. Zero Dictation Data Selling
            </h3>
            <p>
              Voice logs, audio updates, and personal profile data are never sold to third-party ad networks. Voice logs are processed exclusively to generate harvest audio feeds.
            </p>

            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              3. Smart Contract & Escrow Security
            </h3>
            <p>
              Payment data is encrypted using SOC 2 Type II compliant financial gateways. Direct payouts to farmers are settled through bank-grade transfers.
            </p>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
