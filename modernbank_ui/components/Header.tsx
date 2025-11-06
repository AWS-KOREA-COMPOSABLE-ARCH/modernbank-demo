"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { clearUser } from "@/store/slices/authSlice";
import { RootState } from "@/store/store";
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DarkModeToggle } from "./DarkModeToggle";
import LanguageToggle from "./LanguageToggle";

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
  const { t } = useLanguage();
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

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check product service status
  // TODO
  
  // Handle mobile menu closing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu on outside click
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

  // Close menu on page change
  useEffect(() => {
    setActiveCategory(null);
    setIsMenuOpen(false);
  }, [pathname]);

  // Check if customer exists
  useEffect(() => {
    const checkCustomerExists = async () => {
      if (isAuthenticated && user?.user_id) {
        try {
          const response = await fetch(`/api/customer?customerId=${user.user_id}&action=exists`, {
            headers: {
              'x-user-id': user.user_id,
            },
          });
          
          if (response.ok) {
            const exists = await response.json();
            setHasCustomer(exists === true);
          } else {
            setHasCustomer(false);
          }
        } catch (error) {
          console.error('Failed to check customer existence:', error);
          setHasCustomer(false);
        }
      }
    };

    checkCustomerExists();
  }, [isAuthenticated, user]);

  // Customer registration event listener
  useEffect(() => {
    const handleCustomerRegistered = () => {
      console.log('Customer registration event received, status updated');
      setHasCustomer(true);
    };

    window.addEventListener('customerRegistered', handleCustomerRegistered);
    
    return () => {
      window.removeEventListener('customerRegistered', handleCustomerRegistered);
    };
  }, []);

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

  // Check if product service is active
  const isProductServiceActive = productServiceStatus?.status === 'UP';

  // Define navigation data based on customer information
  const navigationData: Navigation = {
    categories: isAuthenticated
      ? hasCustomer
        ? [
            {
              name: t('nav.customerManagement'),
              subMenu: [
                {
                  name: t('nav.customerInquiry'),
                  href: "/retrieveCustomer",
                  description: t('nav.customerInquiryDesc'),
                },
              ],
            },
            {
              name: t('nav.accountManagement'),
              subMenu: [
                {
                  name: t('nav.accountCreation'),
                  href: "/createAccount",
                  description: t('nav.accountCreationDesc'),
                },
                {
                  name: t('nav.deposit'),
                  href: "/deposit",
                  description: t('nav.depositDesc'),
                },
                {
                  name: t('nav.withdrawal'),
                  href: "/withdraw",
                  description: t('nav.withdrawalDesc'),
                },
                {
                  name: t('nav.transactionHistory'),
                  href: "/retrieveTransactionHistory",
                  description: t('nav.transactionHistoryDesc'),
                },
              ],
            },
            {
              name: t('nav.accountTransfer'),
              subMenu: [
                {
                  name: t('nav.internalTransfer'),
                  href: "/transfer",
                  description: t('nav.internalTransferDesc'),
                },
                {
                  name: t('nav.externalTransfer'),
                  href: "/btobTransfer",
                  description: t('nav.externalTransferDesc'),
                },
                {
                  name: t('nav.transferHistory'),
                  href: "/retrieveTransferHistory",
                  description: t('nav.transferHistoryDesc'),
                },
              ],
            },
            // Add product menu only when product service is active
            ...(isProductServiceActive ? [{
              name: t('nav.product'),
              subMenu: [
                {
                  name: t('nav.productCreate'),
                  href: "/createProduct",
                  description: t('nav.productCreateDesc'),
                },
                {
                  name: t('nav.productInquiry'),
                  href: "/retrieveProduct",
                  description: t('nav.productInquiryDesc'),
                },
              ],
            }] : []),
            {
              name: t('nav.report'),
              subMenu: [
                {
                  name: t('nav.customerReport'),
                  href: "/customerReport",
                  description: t('nav.customerReportDesc'),
                },
              ],
            },
          ]
        : [
            // Show only customer registration menu when no customer exists
            {
              name: t('nav.customerRegistration'),
              subMenu: [
                {
                  name: t('nav.customerRegistration'),
                  href: "/createCustomer",
                  description: t('nav.customerRegistrationDesc'),
                },
              ],
            },
          ]
      : [], // Empty menu when not logged in
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

          {/* Desktop nevigation */}
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

            {/* Theme toggle + language toggle + user */}
            <div className="flex items-center space-x-2">
              <LanguageToggle />
              <DarkModeToggle />
            </div>
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.user_id}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                {t('auth.signin')}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <LanguageToggle />
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

        {/* Mobile menu */}
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
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full px-4 py-2 rounded-full text-sm font-medium text-center bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                {t('auth.signin')}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
