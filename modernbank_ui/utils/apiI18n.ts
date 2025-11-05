import { getMessage } from '@/lib/i18n';

export function getLocaleFromRequest(request: Request): 'ko' | 'en' {
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  
  // Accept-Language 헤더에서 한국어 감지
  if (acceptLanguage.toLowerCase().includes('ko')) {
    return 'ko';
  }
  
  return 'en'; // 기본값은 영어
}

export function getApiMessage(request: Request, key: string, fallback?: string): string {
  const locale = getLocaleFromRequest(request);
  return getMessage(locale, key, fallback);
}