import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navigation from './components/Navigation';

const outfit = Outfit({ subsets: ['latin'] });

export function generateMetadata(): Metadata {
  return {
    title: 'Flowless - Workflow Automation',
    description: 'Build and automate workflows with ease',
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
          <main className="min-h-screen">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
} 