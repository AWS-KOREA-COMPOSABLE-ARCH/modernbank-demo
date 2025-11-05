// API 클라이언트 유틸리티
export const createApiHeaders = (currentLanguage?: 'ko' | 'en', additionalHeaders: Record<string, string> = {}) => {
  // 현재 설정된 언어에 따라 Accept-Language 헤더 설정
  let acceptLanguage = 'ko-KR,ko;q=0.9';
  
  if (currentLanguage === 'en') {
    acceptLanguage = 'en-US,en;q=0.9';
  } else if (currentLanguage === 'ko') {
    acceptLanguage = 'ko-KR,ko;q=0.9';
  } else {
    // currentLanguage가 없으면 브라우저 설정 사용
    acceptLanguage = navigator.language === 'en' || navigator.language.startsWith('en') 
      ? 'en-US,en;q=0.9' 
      : 'ko-KR,ko;q=0.9';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': acceptLanguage,
    ...additionalHeaders
  };

  return headers;
};

// API 요청 래퍼 함수
export const apiRequest = async (
  url: string, 
  options: RequestInit = {},
  currentLanguage?: 'ko' | 'en'
): Promise<Response> => {
  const defaultHeaders = createApiHeaders(currentLanguage);
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  return fetch(url, mergedOptions);
};