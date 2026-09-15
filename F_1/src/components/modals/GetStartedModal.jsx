import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';

export default function GetStartedModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('buyer');
  const { initiateGoogleLogin, initiateGitHubLogin } = useAuth();
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

  const handleGoogleLogin = useCallback(() => {
    onClose?.();
    initiateGoogleLogin();
  }, [initiateGoogleLogin, onClose]);

  const handleGitHubLogin = useCallback(() => {
    onClose?.();
    initiateGitHubLogin();
  }, [initiateGitHubLogin, onClose]);

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

              {}
              <div className="relative space-y-2.5 mb-5">
                {}
                <motion.button
                  type="button"
                  onClick={handleGoogleLogin}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full py-3 px-4 bg-white border border-[#132E20]/12 rounded-2xl text-sm font-semibold text-[#132E20] flex items-center justify-center gap-3 hover:bg-gray-50/80 hover:border-[#132E20]/20 transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </motion.button>

                {}
                <motion.button
                  type="button"
                  onClick={handleGitHubLogin}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full py-3 px-4 bg-[#0d1117] border border-[#132E20]/10 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-3 hover:bg-[#161b22] transition-all shadow-sm hover:shadow-md"
                >
                  {}
                  <svg className="w-4 h-4 flex-shrink-0 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>Continue with GitHub</span>
                </motion.button>
              </div>

              {}
              <div className="relative my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-[#132E20]/10" />
                <span className="text-[11px] text-[#132E20]/40 uppercase font-bold tracking-widest">or</span>
                <div className="flex-1 h-px bg-[#132E20]/10" />
              </div>

              {}
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
