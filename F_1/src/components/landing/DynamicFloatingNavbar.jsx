import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sprout, ArrowRight, Menu, X, ShoppingBag } from 'lucide-react';

export default function DynamicFloatingNavbar({ activeSection = 'cream', onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme styles based on current active section behind navbar
  const isCream = activeSection === 'cream';
  const isForest = activeSection === 'forest';
  const _isDark = activeSection === 'dark';

  const navbarBg = isCream
    ? 'rgba(251, 248, 243, 0.88)'
    : isForest
    ? 'rgba(19, 46, 32, 0.88)'
    : 'rgba(14, 23, 18, 0.92)';

  const borderColor = isCream
    ? 'rgba(19, 46, 32, 0.15)'
    : isForest
    ? 'rgba(251, 248, 243, 0.2)'
    : 'rgba(251, 248, 243, 0.15)';

  const textColor = isCream ? '#132E20' : '#FBF8F3';
  const subTextColor = isCream ? 'rgba(19, 46, 32, 0.7)' : 'rgba(251, 248, 243, 0.75)';

  const logoColor = isCream ? '#132E20' : '#FBF8F3';
  const sproutColor = isCream ? '#D97736' : isForest ? '#E29578' : '#84A98C';

  const buttonBg = isCream
    ? '#132E20'
    : isForest
    ? '#D97736'
    : '#FBF8F3';

  const buttonText = isCream
    ? '#FBF8F3'
    : isForest
    ? '#FBF8F3'
    : '#0E1712';

  const navLinks = [
    { label: 'Direct Marketplace', href: '#hero' },
    { label: 'Why Direct', href: '#why-direct' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Impact & Farms', href: '#impact' },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8 max-w-6xl mx-auto pointer-events-none">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          backgroundColor: navbarBg,
          borderColor: borderColor,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto rounded-full border backdrop-blur-md shadow-lg py-2.5 px-4 md:px-6 flex items-center justify-between transition-colors duration-500"
        style={{
          boxShadow: isCream
            ? '0 10px 30px -10px rgba(19, 46, 32, 0.08)'
            : '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Left: Logo & Wordmark */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('hero');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <motion.div
            animate={{ backgroundColor: sproutColor }}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
          >
            <Sprout className="w-5 h-5 text-white stroke-[2.2]" />
          </motion.div>
          <div className="flex flex-col">
            <motion.span
              animate={{ color: logoColor }}
              className="font-serif-display text-xl md:text-2xl font-bold tracking-tight leading-none"
            >
              FarmDirect
            </motion.span>
            <motion.span
              animate={{ color: subTextColor }}
              className="font-sans-body text-[10px] tracking-wider uppercase font-semibold -mt-0.5"
            >
              Straight from origin
            </motion.span>
          </div>
        </a>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                const targetId = link.href.replace('#', '');
                const el = document.getElementById(targetId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative text-sm font-medium transition-colors duration-200 hover:opacity-80 py-1"
            >
              <motion.span animate={{ color: textColor }}>
                {link.label}
              </motion.span>
            </a>
          ))}
        </div>

        {/* Right: Solid Pill CTA Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            animate={{
              backgroundColor: buttonBg,
              color: buttonText,
            }}
            onClick={() => {
              if (onNavigate) onNavigate('/marketplace');
              else {
                const el = document.getElementById('why-direct');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="font-sans-body px-5 py-2 rounded-full text-xs md:text-sm font-semibold tracking-wide flex items-center gap-2 shadow-md transition-all duration-300 cursor-pointer"
          >
            <span>Start Direct Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-full transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" style={{ color: textColor }} />
            ) : (
              <Menu className="w-5 h-5" style={{ color: textColor }} />
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mt-2 rounded-2xl border p-4 shadow-xl backdrop-blur-xl md:hidden"
            style={{
              backgroundColor: navbarBg,
              borderColor: borderColor,
            }}
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    const targetId = link.href.replace('#', '');
                    const el = document.getElementById(targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ color: textColor }}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: borderColor }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) onNavigate('/marketplace');
                  }}
                  className="w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                  style={{ backgroundColor: buttonBg, color: buttonText }}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Browse Harvests</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
