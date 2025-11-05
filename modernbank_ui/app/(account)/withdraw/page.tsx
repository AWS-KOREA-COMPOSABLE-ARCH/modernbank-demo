"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RootState } from "@/store/store";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

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
  const { t } = useLanguage();
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
      showModal(t('common.error'), t('account.authRequired'));
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
        throw new Error(data.error || t('errors.accountNotFound'));
      }

      const accounts = Array.isArray(data) ? data : data.data || [];
      setAccounts(accounts);
      // 자동으로 첫 번째 계좌를 선택하지 않음
      setSelectedAccount("");
      setAccountInfo(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('errors.accountInquiryFailed');
      showModal(t('common.error'), errorMessage);
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
        throw new Error(t('errors.serverResponseNotJson'));
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errors.accountNotFound'));
      }

      if (!data || typeof data !== 'object') {
        throw new Error(t('errors.accountNotFound'));
      }

      setAccountInfo(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('errors.accountInquiryFailed');
      showModal(t('common.error'), errorMessage);
      setAccountInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      showModal(t('common.error'), t('account.enterValidWithdrawalAmount'));
      return;
    }
    if (!accountInfo) {
      showModal(t('common.error'), t('account.selectAccountFirst'));
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
        throw new Error(data.error || t('account.withdrawalProcessingFailed'));
      }

      const data = await response.json();
      setWithdrawResult(data);
      showModal(t('common.success'), `${t('account.withdrawalCompleted')} ${t('account.withdrawalAmount_')} ${Number(withdrawAmount).toLocaleString()} ${t('common.currency')}`);
      setAccountInfo((prev) =>
        prev ? { ...prev, acntBlnc: prev.acntBlnc - Number(withdrawAmount) } : prev
      );
      setWithdrawAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('account.withdrawalProcessingError');
      showModal(t('common.error'), errorMessage);
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
            {t('account.withdrawal')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('account.withdrawalDesc')}
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
                {t('account.selectAccount')}
              </label>
              <select
                id="accountSelect"
                value={selectedAccount}
                onChange={(e) => handleSelectAccount(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('account.selectAccountDesc')}</option>
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
                  {t('account.accountInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('account.accountName')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{accountInfo.acntNm}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('account.number')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{accountInfo.acntNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('account.currentBalance')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {accountInfo.acntBlnc.toLocaleString()} {t('common.currency')}
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
                  {t('account.withdrawalAmount')}
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
                    placeholder={t('account.enterWithdrawalAmount')}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">{t('common.currency')}</span>
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
                    {t('account.withdrawing')}
                  </span>
                ) : t('account.makeWithdrawal')}
              </button>
            )}
          </div>
        </div>

        {/* 출금 결과 */}
        {withdrawResult && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('account.withdrawalResult')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('account.balanceBeforeWithdrawal')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {withdrawResult.formerBlnc.toLocaleString()} {t('common.currency')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('account.withdrawalAmountLabel')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {withdrawResult.trnsAmt.toLocaleString()} {t('common.currency')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('account.currentBalanceAfter')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {withdrawResult.acntBlnc.toLocaleString()} {t('common.currency')}
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
                {t('common.confirm')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
