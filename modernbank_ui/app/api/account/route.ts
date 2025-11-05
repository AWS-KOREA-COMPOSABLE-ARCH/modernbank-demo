import apiClient from "@/utils/apiClient";
import { getApiMessage } from "@/utils/apiI18n";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 계좌 생성 요청 스키마 정의 (기본 영어 메시지 사용)
const accountSchema = z.object({
  acntNo: z.string().min(1, "Account number is required"),
  cstmId: z.string().min(1, "Customer ID is required"),
  cstmNm: z.string().min(1, "Customer name is required"),
  acntNm: z.string().min(1, "Account name is required"),
  newDtm: z.string().optional(),
  acntBlnc: z.number().min(0, "Account balance must be 0 or more").optional(),
});

// 거래 요청 스키마 정의 (입금/출금 공통)
const transactionSchema = z.object({
  acntNo: z.string().min(1, "Account number is required"),
  seq: z.number().default(0),
  divCd: z.string().default("D"),
  stsCd: z.string().default("C"),
  trnsAmt: z.number().min(1, "Transaction amount must be 1 or more"),
  acntBlnc: z.number().min(0, "Account balance must be 0 or more"),
  trnsBrnch: z.string().default(""),
  trnsDtm: z.string().optional(),
});

// 타행 이체 확인 스키마 정의
const confirmWithdrawalSchema = z.object({
  acntNo: z.string().min(1, "Account number is required"),
  seq: z.number(),
  divCd: z.string(),
  stsCd: z.string().refine(
    val => val === "1" || val === "2", 
    {
      message: "Status code must be '1'(confirm) or '2'(cancel) only"
    }
  ),
  trnsAmt: z.number().min(1, "Transaction amount must be 1 or more"),
  acntBlnc: z.number().min(0, "Account balance must be 0 or more"),
  trnsBrnch: z.string(),
  trnsDtm: z.string().optional(),
});

interface ValidationError {
  message: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const customerId = searchParams.get("customerId");
  const accountNo = searchParams.get("accountNo");

  if (!path) {
    return NextResponse.json({ error: getApiMessage(request, "api.pathRequired") }, { status: 400 });
  }

  try {
    let response;
    switch (path) {
      case "accounts":
        if (!customerId) {
          return NextResponse.json({ error: getApiMessage(request, "api.customerIdRequired") }, { status: 400 });
        }
        response = await apiClient("ACCOUNT", `/customer/${customerId}/accounts`, "GET");
        break;
      case "account":
        if (!accountNo) {
          return NextResponse.json({ error: getApiMessage(request, "api.accountNumberRequired") }, { status: 400 });
        }
        response = await apiClient("ACCOUNT", `/${accountNo}`, "GET");
        break;
      case "balance":
        if (!accountNo) {
          return NextResponse.json({ error: getApiMessage(request, "api.accountNumberRequired") }, { status: 400 });
        }
        response = await apiClient("ACCOUNT", `/${accountNo}/balance`, "GET");
        return NextResponse.json(response.data);
      case "transactions":
        if (!accountNo) {
          return NextResponse.json({ error: getApiMessage(request, "api.accountNumberRequired") }, { status: 400 });
        }
        response = await apiClient("ACCOUNT", `/${accountNo}/transactions`, "GET");
        break;
      default:
        return NextResponse.json({ error: getApiMessage(request, "api.invalidPath") }, { status: 400 });
    }

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : getApiMessage(request, "api.internalServerError") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    // 요청 타입에 따라 다른 처리
    if (type === "deposit") {
      // 입금 요청 처리
      const validatedData = transactionSchema.parse({
        acntNo: body.accountNo,
        trnsAmt: body.amount,
        acntBlnc: body.currentBalance || 0,
        trnsDtm: new Date().toISOString(),
        divCd: "D", // 입금 구분 코드
        stsCd: "C", // 완료 상태 코드
        seq: 0,
        trnsBrnch: body.branch || "",
      });

      const response = await apiClient("ACCOUNT", "/deposits/", "POST", validatedData);
      return NextResponse.json(response.data);
    } else if (type === "withdrawal") {
      // 출금 요청 처리
      const validatedData = transactionSchema.parse({
        acntNo: body.accountNo,
        trnsAmt: body.amount,
        acntBlnc: body.currentBalance || 0,
        trnsDtm: new Date().toISOString(),
        divCd: "W", // 출금 구분 코드
        stsCd: body.isOtherBankTransfer ? "0" : "1", // 타행 이체면 대기 상태(0), 당행이체면 성공 상태(1)
        seq: 0,
        trnsBrnch: body.branch || "",
      });

      const response = await apiClient("ACCOUNT", "/withdrawals/", "POST", validatedData);
      return NextResponse.json(response.data);
    } else if (type === "withdrawal-confirm") {
      // 타행 이체 결과 확인 처리
      const validatedData = confirmWithdrawalSchema.parse({
        acntNo: body.accountNo,
        seq: body.seq || 0,
        divCd: body.divCd || "W",
        stsCd: body.stsCd, // "1"(확인) 또는 "2"(취소)만 허용
        trnsAmt: body.amount,
        acntBlnc: body.currentBalance || 0,
        trnsBrnch: body.branch || "",
        trnsDtm: body.trnsDtm || new Date().toISOString(),
      });

      const response = await apiClient("ACCOUNT", "/withdrawals/confirm/", "POST", validatedData);
      return NextResponse.json(response.data);
    } else {
      // 계좌 생성 요청 처리
      const validatedData = accountSchema.parse(body);

      // 현재 시간을 newDtm으로 설정 (없는 경우)
      if (!validatedData.newDtm) {
        validatedData.newDtm = new Date().toISOString();
      }

      // 초기 잔액 설정 (없는 경우)
      if (validatedData.acntBlnc === undefined) {
        validatedData.acntBlnc = 0;
      }

      const response = await apiClient("ACCOUNT", "/", "POST", validatedData);
      return NextResponse.json(response.data);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err: ValidationError) => err.message).join('\n');
      return NextResponse.json(
        { error: errorMessages, details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : getApiMessage(request, "api.serverError") },
      { status: 500 }
    );
  }
} 