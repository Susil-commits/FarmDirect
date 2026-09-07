import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();

  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
  const isHindi = currentLang.startsWith('hi');

  const toggleLanguage = () => {
    const nextLang = isHindi ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#132E20]/15 bg-[#FBF8F3] hover:bg-white text-xs font-bold text-[#132E20] shadow-sm hover:shadow transition-all duration-200 cursor-pointer ${className}`}
      title={t('navbar.lang_toggle', 'Toggle Language (English / Hindi)')}
      aria-label={t('navbar.lang_toggle', 'Toggle Language (English / Hindi)')}
    >
      <Globe size={15} className="text-[#D97736]" />
      <span>{isHindi ? 'हिंदी' : 'EN'}</span>
    </button>
  );
}
