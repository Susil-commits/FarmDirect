import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Sprout, Sparkles, Volume2, ShieldCheck, Heart, Layers } from 'lucide-react';

export default function RawFactsSection() {
  const cards = [
    {
      tag: '100+ CROP VARIETIES',
      title: 'Built around how you eat, not how supermarkets dictate.',
      desc: 'FarmDirect automatically detects regional soil harvests, organic certifications, and seasonal availability across 18 agricultural zones.',
      badge: 'Certified Organic',
    },
    {
      tag: 'FARMER VOICE DICTATION',
      title: 'Farmer logs updated right from the field.',
      desc: 'Growers send voice notes directly from their farm plots — giving you instant audio updates on today’s picking schedule.',
      badge: 'Voice Verified',
    },
    {
      tag: 'FAIR PRICE TRANSPARENCY',
      title: 'Your trade stays honest.',
      desc: 'Zero hidden commission margins. Every invoice shows exact farm-gate earnings, packaging costs, and express delivery logistics.',
      badge: '100% Transparent',
    },
  ];

  return (
    <section className="relative bg-[#FBF8F3] text-[#132E20] py-20 px-4 md:px-8 border-t border-[#132E20]/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
            WISPR FARM DIRECTIVITY
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-normal mt-4 leading-tight">
            Built around <span className="italic text-[#D97736] font-normal">how farmers harvest</span>, not how traders dictate.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((item, idx) => (
            <motion.div
              key={item.tag}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-white/80 backdrop-blur-sm border border-[#132E20]/12 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-sans-body text-[10px] font-extrabold tracking-widest uppercase text-[#D97736]">
                    {item.tag}
                  </span>
                  <span className="font-sans-body text-[10px] font-bold bg-[#F4EFE6] text-[#132E20] px-2.5 py-1 rounded-full border border-[#132E20]/10">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-serif-display text-2xl font-bold text-[#132E20] mb-3">
                  {item.title}
                </h3>
                <p className="font-sans-body text-sm text-[#132E20]/75 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
