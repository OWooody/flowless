import type { Metadata } from 'next';
import * as Sentry from '@sentry/nextjs';
import { Outfit } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navigation from './components/Navigation';

const outfit = Outfit({ subsets: ['latin'] });

export function generateMetadata(): Metadata {
  return {
    title: 'Track - User Behavior Analytics',
    description: 'Track and analyze user behavior on your website',
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={outfit.className}>
        <body>
          <Navigation />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
} 