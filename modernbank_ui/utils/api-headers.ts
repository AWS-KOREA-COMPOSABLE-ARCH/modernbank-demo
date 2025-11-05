import { NextRequest } from 'next/server';

/**
 * Next.js API 라우트에서 프론트엔드 요청의 언어 헤더를 백엔드로 전달하기 위한 유틸리티
 */
export function createBackendHeaders(request: NextRequest, additionalHeaders: Record<string, string> = {}) {
  const acceptLanguage = request.headers.get('accept-language') || 'ko-KR,ko;q=0.9';
  const userId = request.headers.get('x-user-id');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': acceptLanguage,
    ...additionalHeaders
  };

  // x-user-id가 있으면 추가 (필요한 경우)
  if (userId) {
    headers['x-user-id'] = userId;
  }

  return headers;
}

/**
 * 언어 헤더 추출 유틸리티
 */
export function extractLanguageFromRequest(request: NextRequest): 'ko' | 'en' {
  const acceptLanguage = request.headers.get('accept-language') || '';
  
  // 한국어가 포함되어 있으면 한국어, 아니면 영어
  if (acceptLanguage.toLowerCase().includes('ko')) {
    return 'ko';
  }
  
  return 'en';
}