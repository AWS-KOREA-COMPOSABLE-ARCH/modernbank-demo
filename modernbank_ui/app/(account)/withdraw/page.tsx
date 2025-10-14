"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface Account {
  acntNo: string;
  acntNm: string;
  acntBlnc: number;
}

interface WithdrawResult {
  formerBlnc: number;
  trnsAmt: number;
  acntBlnc: number;
}

export default function Withdraw() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountInfo, setAccountInfo] = useState<Account | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<WithdrawResult | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      showModal("오류", "사용자 인증이 필요합니다.");
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
      setAccounts(accounts);
      // 자동으로 첫 번째 계좌를 선택하지 않음
      setSelectedAccount("");
      setAccountInfo(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "계좌 조회 중 오류가 발생했습니다.";
      showModal("오류", errorMessage);
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
      showModal("오류", errorMessage);
      setAccountInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      showModal("오류", "유효한 출금 금액을 입력해주세요.");
      return;
    }
    if (!accountInfo) {
      showModal("오류", "계좌를 먼저 선택하세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.user_id || "",
        },
        body: JSON.stringify({
          type: "withdrawal",
          accountNo: accountInfo.acntNo,
          amount: Number(withdrawAmount),
          currentBalance: accountInfo.acntBlnc
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "출금 처리에 실패했습니다.");
      }

      const data = await response.json();
      setWithdrawResult(data);
      showModal("성공", `출금 완료! 금액: ${Number(withdrawAmount).toLocaleString()} 원`);
      setAccountInfo((prev) =>
        prev ? { ...prev, acntBlnc: prev.acntBlnc - Number(withdrawAmount) } : prev
      );
      setWithdrawAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "출금 처리 중 오류가 발생했습니다.";
      showModal("오류", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 타이틀 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            출금
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            계좌를 선택하고 출금할 금액을 입력하세요.
          </p>
        </div>

        {/* 계좌 선택 및 출금 폼 */}
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
                {accounts.map((account) => (
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

            {/* 출금 금액 입력 */}
            {accountInfo && (
              <div>
                <label
                  htmlFor="withdrawAmount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  출금할 금액
                </label>
                <div className="relative">
                  <input
                    id="withdrawAmount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={withdrawAmount}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, "");
                      setWithdrawAmount(numericValue);
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 pr-12 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="출금할 금액을 입력하세요"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">원</span>
                  </div>
                </div>
              </div>
            )}

            {/* 출금 버튼 */}
            {accountInfo && (
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isLoading}
                className="w-full px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    출금 중...
                  </span>
                ) : '출금하기'}
              </button>
            )}
          </div>
        </div>

        {/* 출금 결과 */}
        {withdrawResult && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              출금 결과
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">출금 전 잔고</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {withdrawResult.formerBlnc.toLocaleString()} 원
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">출금액</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {withdrawResult.trnsAmt.toLocaleString()} 원
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">현재 잔고</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {withdrawResult.acntBlnc.toLocaleString()} 원
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <DialogTitle className="text-lg font-medium text-gray-900 dark:text-white">
              {modalContent.title}
            </DialogTitle>
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {modalContent.message}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors duration-200"
              >
                확인
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
