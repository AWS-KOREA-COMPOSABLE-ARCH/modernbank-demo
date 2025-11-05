"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RootState } from "@/store/store";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useSelector } from "react-redux";

interface ProductFormData {
  id: string;
  name: string;
  description: string;
  interestRate: number;
  currency: string;
}

export default function AddProduct() {
  const { t } = useLanguage();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    id: "",
    name: "",
    description: "",
    interestRate: 0,
    currency: "",
  });

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "interestRate" ? Number(value) : value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.id ||
      !formData.name ||
      !formData.description ||
      formData.interestRate < 0 ||
      !formData.currency
    ) {
      showModal(t('product.warning'), t('product.validateAllFields'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Sending product data:', formData);
      
      const response = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.user_id || "",
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('API Error - Status:', response.status, 'Data:', data);
        throw new Error(data.message || t('product.addFailed'));
      }

      showModal(t('product.notification'), data.message || t('product.addSuccess'));
      // 폼 초기화
      setFormData({
        id: "",
        name: "",
        description: "",
        interestRate: 0,
        currency: "",
      });
    } catch (error: unknown) {
      console.error(t('product.addError'), error);
      showModal(
        t('common.error'),
        error instanceof Error ? error.message : t('product.addErrorMessage')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 폼 초기화
  const handleClear = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      interestRate: 0,
      currency: "",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 타이틀 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t('product.add')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('product.addDesc')}
          </p>
        </div>
      </div>

      {/* 상품 정보 입력 폼 */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('product.productInfoInput')}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 mb-6 md:grid-cols-2">
              {/* 상품 ID */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('product.productId')}
                </label>
                <input
                  id="id"
                  name="id"
                  type="text"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder={t('product.productIdPlaceholder')}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 상품명 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('product.productName')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('product.productNamePlaceholder')}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 상품 설명 */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('product.productDescription')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('product.productDescriptionPlaceholder')}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  rows={4}
                ></textarea>
              </div>

              {/* 이자율 */}
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('product.interestRate')}
                </label>
                <input
                  id="interestRate"
                  name="interestRate"
                  type="number"
                  value={formData.interestRate}
                  onChange={handleChange}
                  placeholder={t('product.interestRatePlaceholder')}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 통화 */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('product.currency')}
                </label>
                <input
                  id="currency"
                  name="currency"
                  type="text"
                  value={formData.currency}
                  onChange={handleChange}
                  placeholder={t('product.currencyPlaceholder')}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
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
                    {t('product.processing')}
                  </span>
                ) : t('product.register')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2.5 text-sm font-medium text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              >
                {t('product.reset')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 모달창 */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckIcon aria-hidden="true" className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                    {modalContent.title}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {modalContent.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
