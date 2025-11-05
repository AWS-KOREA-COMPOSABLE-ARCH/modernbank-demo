"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative">
      <button
        onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
        title={language === 'ko' ? 'Switch to English' : '한국어로 변경'}
      >
        <GlobeAltIcon className="h-5 w-5" />
        <span className="uppercase font-semibold">
          {language === 'ko' ? 'KO' : 'EN'}
        </span>
      </button>
    </div>
  );
}