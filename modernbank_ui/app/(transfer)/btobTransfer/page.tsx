"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RootState } from "@/store/store";
import { Dialog, DialogTitle } from "@headlessui/react";
import { useCallback, useEffect, useState } from "react";
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
    const { t } = useLanguage();
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
                throw new Error(data.error || t('transfer.accountNotFound'));
            }

            const accounts = Array.isArray(data) ? data : data.data || [];
            setAccountList(accounts);
        } catch (error: unknown) {
            setError(
                error instanceof Error
                    ? error.message
                    : t('transfer.accountInquiryError')
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
            console.error(t('transfer.transferLimitInquiryFailed'), error);
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
                throw new Error(t('transfer.serverResponseNotJson'));
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('transfer.accountNotFound'));
            }

            if (!data || typeof data !== 'object') {
                throw new Error(t('transfer.accountNotFound'));
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
                    : t('transfer.withdrawalAccountInquiryError')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async (stsCd: number) => {
        // 초기 로딩 중인지 확인
        if (isInitialLoading) {
            showModal(t('transfer.loading'), t('transfer.loadingData'));
            return;
        }

        if (!accountInfo) {
            showModal(t('transfer.warning'), t('transfer.selectFromAccountFirst'));
            return;
        }
        if (!dpstAcntNo.trim()) {
            showModal(t('transfer.warning'), t('transfer.enterToAccountNumber'));
            return;
        }
        if (trnfAmt <= 0) {
            showModal(t('transfer.warning'), t('transfer.amountMustBePositive'));
            return;
        }
        if (accountBalance === null) {
            showModal(t('transfer.warning'), t('transfer.cannotCheckBalance'));
            return;
        }
        if (trnfAmt > accountBalance) {
            showModal(t('transfer.warning'), t('transfer.insufficientBalance'));
            return;
        }
        if (transferLimit) {
            if (trnfAmt > transferLimit.oneTmTrnfLmt) {
                showModal(
                    t('transfer.warning'),
                    t('transfer.oneTimeTransferLimitExceeded').replace('{limit}', transferLimit.oneTmTrnfLmt.toLocaleString())
                );
                return;
            }
            if (trnfAmt > transferLimit.oneDyTrnfLmt) {
                showModal(
                    t('transfer.warning'),
                    t('transfer.dailyTransferLimitExceeded').replace('{limit}', transferLimit.oneDyTrnfLmt.toLocaleString())
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
                    errorData.error || t('transfer.transferProcessingError')
                );
            }

            if (stsCd === 1) {
                // 타행 이체는 배치 처리되므로 즉시 잔액 변화가 없을 수 있음
                // 이체 요청이 성공적으로 접수되었음을 알림
                showModal(
                    t('transfer.transferComplete'),
                    `✅ ${t('transfer.completed')} ${trnfAmt.toLocaleString()} ${t('common.currency')}`
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
                showModal(t('transfer.transferRequestComplete'), `✅ ${t('transfer.transferRequestComplete')}! ${trnfAmt.toLocaleString()} ${t('common.currency')}`);
            }
            setTrnfAmt(0);
        } catch (error: unknown) {
            setError("");
            if (error instanceof Error) {
                showModal(t('transfer.transferError'), error.message);
            } else {
                showModal(t('transfer.transferError'), t('transfer.transferFailed'));
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
                        {t('transfer.external')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t('transfer.externalTransferDesc')}
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
                                <span className="text-gray-600 dark:text-gray-400">{t('transfer.loadingAccountInfo')}</span>
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
                                {t('transfer.fromAccount')}
                            </label>
                            <select
                                id="fromAccount"
                                value={wthdAcntNo}
                                onChange={(e) => handleSelectAccount(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('transfer.selectFromAccount')}</option>
                                {accountList.map((account) => (
                                    <option key={account.acntNo} value={account.acntNo}>
                                        {account.acntNm} ({account.acntNo})
                                    </option>
                                ))}
                            </select>
                            {accountBalance !== null && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    {t('transfer.currentBalance')}{" "}
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {accountBalance.toLocaleString()} {t('common.currency')}
                                    </span>
                                </p>
                            )}
                            {transferLimit && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {t('transfer.oneTimeTransferLimit')} {transferLimit.oneTmTrnfLmt.toLocaleString()} {t('common.currency')}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {t('transfer.dailyTransferLimit')} {transferLimit.oneDyTrnfLmt.toLocaleString()} {t('common.currency')}
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
                                {t('transfer.toAccountNumber')}
                            </label>
                            <input
                                id="toAccount"
                                type="text"
                                value={dpstAcntNo}
                                onChange={(e) => setDpstAcntNo(e.target.value)}
                                placeholder={t('transfer.externalTransferSimulation')}
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 이체 금액 입력 */}
                        <div>
                            <label
                                htmlFor="amount"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                {t('transfer.transferAmount')}
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
                                    placeholder={t('transfer.enterTransferAmount')}
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">{t('common.currency')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 내 통장 메모 */}
                        <div>
                            <label
                                htmlFor="sendMemo"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                {t('transfer.myAccountMemo')}
                            </label>
                            <input
                                id="sendMemo"
                                type="text"
                                value={sndMm}
                                onChange={(e) => setSndMm(e.target.value)}
                                placeholder={t('transfer.memoOptional')}
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 받는 통장 메모 */}
                        <div>
                            <label
                                htmlFor="receiveMemo"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                {t('transfer.recipientAccountMemo')}
                            </label>
                            <input
                                id="receiveMemo"
                                type="text"
                                value={rcvMm}
                                onChange={(e) => setRcvMm(e.target.value)}
                                placeholder={t('transfer.recipientMemoOptional')}
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
                                        {t('transfer.transferring')}
                                    </span>
                                ) : t('transfer.executeTransfer')}
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
                                        {t('transfer.transferring')}
                                    </span>
                                ) : t('transfer.transferFailure')}
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
                                {t('common.confirm')}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
}
