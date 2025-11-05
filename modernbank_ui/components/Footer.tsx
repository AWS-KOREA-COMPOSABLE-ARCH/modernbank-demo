"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export default function Footer() {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      {/* ✅ 헤더 (로고 + 내비게이션) */}
      <header className="flex justify-between items-center py-4 border-b">
        <h1 className="text-2xl font-bold text-blue-600">ModernBank</h1>
        <nav className="space-x-4">
          <a href="#" className="text-gray-700 hover:text-blue-600">{t('footer.services')}</a>
          <a href="#" className="text-gray-700 hover:text-blue-600">{t('footer.transfer')}</a>
          <a href="#" className="text-gray-700 hover:text-blue-600">{t('footer.customerService')}</a>
        </nav>
      </header>

      {/* ✅ 히어로 섹션 */}
      <section className="text-center py-12">
        <h2 className="text-3xl font-bold text-gray-900">
          {t('footer.fastSecureService')}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('footer.aiRecommendationSecurity')}
        </p>
        <button className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
          {t('footer.freeAccountOpening')}
        </button>
      </section>

      {/* ✅ 핵심 기능 섹션 */}
      <section className="py-12">
        <h3 className="text-2xl font-bold text-gray-900 text-center">{t('footer.coreFeatures')}</h3>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-100 shadow-md rounded-lg">
            <h4 className="text-lg font-semibold">{t('footer.ultraFastTransfer')}</h4>
            <p className="mt-2 text-gray-700">{t('footer.transferIn5Seconds')}</p>
          </div>
          <div className="p-6 bg-gray-100 shadow-md rounded-lg">
            <h4 className="text-lg font-semibold">{t('footer.strongSecurity')}</h4>
            <p className="mt-2 text-gray-700">{t('footer.latestSecurityTech')}</p>
          </div>
          <div className="p-6 bg-gray-100 shadow-md rounded-lg">
            <h4 className="text-lg font-semibold">{t('footer.aiRecommendation')}</h4>
            <p className="mt-2 text-gray-700">{t('footer.perfectFinancialProducts')}</p>
          </div>
        </div>
      </section>

      {/* ✅ CTA 섹션 */}
      <section className="py-12 text-center bg-blue-600 text-white rounded-lg shadow-md">
        <h3 className="text-2xl font-bold">{t('footer.joinModernBank')}</h3>
        <p className="mt-2">{t('footer.signupSpecialBenefits')}</p>
        <button
          className="mt-4 px-6 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100"
          onClick={() => setLoading(true)}
        >
          {loading ? t('footer.processing') : t('footer.freeSignup')}
        </button>
      </section>

      {/* ✅ 푸터 */}
      <footer className="text-center py-6 text-gray-600">
        {t('footer.copyright')}
      </footer>
    </div>
  );
}
