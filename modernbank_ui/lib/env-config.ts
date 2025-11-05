// 환경별 기본 언어 설정
export const getDefaultLanguage = (): 'ko' | 'en' => {
  // 환경 변수로 기본 언어 설정
  const envLang = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE;
  if (envLang === 'en' || envLang === 'ko') {
    return envLang;
  }
  
  // 도메인 기반 언어 감지
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('en.') || hostname.includes('.com')) {
      return 'en';
    }
  }
  
  // 기본값: 한국어
  return 'ko';
};