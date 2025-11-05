"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RootState } from "@/store/store";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface AccountInfo {
  acntNm: string;
  acntNo: string;
  cstmId: string;
  acntBlnc: number;
}

interface TransferLimit {
  oneTmTrnfLmt: number;
  dlyTrnfLmt: number;
}

export default function TransferPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedFromAccount, setSelectedFromAccount] = useState<string>("");
  const [selectedToAccount, setSelectedToAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [transferLimit, setTransferLimit] = useState<TransferLimit | null>(null);
  const [transferType, setTransferType] = useState<"self" | "other" | "">("");
  const [sendMemo, setSendMemo] = useState<string>("");
  const [receiveMemo, setReceiveMemo] = useState<string>("");
  
  // 모달 상태 추가
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
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
      setAccounts(accounts);
    } catch (error) {
      // 콘솔 에러 대신 모달 사용
      if (error instanceof Error) {
        showModal(t('common.error'), error.message);
      } else {
        showModal(t('common.error'), t('transfer.accountInquiryError'));
      }
    }
  }, [user]);

  const fetchTransferLimit = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/transfer?path=limits&customerId=${user.user_id}`, {
        headers: {
          'x-user-id': user.user_id
        }
      });
      
      if (!response.ok) {
        throw new Error(t('transfer.transferLimitInquiryFailed'));
      }
      
      const data = await response.json();
      setTransferLimit(data);
    } catch (error) {
      // 콘솔 에러 대신 모달 사용
      if (error instanceof Error) {
        showModal(t('common.error'), error.message);
      } else {
        showModal(t('common.error'), t('transfer.transferLimitInquiryFailed'));
      }
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
    fetchTransferLimit();
  }, [fetchAccounts, fetchTransferLimit]);

  const handleSelectAccount = async (acntNo: string) => {
    setSelectedFromAccount(acntNo);
    setTransferType("");
    setSelectedToAccount("");
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

      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.acntNo === acntNo 
            ? { ...account, acntBlnc: data.acntBlnc } 
            : account
        )
      );
    } catch (error: unknown) {
      // alert 대신 모달 사용
      if (error instanceof Error) {
        showModal(t('common.error'), error.message);
      } else {
        showModal(t('common.error'), t('transfer.accountInquiryError'));
      }
    }
  };

  const handleTransfer = async () => {
    if (!amount || Number(amount) <= 0) {
      showModal(t('common.warning'), t('transfer.enterValidAmount'));
      return;
    }
    if (!selectedFromAccount) {
      showModal(t('common.warning'), t('transfer.selectFromAccountFirst'));
      return;
    }
    if (!selectedToAccount.trim()) {
      showModal(t('common.warning'), t('transfer.enterToAccount'));
      return;
    }
    if (Number(amount) > (accounts.find(a => a.acntNo === selectedFromAccount)?.acntBlnc ?? 0)) {
      showModal(t('common.warning'), t('transfer.insufficientBalance'));
      return;
    }
    if (transferLimit && Number(amount) > transferLimit.oneTmTrnfLmt) {
      showModal(t('common.warning'), `${t('transfer.exceedsLimit')} (${transferLimit.oneTmTrnfLmt.toLocaleString()} ${t('common.currency')})`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          type: "internal",
          cstmId: user?.user_id,
          dpstAcntNo: selectedToAccount,
          wthdAcntNo: selectedFromAccount,
          sndMm: sendMemo,
          rcvMm: receiveMemo,
          trnfAmt: Number(amount),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('transfer.processingError'));
      }

      await response.json();
      showModal(t('common.success'), `${t('transfer.completed')} ${t('transfer.amount_')} ${Number(amount).toLocaleString()} ${t('common.currency')}`);
      fetchAccounts();
      setAmount("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        showModal(t('common.error'), error.message);
      } else {
        showModal(t('common.error'), t('transfer.processingError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 타이틀 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('transfer.internal')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('transfer.internalDesc')}
        </p>
      </div>

      {/* 이체 폼 */}
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
              value={selectedFromAccount}
              onChange={(e) => handleSelectAccount(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('transfer.selectFromAccount')}</option>
              {accounts.map((account) => (
                <option key={account.acntNo} value={account.acntNo}>
                  {account.acntNm} ({account.acntNo})
                </option>
              ))}
            </select>
            {accounts.find(a => a.acntNo === selectedFromAccount) && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('transfer.currentBalance')}:{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {accounts.find(a => a.acntNo === selectedFromAccount)?.acntBlnc.toLocaleString() ?? "0"} {t('common.currency')}
                </span>
              </p>
            )}
          </div>

          {/* 이체 유형 선택 */}
          {selectedFromAccount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('transfer.transferType')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={accounts.length <= 1}
                  onClick={() => setTransferType("self")}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg ${
                    accounts.length > 1
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {t('transfer.toMyAccount')}
                </button>
                <button
                  onClick={() => setTransferType("other")}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {t('transfer.toOtherAccount')}
                </button>
              </div>
            </div>
          )}

          {/* 입금 계좌 선택/입력 */}
          {transferType && (
            <div>
              <label
                htmlFor="toAccount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {transferType === "self" ? t('transfer.toAccount') : t('transfer.toAccountNumber')}
              </label>
              {transferType === "self" ? (
                <select
                  id="toAccount"
                  value={selectedToAccount}
                  onChange={(e) => setSelectedToAccount(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('transfer.selectMyAccount')}</option>
                  {accounts
                    .filter((account) => account.acntNo !== selectedFromAccount)
                    .map((account) => (
                      <option key={account.acntNo} value={account.acntNo}>
                        {account.acntNm} ({account.acntNo})
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  id="toAccount"
                  type="text"
                  value={selectedToAccount}
                  onChange={(e) => setSelectedToAccount(e.target.value)}
                  placeholder={t('transfer.enterAccountNumber')}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}

          {/* 이체 금액 입력 */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('transfer.amount')}
            </label>
            <div className="relative">
              <input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  setAmount(numericValue);
                }}
                placeholder={t('transfer.enterAmount')}
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
              {t('transfer.myMemo')}
            </label>
            <input
              id="sendMemo"
              type="text"
              value={sendMemo}
              onChange={(e) => setSendMemo(e.target.value)}
              placeholder={t('transfer.enterMemo')}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 받는 통장 메모 */}
          <div>
            <label
              htmlFor="receiveMemo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('transfer.receiveMemo')}
            </label>
            <input
              id="receiveMemo"
              type="text"
              value={receiveMemo}
              onChange={(e) => setReceiveMemo(e.target.value)}
              placeholder={t('transfer.enterReceiveMemo')}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 이체 버튼 */}
          <button
            onClick={handleTransfer}
            disabled={isLoading}
            className="w-full px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('transfer.transferring')}
              </span>
            ) : t('transfer.transfer')}
          </button>
        </div>
      </div>

      {/* 모달 다이얼로그 추가 */}
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
                {t('common.confirm')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
