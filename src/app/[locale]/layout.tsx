import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import SidePanel from '@/components/SidePanel';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import AuthGuard from '@/components/AuthGuard';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'ur')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'ur' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] antialiased">
        <SessionProviderWrapper>
          <NextIntlClientProvider messages={messages}>
            <div className="flex flex-col lg:flex-row min-h-screen">
              <SidePanel />
              <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
                <AuthGuard>{children}</AuthGuard>
              </main>
            </div>
          </NextIntlClientProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
