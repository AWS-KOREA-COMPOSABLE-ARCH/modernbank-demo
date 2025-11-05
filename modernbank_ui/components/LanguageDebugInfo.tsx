"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

export default function LanguageDebugInfo() {
  const { language } = useLanguage();
  const [browserInfo, setBrowserInfo] = useState<{
    language: string;
    languages: string[];
  } | null>(null);

  useEffect(() => {
    setBrowserInfo({
      language: navigator.language,
      languages: Array.from(navigator.languages || [])
    });
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // 개발 환경에서만 표시
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
      <div className="font-semibold mb-2">Language Debug Info</div>
      <div>Current: <span className="font-mono bg-gray-700 px-1 rounded">{language}</span></div>
      {browserInfo && (
        <>
          <div>Browser: <span className="font-mono bg-gray-700 px-1 rounded">{browserInfo.language}</span></div>
          <div>Languages: <span className="font-mono bg-gray-700 px-1 rounded text-xs">{browserInfo.languages.join(', ')}</span></div>
        </>
      )}
      <div className="mt-2 text-gray-300 text-xs">
        <div>🔄 브라우저 언어 기반 자동 감지</div>
        <div>📡 API 요청 시 Accept-Language 헤더 전달</div>
        <div>🌐 프론트엔드 ↔ 백엔드 언어 동기화</div>
      </div>
    </div>
  );
}