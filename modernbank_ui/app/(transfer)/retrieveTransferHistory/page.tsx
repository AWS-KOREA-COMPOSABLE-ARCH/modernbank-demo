"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface TransferRecord {
  cstmId: string;
  seq: number;
  divCd: string;
  stsCd: string;
  dpstAcntNo: string;
  wthdAcntNo: string;
  wthdAcntSeq: number;
  sndMm: string;
  rcvMm: string;
  rcvCstmNm: string;
  trnfAmt: number;
  trnfDtm: string;
}

export default function TransferHistory() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [cstmId, setCstmId] = useState<string>(user?.user_id || "");
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  const handleSearch = async () => {
    if (!cstmId.trim()) {
      showModal("경고", "고객번호를 입력하세요.");
      return;
    }

    if (!user?.user_id) {
      showModal("오류", "사용자 인증이 필요합니다.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/transfer?path=history&customerId=${cstmId}`, {
        headers: {
          'x-user-id': user.user_id
        }
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버 응답이 JSON 형식이 아닙니다.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "이체 내역을 불러올 수 없습니다.");
      }

      if (!Array.isArray(data)) {
        throw new Error("이체 내역 데이터 형식이 올바르지 않습니다.");
      }

      const sortedByLatest = [...data].sort((a: TransferRecord, b: TransferRecord) => {
        // 날짜 문자열 파싱이 안전하도록 공백을 'T'로 치환하여 파싱 시도
        const aTime = new Date(a.trnfDtm.replace(' ', 'T')).getTime();
        const bTime = new Date(b.trnfDtm.replace(' ', 'T')).getTime();
        return bTime - aTime; // 최신 우선
      });
      setTransferHistory(sortedByLatest);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "이체 내역 조회 중 오류가 발생했습니다.";
      showModal("오류", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date(dateStr));
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 타이틀 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            이체 이력 조회
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            고객번호를 입력하여 이체 내역을 조회하세요.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 검색 폼 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label
                htmlFor="customerId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                고객번호
              </label>
              <input
                id="customerId"
                type="text"
                value={cstmId}
                onChange={(e) => setCstmId(e.target.value)}
                placeholder="고객번호를 입력하세요"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    조회 중...
                  </span>
                ) : '조회'}
              </button>
            </div>
          </div>
        </div>

        {/* 이체 내역 테이블 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            이체 내역
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">이체구분</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">거래일시</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">출금계좌</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">입금계좌</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">받는 분</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">이체금액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">받는 통장 메모</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transferHistory.length > 0 ? (
                  transferHistory.map((transfer, idx) => (
                    <tr
                      key={transfer.seq}
                      className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                        {transfer.divCd === "D" ? "당행" : "타행"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(transfer.trnfDtm)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                        {transfer.wthdAcntNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                        {transfer.dpstAcntNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                        {transfer.rcvCstmNm || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {transfer.trnfAmt.toLocaleString()} 원
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                        {transfer.rcvMm || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transfer.stsCd === "0" || transfer.stsCd === "3" || transfer.stsCd === "C"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {transfer.stsCd === "0" || transfer.stsCd === "3" || transfer.stsCd === "C" ? "성공" : "실패"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      이체 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
