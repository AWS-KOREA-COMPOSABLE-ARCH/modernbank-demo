"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { clearUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { DarkModeToggle } from "./DarkModeToggle";
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SubMenuItem {
  name: string;
  href: string;
  description: string;
}

interface NavigationItem {
  name: string;
  subMenu: SubMenuItem[];
}

interface Navigation {
  categories: NavigationItem[];
}

interface HealthStatus {
  status: string;
  error?: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [productServiceStatus, setProductServiceStatus] = useState<HealthStatus | null>(null);
  const [hasCustomer, setHasCustomer] = useState<boolean>(false);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 상품 서비스 상태 확인
  useEffect(() => {
    let isMounted = true;
    
    const checkProductServiceHealth = async () => {
      if (!isMounted) return;
      
      if (isAuthenticated && user?.user_id) {
        try {
          const response = await fetch('/api/product/actuator/health', {
            headers: {
              'x-user-id': user.user_id,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (isMounted) {
              setProductServiceStatus(data);
            }
          } else {
            if (isMounted) {
              setProductServiceStatus({ status: 'DOWN' });
            }
          }
        } catch (error) {
          console.error('상품 서비스 상태 확인 실패:', error);
          if (isMounted) {
            setProductServiceStatus({ status: 'DOWN' });
          }
        }
      }
    };

    checkProductServiceHealth();
    // 10초마다 상태 확인
    const interval = setInterval(checkProductServiceHealth, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, user?.user_id]);
  
  // 모바일 메뉴 닫기 처리
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.navigation-menu') && !target.closest('.menu-button')) {
        setActiveCategory(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 페이지 변경 시 메뉴 닫기
  useEffect(() => {
    setActiveCategory(null);
    setIsMenuOpen(false);
  }, [pathname]);

  // 고객 존재 여부 확인
  useEffect(() => {
    const checkCustomerExists = async () => {
      if (isAuthenticated && user?.user_id) {
        try {
          const response = await fetch('/api/customer', {
            method: 'HEAD',
            headers: {
              'x-user-id': user.user_id,
            },
          });
          setHasCustomer(response.ok);
        } catch (error) {
          console.error('고객 존재 여부 확인 실패:', error);
          setHasCustomer(false);
        }
      }
    };

    checkCustomerExists();
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    dispatch(clearUser());
    router.push("/signin");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(activeCategory === categoryName ? null : categoryName);
  };

  // 상품 서비스가 활성화되어 있는지 확인
  const isProductServiceActive = productServiceStatus?.status === 'UP';

  // Define navigation data based on customer information
  const navigationData: Navigation = {
    categories: isAuthenticated
      ? hasCustomer
        ? [
            {
              name: "고객 관리",
              subMenu: [
                {
                  name: "고객 조회",
                  href: "/retrieveCustomer",
                  description: "고객 정보를 조회합니다.",
                },
              ],
            },
            {
              name: "계좌 관리",
              subMenu: [
                {
                  name: "계좌 개설",
                  href: "/createAccount",
                  description: "새로운 계좌를 개설하세요.",
                },
                {
                  name: "입금",
                  href: "/deposit",
                  description: "계좌에 금액을 입금합니다.",
                },
                {
                  name: "출금",
                  href: "/withdraw",
                  description: "계좌에서 금액을 출금합니다.",
                },
                {
                  name: "입출금 이력 조회",
                  href: "/retrieveTransactionHistory",
                  description: "입출금 내역을 확인하세요.",
                },
              ],
            },
            {
              name: "계좌 이체",
              subMenu: [
                {
                  name: "당행 이체",
                  href: "/transfer",
                  description: "같은 은행 계좌로 이체합니다.",
                },
                {
                  name: "타행 이체",
                  href: "/btobTransfer",
                  description: "다른 은행 계좌로 이체합니다.",
                },
                {
                  name: "이체 이력 조회",
                  href: "/retrieveTransferHistory",
                  description: "이체 내역을 확인하세요.",
                },
              ],
            },
            // 상품 서비스가 활성화된 경우에만 상품 메뉴 추가
            ...(isProductServiceActive ? [{
              name: "상품",
              subMenu: [
                {
                  name: "상품 추가",
                  href: "/createProduct",
                  description: "새로운 상품을 추가합니다.",
                },
                {
                  name: "상품 조회",
                  href: "/retrieveProduct",
                  description: "등록된 상품을 조회합니다.",
                },
              ],
            }] : []),
            {
              name: "리포트",
              subMenu: [
                {
                  name: "고객조회(CQRS)",
                  href: "/customerReport",
                  description: "CQRS 패턴으로 고객을 조회합니다.",
                },
              ],
            },
          ]
        : [
            // 고객이 없는 경우 고객 등록 메뉴만 표시
            {
              name: "고객 등록",
              subMenu: [
                {
                  name: "고객 등록",
                  href: "/createCustomer",
                  description: "고객을 등록합니다.",
                },
              ],
            },
          ]
      : [], // 로그인하지 않은 경우 빈 메뉴
  };

  if (!mounted) {
    return null;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}
    >
      <nav className="container mx-auto h-full px-4">
        <div className="flex items-center justify-between h-full">
          {/* 로고 */}
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400"
          >
            ModernBank
          </Link>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center space-x-6 navigation-menu">
            {isAuthenticated && (
              <div className="flex items-center space-x-6">
                {navigationData.categories.map((category) => (
                  <div key={category.name} className="relative group">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(category.name);
                      }}
                      className="flex items-center gap-x-1 text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {category.name}
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${activeCategory === category.name ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                    {activeCategory === category.name && (
                      <div 
                        className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ul className="p-2 space-y-1">
                          {category.subMenu.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setActiveCategory(null)}
                                className="block rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 테마 토글 + 유저 */}
            <DarkModeToggle />
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.user_id}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                로그인
              </Link>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center space-x-3">
            <DarkModeToggle />
            <button
              onClick={toggleMenu}
              className="text-gray-700 dark:text-gray-300 menu-button"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                {isMenuOpen ? (
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <div
          className={`md:hidden fixed top-20 left-0 right-0 backdrop-blur bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navigationData.categories.map((category) => (
              <Disclosure key={category.name} as="div" className="-mx-3">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full py-2 px-3 rounded-md text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      {category.name}
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''
                          }`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="space-y-2">
                      {category.subMenu.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-md px-6 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            ))}

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.user_id}
                </span>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 rounded-full text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full px-4 py-2 rounded-full text-sm font-medium text-center bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
