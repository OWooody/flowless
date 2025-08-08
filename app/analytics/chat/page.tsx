'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AnalyticsChat from '../../components/analytics/AnalyticsChat';

export default function AnalyticsChatPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent('/analytics/chat')}`);
    }
  }, [isLoaded, userId, router]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!userId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Analytics Assistant</h1>
        <p className="text-gray-600 mb-6">
          Get AI-powered insights about your analytics data. Ask questions about user behavior, 
          feature usage, conversion rates, and more.
        </p>
        <AnalyticsChat />
      </div>
    </div>
  );
} 