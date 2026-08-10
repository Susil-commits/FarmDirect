import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { ChevronRight, HelpCircle } from 'lucide-react';

export default function FaqsSection() {
  const [activeFaq, setActiveFaq] = useState(0);

  const faqs = [
    {
      q: 'How does FarmDirect eliminate middleman markups?',
      a: 'FarmDirect acts as a 1-to-1 direct marketplace protocol. Buyers order straight from verified regional growers. Payouts go directly to the farmer’s account, eliminating multi-tier mandi distributor cuts.',
    },
    {
      q: 'How fresh is the produce upon delivery?',
      a: 'Crops are picked at peak maturity after your order is confirmed and dispatched directly from the farm gate. Delivery occurs within 4 to 12 hours of harvest depending on your location.',
    },
    {
      q: 'Can I track soil health and organic certification?',
      a: 'Yes! Every basket comes with a QR code linking directly to soil test reports, harvest timestamps, and audio updates from the grower.',
    },
    {
      q: 'What is the refund policy if produce arrives damaged?',
      a: 'We stand by 100% field purity. If any item fails quality standards, click "Report Issue" in your order dashboard for an instant 100% refund or replacement.',
    },
  ];

  return (
    <section className="relative bg-[#FBF8F3] text-[#132E20] py-20 px-4 md:px-8 border-t border-[#132E20]/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
            FAQS
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-normal mt-4 leading-tight">
            Good <span className="italic text-[#D97736] font-normal">questions.</span>
          </h2>
        </div>

        {/* Side-by-side FAQ Layout (Wispr Flow style at video 0:26) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Questions Buttons */}
          <div className="lg:col-span-5 space-y-3">
            <span className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#132E20]/50 block mb-2 px-2">
              Questions
            </span>
            {faqs.map((faq, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFaq(idx)}
                className={`w-full text-left p-4 rounded-2xl font-sans-body text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeFaq === idx
                    ? 'bg-[#132E20] text-[#FBF8F3] shadow-lg ring-1 ring-[#132E20]'
                    : 'bg-white/80 text-[#132E20] border border-[#132E20]/10 hover:bg-white'
                }`}
              >
                <span>{faq.q}</span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    activeFaq === idx ? 'rotate-90 text-[#D97736]' : 'text-[#132E20]/40'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Right Column: Active Answer Card */}
          <div className="lg:col-span-7">
            <span className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#132E20]/50 block mb-2 px-2">
              Answer
            </span>
            <motion.div
              key={activeFaq}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#1B3B2B] text-[#FBF8F3] rounded-3xl p-8 shadow-2xl border border-white/10 min-h-[220px] flex flex-col justify-between"
            >
              <div>
                <h3 className="font-serif-display text-2xl font-bold mb-4 text-[#FBF8F3]">
                  {faqs[activeFaq].q}
                </h3>
                <p className="font-sans-body text-base text-[#FBF8F3]/85 leading-relaxed">
                  {faqs[activeFaq].a}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#84A98C]">
                <span>Wispr FarmDirect FAQ Guarantee</span>
                <span className="font-bold text-[#D97736]">100% Direct Purity</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
