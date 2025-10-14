"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { User } from "@/types/auth";
import { useRouter } from "next/navigation";

interface FormData {
  cstmId: string;
  cstmNm: string;
  cstmAge: string;
  cstmGnd: string;
  cstmAdr: string;
  cstmPn: string;
}

export default function CreateCustomerPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

  const [formData, setFormData] = useState<FormData>({
    cstmId: "",
    cstmNm: "",
    cstmAge: "",
    cstmGnd: "1",
    cstmAdr: "",
    cstmPn: "",
  });

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [customerExists, setCustomerExists] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  // 고객 정보 가져오기
  const fetchCustomerData = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/customer?customerId=${userId}`, {
        headers: {
          'x-user-id': userId,
        },
      });
      
      if (response.ok) {
        const customerData = await response.json();
        console.log("Fetched customer data:", customerData);
        setFormData({
          cstmId: customerData.cstmId,
          cstmNm: customerData.cstmNm,
          cstmAge: customerData.cstmAge || "",
          cstmGnd: customerData.cstmGnd || "1",
          cstmAdr: customerData.cstmAdr || "",
          cstmPn: customerData.cstmPn || "",
        });
      } else {
        console.error("Failed to fetch customer data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }, []);

  const checkCustomerExists = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/customer?customerId=${userId}&action=exists`, {
        headers: {
          'x-user-id': userId,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const exists = data === true || data === "true";
        setCustomerExists(exists);
        
        // 고객이 존재하면 고객 정보 가져오기
        if (exists) {
          fetchCustomerData(userId);
        }
      } else {
        setCustomerExists(false);
      }
    } catch (error) {
      console.error("Error checking customer existence:", error);
      setCustomerExists(false);
    }
  }, [fetchCustomerData]);

  useEffect(() => {
    if (user?.user_id) {
      setFormData(prev => ({ ...prev, cstmId: user.user_id }));
      checkCustomerExists(user.user_id);
    }
  }, [user, checkCustomerExists]);

  // API auth에서 /user/username/{user_id}를 통해 username 받아오기
  useEffect(() => {
    if (user?.user_id && !customerExists) {
      const fetchUsername = async () => {
        try {
          const response = await fetch(`/api/auth/username/${user.user_id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch username');
          }
          const data = await response.json();
          setFormData(prev => ({ ...prev, cstmNm: data.username }));
        } catch {
          setModalContent({
            title: "오류",
            message: "사용자 이름을 불러오는데 실패했습니다."
          });
          setModalOpen(true);
        }
      };
      fetchUsername();
    }
  }, [user, customerExists]);

  // 고객 등록 또는 수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_id) return;
    
    setLoading(true);
    
    try {
      // 고객이 존재하면 PUT 요청, 없으면 POST 요청
      const method = customerExists ? "PUT" : "POST";
      
      const requestBody = {
        cstmId: user.user_id,
        cstmNm: formData.cstmNm,
        cstmAge: formData.cstmAge,
        cstmGnd: formData.cstmGnd,
        cstmPn: formData.cstmPn,
        cstmAdr: formData.cstmAdr,
        oneTmTrnfLmt: 0,
        oneDyTrnfLmt: 0,
        accounts: []
      };

      console.log('[Customer Form] Submitting:', {
        method,
        customerExists,
        requestBody,
        userId: user.user_id
      });
      
      const response = await fetch("/api/customer", {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.user_id,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[Customer Form] Response status:', response.status);
      console.log('[Customer Form] Response headers:', Object.fromEntries(response.headers));

      const responseData = await response.json();
      console.log('[Customer Form] Response data:', responseData);
      console.log('[Customer Form] Response data type:', typeof responseData);
      console.log('[Customer Form] Response data keys:', Object.keys(responseData));
      console.log('[Customer Form] Response ok:', response.ok);
      console.log('[Customer Form] Response status:', response.status);

      if (!response.ok) {
        console.error('[Customer Form] Error response:', responseData);
        throw new Error(responseData.error || "Failed to create/update customer");
      }

      // 성공 응답 처리
      setModalContent({
        title: customerExists ? "고객 정보 수정" : "고객 등록",
        message: customerExists ? "고객 정보가 수정되었습니다." : "고객 등록이 완료되었습니다."
      });
      setModalOpen(true);
      
      // 고객 등록 성공 후 상태 업데이트
      if (!customerExists) {
        setCustomerExists(true);
        // 고객 정보 다시 가져오기
        await fetchCustomerData(user.user_id);
        
        // Header 컴포넌트 상태 강제 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new CustomEvent('customerRegistered'));
      }
    } catch (error) {
      console.error("Customer create/update error:", error);
      setModalContent({
        title: "오류",
        message: error instanceof Error ? error.message : "고객 생성/수정 중 오류가 발생했습니다."
      });
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 폼 초기화
  const handleClear = () => {
    if (user?.user_id) {
      setFormData({
        cstmId: user.user_id,
        cstmNm: formData.cstmNm,
        cstmAge: "",
        cstmGnd: "1",
        cstmAdr: "",
        cstmPn: "",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 타이틀 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {customerExists ? "고객 정보 수정" : "고객 등록"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            고객 정보를 입력하여 {customerExists ? "수정" : "등록"}합니다.
          </p>
        </div>
      </div>

      {/* 고객 정보 입력 폼 */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            고객 정보 입력
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 mb-6 md:grid-cols-2">
              <div>
                <label htmlFor="cstmId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  고객 ID
                </label>
                <input
                  type="text"
                  id="cstmId"
                  value={formData.cstmId}
                  disabled
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-75"
                />
              </div>

              <div>
                <label htmlFor="cstmNm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  고객명
                </label>
                <input
                  type="text"
                  id="cstmNm"
                  value={formData.cstmNm}
                  disabled
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-75"
                />
              </div>

              <div>
                <label htmlFor="cstmAge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  나이
                </label>
                <input
                  type="text"
                  id="cstmAge"
                  value={formData.cstmAge}
                  onChange={(e) => setFormData({ ...formData, cstmAge: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="나이 입력"
                />
              </div>

              <div>
                <label htmlFor="cstmGnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  성별
                </label>
                <select
                  id="cstmGnd"
                  value={formData.cstmGnd}
                  onChange={(e) => setFormData({ ...formData, cstmGnd: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">남</option>
                  <option value="2">여</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="cstmAdr" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  id="cstmAdr"
                  value={formData.cstmAdr}
                  onChange={(e) => setFormData({ ...formData, cstmAdr: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="주소 입력"
                />
              </div>

              <div>
                <label htmlFor="cstmPn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  전화번호
                </label>
                <input
                  type="text"
                  id="cstmPn"
                  value={formData.cstmPn}
                  onChange={(e) => setFormData({ ...formData, cstmPn: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="전화번호 입력"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
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
                    처리중...
                  </span>
                ) : (customerExists ? "수정하기" : "등록하기")}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2.5 text-sm font-medium text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              >
                초기화
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Dialog */}
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
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                  modalContent.title === "오류" ? "bg-red-100" : "bg-green-100"
                }`}>
                  {modalContent.title === "오류" ? (
                    <ExclamationTriangleIcon aria-hidden="true" className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckIcon aria-hidden="true" className="h-6 w-6 text-green-600" />
                  )}
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
                  onClick={() => {
                    setModalOpen(false);
                    if (!customerExists) {
                      // 새로 등록한 경우 홈으로 이동
                      router.push('/');
                    } else {
                      // 수정인 경우 현재 페이지 리로드
                      window.location.reload();
                    }
                  }}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  확인
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
