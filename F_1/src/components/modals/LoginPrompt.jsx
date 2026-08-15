import React from 'react';
import { X, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

export default function LoginPrompt({ isOpen, onClose, onLogin, onRegister, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132E20]/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-[36px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in p-6 sm:p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition cursor-pointer text-stone-500 hover:text-stone-800"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#132E20] to-[#1B3B2B] text-white flex items-center justify-center shadow-lg text-2xl">
            🔐
          </div>
        </div>

        {}
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736] bg-[#D97736]/10 px-3 py-1 rounded-full border border-[#D97736]/20">
            AUTHENTICATION REQUIRED
          </span>
          <h2 className="font-serif-display text-3xl font-normal text-[#132E20] mt-2">
            Login Required
          </h2>
          <p className="text-stone-600 text-xs mt-2 leading-relaxed px-2">
            {message || "Login to your account to proceed with direct crop orders and negotiations."}
          </p>
        </div>

        {}
        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full py-3.5 bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogIn size={16} />
            <span>Login to Account</span>
          </button>

          <div className="relative my-2 text-center">
            <span className="bg-white px-3 text-[10px] font-bold uppercase text-stone-400">or</span>
          </div>

          <button
            onClick={onRegister}
            className="w-full py-3.5 bg-[#D97736] hover:bg-[#c06528] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <UserPlus size={16} />
            <span>3-Step Registration Wizard</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-stone-500 hover:text-stone-800 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Continue Browsing
          </button>
        </div>

        {}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-center gap-1.5 text-stone-500 text-[11px]">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>256-bit encrypted direct farmer connection</span>
        </div>
      </div>
    </div>
  );
}
