import { Analytics } from '@vercel/analytics/react';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';
import { ToastProvider } from '@/providers/toast-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Subliminal.Studio',
  description: 'Create personalized affirmations with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.className}>
        <body>
          <ToastProvider>
            {children}
          </ToastProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

// Remove the ErrorBoundary class from this file

