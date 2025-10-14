"use client";

import { RootState } from "@/store/store";
import { Dialog, DialogTitle } from "@headlessui/react";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";

interface AccountInfo {
    acntNm: string;
    acntNo: string;
    cstmId: string;
    cstmNm: string;
    acntBlnc: number;
}

interface TransferLimit {
    oneTmTrnfLmt: number;
    oneDyTrnfLmt: number;
}

export default function BtobTransfer() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [accountList, setAccountList] = useState<AccountInfo[]>([]);
    const [wthdAcntNo, setWthdAcntNo] = useState<string>(""); // 출금 계좌 선택
    const [dpstAcntNo, setDpstAcntNo] = useState<string>(""); // 입금 계좌번호 입력
    const [trnfAmt, setTrnfAmt] = useState<number>(0); // 이체 금액
    const [sndMm, setSndMm] = useState<string>(""); // 내 통장 메모
    const [rcvMm, setRcvMm] = useState<string>(""); // 받는 통장 메모
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [accountBalance, setAccountBalance] = useState<number | null>(null);
    const [transferLimit, setTransferLimit] = useState<TransferLimit | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // Modal 상태 추가
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: "",
        message: "",
    });

    const showModal = (title: string, message: string) => {
        setModalContent({ title, message });
        setModalOpen(true);
    };

    const fetchAccounts = useCallback(async () => {
        if (!user) return;
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
        } catch (error: unknown) {
            setError(
                error instanceof Error
                    ? error.message
                    : "계좌 조회 중 오류가 발생했습니다."
            );
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchAccounts();
        }
    }, [user, fetchAccounts]);

    // 이체 한도 조회
    const fetchTransferLimit = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`/api/transfer?path=limits&customerId=${user.user_id}`, {
                headers: {
                    'x-user-id': user.user_id
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setTransferLimit(data);
            }
        } catch (error) {
            console.error('이체 한도 조회 실패:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchTransferLimit();
        }
    }, [user, fetchTransferLimit]);

    const handleSelectAccount = async (acntNo: string) => {
        setWthdAcntNo(acntNo);
        setIsLoading(true);
        setError("");
        setAccountBalance(null);

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
            setAccountBalance(data.acntBlnc);

            const limitResponse = await fetch(
                `/api/transfer?path=limits&customerId=${data.cstmId}`, {
                    headers: {
                        'x-user-id': user?.user_id || ''
                    }
                }
            );
            
            if (limitResponse.ok) {
                const limitData = await limitResponse.json();
                setTransferLimit(limitData);
            }
        } catch (error: unknown) {
            setError(
                error instanceof Error
                    ? error.message
                    : "출금 계좌 조회 중 오류가 발생했습니다."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async (stsCd: number) => {
        // 초기 로딩 중인지 확인
        if (isInitialLoading) {
            showModal("로딩 중", "데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        if (!accountInfo) {
            showModal("경고", "출금 계좌를 먼저 선택하세요.");
            return;
        }
        if (!dpstAcntNo.trim()) {
            showModal("경고", "입금 계좌번호를 입력하세요.");
            return;
        }
        if (trnfAmt <= 0) {
            showModal("경고", "이체 금액은 0원보다 커야 합니다.");
            return;
        }
        if (accountBalance === null) {
            showModal("경고", "계좌 잔액을 확인할 수 없습니다. 계좌를 다시 선택해주세요.");
            return;
        }
        if (trnfAmt > accountBalance) {
            showModal("경고", "출금 계좌의 잔액이 부족합니다.");
            return;
        }
        if (transferLimit) {
            if (trnfAmt > transferLimit.oneTmTrnfLmt) {
                showModal(
                    "경고",
                    `1회 이체 한도를 초과했습니다. 최대 ${transferLimit.oneTmTrnfLmt.toLocaleString()} 원까지 가능합니다.`
                );
                return;
            }
            if (trnfAmt > transferLimit.oneDyTrnfLmt) {
                showModal(
                    "경고",
                    `1일 이체 한도를 초과했습니다. 최대 ${transferLimit.oneDyTrnfLmt.toLocaleString()} 원까지 가능합니다.`
                );
                return;
            }
        }

        setIsLoading(true);
        const previousBalance = accountBalance;
        try {
            const response = await fetch("/api/transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'x-user-id': user?.user_id || ''
                },
                body: JSON.stringify({
                    type: "external",
                    cstmId: accountInfo.cstmId,
                    dpstAcntNo,
                    wthdAcntNo: accountInfo.acntNo,
                    sndMm,
                    rcvMm,
                    trnfAmt,
                    stsCd: stsCd === 1 ? "0" : "2",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "이체 처리 중 오류가 발생했습니다."
                );
            }

            if (stsCd === 1) {
                // 타행 이체는 배치 처리되므로 즉시 잔액 변화가 없을 수 있음
                // 이체 요청이 성공적으로 접수되었음을 알림
                showModal(
                    "이체 완료",
                    `✅ 이체 완료! ${trnfAmt.toLocaleString()} 원`
                );
                
                // 잔액 정보 업데이트 (참고용)
                const balanceResponse = await fetch(
                    `/api/account?path=balance&accountNo=${accountInfo.acntNo}`, {
                        headers: {
                            'x-user-id': user?.user_id || ''
                        }
                    }
                );
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    setAccountBalance(balanceData);
                }
            } else {
                showModal("연결 장애", "⛔ 타행 시스템 문제로 인하여 잠시후 재 시도 바랍니다.");
            }
            setTrnfAmt(0);
        } catch (error: unknown) {
            setError("");
            if (error instanceof Error) {
                showModal("이체 오류", error.message);
            } else {
                showModal("이체 오류", "이체 중 오류가 발생했습니다.");
            }
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
                        타행 이체
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        계좌를 선택하고 이체할 금액을 입력하세요.
                    </p>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* 초기 로딩 상태 */}
                {isInitialLoading && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center space-x-3">
                                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-gray-600 dark:text-gray-400">계좌 정보를 불러오는 중...</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 이체 폼 */}
                {!isInitialLoading && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="space-y-6">
                        {/* 출금 계좌 선택 */}
                        <div>
                            <label
                                htmlFor="fromAccount"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                출금 계좌
                            </label>
                            <select
                                id="fromAccount"
                                value={wthdAcntNo}
                                onChange={(e) => handleSelectAccount(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">출금 계좌를 선택하세요</option>
                                {accountList.map((account) => (
                                    <option key={account.acntNo} value={account.acntNo}>
                                        {account.acntNm} ({account.acntNo})
                                    </option>
                                ))}
                            </select>
                            {accountBalance !== null && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    현재 잔액:{" "}
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {accountBalance.toLocaleString()} 원
                                    </span>
                                </p>
                            )}
                            {transferLimit && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        1회 이체 한도: {transferLimit.oneTmTrnfLmt.toLocaleString()} 원
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        1일 이체 한도: {transferLimit.oneDyTrnfLmt.toLocaleString()} 원
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 입금 계좌 입력 */}
                        <div>
                            <label
                                htmlFor="toAccount"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                입금 계좌번호
                            </label>
                            <input
                                id="toAccount"
                                type="text"
                                value={dpstAcntNo}
                                onChange={(e) => setDpstAcntNo(e.target.value)}
                                placeholder="타행 이체는 시뮬레이션으로 아무 숫자나 입력하세요"
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 이체 금액 입력 */}
                        <div>
                            <label
                                htmlFor="amount"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                이체 금액
                            </label>
                            <div className="relative">
                                <input
                                    id="amount"
                                    type="text"
                                    value={trnfAmt.toString()}
                                    onChange={(e) => {
                                        const numericValue = e.target.value.replace(/\D/g, "");
                                        setTrnfAmt(Number(numericValue));
                                    }}
                                    placeholder="이체 금액을 입력하세요"
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">원</span>
                                </div>
                            </div>
                        </div>

                        {/* 내 통장 메모 */}
                        <div>
                            <label
                                htmlFor="sendMemo"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                내 통장 메모
                            </label>
                            <input
                                id="sendMemo"
                                type="text"
                                value={sndMm}
                                onChange={(e) => setSndMm(e.target.value)}
                                placeholder="메모 입력 (선택)"
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 받는 통장 메모 */}
                        <div>
                            <label
                                htmlFor="receiveMemo"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                받는 통장 메모
                            </label>
                            <input
                                id="receiveMemo"
                                type="text"
                                value={rcvMm}
                                onChange={(e) => setRcvMm(e.target.value)}
                                placeholder="받는 사람에게 표시될 메모 입력 (선택)"
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 이체 버튼 그룹 */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleTransfer(1)}
                                disabled={isLoading}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        이체 중...
                                    </span>
                                ) : '이체 실행'}
                            </button>
                            <button
                                onClick={() => handleTransfer(2)}
                                disabled={isLoading}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        이체 중...
                                    </span>
                                ) : '이체 실패'}
                            </button>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* Modal Dialog */}
            <Dialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                className="fixed inset-0 z-50 overflow-y-auto bg-gray-300 bg-opacity-50"
            >
                <div className="flex items-center justify-center min-h-screen p-4">
                    <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
}
