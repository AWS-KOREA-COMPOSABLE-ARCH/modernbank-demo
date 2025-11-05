"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RootState } from "@/store/store";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface Product {
  id: string;
  name: string;
  description: string;
  interestRate: number;
  currency: string;
}

export default function RetrieveProduct() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 편집 모드 상태
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // 모든 상품 불러오기
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isAuthenticated || !user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/product", {
          headers: {
            "x-user-id": user.user_id,
          },
        });
        
        if (!response.ok) {
          throw new Error(t('product.loadProductsFailed'));
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.unknownError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
    
    // 10초마다 상품 목록 새로고침
    const interval = setInterval(fetchProducts, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);
  
  // 상품 수정 상태 초기화
  const initEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditMode(true);
  };
  
  // 상품 수정 폼 제출
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/product/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedProduct),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('product.updateFailed'));
      }
      
      // 수정된 상품으로 목록 업데이트
      setProducts(products.map(product => 
        product.id === selectedProduct.id ? selectedProduct : product
      ));
      
      setModalContent({
        title: t('product.updateComplete'),
        message: t('product.updateSuccess'),
      });
      setModalOpen(true);
      setEditMode(false);
      setSelectedProduct(null);
    } catch (err) {
      setModalContent({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('product.updateError'),
      });
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // 상품 삭제 확인 창 표시
  const confirmDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setConfirmationModalOpen(true);
  };
  
  // 상품 삭제 실행
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/product/${productToDelete}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('product.deleteFailed'));
      }
      
      // 삭제된 상품 제거
      setProducts(products.filter(product => product.id !== productToDelete));
      
      setModalContent({
        title: t('product.deleteComplete'),
        message: t('product.deleteSuccess'),
      });
      setModalOpen(true);
    } catch (err) {
      setModalContent({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('product.deleteError'),
      });
      setModalOpen(true);
    } finally {
      setConfirmationModalOpen(false);
      setProductToDelete(null);
      setLoading(false);
    }
  };
  
  // 폼 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedProduct) return;
    
    const { name, value } = e.target;
    setSelectedProduct({
      ...selectedProduct,
      [name]: name === 'interestRate' ? Number(value) : value,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('product.retrieve')}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('product.retrieveDesc')}
          </p>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('product.productList')}
          </h3>

          {loading && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="py-4 text-center text-red-500 dark:text-red-400">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>{t('product.noProductsMessage')}</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('product.productId')}</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('product.productName')}</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('product.description')}</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('product.interestRate')}</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('product.currency')}</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('product.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{product.description}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.interestRate}%</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.currency}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => initEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => confirmDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 상품 수정 폼 */}
      {editMode && selectedProduct && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('product.edit')}
            </h3>
            
            <form onSubmit={handleUpdateProduct}>
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
                    value={selectedProduct.id}
                    disabled
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:opacity-75"
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
                    value={selectedProduct.name}
                    onChange={handleInputChange}
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
                    value={selectedProduct.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    step="0.01"
                    value={selectedProduct.interestRate}
                    onChange={handleInputChange}
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
                    value={selectedProduct.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
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
                      {t('product.processing')}
                    </span>
                  ) : t('product.modify')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                >
                  {t('product.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
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

      {/* 삭제 확인 모달 */}
      <Dialog open={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)} className="relative z-10">
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <TrashIcon aria-hidden="true" className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                    {t('product.deleteProduct')}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('product.deleteConfirmation')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={loading}
                  className="inline-flex flex-1 justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? t('product.processing') : t('product.delete')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmationModalOpen(false)}
                  className="inline-flex flex-1 justify-center rounded-md bg-gray-200 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {t('product.cancel')}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
