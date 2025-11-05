"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { JSX, useState } from "react";

export default function Home(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  return (
    // 전체 배경을 멋진 이미지로 설정 (bg-cover, bg-center)
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')",
      }}
    >
      {/* 배경 이미지 위에 검은색 반투명 오버레이 적용 */}
      <div className="bg-black bg-opacity-60 min-h-screen">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-12">
          {/* ==============================
              히어로 섹션
          ============================== */}
          <section className="text-center py-12">
            <h1 className="text-4xl font-extrabold text-white">
              {t('home.title')}
            </h1>
            <p className="mt-4 text-lg text-gray-200">
              {t('home.subtitle')}
            </p>
            <Link href="#">
              <button className="mt-6 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition">
                {t('home.openAccount')}
              </button>
            </Link>
          </section>

          {/* ==============================
              핵심 기능 섹션
          ============================== */}
          <section className="py-16">
            <h2 className="text-3xl font-bold text-center text-white">
              {t('home.coreServices')}
            </h2>
            <div className="mt-12 grid md:grid-cols-3 gap-8">
              {/* 초고속 송금 */}
              <div className="p-6 bg-white bg-opacity-90 shadow-md rounded-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('home.fastTransfer')}
                </h3>
                <p className="mt-3 text-gray-700">{t('home.fastTransferDesc')}</p>
                <Link
                  href="/transfer"
                  className="mt-4 inline-block text-yellow-500 font-semibold hover:underline"
                >
                  {t('home.fastTransferLink')}
                </Link>
              </div>
              {/* 강력한 보안 */}
              <div className="p-6 bg-white bg-opacity-90 shadow-md rounded-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('home.strongSecurity')}
                </h3>
                <p className="mt-3 text-gray-700">
                  {t('home.strongSecurityDesc')}
                </p>
                <Link
                  href="https://docs.aws.amazon.com/security/"
                  className="mt-4 inline-block text-yellow-500 font-semibold hover:underline"
                >
                  {t('home.securityLink')}
                </Link>
              </div>
              {/* AI 맞춤 추천 */}
              <div className="p-6 bg-white bg-opacity-90 shadow-md rounded-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('home.aiRecommendation')}
                </h3>
                <p className="mt-3 text-gray-700">
                  {t('home.aiRecommendationDesc')}
                </p>
                <Link
                  href="https://github.com/aws-samples/sample-virtual-banking-assistant"
                  className="mt-4 inline-block text-yellow-500 font-semibold hover:underline"
                >
                  {t('home.aiLink')}
                </Link>
              </div>
            </div>
          </section>

          {/* ==============================
              입출금 & 금융 서비스 섹션
          ============================== */}
          <section className="py-16 bg-gray-100 bg-opacity-90 rounded-lg">
            <h2 className="text-3xl font-bold text-center text-gray-900">
              {t('home.convenientServices')}
            </h2>
            <div className="mt-12 grid md:grid-cols-2 gap-8">
              {/* 입금 서비스 */}
              <div className="p-6 bg-white shadow-md rounded-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('home.easyDeposit')}
                </h3>
                <p className="mt-3 text-gray-700">
                  {t('home.easyDepositDesc')}
                </p>
                <Link
                  href="/deposit"
                  className="mt-4 inline-block text-yellow-500 font-semibold hover:underline"
                >
                  {t('home.depositLink')}
                </Link>
              </div>
              {/* 출금 서비스 */}
              <div className="p-6 bg-white shadow-md rounded-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('home.withdrawalService')}
                </h3>
                <p className="mt-3 text-gray-700">
                  {t('home.withdrawalServiceDesc')}
                </p>
                <Link
                  href="/withdraw"
                  className="mt-4 inline-block text-yellow-500 font-semibold hover:underline"
                >
                  {t('home.withdrawalLink')}
                </Link>
              </div>
            </div>
          </section>

          {/* ==============================
              고객 리뷰 & 신뢰도 섹션
          ============================== */}
          <section className="py-16 text-center">
            <h2 className="text-3xl font-bold text-white">
              {t('home.trustedService')}
            </h2>
            <p className="mt-4 text-lg text-gray-200">
              {t('home.customerCount')}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              <div className="p-6 bg-white bg-opacity-90 rounded-lg shadow-md max-w-sm">
                <p className="text-gray-700">
                  &ldquo;{t('home.review1')}&rdquo;
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {t('home.reviewer1')}
                </p>
              </div>
              <div className="p-6 bg-white bg-opacity-90 rounded-lg shadow-md max-w-sm">
                <p className="text-gray-700">
                  &ldquo;{t('home.review2')}&rdquo;
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {t('home.reviewer2')}
                </p>
              </div>
            </div>
          </section>

          {/* ==============================
              CTA 섹션
          ============================== */}
          <section className="py-16 text-center bg-yellow-500 bg-opacity-90 text-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold">{t('home.joinUs')}</h2>
            <p className="mt-2">
              {t('home.joinUsDesc')}
            </p>
            <button
              className="mt-6 px-6 py-3 bg-white text-yellow-500 font-semibold rounded-md hover:bg-gray-100 transition"
              onClick={() => setLoading(true)}
            >
              {loading ? t('home.processing') : t('home.freeSignup')}
            </button>
          </section>

          <p>
            &ldquo;{t('home.welcome')}&rdquo;
          </p>
          <p>
            &ldquo;{t('home.bestService')}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
