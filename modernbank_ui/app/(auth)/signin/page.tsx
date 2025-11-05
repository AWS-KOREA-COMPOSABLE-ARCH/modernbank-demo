"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { setUser } from "@/store/slices/authSlice";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export default function SignIn() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('auth.loginFailed'));
      }

      const data = await response.json();
      
      console.log(t('auth.loginResponseData'), data);
      
      // Redux store에 사용자 정보 저장 - user 객체 형태 그대로 유지
      const userData = {
        user_id: formData.user_id, // user_id 또는 cstmId 필드 사용
        name: formData.user_id // name 또는 cstmNm 필드 사용
      };
      
      console.log(t('auth.savingUserData'), userData);
      
      // Redux 스토어에 저장
      dispatch(setUser(userData));
      
      // 다른 컴포넌트가 retrieveCustomer를 포함해 사용자 정보를 참조할 수 있도록
      // 직접 localStorage에도 저장
      localStorage.setItem('user', JSON.stringify(userData));
      
      router.push("/");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('auth.loginError');
      showModal(t('auth.error'), errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t('auth.signin')}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('auth.signinDesc')}
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="user_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t('auth.userId')}
                  </label>
                  <input
                    id="user_id"
                    name="user_id"
                    type="text"
                    required
                    value={formData.user_id}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={t('auth.userIdPlaceholder')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t('auth.password')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('auth.signingIn')}
                    </span>
                  ) : (
                    t('auth.signin')
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('auth.noAccount')}{" "}
                <Link 
                  href="/signup"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('auth.signup')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {mounted && (
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
                  {t('auth.confirm')}
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </>
  );
}
