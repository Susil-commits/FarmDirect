import React from 'react';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition.jsx';
import DynamicFloatingNavbar from '../components/landing/DynamicFloatingNavbar';
import GiantBrandFooter from '../components/common/GiantBrandFooter';

export default function Refund() {
  const { navigate } = useRouter();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <DynamicFloatingNavbar activeSection="cream" onNavigate={navigate} />

        <section className="pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
            REFUND POLICY
          </span>
          <h1 className="font-serif-display text-5xl sm:text-6xl font-normal mt-4 leading-tight mb-8">
            100% Purity <span className="italic text-[#D97736]">refund guarantee.</span>
          </h1>

          <div className="bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 text-sm text-[#132E20]/80 leading-relaxed">
            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              Instant Quality Refund
            </h3>
            <p>
              If your fresh produce arrives damaged or fails organic purity standards, submit a photo report in your dashboard within 24 hours. We issue a 100% refund to your original payment method within 1 business hour.
            </p>

            <h3 className="font-serif-display text-2xl font-bold text-[#132E20]">
              Fair Farmer Protection
            </h3>
            <p>
              Refund claims are verified by our regional agronomists to protect local farmers while upholding uncompromised quality for buyers.
            </p>
          </div>
        </section>

        <GiantBrandFooter onNavigate={navigate} />
      </div>
    </PageTransition>
  );
}
