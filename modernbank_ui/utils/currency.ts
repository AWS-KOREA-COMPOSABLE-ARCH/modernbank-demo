// 통화 형식화 유틸리티

export const formatCurrency = (amount: number, language: 'ko' | 'en'): string => {
  if (language === 'ko') {
    // 한국어: 원화 표시
    return `${amount.toLocaleString()} 원`;
  } else {
    // 영어: 달러 기호 사용 (변환 없이 동일한 금액)
    return `$${amount.toLocaleString()}`;
  }
};

export const getCurrencySymbol = (language: 'ko' | 'en'): string => {
  return language === 'ko' ? '원' : '$';
};