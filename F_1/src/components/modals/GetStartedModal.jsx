import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Sprout } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';

export default function GetStartedModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('buyer');
  const { navigate } = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleEmailSubmit = useCallback((e) => {
    e.preventDefault();
    onClose?.();
    
    const params = new URLSearchParams({ role: userRole });
    if (email) params.set('email', email);
    navigate(`/auth/register?${params.toString()}`);
  }, [email, userRole, navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Get Started">
          {}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
          />

          {}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {}
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative bg-[#FAFAF7] text-[#132E20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#132E20]/12 overflow-hidden">
              {}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-amber-50/30 pointer-events-none rounded-3xl" />

              {}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#132E20]/8 hover:bg-[#132E20]/18 flex items-center justify-center transition-all text-[#132E20] hover:rotate-90 duration-200 z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {}
              <div className="relative text-center mb-6">
                {}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#132E20] to-[#1e4830] text-[#FBF8F3] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#132E20]/25"
                >
                  <Sprout className="w-7 h-7 text-emerald-300" />
                </motion.div>

                <h2 className="font-bold text-2xl sm:text-3xl tracking-tight text-[#132E20]">
                  Join FarmDirect
                </h2>
                <p className="text-sm text-[#132E20]/60 mt-1 font-medium">
                  Connect directly with verified local growers
                </p>

                {}
                <div className="flex bg-[#F0EBE1] p-1 rounded-full border border-[#132E20]/8 mt-5 max-w-xs mx-auto gap-1">
                  {[
                    { value: 'buyer', label: '🛒 Buyer', active: 'bg-[#132E20] text-[#FBF8F3] shadow-sm' },
                    { value: 'farmer', label: '🌾 Farmer', active: 'bg-gradient-to-r from-[#D97736] to-[#c76a28] text-white shadow-sm' },
                  ].map(({ value, label, active }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUserRole(value)}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                        userRole === value ? active : 'text-[#132E20]/55 hover:text-[#132E20]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="relative space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#132E20]/15 rounded-2xl text-sm text-[#132E20] placeholder-[#132E20]/35 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full py-3 bg-gradient-to-r from-[#132E20] to-[#1e4830] hover:from-[#1a3d2b] hover:to-[#265c3d] text-[#FBF8F3] text-sm font-bold rounded-2xl shadow-lg shadow-[#132E20]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>

              {}
              <div className="relative mt-6 pt-5 border-t border-[#132E20]/8 text-center">
                <p className="text-[10px] font-bold text-[#132E20]/35 uppercase tracking-widest mb-2">
                  Trusted by 1,450+ Verified Local Farms
                </p>
                <div className="flex items-center justify-center gap-3 text-xs font-semibold text-[#132E20]/45">
                  <span>Green Valley</span>
                  <span className="text-[#132E20]/20">•</span>
                  <span>Sunrise Orchards</span>
                  <span className="text-[#132E20]/20">•</span>
                  <span>Riverbed Organics</span>
                </div>
                <p className="text-[10px] text-[#132E20]/30 mt-3">
                  By continuing, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => { onClose?.(); navigate('/terms'); }}
                    className="underline hover:text-[#132E20]/60 transition-colors"
                  >
                    Terms
                  </button>{' '}
                  &{' '}
                  <button
                    type="button"
                    onClick={() => { onClose?.(); navigate('/privacy'); }}
                    className="underline hover:text-[#132E20]/60 transition-colors"
                  >
                    Privacy Policy
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
