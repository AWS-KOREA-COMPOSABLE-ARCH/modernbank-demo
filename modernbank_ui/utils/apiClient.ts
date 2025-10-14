import { getSession } from "next-auth/react";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type ServiceName = "AUTH" | "CUSTOMER" | "ACCOUNT" | "TRANSFER" | "CQRS" | "PRODUCT";

/**
 * 서비스 URL 매핑 객체
 */
const SERVICE_URLS: Record<ServiceName, string> = {
  AUTH: process.env.NEXT_PUBLIC_AUTH || "",
  CUSTOMER: process.env.NEXT_PUBLIC_CUSTOMER || "",
  ACCOUNT: process.env.NEXT_PUBLIC_ACCOUNT || "",
  TRANSFER: process.env.NEXT_PUBLIC_TRANSFER || "",
  CQRS: process.env.NEXT_PUBLIC_CQRS || "",
  PRODUCT: process.env.NEXT_PUBLIC_PRODUCT || "",
};

/**
 * 서비스 이름에 따라 URL을 반환하는 함수
 */
const getServiceUrl = (serviceName: ServiceName): string => {
  const url = SERVICE_URLS[serviceName];
  if (!url) {
    console.error(`Missing URL for service: ${serviceName}`);
  }
  console.log(`[Service URL] ${serviceName}: ${url}`);
  return url;
};

/**
 * 토큰 갱신 요청 함수 (쿠키 기반)
 * HttpOnly 쿠키에 저장된 refresh token을 사용하여 토큰을 갱신합니다.
 */
const refreshAuthToken = async (): Promise<void> => {
  try {
    console.log("[Token Refresh] Refreshing token...");
    const authBaseUrl = getServiceUrl("AUTH");

    const response = await fetch(`${authBaseUrl}/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ 쿠키 자동 전송
    });

    if (!response.ok) {
      // throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    console.log("[Token Refresh] Token refreshed successfully.");
  } catch (error: any) {
    console.error("[Token Refresh] Error refreshing token:", error.message);
    // throw new Error("Failed to refresh token");
  }
};

/**
 * 범용 API 클라이언트 (쿠키 기반 인증)
 * @param serviceName - 요청을 보낼 서비스 이름
 * @param endpoint - 서비스의 엔드포인트
 * @param method - HTTP 메서드 (GET, POST, PUT, DELETE)
 * @param body - 요청 본문 (선택 사항)
 */
const apiClient = async (
  serviceName: ServiceName,
  endpoint: string,
  method: HttpMethod,
  body?: object,
  headers?: Record<string, string>
): Promise<{ data: any; headers: Headers }> => {
  const baseUrl = getServiceUrl(serviceName);
  const fullEndpoint = endpoint.startsWith("/") ? endpoint : `${endpoint}`;
  const url = `${baseUrl}${fullEndpoint}`;

  // ✅ GET 요청은 params, 나머지는 body 사용
  const isGetRequest = method.toUpperCase() === "GET";
  const requestUrl = isGetRequest && body
    ? `${url}?${new URLSearchParams(body as Record<string, string>)}`
    : url;

  console.log("[API Client] Request Details:", {
    service: serviceName,
    method,
    url: requestUrl,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: !isGetRequest ? body : undefined,
    params: isGetRequest ? body : undefined
  });

  const fetchConfig: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    credentials: "include", // ✅ 쿠키 자동 포함
  };

  if (!isGetRequest && body) {
    fetchConfig.body = JSON.stringify(body);
  }

  try {
    console.log("[API Client] Sending request...");
    let response = await fetch(requestUrl, fetchConfig);
    console.log("[API Client] Response received:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // ✅ 401 Unauthorized → Token Refresh 후 재시도
    if (response.status === 401) {
      console.warn("[API Client] Unauthorized. Attempting to refresh token...");
      try {
        await refreshAuthToken();
        console.log("[API Client] Token refreshed, retrying request...");
        response = await fetch(requestUrl, fetchConfig); // ✅ 재시도
        console.log("[API Client] Retry response:", {
          status: response.status,
          statusText: response.statusText
        });
      } catch (refreshError: any) {
        console.error("[API Client] Failed to refresh token:", refreshError.message);
        throw new Error("Authentication failed. Please log in again.");
      }
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        console.error("[API Client] Error response:", errorData);
        
        // 417 에러 (ID does not exist)는 특별 처리
        if (response.status === 417) {
          console.log("[API Client] 417 error - ID does not exist, treating as normal case");
          return { data: false, headers: response.headers };
        }
        
        throw new Error(errorData.message || `Request failed: ${response.statusText}`);
      } else {
        console.error("[API Client] Non-JSON error response:", response.statusText);
        throw new Error(`Request failed: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else if (contentType && contentType.includes("text/plain")) {
      const textResponse = await response.text();
      // text/plain 응답을 JSON으로 변환 시도
      try {
        data = JSON.parse(textResponse);
      } catch {
        // JSON으로 파싱할 수 없는 경우 텍스트를 그대로 반환
        data = { message: textResponse };
      }
    } else {
      console.error("[API Client] Unsupported content type:", contentType);
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    console.log("[API Client] Success response data:", data);
    console.log("[API Client] Response data type:", typeof data);
    console.log("[API Client] Response data stringified:", JSON.stringify(data));
    console.log("[API Client] Data is 0:", data === 0);
    console.log("[API Client] Data is falsy:", !data);
    console.log("[API Client] Returning data:", { data, headers: response.headers });

    return { data, headers: response.headers };
  } catch (error: any) {
    console.error("[API Client] Request failed:", {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export default apiClient;
