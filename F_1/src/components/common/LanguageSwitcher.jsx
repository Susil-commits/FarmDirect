import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#132E20]/15 bg-[#FBF8F3] hover:bg-white text-xs font-bold text-[#132E20] shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
      title="Toggle Language (English / Hindi)"
    >
      <Globe size={15} className="text-[#D97736]" />
      <span>{i18n.language === 'hi' ? 'हिंदी' : 'EN'}</span>
    </button>
  );
}
