"use client";

import { getMessage } from '@/lib/i18n';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 브라우저 언어 감지 함수
function detectBrowserLanguage(): Language {
  // 브라우저의 언어 설정들을 확인
  const browserLanguages = [
    navigator.language,
    ...(navigator.languages || [])
  ].filter(Boolean);

  console.log('Browser languages detected:', browserLanguages);

  // 한국어 감지 (ko, ko-KR, ko-KP 등)
  const hasKorean = browserLanguages.some(lang => 
    lang.toLowerCase().startsWith('ko')
  );

  if (hasKorean) {
    console.log('Korean language detected, setting to Korean');
    return 'ko';
  }

  // 한국어가 아닌 경우 영어로 설정
  console.log('Non-Korean language detected, setting to English');
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    // URL 파라미터에서 언어 확인
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang') as Language;
    
    if (urlLang && (urlLang === 'ko' || urlLang === 'en')) {
      setLanguage(urlLang);
      localStorage.setItem('language', urlLang);
      return;
    }
    
    // 로컬 스토리지에서 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    } else {
      // 브라우저 언어 설정 기반 자동 감지
      const detectedLanguage = detectBrowserLanguage();
      setLanguage(detectedLanguage);
      localStorage.setItem('language', detectedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, fallback?: string) => {
    return getMessage(language, key, fallback);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // 개발 중 임시 fallback
    console.warn('useLanguage must be used within a LanguageProvider. Using fallback.');
    return {
      language: 'ko' as const,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key
    };
  }
  return context;
}