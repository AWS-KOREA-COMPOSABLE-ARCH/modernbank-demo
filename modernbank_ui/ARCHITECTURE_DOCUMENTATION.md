# ModernBank UI 프로젝트 아키텍처 문서

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [핵심 아키텍처](#핵심-아키텍처)
5. [파일별 상세 분석](#파일별-상세-분석)
6. [상태 관리](#상태-관리)
7. [API 통신](#api-통신)
8. [인증 시스템](#인증-시스템)
9. [라우팅 구조](#라우팅-구조)
10. [컴포넌트 계층](#컴포넌트-계층)
11. [에러 처리](#에러-처리)
12. [개발 가이드](#개발-가이드)

---

## 🏗️ 프로젝트 개요

ModernBank UI는 Next.js 15 기반의 현대적인 은행 서비스 프론트엔드 애플리케이션입니다. 마이크로서비스 아키텍처를 지원하며, 사용자 인증, 계좌 관리, 송금, 고객 관리 등의 핵심 금융 서비스를 제공합니다.

### 주요 특징
- **Next.js 15 App Router** 기반의 서버 사이드 렌더링
- **Redux Toolkit**을 통한 전역 상태 관리
- **Tailwind CSS** 기반의 반응형 UI
- **다크 모드** 지원
- **마이크로서비스** 아키텍처 지원
- **JWT 기반 인증** 시스템
- **실시간 채팅봇** 기능

---

## 🛠️ 기술 스택

### Frontend Framework
- **Next.js 15.1.3** - React 기반 풀스택 프레임워크
- **React 18.2.0** - UI 라이브러리
- **TypeScript 5** - 정적 타입 검사

### 상태 관리
- **Redux Toolkit 2.5.0** - 전역 상태 관리
- **React Redux 9.2.0** - React-Redux 바인딩
- **Redux Persist 6.0.0** - 상태 영속화

### UI/UX
- **Tailwind CSS 3.4.1** - 유틸리티 기반 CSS 프레임워크
- **Headless UI 2.2.0** - 접근성 컴포넌트
- **Heroicons 2.2.0** - 아이콘 라이브러리
- **Flowbite React 0.10.2** - UI 컴포넌트 라이브러리

### 인증
- **NextAuth.js 4.24.11** - 인증 프레임워크
- **JWT 9.0.2** - 토큰 기반 인증

### HTTP 통신
- **Axios 1.7.9** - HTTP 클라이언트
- **HTTP Proxy Middleware 3.0.3** - 프록시 설정

### 유틸리티
- **Zod 3.24.2** - 스키마 검증
- **UUID 11.0.5** - 고유 식별자 생성
- **CLSX 2.1.1** - 조건부 클래스명
- **Tailwind Merge 3.0.2** - 클래스명 병합

---

## 📁 프로젝트 구조

```
modernbank_ui/
├── app/                          # Next.js App Router
│   ├── (account)/               # 계좌 관련 페이지
│   ├── (auth)/                  # 인증 관련 페이지
│   ├── (customer)/              # 고객 관련 페이지
│   ├── (product)/               # 상품 관련 페이지
│   ├── (transfer)/              # 송금 관련 페이지
│   ├── (cqrs)/                  # CQRS 관련 페이지
│   ├── api/                     # API 라우트
│   ├── api-docs/                # API 문서
│   ├── globals.css              # 전역 스타일
│   ├── layout.tsx               # 루트 레이아웃
│   └── page.tsx                 # 홈페이지
├── components/                  # 재사용 가능한 컴포넌트
├── store/                       # Redux 상태 관리
├── types/                       # TypeScript 타입 정의
├── utils/                       # 유틸리티 함수
├── hooks/                       # 커스텀 훅
├── lib/                         # 라이브러리 설정
├── contexts/                    # React Context
└── public/                      # 정적 파일
```

---

## 🏛️ 핵심 아키텍처

### 1. 마이크로서비스 통신 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Microservices │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redux Store   │    │   API Client    │    │   Auth Service  │
│   (State Mgmt)  │    │   (Utils)       │    │   Account Svc   │
└─────────────────┘    └─────────────────┘    │   Transfer Svc  │
                                              │   Customer Svc  │
                                              │   Product Svc   │
                                              └─────────────────┘
```

### 2. 컴포넌트 아키텍처

```
App Layout
├── ClientProviders
│   ├── Redux Provider
│   ├── DarkMode Provider
│   └── ClientLayout
│       ├── Header
│       ├── AuthGuard
│       │   └── Main Content
│       └── ChatbotButton
```

---

## 📄 파일별 상세 분석

### 🏠 루트 레이아웃 및 설정

#### `app/layout.tsx`
- **역할**: 전체 애플리케이션의 루트 레이아웃
- **주요 기능**:
  - HTML 문서 구조 정의
  - 다국어 설정 (한국어)
  - ClientProviders 래핑
- **연관 파일**: `components/ClientProviders.tsx`

#### `app/page.tsx`
- **역할**: 홈페이지 (랜딩 페이지)
- **주요 기능**:
  - 히어로 섹션
  - 핵심 서비스 소개
  - 고객 리뷰 섹션
  - CTA (Call-to-Action) 섹션
- **디자인**: 배경 이미지 + 반투명 오버레이
- **연관 파일**: 각 서비스 페이지들

### 🔧 핵심 컴포넌트

#### `components/ClientProviders.tsx`
- **역할**: 전역 상태 및 컨텍스트 제공자
- **주요 기능**:
  - Redux Provider 설정
  - 다크모드 Provider 설정
  - 레이아웃 구조 정의
- **연관 파일**: 
  - `store/store.ts`
  - `contexts/DarkModeContext.tsx`
  - `components/ClientLayout.tsx`

#### `components/Header.tsx`
- **역할**: 네비게이션 헤더
- **주요 기능**:
  - 사용자 인증 상태 표시
  - 서비스별 네비게이션 메뉴
  - 다크모드 토글
  - 서비스 상태 모니터링
- **상태 관리**: Redux store 연동
- **연관 파일**: `store/authSlice.ts`

#### `components/AuthGuard.tsx`
- **역할**: 인증 보호 컴포넌트
- **주요 기능**:
  - 인증 상태 확인
  - 비인증 사용자 리다이렉트
  - 세션 유효성 검증
- **연관 파일**: 
  - `store/authSlice.ts`
  - `app/api/auth/check/route.ts`

### 💾 상태 관리

#### `store/store.ts`
- **역할**: Redux 스토어 설정
- **주요 기능**:
  - 리듀서 결합
  - 개발 도구 설정
  - 타입 정의
- **연관 파일**: 
  - `store/authSlice.ts`
  - `store/customerSlice.ts`

#### `store/authSlice.ts`
- **역할**: 인증 상태 관리
- **주요 기능**:
  - 로그인/로그아웃 상태 관리
  - 사용자 정보 저장
  - localStorage 연동
- **상태 구조**:
  ```typescript
  interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
  }
  ```

### 🌐 API 통신

#### `utils/apiClient.ts`
- **역할**: 범용 API 클라이언트
- **주요 기능**:
  - 마이크로서비스별 URL 관리
  - 자동 토큰 갱신
  - 에러 처리
  - 쿠키 기반 인증
- **지원 서비스**:
  - AUTH, CUSTOMER, ACCOUNT, TRANSFER, CQRS, PRODUCT
- **연관 파일**: `types/api.ts`

#### `utils/serverApiClient.ts`
- **역할**: 서버 사이드 API 클라이언트
- **주요 기능**:
  - 서버에서 실행되는 API 호출
  - 쿠키 처리
- **사용처**: API 라우트 핸들러

### 🎨 UI 컴포넌트

#### `components/ChatWindow.tsx`
- **역할**: 채팅봇 인터페이스
- **주요 기능**:
  - 실시간 채팅
  - 메시지 히스토리
  - 사용자 입력 처리
- **연관 파일**: `components/ChatbotButton.tsx`

#### `components/DarkModeToggle.tsx`
- **역할**: 다크모드 토글 버튼
- **주요 기능**:
  - 테마 전환
  - 상태 영속화
- **연관 파일**: `contexts/DarkModeContext.tsx`

### 🔄 컨텍스트 관리

#### `contexts/DarkModeContext.tsx`
- **역할**: 다크모드 상태 관리
- **주요 기능**:
  - 다크모드 상태 저장
  - localStorage 연동
  - CSS 클래스 자동 적용
- **상태 구조**:
  ```typescript
  interface DarkModeContextType {
    darkMode: boolean;
    toggleDarkMode: () => void;
  }
  ```
- **연관 파일**: `components/DarkModeToggle.tsx`

### 🌐 API 라우트

#### `app/api/auth/route.ts`
- **역할**: 인증 관련 API 엔드포인트
- **주요 기능**:
  - POST: 로그인 처리
  - GET: 인증 상태 확인
- **연관 파일**: 
  - `utils/apiClient.ts`
  - `components/AuthGuard.tsx`

#### `app/api/proxy/[...path]/route.ts`
- **역할**: 마이크로서비스 프록시
- **주요 기능**:
  - 서비스별 요청 라우팅
  - 헤더 전달
  - 에러 처리
  - 로깅
- **지원 서비스**: customer, account, transfer, product, cqrs
- **연관 파일**: `utils/apiClient.ts`

### 📝 타입 정의

#### `types/api.ts`
- **역할**: API 관련 타입 정의
- **주요 타입**:
  - `ApiResponse<T>`
  - `Account`, `Transaction`, `Customer`
  - `Transfer`, `Product`
  - `HealthCheckResponse`

#### `types/auth.ts`
- **역할**: 인증 관련 타입 정의
- **주요 타입**:
  - `User`
  - `AuthState`
  - `LoginRequest`

### 🎣 커스텀 훅

#### `hooks/useAuth.ts`
- **역할**: 인증 상태 접근 훅
- **주요 기능**:
  - Redux store에서 인증 상태 조회
  - 사용자 정보 및 인증 상태 반환
- **반환값**:
  ```typescript
  { user: User | null, isAuthenticated: boolean }
  ```
- **연관 파일**: `store/authSlice.ts`

#### `hooks/useDarkMode.ts`
- **역할**: 다크모드 상태 관리 훅
- **주요 기능**:
  - 다크모드 상태 토글
  - localStorage 연동
  - CSS 클래스 자동 적용
- **반환값**:
  ```typescript
  { darkMode: boolean, toggleDarkMode: () => void }
  ```
- **연관 파일**: `contexts/DarkModeContext.tsx`

#### `hooks/useOnClickOutside.ts`
- **역할**: 외부 클릭 감지 훅
- **주요 기능**:
  - 요소 외부 클릭 이벤트 감지
  - 모달, 드롭다운 등에서 사용
- **사용처**: 모달, 네비게이션 메뉴

### ⚙️ 설정 파일

#### `lib/auth.ts`
- **역할**: NextAuth.js 설정
- **주요 기능**:
  - Credentials Provider 설정
  - JWT 콜백 설정
  - 세션 콜백 설정
- **연관 파일**: 
  - `utils/apiClient.ts`
  - `types/auth.ts`

#### `next.config.ts`
- **역할**: Next.js 설정
- **주요 기능**:
  - 빌드 설정
  - 환경 변수 설정
  - 플러그인 설정

#### `tailwind.config.ts`
- **역할**: Tailwind CSS 설정
- **주요 기능**:
  - 컨텐츠 경로 설정
  - 테마 확장
  - 플러그인 설정
- **특징**: 다크모드 지원

---

## 🔄 상태 관리

### Redux Store 구조

```typescript
interface RootState {
  auth: AuthState;
  customer: CustomerState;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface CustomerState {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
}
```

### 상태 흐름

1. **인증 플로우**:
   ```
   Login Form → API Call → Redux Action → Store Update → UI Update
   ```

2. **데이터 로딩 플로우**:
   ```
   Component Mount → API Call → Redux Action → Store Update → UI Re-render
   ```

---

## 🌐 API 통신

### 서비스별 엔드포인트

| 서비스 | 환경변수 | 기본 URL |
|--------|----------|----------|
| AUTH | `NEXT_PUBLIC_AUTH` | 인증 서비스 |
| CUSTOMER | `NEXT_PUBLIC_CUSTOMER` | 고객 관리 서비스 |
| ACCOUNT | `NEXT_PUBLIC_ACCOUNT` | 계좌 관리 서비스 |
| TRANSFER | `NEXT_PUBLIC_TRANSFER` | 송금 서비스 |
| CQRS | `NEXT_PUBLIC_CQRS` | CQRS 서비스 |
| PRODUCT | `NEXT_PUBLIC_PRODUCT` | 상품 관리 서비스 |

### API 클라이언트 사용법

```typescript
import apiClient from '@/utils/apiClient';

// 계좌 조회
const response = await apiClient('ACCOUNT', '/accounts', 'GET', { customerId });

// 송금 요청
const response = await apiClient('TRANSFER', '/transfer', 'POST', transferData);
```

---

## 🔐 인증 시스템

### 인증 플로우

1. **로그인**:
   ```
   사용자 입력 → API 호출 → JWT 토큰 발급 → Redux Store 저장 → 리다이렉트
   ```

2. **세션 확인**:
   ```
   페이지 로드 → AuthGuard → API 호출 → 상태 업데이트
   ```

3. **토큰 갱신**:
   ```
   401 에러 → 자동 토큰 갱신 → 원래 요청 재시도
   ```

### 보안 특징

- **HttpOnly 쿠키** 사용
- **자동 토큰 갱신**
- **세션 기반 인증**
- **CSRF 보호**

---

## 🛣️ 라우팅 구조

### 페이지 그룹별 구조

```
app/
├── (auth)/                    # 인증 관련
│   ├── signin/page.tsx       # 로그인
│   └── signup/page.tsx       # 회원가입
├── (account)/                # 계좌 관련
│   ├── deposit/page.tsx      # 입금
│   ├── withdraw/page.tsx     # 출금
│   ├── createAccount/page.tsx # 계좌 개설
│   └── retrieveTransactionHistory/page.tsx # 거래 내역
├── (transfer)/               # 송금 관련
│   ├── transfer/page.tsx     # 송금
│   ├── btobTransfer/page.tsx # 기업간 송금
│   └── retrieveTransferHistory/page.tsx # 송금 내역
├── (customer)/               # 고객 관련
│   ├── createCustomer/page.tsx # 고객 등록
│   ├── retrieveCustomer/page.tsx # 고객 조회
│   └── retrieveCustomerCQRS/page.tsx # CQRS 고객 조회
├── (product)/                # 상품 관련
│   ├── createProduct/page.tsx # 상품 등록
│   └── retrieveProduct/page.tsx # 상품 조회
└── (cqrs)/                   # CQRS 관련
    └── customerReport/page.tsx # 고객 리포트
```

---

## 🧩 컴포넌트 계층

### 컴포넌트 트리

```
App Layout
├── ClientProviders
│   ├── Redux Provider
│   ├── DarkMode Provider
│   └── ClientLayout
│       ├── Header
│       │   ├── Navigation Menu
│       │   ├── User Menu
│       │   └── DarkMode Toggle
│       ├── AuthGuard
│       │   └── Main Content (Pages)
│       └── ChatbotButton
│           └── ChatWindow
```

### 컴포넌트 분류

#### 1. 레이아웃 컴포넌트
- `ClientLayout.tsx` - 전체 레이아웃 구조
- `Header.tsx` - 네비게이션 헤더
- `Footer.tsx` - 푸터

#### 2. 기능 컴포넌트
- `AuthGuard.tsx` - 인증 보호
- `ChatWindow.tsx` - 채팅 인터페이스
- `DarkModeToggle.tsx` - 테마 토글

#### 3. 제공자 컴포넌트
- `ClientProviders.tsx` - 전역 상태 제공
- `Providers.tsx` - 추가 제공자
- `SessionProvider.tsx` - 세션 제공

---

## ⚠️ 에러 처리

### 에러 처리 전략

1. **API 에러 처리**:
   - HTTP 상태 코드별 처리
   - 자동 토큰 갱신
   - 사용자 친화적 에러 메시지

2. **네트워크 에러 처리**:
   - 연결 실패 시 재시도
   - 오프라인 상태 감지

3. **인증 에러 처리**:
   - 401 에러 시 자동 로그아웃
   - 세션 만료 처리

### 에러 로깅

- **콘솔 로깅**: 개발 환경
- **에러 바운더리**: React 에러 캐치
- **사용자 피드백**: 모달 및 토스트 메시지

---

## 🚀 개발 가이드

### 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트 검사
npm run lint
```

### 환경 변수 설정

```env
# 마이크로서비스 URL
NEXT_PUBLIC_AUTH=http://localhost:8081
NEXT_PUBLIC_CUSTOMER=http://localhost:8082
NEXT_PUBLIC_ACCOUNT=http://localhost:8083
NEXT_PUBLIC_TRANSFER=http://localhost:8084
NEXT_PUBLIC_CQRS=http://localhost:8085
NEXT_PUBLIC_PRODUCT=http://localhost:8086

# NextAuth 설정
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 코드 컨벤션

1. **파일 명명**: PascalCase (컴포넌트), camelCase (유틸리티)
2. **폴더 구조**: 기능별 그룹화
3. **타입 정의**: 명시적 타입 사용
4. **에러 처리**: 일관된 에러 처리 패턴

### 새로운 페이지 추가

1. **라우트 생성**: `app/(group)/page-name/page.tsx`
2. **타입 정의**: `types/api.ts`에 인터페이스 추가
3. **API 클라이언트**: `utils/apiClient.ts` 활용
4. **상태 관리**: 필요시 Redux slice 추가
5. **네비게이션**: `components/Header.tsx`에 메뉴 추가

### 새로운 컴포넌트 추가

1. **컴포넌트 생성**: `components/ComponentName.tsx`
2. **타입 정의**: Props 인터페이스 정의
3. **스타일링**: Tailwind CSS 클래스 사용
4. **테스트**: 필요시 테스트 코드 작성

---

## 📊 성능 최적화

### 최적화 전략

1. **코드 스플리팅**: Next.js 자동 코드 스플리팅
2. **이미지 최적화**: Next.js Image 컴포넌트 사용
3. **번들 최적화**: Tree shaking 및 압축
4. **캐싱**: Redux Persist를 통한 상태 캐싱

### 모니터링

- **서비스 상태**: 헤더에서 실시간 상태 확인
- **에러 추적**: 콘솔 로그 및 에러 바운더리
- **성능 메트릭**: Next.js 내장 성능 모니터링

---

## 🔧 유지보수 가이드

### 일반적인 수정 사항

1. **API 엔드포인트 변경**:
   - `utils/apiClient.ts`의 SERVICE_URLS 수정
   - 관련 타입 정의 업데이트

2. **새로운 서비스 추가**:
   - 환경 변수 추가
   - API 클라이언트에 서비스 추가
   - 타입 정의 추가

3. **UI 변경**:
   - Tailwind CSS 클래스 수정
   - 컴포넌트 Props 업데이트

### 디버깅 팁

1. **Redux DevTools**: 브라우저 확장 프로그램 사용
2. **Network 탭**: API 요청/응답 확인
3. **Console 로그**: 상세한 로깅 활용
4. **React DevTools**: 컴포넌트 상태 확인

---

## 🔗 파일별 연관관계 다이어그램

### 핵심 파일 의존성

```
app/layout.tsx
├── components/ClientProviders.tsx
│   ├── store/store.ts
│   │   ├── store/authSlice.ts
│   │   └── store/customerSlice.ts
│   ├── contexts/DarkModeContext.tsx
│   ├── components/ClientLayout.tsx
│   ├── components/Header.tsx
│   │   └── hooks/useAuth.ts
│   ├── components/AuthGuard.tsx
│   │   └── app/api/auth/check/route.ts
│   └── components/ChatbotButton.tsx
│       └── components/ChatWindow.tsx
└── app/page.tsx
    └── app/(*)/*/page.tsx
```

### API 통신 흐름

```
Page Component
├── utils/apiClient.ts
│   ├── types/api.ts
│   └── app/api/proxy/[...path]/route.ts
├── store/slices/*.ts
└── components/*.tsx
```

### 상태 관리 흐름

```
User Action
├── Redux Action
├── API Call
├── Store Update
└── UI Re-render
```

---

## 🚨 트러블슈팅 가이드

### 일반적인 문제 및 해결방법

#### 1. 인증 관련 문제

**문제**: 로그인 후 인증 상태가 유지되지 않음
**원인**: localStorage 또는 쿠키 설정 문제
**해결방법**:
```typescript
// store/authSlice.ts에서 localStorage 확인
const loadInitialState = (): AuthState => {
  if (typeof window !== "undefined") {
    try {
      const savedState = localStorage.getItem("authState");
      return savedState ? JSON.parse(savedState) : { user: null, isAuthenticated: false };
    } catch (error) {
      console.error("Error loading auth state:", error);
      return { user: null, isAuthenticated: false };
    }
  }
  return { user: null, isAuthenticated: false };
};
```

#### 2. API 통신 문제

**문제**: 마이크로서비스 연결 실패
**원인**: 환경 변수 설정 오류 또는 서비스 다운
**해결방법**:
```bash
# 환경 변수 확인
echo $NEXT_PUBLIC_AUTH
echo $NEXT_PUBLIC_CUSTOMER
# ... 기타 서비스 URL들

# 서비스 상태 확인
curl http://localhost:8081/actuator/health
```

#### 3. 다크모드 문제

**문제**: 다크모드 설정이 저장되지 않음
**원인**: localStorage 접근 문제
**해결방법**:
```typescript
// contexts/DarkModeContext.tsx에서 mounted 상태 확인
useEffect(() => {
  if (mounted) {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }
}, [darkMode, mounted]);
```

#### 4. 빌드 오류

**문제**: TypeScript 타입 오류
**원인**: 타입 정의 누락 또는 불일치
**해결방법**:
```bash
# 타입 체크
npx tsc --noEmit

# 린트 검사
npm run lint

# 타입 정의 파일 확인
# types/api.ts, types/auth.ts 등
```

#### 5. 성능 문제

**문제**: 페이지 로딩 속도 느림
**원인**: 불필요한 리렌더링 또는 큰 번들 크기
**해결방법**:
```typescript
// React.memo 사용
const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// useMemo, useCallback 활용
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### 로그 분석

#### API 요청 로그
```javascript
// utils/apiClient.ts에서 상세 로깅
console.log("[API Client] Request Details:", {
  service: serviceName,
  method,
  url: requestUrl,
  headers,
  body: !isGetRequest ? body : undefined
});
```

#### Redux 상태 로그
```javascript
// store/store.ts에서 개발 도구 활성화
devTools: process.env.NODE_ENV !== 'production'
```

### 성능 모니터링

1. **Lighthouse**: 웹 성능 측정
2. **React DevTools Profiler**: 컴포넌트 렌더링 분석
3. **Network 탭**: API 요청 시간 분석
4. **Console**: 에러 및 경고 메시지 확인

---

## 📚 추가 리소스

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Redux Toolkit 문서](https://redux-toolkit.js.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

---

## 📝 문서 정보

- **최종 업데이트**: 2024년 12월
- **프로젝트 버전**: 0.1.0
- **문서 버전**: 1.0.0
- **작성자**: AI Assistant
- **검토자**: 개발팀

### 문서 업데이트 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2024-12 | 초기 문서 작성 |

---

*이 문서는 ModernBank UI 프로젝트의 현재 상태를 반영하며, 지속적으로 업데이트됩니다.*
