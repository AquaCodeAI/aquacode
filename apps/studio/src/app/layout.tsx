import type { Metadata, Viewport } from 'next';
import ClientProviders from '@/app/_client-providers';
import { ServerProviders } from '@/app/_server-providers';
import { fontSans } from '@/configurations/font';
import { NextLayout } from '@/types/next';
import { cn } from '@/utils/cn';

import '../styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'AquaCode',
    template: 'Build apps with AI | AquaCode',
  },
};

const RootLayout: NextLayout = ({ children }) => {
  return (
    <html suppressHydrationWarning lang='en' dir={'ltr'}>
      <head />
      <body
        className={cn(
          'scroll flex min-h-dvh flex-col bg-white font-sans antialiased dark:bg-neutral-800/90',
          fontSans.variable
        )}
      >
        <ClientProviders>
          <ServerProviders>{children}</ServerProviders>
        </ClientProviders>
      </body>
    </html>
  );
};

export default RootLayout;
