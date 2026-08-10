import React from 'react';
import { ArrowUpRight, ShieldCheck, Truck, Percent, Layers, HeartHandshake, Sparkles } from 'lucide-react';

export default function ForestGreenPeelSection({ onExploreClick }) {
  const comparisonItems = [
    {
      title: 'Traditional Supply Chain',
      badge: '4-5 Days Old',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      items: [
        'Farmer gets only ~25-30% of end consumer price',
        'Passes through 3 to 5 middlemen & wholesale yards',
        'Chemical preservation for multi-day cold storage',
        'Unpredictable harvest dates & zero origin history',
      ],
      isHighlighted: false,
    },
    {
      title: 'FarmDirect Protocol',
      badge: 'Harvested Today',
      badgeColor: 'bg-[#D97736] text-white font-bold',
      items: [
        'Farmer receives 85%+ fair farm-gate value',
        'Zero middlemen — Direct 1-to-1 connection',
        '100% organic peak freshness, zero artificial wax',
        'Full QR traceability back to exact farm coordinates',
      ],
      isHighlighted: true,
    },
  ];

  const pillarProps = [
    {
      icon: HeartHandshake,
      title: 'Direct Farmer Earnings',
      desc: 'Farmers set their own price based on true input costs and earn up to 3x more than traditional wholesale contracts.',
    },
    {
      icon: Truck,
      title: 'Express Field-to-Door Logistics',
      desc: 'Crops are harvested upon your order confirmation and dispatched directly from the farm in temperature-controlled transport.',
    },
    {
      icon: Percent,
      title: 'Zero Hidden Markups',
      desc: 'Transparent pricing breakdown showing exact farmer revenue, packaging cost, and logistics fee on every invoice.',
    },
    {
      icon: Layers,
      title: 'Guaranteed Traceability',
      desc: 'Scan the batch code on any basket to view soil health reports, harvest timestamp, and audio logs directly from the grower.',
    },
  ];

  return (
    <section
      id="why-direct"
      className="relative bg-[#132E20] text-[#FBF8F3] pt-24 pb-28 md:pt-32 md:pb-36 -mt-16 md:-mt-20 rounded-t-[60px] md:rounded-t-[80px] z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
    >
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D97736]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#84A98C]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#1B3B2B] border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#84A98C]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
            <span>Why Direct Farmer Connection Matters</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.02] tracking-tight"
          >
            Middleman markups evaporate when you{' '}
            <span className="italic text-[#E29578] block md:inline font-normal">
              buy directly from the grower.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans-body text-base md:text-lg text-[#FBF8F3]/75 font-normal max-w-2xl mx-auto"
          >
            Traditional grocery networks add up to 4 layers of distributors, extending delivery times to 5 days while reducing farmer income. FarmDirect restores equity and freshness.
          </motion.p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {comparisonItems.map((comp, idx) => (
            <motion.div
              key={comp.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 relative ${
                comp.isHighlighted
                  ? 'bg-[#1B3B2B] border-[#D97736]/40 shadow-2xl ring-1 ring-[#D97736]/30'
                  : 'bg-[#0E1712]/50 border-white/10'
              }`}
            >
              {comp.isHighlighted && (
                <div className="absolute -top-3 right-6 bg-[#D97736] text-white font-sans-body text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-md">
                  Recommended Way
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif-display text-2xl md:text-3xl font-bold">
                  {comp.title}
                </h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full border font-semibold ${comp.badgeColor}`}
                >
                  {comp.badge}
                </span>
              </div>

              <ul className="space-y-4">
                {comp.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-3 text-sm md:text-base">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mt-0.5 flex-shrink-0 ${
                        comp.isHighlighted
                          ? 'bg-[#D97736] text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={
                        comp.isHighlighted ? 'text-[#FBF8F3]' : 'text-[#FBF8F3]/70'
                      }
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* 4 Core Value Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillarProps.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#1B3B2B]/60 border border-white/10 rounded-2xl p-6 hover:bg-[#1B3B2B] transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#D97736]/15 border border-[#D97736]/30 text-[#D97736] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-serif-display text-xl font-bold mb-2">
                  {pillar.title}
                </h4>
                <p className="font-sans-body text-xs md:text-sm text-[#FBF8F3]/70 leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Section Bottom Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-2 bg-[#D97736] hover:bg-[#C86428] text-white font-sans-body px-8 py-3.5 rounded-full font-semibold text-sm shadow-xl transition-all duration-300 cursor-pointer"
          >
            <span>Explore Farmer Profiles & Harvests</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
