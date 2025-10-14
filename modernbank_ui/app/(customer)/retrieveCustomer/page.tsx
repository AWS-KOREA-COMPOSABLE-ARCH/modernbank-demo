"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Dialog, DialogTitle } from "@headlessui/react";
import { useRouter } from "next/navigation";

interface Account {
  acntNm: string;
  acntNo: string;
  acntBlnc: number;
  newDtm: string;
}

interface CustomerData {
  cstmId: string;
  cstmNm: string;
  cstmGnd: string;
  cstmAge: string;
  cstmAdr: string;
  cstmPn: string;
}

export default function RetrieveCustomer() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // 페이지 로드 시 Redux store에서 userID를 가져와서 자동으로 조회
  useEffect(() => {
    if (user?.user_id) {
      fetchCustomerData(user.user_id);
      fetchAccounts(user.user_id);
    } else {
      setErrorMessage("로그인이 필요합니다.");
      setErrorModalOpen(true);
      router.push('/signin');
    }
  }, [user, router]);

  // 고객 데이터 조회 함수
  const fetchCustomerData = async (userId: string) => {
    setLoading(true);

    try {
      const apiResponse = await fetch(`/api/customer?customerId=${userId}&action=details`, {
        headers: {
          'x-user-id': userId
        }
      });

      const responseData = await apiResponse.json();

      if (!apiResponse.ok) {
        setErrorMessage(responseData.error || "고객 정보를 가져오는데 실패했습니다.");
        setErrorModalOpen(true);
        return;
      }

      setCustomerData(responseData);
    } catch (error: unknown) {
      console.error("고객 조회 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 계좌 정보 조회 함수
  const fetchAccounts = async (userId: string) => {
    try {
      const apiResponse = await fetch(`/api/account?path=accounts&customerId=${userId}`, {
        headers: {
          'x-user-id': userId
        }
      });

      const responseData = await apiResponse.json();

      if (!apiResponse.ok) {
        console.error("계좌 정보 조회 실패:", responseData.error);
        return;
      }

      const accountsData = Array.isArray(responseData) ? responseData : responseData.data || [];
      setAccounts(accountsData);
    } catch (error: unknown) {
      console.error("계좌 조회 실패:", error);
    }
  };

  // 날짜 형식 변환 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      return dateString;
    }
  };

  // 고객 조회 버튼 클릭 시 상세 정보 조회
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.user_id) {
      setErrorMessage("고객 ID를 찾을 수 없습니다.");
      setErrorModalOpen(true);
      return;
    }
    await fetchCustomerData(user.user_id);
    await fetchAccounts(user.user_id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 고객 조회 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            고객 조회
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            고객의 상세 정보와 보유 계좌를 조회합니다.
          </p>

          <form onSubmit={handleSearch} className="mt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-grow max-w-xs">
                <label htmlFor="cstmId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  고객 ID
                </label>
                <input
                  id="cstmId"
                  type="text"
                  value={user?.user_id || ''}
                  disabled
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-75"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    조회중...
                  </span>
                ) : '조회하기'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 고객 정보 카드 */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            고객 상세정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">고객ID</p>
              <p className="text-sm text-gray-900 dark:text-white">{customerData?.cstmId ?? '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">이름</p>
              <p className="text-sm text-gray-900 dark:text-white">{customerData?.cstmNm ?? '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">성별</p>
              <p className="text-sm text-gray-900 dark:text-white">{customerData?.cstmGnd ?? '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">나이</p>
              <p className="text-sm text-gray-900 dark:text-white">{customerData?.cstmAge ?? '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">주소</p>
              <p className="text-sm text-gray-900 dark:text-white">{customerData?.cstmAdr ?? '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">전화번호</p>
              <p className="text-sm text-gray-900 dark:text-white">{customerData?.cstmPn ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 계좌 정보 카드 */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            보유 계좌 목록
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">계좌명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">계좌번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">잔액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">개설일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        계좌 정보를 불러오는 중입니다...
                      </div>
                    </td>
                  </tr>
                ) : accounts?.length ? (
                  accounts.map((account, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{account.acntNm}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium whitespace-nowrap">{account.acntNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(account.acntBlnc)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(account.newDtm)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        보유한 계좌가 없습니다.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 에러 모달 */}
      <Dialog
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              오류 발생
            </DialogTitle>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">{errorMessage}</div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setErrorModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
