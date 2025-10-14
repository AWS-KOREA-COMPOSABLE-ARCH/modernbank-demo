"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface AccountInfo {
  acntNm: string;
  acntNo: string;
  cstmId: string;
  cstmNm: string;
  acntBlnc: number;
}

interface DepositResult {
  formerBlnc: number;
  trnsAmt: number;
  acntBlnc: number;
}

export default function Deposit() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [accountList, setAccountList] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);

  const showModal = (message: string) => {
    setModalOpen(true);
    setModalContent({ title: "알림", message });
  };

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      showModal("사용자 인증이 필요합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/account?path=accounts&customerId=${user.user_id}`, {
        headers: {
          'x-user-id': user.user_id
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "계좌 정보를 찾을 수 없습니다.");
      }

      const accounts = Array.isArray(data) ? data : data.data || [];
      setAccountList(accounts);
      // 자동으로 첫 번째 계좌를 선택하지 않음
      setSelectedAccount("");
      setAccountInfo(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "계좌 조회 중 오류가 발생했습니다.";
      showModal(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user, fetchAccounts]);

  const handleSelectAccount = async (acntNo: string) => {
    setSelectedAccount(acntNo);
    
    if (!acntNo) {
      setAccountInfo(null);
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`/api/account?path=account&accountNo=${acntNo}`, {
        headers: {
          'x-user-id': user?.user_id || ''
        }
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버 응답이 JSON 형식이 아닙니다.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "계좌 정보를 찾을 수 없습니다.");
      }

      if (!data || typeof data !== 'object') {
        throw new Error("계좌 정보를 찾을 수 없습니다.");
      }

      setAccountInfo(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "계좌 조회 중 오류가 발생했습니다.";
      showModal(errorMessage);
      setAccountInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!accountInfo) {
      showModal("계좌를 먼저 선택하세요.");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showModal("유효한 입금 금액을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "deposit",
          accountNo: accountInfo.acntNo,
          amount: amount,
          currentBalance: accountInfo.acntBlnc,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "입금 처리 실패.");
      }

      setDepositResult(data);
      showModal(`입금 완료! 금액: ${amount.toLocaleString()} 원`);
      setAccountInfo((prev) =>
        prev ? { ...prev, acntBlnc: prev.acntBlnc + amount } : prev
      );
      setDepositAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "입금 처리 중 오류가 발생했습니다.";
      showModal(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 타이틀 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          입금
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          계좌를 선택하고 입금할 금액을 입력하세요.
        </p>
      </div>

      {/* 계좌 선택 및 입금 폼 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          {/* 계좌 선택 */}
          <div>
            <label
              htmlFor="accountSelect"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              계좌 선택
            </label>
            <select
              id="accountSelect"
              value={selectedAccount}
              onChange={(e) => handleSelectAccount(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">계좌를 선택하세요</option>
              {accountList.map((account) => (
                <option key={account.acntNo} value={account.acntNo}>
                  {account.acntNm} ({account.acntNo})
                </option>
              ))}
            </select>
          </div>

          {/* 선택된 계좌 정보 */}
          {accountInfo && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                계좌 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">계좌명</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{accountInfo.acntNm}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">계좌번호</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{accountInfo.acntNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">현재 잔액</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {accountInfo.acntBlnc.toLocaleString()} 원
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 입금 금액 입력 */}
          {accountInfo && (
            <div>
              <label
                htmlFor="depositAmount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                입금할 금액
              </label>
              <div className="relative">
                <input
                  id="depositAmount"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={depositAmount}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setDepositAmount(numericValue);
                  }}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 pr-12 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="입금할 금액을 입력하세요"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">원</span>
                </div>
              </div>
            </div>
          )}

          {/* 입금 버튼 */}
          {accountInfo && (
            <button
              type="button"
              onClick={handleDeposit}
              disabled={isLoading}
              className="w-full px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  입금 중...
                </span>
              ) : '입금하기'}
            </button>
          )}
        </div>
      </div>

      {/* 입금 결과 */}
      {depositResult && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            입금 결과
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">입금 전 잔고</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {depositResult.formerBlnc.toLocaleString()} 원
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">입금액</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {depositResult.trnsAmt.toLocaleString()} 원
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">현재 잔고</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {depositResult.acntBlnc.toLocaleString()} 원
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 모달 */}
      {modalOpen && modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {modalContent.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {modalContent.message}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors duration-200"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
