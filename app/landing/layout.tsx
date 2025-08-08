import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import '../globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Understand - AI-Powered Behavior Understanding & Automation Platform',
  description: 'Understand user behavior patterns and automate workflows with intelligent triggers. Transform user interactions into automated actions that respond in real-time.',
  keywords: 'user behavior, automation, workflow automation, behavior understanding, AI analytics, real-time triggers, user insights, business automation',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Understand - AI-Powered Behavior Understanding & Automation Platform',
    description: 'Understand user behavior patterns and automate workflows with intelligent triggers. Transform user interactions into automated actions that respond in real-time.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Understand - AI-Powered Behavior Understanding & Automation Platform',
    description: 'Understand user behavior patterns and automate workflows with intelligent triggers.',
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={jetbrainsMono.variable}>
        <body className="font-sans landing-page">
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
} 