import apiClient from '@/utils/apiClient';
import { getApiMessage } from '@/utils/apiI18n';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 고객 스키마 정의 (기본 영어 메시지 사용)
const customerSchema = z.object({
  cstmId: z.string().min(1, "Customer ID is required"),
  cstmNm: z.string().min(1, "Customer name is required"),
  cstmAge: z.string().optional(),
  cstmGnd: z.string().optional(),
  cstmPn: z.string().optional(),
  cstmAdr: z.string().optional(),
  oneTmTrnfLmt: z.number().min(0).optional(),
  oneDyTrnfLmt: z.number().min(0).optional(),
  accounts: z.array(z.any()).optional(),
});

// GET - Retrieve basic customer information
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId") || userId;
    const action = searchParams.get("action");

    if (!customerId) {
      return NextResponse.json(
        { error: getApiMessage(request, 'api.customerIdRequired') },
        { status: 400 }
      );
    }

    let response;
    if (action === "exists") {
      // 고객 존재 여부 확인
      try {
        response = await apiClient("CUSTOMER", `/${customerId}/exists`, "GET");
      } catch (error) {
        // 417 에러는 고객이 존재하지 않는 것을 의미
        if (error instanceof Error && error.message.includes("ID does not exist")) {
          return NextResponse.json(false);
        }
        throw error;
      }
    } else {
      // 기본 고객 정보 조회
      try {
        response = await apiClient("CUSTOMER", `/${customerId}`, "GET");
      } catch (error) {
        // 417 에러는 고객이 존재하지 않는 것을 의미
        if (error instanceof Error && error.message.includes("ID does not exist")) {
          return NextResponse.json(
            { error: getApiMessage(request, 'api.customerNotFound') },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    if (!response?.data && action !== "exists") {
      return NextResponse.json(
        { error: getApiMessage(request, 'api.customerNotFound') },
        { status: 404 }
      );
    }

    return NextResponse.json(response.data);

  } catch (error: unknown) {
    console.error('[Customer API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : getApiMessage(request, 'api.serverError');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Register a new customer
export async function POST(request: NextRequest) {
  console.log('[Customer API POST] Function called');
  
  try {
    const userId = request.headers.get('x-user-id');
    console.log('[Customer API POST] User ID:', userId);
    
    const body = await request.json();
    console.log('[Customer API POST] Request body:', body);
    
    // 데이터 유효성 검사
    try {
      const validatedData = customerSchema.parse(body);
      console.log('[Customer API POST] Validation successful:', validatedData);
      
      // ID가 헤더에만 있고 body에 없는 경우 추가
      if (!validatedData.cstmId && userId) {
        validatedData.cstmId = userId;
      }
      
      console.log('[Customer API POST] Calling backend API...');
      const response = await apiClient("CUSTOMER", "/", "POST", validatedData);

      console.log('[Customer API POST] Backend response:', response);
      console.log('[Customer API POST] Backend response data:', response?.data);
      console.log('[Customer API POST] Backend response data type:', typeof response?.data);
      console.log('[Customer API POST] Response data === 0:', response?.data === 0);
      console.log('[Customer API POST] Response data truthy check:', !!response?.data);
      console.log('[Customer API POST] Condition check (response?.data === 0 || response?.data):', (response?.data === 0 || response?.data));
      
      // 백엔드에서 0을 성공 응답으로 보내는 경우 처리
      if (response?.data === 0 || response?.data) {
        const successResponse = { 
          message: getApiMessage(request, 'api.customerRegistrationComplete'),
          data: response.data 
        };
        console.log('[Customer API POST] Sending success response:', successResponse);
        return NextResponse.json(successResponse, { status: 200 });
      }

      // 백엔드 응답이 없거나 실패한 경우
      console.log('[Customer API POST] Backend response is falsy, sending error');
      return NextResponse.json(
        { error: getApiMessage(request, 'api.customerRegistrationFailed') },
        { status: 400 }
      );
      
    } catch (error) {
      console.log('[Customer API POST] Validation error:', error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join('\n');
        console.log('[Customer API POST] Zod validation errors:', error.errors);
        return NextResponse.json(
          { error: errorMessages, details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

  } catch (error: unknown) {
    console.error('[Customer API POST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : getApiMessage(request, 'api.serverError');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(request: NextRequest) {
  console.log('[Customer API PUT] Function called');
  
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();

    console.log('[Customer API PUT] Request:', {
      userId,
      body,
      headers: Object.fromEntries(request.headers)
    });

    if (!userId) {
      return NextResponse.json(
        { error: getApiMessage(request, 'api.userInfoRequired') },
        { status: 401 }
      );
    }

    // 데이터 유효성 검사
    try {
      const validatedData = customerSchema.partial().parse(body);
      console.log('[Customer API PUT] Validated data:', validatedData);
      
      // CUSTOMER 서비스로 PUT 요청 전송
      const response = await apiClient("CUSTOMER", `/${userId}`, "PUT", validatedData, {
        'Content-Type': 'application/json'
      });

      console.log('[Customer API PUT] Response:', response);

      if (!response?.data) {
        return NextResponse.json(
          { error: getApiMessage(request, 'api.customerUpdateFailed') },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        message: getApiMessage(request, 'api.customerUpdateComplete'),
        data: response.data 
      }, { status: 200 });
      
    } catch (error) {
      console.error('[Customer API PUT] Validation error:', error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join('\n');
        return NextResponse.json(
          { error: errorMessages, details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

  } catch (error: unknown) {
    console.error('[Customer API PUT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : getApiMessage(request, 'api.serverError');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE customer
export async function DELETE(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: getApiMessage(request, "api.customerIdRequired") },
        { status: 400 }
      );
    }

    const response = await apiClient("CUSTOMER", `/customer/${customerId}`, "DELETE");
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[Customer DELETE] Error:", error);
    const errorMessage = error instanceof Error ? error.message : getApiMessage(request, "api.serverError");
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 