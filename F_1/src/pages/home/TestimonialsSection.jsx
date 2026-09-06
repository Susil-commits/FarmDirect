import React from 'react';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export default function TestimonialsSection() {
  const reviews = [
    {
      quote: "FarmDirect replaces multi-tier middlemen with a direct grower connection model that is scary good.",
      author: "Rajesh K.",
      role: "Organic Farmer, Nashik",
      badge: "Verified Grower",
      avatar: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=150&q=80",
    },
    {
      quote: "Receiving vegetables picked 4 hours ago is a game changer for our restaurant chain. It’s far superior to standard wholesale markets.",
      author: "Chef Priya Sharma",
      role: "Head of Culinary, Heritage Kitchen",
      badge: "Verified Buyer",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    },
    {
      quote: "Wispr FarmDirect just gets it right. Payouts go straight to local growers, while buyers get 100% field purity.",
      author: "Siddharth Malhotra",
      role: "Agriculture Economist",
      badge: "AgriTech Review",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
  ];

  return (
    <section className="relative bg-[#0E1712] text-[#FBF8F3] py-20 px-4 md:px-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#84A98C] bg-[#132E20] px-3.5 py-1.5 rounded-full border border-white/10">
            EARLY ACCESS, REAL RESULTS
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-normal mt-4 leading-tight">
            From the first <span className="italic text-[#E29578] font-normal">people to use it.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((item, idx) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-[#132E20]/80 border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col justify-between hover:border-[#D97736]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#D97736]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-sans-body text-[10px] font-bold bg-[#1B3B2B] text-[#84A98C] px-2.5 py-1 rounded-full border border-white/10">
                    {item.badge}
                  </span>
                </div>
                <p className="font-serif-display text-xl text-[#FBF8F3]/90 italic leading-relaxed mb-6">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <img
                  src={item.avatar}
                  alt={item.author}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#D97736]"
                />
                <div>
                  <h4 className="font-sans-body text-xs font-bold text-[#FBF8F3]">
                    {item.author}
                  </h4>
                  <span className="font-sans-body text-[11px] text-[#84A98C]">
                    {item.role}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
