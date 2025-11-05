/**
 * 모든 페이지에 다국어 지원을 일괄 적용하기 위한 유틸리티
 * 하드코딩된 한글 텍스트를 찾아서 다국어 키로 매핑
 */

export const koreanToI18nKeyMap: Record<string, string> = {
  // Common
  '알림': 'common.info',
  '확인': 'common.confirm',
  '취소': 'common.cancel',
  '저장': 'common.save',
  '삭제': 'common.delete',
  '수정': 'common.edit',
  '생성': 'common.create',
  '처리중...': 'common.loading',
  '성공': 'common.success',
  '오류': 'common.error',
  '경고': 'common.warning',
  '정보': 'common.info',
  '닫기': 'common.close',
  '뒤로': 'common.back',
  '다음': 'common.next',
  '이전': 'common.previous',
  '검색': 'common.search',
  '초기화': 'common.reset',
  '제출': 'common.submit',
  '지우기': 'common.clear',

  // Customer
  '고객 등록': 'customer.registration',
  '고객 정보 수정': 'customer.modification',
  '고객 ID': 'customer.id',
  '고객명': 'customer.name',
  '나이': 'customer.age',
  '성별': 'customer.gender',
  '남': 'customer.male',
  '여': 'customer.female',
  '주소': 'customer.address',
  '전화번호': 'customer.phone',
  '나이 입력': 'customer.enterAge',
  '주소 입력': 'customer.enterAddress',
  '전화번호 입력': 'customer.enterPhone',
  '고객 등록이 완료되었습니다.': 'customer.registrationComplete',
  '고객 정보가 수정되었습니다.': 'customer.modificationComplete',
  '사용자 이름을 불러오는데 실패했습니다.': 'customer.fetchUsernameFailed',

  // Account
  '계좌 개설': 'account.creation',
  '계좌번호': 'account.number',
  '고객 ID': 'account.customerId',
  '고객명': 'account.customerName',
  '상품 선택': 'account.productSelection',
  '기본 정보': 'account.basicInfo',
  '입금 정보': 'account.depositInfo',
  '초기 입금액': 'account.initialDeposit',
  '입금액을 입력하세요': 'account.enterAmount',
  '계좌가 성공적으로 생성되었습니다.': 'account.creationSuccess',
  '계좌 생성에 실패했습니다.': 'account.creationFailed',
  '사용자 인증이 필요합니다.': 'account.authRequired',

  // Transfer
  '당행 이체': 'transfer.internal',
  '출금 계좌': 'transfer.fromAccount',
  '출금 계좌를 선택하세요': 'transfer.selectFromAccount',
  '현재 잔액': 'transfer.currentBalance',
  '이체 유형': 'transfer.transferType',
  '내 계좌로 이체': 'transfer.toMyAccount',
  '다른 사람에게 이체': 'transfer.toOtherAccount',
  '입금 계좌': 'transfer.toAccount',
  '입금 계좌번호': 'transfer.toAccountNumber',
  '이체 금액': 'transfer.amount',
  '이체 금액을 입력하세요': 'transfer.enterAmount',
  '내 통장 메모': 'transfer.myMemo',
  '받는 통장 메모': 'transfer.receiveMemo',
  '이체 중...': 'transfer.transferring',
  '이체하기': 'transfer.transfer',
  '이체 완료!': 'transfer.completed',
  '잔액이 부족합니다.': 'transfer.insufficientBalance',

  // Auth
  '로그인': 'auth.signin',
  '회원가입': 'auth.signup',
  '계정에 로그인하여 서비스를 이용하세요.': 'auth.signinDesc',
  '아이디': 'auth.userId',
  '비밀번호': 'auth.password',
  '아이디를 입력하세요': 'auth.userIdPlaceholder',
  '비밀번호를 입력하세요': 'auth.passwordPlaceholder',
  '로그인 중...': 'auth.signingIn',
  '계정이 없으신가요?': 'auth.noAccount',
  '로그인에 실패했습니다.': 'auth.loginFailed',
  '로그인 중 오류가 발생했습니다.': 'auth.loginError',

  // Errors
  '네트워크 오류가 발생했습니다.': 'errors.networkError',
  '서버 오류가 발생했습니다.': 'errors.serverError',
  '알 수 없는 오류가 발생했습니다.': 'errors.unknownError',
  '계좌 정보를 찾을 수 없습니다.': 'errors.accountNotFound',
};

/**
 * 하드코딩된 한글 텍스트를 i18n 키로 변환
 */
export function convertKoreanToI18nKey(koreanText: string): string {
  return koreanToI18nKeyMap[koreanText] || koreanText;
}

/**
 * 파일 내용에서 하드코딩된 한글을 찾아서 i18n 키로 교체하는 정규식 패턴들
 */
export const i18nReplacementPatterns = [
  // 문자열 리터럴 패턴
  {
    pattern: /"([^"]*[\u3131-\u318E\uAC00-\uD7A3]+[^"]*)"/g,
    replacement: (match: string, koreanText: string) => {
      const i18nKey = convertKoreanToI18nKey(koreanText);
      return i18nKey === koreanText ? match : `{t('${i18nKey}')}`;
    }
  },
  // 템플릿 리터럴 패턴
  {
    pattern: /`([^`]*[\u3131-\u318E\uAC00-\uD7A3]+[^`]*)`/g,
    replacement: (match: string, koreanText: string) => {
      const i18nKey = convertKoreanToI18nKey(koreanText);
      return i18nKey === koreanText ? match : `{t('${i18nKey}')}`;
    }
  }
];