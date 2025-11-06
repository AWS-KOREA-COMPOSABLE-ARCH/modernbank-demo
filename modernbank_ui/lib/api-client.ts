// API client utility
export const createApiHeaders = (currentLanguage?: 'ko' | 'en', additionalHeaders: Record<string, string> = {}) => {
  // Set Accept-Language header based on currently configured language
  let acceptLanguage = 'ko-KR,ko;q=0.9';
  
  if (currentLanguage === 'en') {
    acceptLanguage = 'en-US,en;q=0.9';
  } else if (currentLanguage === 'ko') {
    acceptLanguage = 'ko-KR,ko;q=0.9';
  } else {
    // Use browser settings if currentLanguage is not available
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

// API request wrapper function
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