import ScrollAnimation from '../../components/common/ScrollAnimation';
import { ShoppingBag, Sprout, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';

export default function HowItWorksSection() {
  const { navigate } = useRouter();

  return (
    <section className="py-24 px-4 md:px-8 relative z-10 bg-[#FBF8F3]/90 backdrop-blur-xl border-y border-[#132E20]/10 my-8">
      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollAnimation className="text-center mb-16">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/10 px-3.5 py-1.5 rounded-full border border-[#D97736]/20 inline-block mb-3">
            TRANSPARENT DIRECT PROCESS
          </span>
          <h2 className="font-serif-display text-4xl md:text-5xl font-bold text-[#132E20] tracking-tight mb-4">
            How FarmDirect Works
          </h2>
          <p className="font-sans-body text-base md:text-lg text-[#132E20]/75 max-w-2xl mx-auto">
            Connecting local growers directly with buyers for 100% fresh, fair, and field-traceable harvests.
          </p>
        </ScrollAnimation>

        {/* For Buyers */}
        <div className="mb-20">
          <ScrollAnimation className="mb-8">
            <h3 className="font-serif-display text-2xl md:text-3xl font-bold text-[#132E20] flex items-center justify-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#D97736]/15 text-[#D97736] flex items-center justify-center text-sm font-bold">🛒</span>
              <span>For Buyers</span>
            </h3>
          </ScrollAnimation>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <ScrollAnimation className="h-full">
              <div className="h-full bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">01</span>
                    <div className="w-12 h-12 rounded-2xl bg-[#132E20] text-[#FBF8F3] flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-5 h-5 text-[#D97736]" />
                    </div>
                  </div>
                  <h4 className="font-serif-display text-2xl font-bold text-[#132E20] mb-3">Sign Up & Explore</h4>
                  <p className="font-sans-body text-xs text-[#132E20]/75 leading-relaxed mb-4">
                    Create a buyer account in seconds. Access 100+ fresh organic veggies, fruits & grains directly from verified local farms.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#132E20]/10 text-xs font-semibold text-[#132E20]/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D97736]" />
                    <span>Instant buyer account setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D97736]" />
                    <span>No hidden broker markups</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Step 2 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.1s' }}>
              <div className="h-full bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">02</span>
                    <div className="w-12 h-12 rounded-2xl bg-[#132E20] text-[#FBF8F3] flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                      <Sprout className="w-5 h-5 text-[#84A98C]" />
                    </div>
                  </div>
                  <h4 className="font-serif-display text-2xl font-bold text-[#132E20] mb-3">Select & Order Direct</h4>
                  <p className="font-sans-body text-xs text-[#132E20]/75 leading-relaxed mb-4">
                    Choose your harvest batch, check farmer ratings & QR soil reports, or submit custom bulk contract offers directly to growers.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#132E20]/10 text-xs font-semibold text-[#132E20]/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84A98C]" />
                    <span>Fair farm-gate pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84A98C]" />
                    <span>QR batch traceability</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Step 3 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.2s' }}>
              <div className="h-full bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">03</span>
                    <div className="w-12 h-12 rounded-2xl bg-[#132E20] text-[#FBF8F3] flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5 text-[#E29578]" />
                    </div>
                  </div>
                  <h4 className="font-serif-display text-2xl font-bold text-[#132E20] mb-3">Field-Fresh Delivery</h4>
                  <p className="font-sans-body text-xs text-[#132E20]/75 leading-relaxed mb-4">
                    Harvested fresh at dawn and dispatched straight to your doorstep in 4 to 12 hours with 256-bit secure payment protection.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#132E20]/10 text-xs font-semibold text-[#132E20]/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E29578]" />
                    <span>Same-day dawn dispatch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E29578]" />
                    <span>Escrow buyer guarantee</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center gap-2 bg-[#132E20] hover:bg-[#1B3B2B] text-[#FBF8F3] font-sans-body px-6 py-3 rounded-full font-semibold text-sm shadow-md transition-all cursor-pointer group"
            >
              <span>Explore Marketplace as Buyer</span>
              <ArrowRight className="w-4 h-4 text-[#D97736] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* For Farmers */}
        <div>
          <ScrollAnimation className="mb-8">
            <h3 className="font-serif-display text-2xl md:text-3xl font-bold text-[#132E20] flex items-center justify-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#132E20]/10 text-[#132E20] flex items-center justify-center text-sm font-bold">🌾</span>
              <span>For Farmers</span>
            </h3>
          </ScrollAnimation>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Farmer Step 1 */}
            <ScrollAnimation className="h-full">
              <div className="h-full bg-[#132E20] text-[#FBF8F3] border border-white/10 rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">01</span>
                    <div className="w-12 h-12 rounded-2xl bg-[#1B3B2B] text-white flex items-center justify-center font-bold border border-white/15">
                      <Sprout className="w-5 h-5 text-[#D97736]" />
                    </div>
                  </div>
                  <h4 className="font-serif-display text-2xl font-bold text-[#FBF8F3] mb-3">Register & Verify KYC</h4>
                  <p className="font-sans-body text-xs text-[#FBF8F3]/75 leading-relaxed mb-4">
                    Set up your farm profile with land records & Government ID. Fast 24-hour verification unlocks direct trade access.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-semibold text-[#FBF8F3]/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D97736]" />
                    <span>Free farmer profile creation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D97736]" />
                    <span>Government ID verification</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Farmer Step 2 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.1s' }}>
              <div className="h-full bg-[#132E20] text-[#FBF8F3] border border-white/10 rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">02</span>
                    <div className="w-12 h-12 rounded-2xl bg-[#1B3B2B] text-white flex items-center justify-center font-bold border border-white/15">
                      <ShoppingBag className="w-5 h-5 text-[#84A98C]" />
                    </div>
                  </div>
                  <h4 className="font-serif-display text-2xl font-bold text-[#FBF8F3] mb-3">List Crop via Voice or Form</h4>
                  <p className="font-sans-body text-xs text-[#FBF8F3]/75 leading-relaxed mb-4">
                    Dictate crop details in your regional language or fill out a simple form. Set your own prices without commission cuts.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-semibold text-[#FBF8F3]/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84A98C]" />
                    <span>Voice dictation support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84A98C]" />
                    <span>Set 100% of your prices</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Farmer Step 3 */}
            <ScrollAnimation className="h-full" style={{ animationDelay: '0.2s' }}>
              <div className="h-full bg-[#132E20] text-[#FBF8F3] border border-white/10 rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif-display text-3xl font-extrabold text-[#D97736]">03</span>
                    <div className="w-12 h-12 rounded-2xl bg-[#1B3B2B] text-white flex items-center justify-center font-bold border border-white/15">
                      <ShieldCheck className="w-5 h-5 text-[#E29578]" />
                    </div>
                  </div>
                  <h4 className="font-serif-display text-2xl font-bold text-[#FBF8F3] mb-3">Earn Direct to Bank</h4>
                  <p className="font-sans-body text-xs text-[#FBF8F3]/75 leading-relaxed mb-4">
                    Receive direct orders from buyers and institutions. Enjoy instant 24-hour bank payout upon batch dispatch.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-semibold text-[#FBF8F3]/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E29578]" />
                    <span>24-hour instant payout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E29578]" />
                    <span>Zero middleman commission</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/join-farmer')}
              className="inline-flex items-center gap-2 bg-[#D97736] hover:bg-[#C86428] text-white font-sans-body px-6 py-3 rounded-full font-semibold text-sm shadow-md transition-all cursor-pointer group"
            >
              <span>Join as Verified Farmer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
