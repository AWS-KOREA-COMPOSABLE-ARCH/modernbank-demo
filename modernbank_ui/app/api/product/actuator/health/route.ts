import { NextRequest, NextResponse } from "next/server";
import apiClient from "@/utils/apiClient";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ status: "DOWN", error: '사용자 정보가 없습니다.' }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Connection': 'close'
          }
        }
      );
    }

    try {
      // Check if the base product endpoint is available
      const { data } = await apiClient("PRODUCT", "/actuator", "GET", undefined, {
        'x-user-id': userId
      });

      // If we can reach the base endpoint and get data, the service is up
      if (data) {
        return new NextResponse(
          JSON.stringify({ status: "UP" }),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Connection': 'close'
            }
          }
        );
      } else {
        throw new Error("상품 서비스 응답이 실패했습니다.");
      }
    } catch (error: unknown) {
      // If we can't reach the endpoint or get a successful response, consider the service as down
      console.error("Product service check failed:", error);
      return new NextResponse(
        JSON.stringify({ 
          status: "DOWN",
          error: error instanceof Error ? error.message : "상품 서비스에 접근할 수 없습니다."
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Connection': 'close'
          }
        }
      );
    }
  } catch (error: unknown) {
    console.error('[Product Health Check] Error:', error);
    return new NextResponse(
      JSON.stringify({ 
        status: "DOWN",
        error: error instanceof Error ? error.message : "상품 서비스 상태 확인 중 오류가 발생했습니다."
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Connection': 'close'
        }
      }
    );
  }
} 