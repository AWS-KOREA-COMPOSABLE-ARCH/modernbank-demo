"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RootState } from "@/store/store";
import { Product } from "@/types/api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

interface FormData {
  acntNo: string;
  cstmId: string;
  cstmNm: string;
  acntNm: string;
  acntBlnc: number;
}

interface ErrorDetails {
  details?: { message: string }[];
  error?: string;
}

export default function CreateAccount() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    acntNo: "",
    cstmId: user?.user_id || "",
    cstmNm: "",
    acntNm: "Default Product",
    acntBlnc: 0,
  });

  // 기본 상품 옵션
  const defaultProducts = useMemo(() => [
    { id: '1', name: t('product.type.checking') },
    { id: '2', name: t('product.type.savings') },
  ], [t]);

  const [productOptions, setProductOptions] = useState<Product[]>(defaultProducts);
  const [productServiceStatus, setProductServiceStatus] = useState<"UP" | "DOWN">("DOWN");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      acntNo: generateAccountNumber(),
    }));
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      setFormData((prev) => ({
        ...prev,
        cstmId: user.user_id,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      const fetchUsername = async () => {
        try {
          const response = await fetch(`/api/auth/username/${user.user_id}`, {
            headers: {
              'x-user-id': user.user_id
            }
          });
          
          if (!response.ok) {
            throw new Error(t('account.fetchUsernameFailed'));
          }
          
          const data = await response.json();
          setFormData((prev) => ({ 
            ...prev, 
            cstmNm: data.name || data.username || '' 
          }));
        } catch (error) {
          console.error('Error fetching username:', error);
          if (error instanceof Error) {
            showModal(t('common.error'), t('account.fetchUsernameFailed'));
          }
        }
      };
      fetchUsername();
    }
  }, [user]);

  // 상품 목록 가져오기 함수
  const fetchProducts = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await fetch("/api/product", {
        headers: {
          'x-user-id': user.user_id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProductOptions(data);
        setFormData((prev) => ({
          ...prev,
          acntNm: data[0]?.name || defaultProducts[0].name,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProductOptions(defaultProducts);
      setFormData((prev) => ({
        ...prev,
        acntNm: defaultProducts[0].name,
      }));
    }
  }, [user?.user_id, defaultProducts]);

  // 상품 서비스 상태 확인 함수
  const checkProductServiceStatus = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await fetch("/api/product/actuator/health", {
        headers: {
          'x-user-id': user.user_id
        }
      });
      
      const data = await response.json();
      const status = data.status;
      setProductServiceStatus(status);
      
      if (status === "UP") {
        await fetchProducts();
      } else {
        setProductOptions(defaultProducts);
        setFormData((prev) => ({
          ...prev,
          acntNm: defaultProducts[0].name,
        }));
      }
    } catch (error) {
      console.error('Failed to check product service status:', error);
      setProductServiceStatus("DOWN");
      setProductOptions(defaultProducts);
      setFormData((prev) => ({
        ...prev,
        acntNm: defaultProducts[0].name,
      }));
    }
  }, [user?.user_id, fetchProducts, defaultProducts]);

  // 초기 로드 시 한 번만 상태 확인
  useEffect(() => {
    if (user?.user_id) {
      checkProductServiceStatus();
    }
  }, [user?.user_id, checkProductServiceStatus]);

  // 상품 서비스 상태 확인 버튼 클릭 핸들러
  const handleCheckServiceStatus = async () => {
    await checkProductServiceStatus();
  };

  function generateAccountNumber() {
    return Math.floor(100000000000000000 + Math.random() * 900000000000000000).toString();
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "acntBlnc") {
      // 숫자가 아닌 문자 제거
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue === "" ? 0 : Number(numericValue),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user?.user_id) {
      showModal(t('common.error'), t('account.authRequired'));
      setIsLoading(false);
      return;
    }

    try {
      const requestData = {
        acntNo: formData.acntNo,
        cstmId: formData.cstmId,
        cstmNm: formData.cstmNm,
        acntNm: formData.acntNm,
        newDtm: new Date().toISOString(),
        acntBlnc: formData.acntBlnc
      };

      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorDetails;
        if (errorData.details) {
          const errorMessages = errorData.details.map(err => err.message).join('\n');
          throw new Error(errorMessages);
        }
        throw new Error(errorData.error || t('account.creationFailed'));
      }

      await response.json();
      showModal(t('common.success'), t('account.creationSuccess'));

      // 성공 후 폼 초기화
      setFormData({
        acntNo: generateAccountNumber(),
        cstmId: user?.user_id || "",
        cstmNm: formData.cstmNm,
        acntNm: productOptions.length > 0 ? productOptions[0].name : "",
        acntBlnc: 0,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('errors.customerCreateUpdateError');
      showModal(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 계좌 개설 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t('account.creation')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('account.creationDesc')}
          </p>
          
          {/* 상품 서비스 상태 표시 및 확인 버튼 */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                productServiceStatus === "UP" 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full mr-1 ${
                  productServiceStatus === "UP" ? 'bg-green-500' : 'bg-gray-500'
                }`}
              ></span>
              {productServiceStatus === "UP" ? t('account.productServiceActive') : t('account.defaultProductUsing')}
            </span>
            <button
              onClick={handleCheckServiceStatus}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t('account.checkStatus')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('account.basicInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="acntNm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('account.productSelection')}
                  </label>
                  <div className="relative">
                    <select
                      id="acntNm"
                      name="acntNm"
                      value={formData.acntNm}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.name}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="acntNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('account.number')}
                  </label>
                  <input
                    id="acntNo"
                    name="acntNo"
                    type="text"
                    value={formData.acntNo}
                    disabled
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:opacity-75"
                  />
                </div>

                <div>
                  <label htmlFor="cstmId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('account.customerId')}
                  </label>
                  <input
                    id="cstmId"
                    name="cstmId"
                    type="text"
                    value={formData.cstmId}
                    disabled
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:opacity-75"
                  />
                </div>

                <div>
                  <label htmlFor="cstmNm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('account.customerName')}
                  </label>
                  <input
                    id="cstmNm"
                    name="cstmNm"
                    type="text"
                    value={formData.cstmNm}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('account.depositInfo')}
              </h3>
              <div>
                <label htmlFor="acntBlnc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('account.initialDeposit')}
                </label>
                <div className="relative">
                  <input
                    id="acntBlnc"
                    name="acntBlnc"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.acntBlnc === 0 ? "" : formData.acntBlnc}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 pr-12 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder={t('account.enterAmount')}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">{t('common.currency')}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {t('account.minimumAmount')}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : t('account.creation')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 에러 모달 */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <DialogPanel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {modalContent.title}
            </DialogTitle>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">{modalContent.message}</div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
