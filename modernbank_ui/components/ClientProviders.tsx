"use client";

import AuthGuard from "@/components/AuthGuard";
import ChatbotButton from "@/components/ChatbotButton";
import ClientLayout from "@/components/ClientLayout";
import Header from "@/components/Header";

import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { store } from '@/store';
import { Provider } from 'react-redux';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <DarkModeProvider>
          <ClientLayout>
            <div className="flex flex-col min-h-screen">
              <Header />
              <AuthGuard>
                <main className="flex-1 w-full mx-auto px-6 pt-24">
                  {children}
                </main>
              </AuthGuard>
            </div>
            <div className="fixed bottom-6 right-6 z-50">
              <ChatbotButton />
            </div>

          </ClientLayout>
        </DarkModeProvider>
      </LanguageProvider>
    </Provider>
  );
} 