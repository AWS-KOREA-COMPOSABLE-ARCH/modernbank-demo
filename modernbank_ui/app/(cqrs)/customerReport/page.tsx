"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RootState } from "@/store/store";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

// ✅ 인터페이스 정의
interface Account {
  acntNo: string;
  cstmId: string;
  cstmNm: string | null;
  acntNm: string;
  newDtm: string;
  acntBlnc: number;
}

interface CustomerReport {
  cstmId: string;
  cstmNm: string;
  cstmAge: string;
  cstmGnd: string;
  cstmPn: string;
  cstmAdr: string;
  oneTmTrnfLmt: number;
  oneDyTrnfLmt: number;
  accounts: Account[];
}

export default function CustomerReport() {
  const { t } = useLanguage();
  const { user } = useSelector((state: RootState) => state.auth);
  const [report, setReport] = useState<CustomerReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchReport = async () => {
      if (!user?.user_id) {
        showModal(t('common.error'), t('account.authRequired'));
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/cqrs/customers/${user.user_id}/details`, {
          headers: {
            "x-user-id": user.user_id,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t('cqrs.customerReportLoadError'));
        }

        const data = await response.json();
        setReport(data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : t('cqrs.customerReportError');
        showModal(t('common.error'), errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">⚠️ Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-900 dark:text-white">❌ {t('cqrs.customerInfoNotFound')}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)] overflow-auto">
      {/* 페이지 타이틀 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('cqrs.customerInfo')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('cqrs.customerInfoDesc')}
        </p>
      </div>

      {/* 고객 기본 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('cqrs.basicInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.customerId')}</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{report.cstmId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.customerName')}</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{report.cstmNm}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.contact')}</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{report.cstmPn}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.address')}</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{report.cstmAdr}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.age')}</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{report.cstmAge}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.gender')}</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {report.cstmGnd === '1' ? t('cqrs.male') : t('cqrs.female')}
            </p>
          </div>
        </div>
      </div>

      {/* 이체 한도 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('cqrs.transferLimit')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.oneTimeTransferLimit')}</p>
            <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              {report.oneTmTrnfLmt.toLocaleString()} {t('common.currency')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('cqrs.dailyTransferLimit')}</p>
            <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              {report.oneDyTrnfLmt.toLocaleString()} {t('common.currency')}
            </p>
          </div>
        </div>
      </div>

      {/* 계좌 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('cqrs.accountList')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cqrs.accountNumber')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cqrs.accountName')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cqrs.openDate')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cqrs.balance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {report.accounts.map((account: Account, idx: number) => (
                <tr key={account.acntNo} className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{account.acntNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{account.acntNm}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{formatDate(account.newDtm)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                    {account.acntBlnc.toLocaleString()} {t('common.currency')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                {t('common.confirm')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
