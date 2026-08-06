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
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
      title="Toggle Language (English / Hindi)"
    >
      <Globe size={16} className="text-green-600" />
      <span>{i18n.language === 'hi' ? 'हिंदी' : 'EN'}</span>
    </button>
  );
}
