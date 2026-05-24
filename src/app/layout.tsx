import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import { SolanaWalletProviderShell } from '@/components/providers/wallet-provider-shell';
import { AppProvider } from '@/components/providers/app-provider';
import { getServerI18n } from '@/lib/i18n/server';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Niche Trust — Expert marketplace for prediction traders',
  description:
    'Polymarket-style categories, multi-language UI, multi-chain wallet trust, verified subscriber reviews',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme } = await getServerI18n();

  return (
    <html
      lang="en"
      dir="ltr"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      style={{ colorScheme: theme }}
    >
      <body className="min-h-full flex flex-col antialiased">
        <AuthSessionProvider>
          <SolanaWalletProviderShell>
            <AppProvider initialLocale="en" initialTheme={theme}>
              {children}
            </AppProvider>
          </SolanaWalletProviderShell>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
