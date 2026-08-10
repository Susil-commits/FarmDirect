import React, { useState } from 'react';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition.jsx';
import DynamicFloatingNavbar from '../components/landing/DynamicFloatingNavbar';
import GiantBrandFooter from '../components/common/GiantBrandFooter';
import { HelpCircle, ShieldCheck, Truck, RefreshCw, MessageSquare } from 'lucide-react';

export default function Support() {
  const { navigate } = useRouter();
  const [selectedFaqIndex, setSelectedFaqIndex] = useState(0);

  const topics = [
    { title: 'Order & Harvest Tracking', icon: Truck, desc: 'Track your live harvest dispatch timestamp and express transport route.' },
    { title: 'Farmer Payments & Escrow', icon: ShieldCheck, desc: 'Learn how smart contract escrow ensures 85%+ farm-gate payout to growers.' },
    { title: 'Refunds & Returns', icon: RefreshCw, desc: 'Report any damaged items within 24 hours for instant 100% replacement or refund.' },
    { title: 'Direct Communications', icon: MessageSquare, desc: 'Contact your assigned farmer or regional agronomist through voice logs.' },
  ];

  const faqs = [
    {
      q: 'How does direct farmer pricing work on FarmDirect?',
      a: 'Farmers set their prices directly based on crop variety, harvest effort, and market conditions. Zero middleman commissions are added. FarmDirect charges a minimal platform logistics fee (5%), allowing buyers to save 20-40% while farmers earn 85%+ invoice value.'
    },
    {
      q: 'What is the harvest-to-delivery timeframe?',
      a: 'Produce is harvested at peak maturity early in the morning upon order confirmation. Express regional dispatch delivers field-to-door within 4 to 12 hours depending on your distance from the farm.'
    },
    {
      q: 'How are organic certifications & soil purity verified?',
      a: 'Every farm on FarmDirect undergoes strict KYC verification. Chemical-free and certified organic batches include a scannable QR code on delivery with soil composition and lab quality test reports.'
    },
    {
      q: 'What happens if items arrive damaged or sub-standard?',
      a: 'We offer a 100% Quality Guarantee. If produce arrives damaged or unsatisfactory, simply upload a photo within 24 hours via the Support portal for an immediate refund or replacement dispatch.'
    },
    {
      q: 'Can restaurants & hotels set up bulk recurring contracts?',
      a: 'Yes! Commercial buyers can negotiate custom bulk contracts directly with farming cooperatives, complete with dedicated cold-chain delivery schedules and monthly invoicing.'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <DynamicFloatingNavbar activeSection="cream" onNavigate={navigate} />

        <section className="pt-32 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
              SUPPORT CENTER
            </span>
            <h1 className="font-serif-display text-5xl sm:text-6xl md:text-7xl font-normal mt-4 leading-tight">
              How can we <span className="italic text-[#D97736]">help you today?</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {topics.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.title}
                  className="bg-white/90 border border-[#132E20]/12 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate('/contact')}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#132E20] text-[#FBF8F3] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-[#D97736]" />
                  </div>
                  <h3 className="font-serif-display text-xl font-bold text-[#132E20] mb-2">
                    {t.title}
                  </h3>
                  <p className="font-sans-body text-xs text-[#132E20]/75 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Interactive 2-Column FAQ Section (Wispr Flow style at video 1:06) */}
          <div className="bg-[#132E20] text-[#FBF8F3] rounded-[40px] p-8 sm:p-12 shadow-2xl border border-white/10 mb-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/15 px-3.5 py-1.5 rounded-full border border-[#D97736]/30">
                FAQS
              </span>
              <h2 className="font-serif-display text-4xl sm:text-5xl font-normal mt-3">
                Good <span className="italic text-[#E29578]">questions.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Questions List - Left Column */}
              <div className="lg:col-span-5 space-y-3">
                <p className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#84A98C] mb-2">Questions</p>
                {faqs.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFaqIndex(idx)}
                    className={`w-full text-left p-4 rounded-2xl transition-all font-sans-body text-xs font-bold flex items-center justify-between cursor-pointer border ${
                      selectedFaqIndex === idx
                        ? 'bg-[#1B3B2B] border-[#D97736] text-[#FBF8F3] shadow-md'
                        : 'bg-[#132E20] border-white/10 text-[#FBF8F3]/70 hover:text-[#FBF8F3] hover:bg-white/5'
                    }`}
                  >
                    <span className="line-clamp-2">{faq.q}</span>
                    <span className={`text-lg font-serif-display ml-2 ${selectedFaqIndex === idx ? 'text-[#D97736]' : 'text-white/40'}`}>
                      →
                    </span>
                  </button>
                ))}
              </div>

              {/* Answer Box - Right Column */}
              <div className="lg:col-span-7 bg-[#1B3B2B] border border-white/15 rounded-3xl p-8 shadow-xl">
                <p className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#D97736] mb-3">Answer</p>
                <h3 className="font-serif-display text-2xl font-bold text-[#FBF8F3] mb-4">
                  {faqs[selectedFaqIndex].q}
                </h3>
                <p className="font-sans-body text-sm text-[#FBF8F3]/85 leading-relaxed">
                  {faqs[selectedFaqIndex].a}
                </p>
              </div>
            </div>
          </div>
        </section>

        <GiantBrandFooter onNavigate={navigate} />
      </div>
    </PageTransition>
  );
}

