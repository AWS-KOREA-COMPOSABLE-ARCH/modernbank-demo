// Default language setting by environment
export const getDefaultLanguage = (): 'ko' | 'en' => {
  // Set default language via environment variable
  const envLang = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE;
  if (envLang === 'en' || envLang === 'ko') {
    return envLang;
  }
  
  // Domain-based language detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('en.') || hostname.includes('.com')) {
      return 'en';
    }
  }
  
  // Default: Korean
  return 'ko';
};