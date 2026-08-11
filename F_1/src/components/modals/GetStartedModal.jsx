import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Sprout, ShieldCheck, Mail } from 'lucide-react';

export default function GetStartedModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('buyer'); // buyer or farmer

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSuccess) onSuccess({ email, role: userRole });
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card (Wispr Flow style at video 1:13) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md bg-[#FBF8F3] text-[#132E20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#132E20]/15 z-10 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#132E20]/10 hover:bg-[#132E20]/20 flex items-center justify-center transition-colors text-[#132E20]"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#132E20] text-[#FBF8F3] flex items-center justify-center mx-auto mb-3 shadow-md">
              <Sprout className="w-6 h-6 text-[#D97736]" />
            </div>
            <h3 className="font-serif-display text-3xl font-bold">
              Get started
            </h3>
            <p className="font-sans-body text-xs text-[#132E20]/70 mt-1">
              Connect directly with verified local growers
            </p>

            {/* Buyer vs Farmer Pill Switcher */}
            <div className="flex bg-[#F4EFE6] p-1 rounded-full border border-[#132E20]/10 mt-4 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setUserRole('buyer')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                  userRole === 'buyer'
                    ? 'bg-[#132E20] text-[#FBF8F3] shadow-sm'
                    : 'text-[#132E20]/70 hover:text-[#132E20]'
                }`}
              >
                Direct Buyer
              </button>
              <button
                type="button"
                onClick={() => setUserRole('farmer')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                  userRole === 'farmer'
                    ? 'bg-[#D97736] text-white shadow-sm'
                    : 'text-[#132E20]/70 hover:text-[#132E20]'
                }`}
              >
                Local Farmer
              </button>
            </div>
          </div>

          {/* Social Auth Buttons (Wispr Flow style) */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 px-4 bg-white border border-[#132E20]/15 rounded-xl font-sans-body text-xs font-semibold text-[#132E20] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 px-4 bg-white border border-[#132E20]/15 rounded-xl font-sans-body text-xs font-semibold text-[#132E20] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.6.7-1.13 1.83-0.99 2.93 1.07.08 2.15-.53 2.8-1.33z"/>
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#132E20]/10" />
            </div>
            <span className="relative bg-[#FBF8F3] px-3 font-sans-body text-[11px] text-[#132E20]/50 uppercase font-semibold">
              or
            </span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#132E20]/20 rounded-xl font-sans-body text-sm text-[#132E20] focus:outline-none focus:border-[#D97736] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#132E20] hover:bg-[#1B3B2B] text-[#FBF8F3] font-sans-body text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Trusted by logo strip footer */}
          <div className="mt-6 pt-4 border-t border-[#132E20]/10 text-center">
            <span className="font-sans-body text-[10px] font-bold text-[#132E20]/40 uppercase tracking-widest block mb-2">
              Trusted by 1,450+ Verified Local Farms
            </span>
            <div className="flex items-center justify-center gap-4 text-xs font-serif-display font-bold text-[#132E20]/60">
              <span>Green Valley</span>
              <span>•</span>
              <span>Sunrise Orchards</span>
              <span>•</span>
              <span>Riverbed Organics</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
