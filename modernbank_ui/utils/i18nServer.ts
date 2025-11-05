// 서버사이드에서 사용할 다국어 유틸리티

interface Messages {
  [key: string]: {
    ko: string;
    en: string;
  };
}

const messages: Messages = {
  // 공통 메시지
  'common.userInfoRequired': {
    ko: '사용자 정보가 없습니다.',
    en: 'User information is required.'
  },
  'common.serverError': {
    ko: '서버 오류가 발생했습니다.',
    en: 'A server error occurred.'
  },
  'common.invalidRequestData': {
    ko: '잘못된 요청 데이터입니다.',
    en: 'Invalid request data.'
  },

  // 상품 관련 메시지
  'product.notFound': {
    ko: '상품 정보를 찾을 수 없습니다.',
    en: 'Product information not found.'
  },
  'product.createSuccess': {
    ko: '상품이 성공적으로 생성되었습니다.',
    en: 'Product created successfully.'
  },
  'product.createError': {
    ko: '상품 생성 중 오류 발생',
    en: 'Error occurred while creating product'
  },

  // 검증 메시지
  'validation.product.id.required': {
    ko: '상품 ID는 필수입니다',
    en: 'Product ID is required'
  },
  'validation.product.name.required': {
    ko: '상품명은 필수입니다',
    en: 'Product name is required'
  },
  'validation.product.description.required': {
    ko: '상품 설명은 필수입니다',
    en: 'Product description is required'
  },
  'validation.product.interestRate.min': {
    ko: '이자율은 0 이상이어야 합니다',
    en: 'Interest rate must be 0 or higher'
  },
  'validation.product.currency.required': {
    ko: '통화는 필수입니다',
    en: 'Currency is required'
  }
};

/**
 * Accept-Language 헤더에서 언어 추출
 */
export function getLocaleFromHeader(acceptLanguage: string | null): 'ko' | 'en' {
  if (!acceptLanguage) return 'ko'; // 기본값: 한국어

  // Accept-Language 헤더 파싱 (예: "ko-KR,ko;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      return { code: code.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // 한국어 우선 확인
  for (const lang of languages) {
    if (lang.code.startsWith('ko')) {
      return 'ko';
    }
  }

  // 영어 확인
  for (const lang of languages) {
    if (lang.code.startsWith('en')) {
      return 'en';
    }
  }

  return 'ko'; // 기본값
}

/**
 * 메시지 키에 해당하는 다국어 메시지 반환
 */
export function getMessage(locale: 'ko' | 'en', key: string, fallback?: string): string {
  const message = messages[key];
  if (message && message[locale]) {
    return message[locale];
  }
  
  // 폴백: 한국어 → 영어 → 키 자체 → fallback
  if (message && message.ko) return message.ko;
  if (message && message.en) return message.en;
  if (fallback) return fallback;
  return key;
}

/**
 * Request 객체에서 언어를 추출하고 메시지를 반환하는 헬퍼 함수
 */
export function getLocalizedMessage(request: Request, key: string, fallback?: string): string {
  const acceptLanguage = request.headers.get('Accept-Language');
  const locale = getLocaleFromHeader(acceptLanguage);
  return getMessage(locale, key, fallback);
}