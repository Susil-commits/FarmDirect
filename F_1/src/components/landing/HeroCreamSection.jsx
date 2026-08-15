import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { CheckCircle2, Play, Volume2, Sparkles, ArrowRight, ShieldCheck, MapPin, Clock, Leaf } from 'lucide-react';

export default function HeroCreamSection({ onExploreClick, onGetStarted }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioActive, setAudioActive] = useState(true);

  const farmPartners = [
    { name: 'Green Valley Organics', location: 'Nashik, MH' },
    { name: 'Sunrise Heritage Orchards', location: 'Shimla, HP' },
    { name: 'Golden Wheat Fields', location: 'Ludhiana, PB' },
    { name: 'Riverbed Spice Collective', location: 'Wayanad, KL' },
    { name: 'Evergreen Dairy & Farms', location: 'Anand, GJ' },
    { name: 'Highland Tea Estate', location: 'Munnar, KL' },
    { name: 'Blossom Valley Berries', location: 'Mahabaleshwar, MH' },
  ];

  return (
    <section
      id="hero"
      className="relative bg-[#FBF8F3] text-[#132E20] pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden min-h-screen flex flex-col justify-between"
    >
      {}
      <div className="absolute top-12 left-0 right-0 pointer-events-none z-0 opacity-40 md:opacity-50">
        <svg
          className="w-full max-w-5xl mx-auto h-48 overflow-visible"
          viewBox="0 0 900 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            id="heroArcPath"
            d="M 50 170 Q 380 20 850 140"
            fill="none"
            stroke="transparent"
          />
          <text className="font-sans-body text-xs md:text-sm tracking-[0.25em] font-bold uppercase fill-[#132E20]/40">
            <textPath href="#heroArcPath" startOffset="0%">
              ✦ DIRECT FROM LOCAL FARMS • ZERO MIDDLEMEN MARKUPS • 100% TRANSPARENT HARVEST TRACEABILITY • PEAK FRESHNESS GUARANTEED ✦
            </textPath>
          </text>
        </svg>
      </div>

      {}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#D97736]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-[#132E20]/5 rounded-full blur-3xl pointer-events-none" />

      {}
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 w-full">
        {}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-[#F4EFE6] border border-[#132E20]/15 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#132E20] mb-6 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
          <span>FarmDirect 2.0 • Direct Farm-to-Buyer Protocol</span>
        </motion.div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {}
          <div className="lg:col-span-8 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-serif-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight font-normal text-[#132E20]"
            >
              Middlemen slow things down —{' '}
              <span className="block italic text-[#D97736] font-normal pt-1">
                go straight to the source.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="font-sans-body text-base md:text-lg text-[#132E20]/75 max-w-2xl font-normal leading-relaxed"
            >
              Connect directly with verified local growers. Skip multi-tier distribution markups, track real-time harvest schedules, and get farm-fresh produce delivered straight to your door within hours of picking.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button
                onClick={onExploreClick}
                className="font-sans-body px-7 py-3.5 rounded-full bg-[#132E20] text-[#FBF8F3] font-semibold text-sm md:text-base shadow-lg hover:bg-[#1B3B2B] hover:shadow-xl transition-all duration-300 flex items-center gap-3 cursor-pointer group"
              >
                <span>Browse Today's Harvest</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {onGetStarted && (
                <button
                  onClick={onGetStarted}
                  className="font-sans-body px-6 py-3.5 rounded-full bg-[#D97736] text-white font-semibold text-sm md:text-base shadow-lg hover:bg-[#c76a28] hover:shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="font-sans-body px-6 py-3.5 rounded-full bg-white/70 border border-[#132E20]/20 text-[#132E20] font-semibold text-sm hover:bg-white transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#D97736]" />
                <span>See Fair-Price Guarantee</span>
              </a>
            </motion.div>
          </div>

          {/* Right Column / Overlay Floating Widget Cards */}
          <div className="lg:col-span-4 relative min-h-[220px] lg:min-h-[320px] flex flex-col justify-center">
            {/* Widget Card 1: Audio Waveform Indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.4 },
                scale: { duration: 0.5, delay: 0.4 },
                y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute -top-4 right-2 lg:-left-6 lg:top-2 z-20 bg-white/95 backdrop-blur-md border border-[#132E20]/10 rounded-full px-4 py-2.5 shadow-xl flex items-center gap-3 rotate-[-2deg] hover:rotate-0 transition-transform cursor-pointer"
              onClick={() => setAudioActive(!audioActive)}
            >
              <div className="w-8 h-8 rounded-full bg-[#D97736]/15 flex items-center justify-center text-[#D97736]">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans-body text-[11px] font-bold text-[#132E20] leading-tight">
                  Farmer Rajesh • Audio Log
                </span>
                <span className="font-sans-body text-[10px] text-[#132E20]/60">
                  "Harvesting ripe Alphonso today"
                </span>
              </div>
              <div className="flex items-center gap-0.5 ml-1 h-5">
                {[40, 90, 60, 100, 50, 80, 30].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full bg-[#D97736] ${
                      audioActive ? 'animate-soundwave' : 'h-1'
                    }`}
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Widget Card 2: Order Status Checkmark Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.55 },
                scale: { duration: 0.5, delay: 0.55 },
                y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
              }}
              className="absolute top-24 right-4 lg:right-0 z-30 bg-[#132E20] text-[#FBF8F3] rounded-2xl p-3.5 shadow-2xl border border-white/10 flex items-center gap-3 rotate-[3deg] hover:rotate-0 transition-transform max-w-[260px]"
            >
              <div className="w-9 h-9 rounded-full bg-[#84A98C]/20 text-[#84A98C] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#84A98C]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans-body text-xs font-bold text-[#FBF8F3]">
                    Order Confirmed
                  </span>
                  <span className="bg-[#D97736] text-[9px] font-bold px-1.5 py-0.2 rounded text-white">
                    LIVE
                  </span>
                </div>
                <span className="font-sans-body text-[11px] text-[#FBF8F3]/70">
                  12kg Heirloom Tomatoes • #FD-8921
                </span>
              </div>
            </motion.div>

            {/* Widget Card 3: Small Farmer Profile Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.7 },
                scale: { duration: 0.5, delay: 0.7 },
                y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
              }}
              className="absolute bottom-2 left-6 lg:left-2 z-10 bg-white/95 backdrop-blur-md border border-[#132E20]/15 rounded-2xl p-3 shadow-xl flex items-center gap-3 rotate-[-1deg] hover:rotate-0 transition-transform"
            >
              <img
                src="https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=120&q=80"
                alt="Farmer Ananya"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#D97736]"
              />
              <div className="flex flex-col">
                <span className="font-sans-body text-xs font-bold text-[#132E20]">
                  Ananya Sharma
                </span>
                <div className="flex items-center gap-1 text-[10px] text-[#132E20]/70 font-medium">
                  <MapPin className="w-3 h-3 text-[#D97736]" />
                  <span>Nashik • Harvested 2h ago</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Hero Media Panel */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#132E20]/10 aspect-[16/9] sm:aspect-[21/9] bg-[#132E20]"
        >
          {/* Farm Media Image */}
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
            alt="Lush green organic farm field at sunrise"
            className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.05] transition-transform duration-700 hover:scale-105"
          />

          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#132E20]/80 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Live Pill Control Bar centered near bottom */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl">
            <div className="bg-[#132E20]/85 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between text-[#FBF8F3]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-[#D97736] hover:bg-[#C86428] text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                >
                  <Play className={`w-4 h-4 ${isPlaying ? 'fill-current' : 'ml-0.5'}`} />
                </button>
                <div className="flex flex-col">
                  <span className="font-sans-body text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sunrise Harvest Stream • Nashik Hub
                  </span>
                  <span className="font-sans-body text-[10px] text-[#FBF8F3]/70">
                    Live quality check & direct packaging
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
                <span className="bg-white/10 px-3 py-1 rounded-full text-[11px] border border-white/15">
                  100% Organic
                </span>
                <span className="flex items-center gap-1 text-[#84A98C]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Picked 6:00 AM</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Marquee Strip Below Hero */}
      <div className="mt-16 pt-8 border-t border-[#132E20]/10 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 mb-4 text-center">
          <span className="font-sans-body text-[11px] font-bold tracking-[0.2em] text-[#132E20]/50 uppercase">
            TRUSTED BY LOCAL FARMS AT
          </span>
        </div>

        <div className="relative w-full overflow-hidden py-2 bg-[#F4EFE6]/50">
          <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
            {[...farmPartners, ...farmPartners, ...farmPartners].map((farm, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Leaf className="w-4 h-4 text-[#D97736]" />
                <span className="font-serif-display text-xl md:text-2xl font-bold text-[#132E20]">
                  {farm.name}
                </span>
                <span className="font-sans-body text-xs font-semibold px-2 py-0.5 rounded-full bg-[#132E20]/10 text-[#132E20]/80">
                  {farm.location}
                </span>
                <span className="text-[#132E20]/20 ml-6">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
