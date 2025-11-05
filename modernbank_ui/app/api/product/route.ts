import apiClient from "@/utils/apiClient";
import { getLocaleFromHeader, getMessage } from "@/utils/i18nServer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 상품 생성 요청 스키마 정의 (다국어 처리를 위해 동적으로 생성)
const createProductSchema = (locale: 'ko' | 'en') => z.object({
  id: z.string().min(1, getMessage(locale, 'validation.product.id.required')),
  name: z.string().min(1, getMessage(locale, 'validation.product.name.required')),
  description: z.string().min(1, getMessage(locale, 'validation.product.description.required')),
  interestRate: z.number().min(0, getMessage(locale, 'validation.product.interestRate.min')),
  currency: z.string().min(1, getMessage(locale, 'validation.product.currency.required')),
});

export async function GET(request: NextRequest) {
  const locale = getLocaleFromHeader(request.headers.get('Accept-Language'));
  
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: getMessage(locale, 'common.userInfoRequired') },
        { status: 401 }
      );
    }

    const response = await apiClient("PRODUCT", "", "GET", undefined, {
      'x-user-id': userId
    });

    if (!response?.data) {
      return NextResponse.json(
        { error: getMessage(locale, 'product.notFound') },
        { status: 404 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('[Product API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : getMessage(locale, 'common.serverError');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const locale = getLocaleFromHeader(request.headers.get('Accept-Language'));
  
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: getMessage(locale, 'common.userInfoRequired') },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Received request body:", body);
    
    // 요청 데이터 검증 (다국어 스키마 사용)
    const productSchema = createProductSchema(locale);
    const validatedData = productSchema.parse(body);
    console.log("Validated data:", validatedData);

    // API Client를 사용하여 PRODUCT 서비스로 요청 전송
    console.log("Sending request to PRODUCT service...");
    const { data } = await apiClient(
      "PRODUCT",
      "/",
      "POST",
      validatedData,
      { 'x-user-id': userId }
    );
    console.log("Received response data:", data);

    return NextResponse.json(
      { message: getMessage(locale, 'product.createSuccess'), data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Detailed error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: getMessage(locale, 'common.invalidRequestData'), errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error(getMessage(locale, 'product.createError'), error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : getMessage(locale, 'common.serverError'),
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 