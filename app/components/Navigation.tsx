'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [developerMenuOpen, setDeveloperMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const isDeveloperPage = pathname === '/webhooks' || pathname === '/api-keys' || pathname === '/whatsapp' || pathname === '/sms' || pathname === '/debug' || pathname === '/personalization';

  if (!isSignedIn) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/analytics/chat" className="text-xl font-bold text-blue-600">
                Track
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/analytics/chat"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/analytics/chat'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Analytics AI
              </Link>
              <Link
                href="/events"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/events'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Events
              </Link>
              
              <Link
                href="/segments"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname.startsWith('/segments')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Segments
              </Link>
              <Link
                href="/campaigns"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/campaigns'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Campaigns
              </Link>
              <Link
                href="/workflows"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname.startsWith('/workflows')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Workflows
              </Link>
              <Link
                href="/knowledge"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/knowledge'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Knowledge Base
              </Link>
              <Link
                href="/promocodes"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname.startsWith('/promocodes')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Promo Codes
              </Link>
              
              {/* Developer Dropdown */}
              <div className="relative inline-flex items-center">
                <button
                  onClick={() => setDeveloperMenuOpen(!developerMenuOpen)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full ${
                    isDeveloperPage
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Developer
                  <svg
                    className={`ml-1 h-4 w-4 transition-transform ${developerMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {developerMenuOpen && (
                  <div className="absolute transform -translate-x-1/2 left-1/2 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      href="/webhooks"
                      className={`block px-4 py-2 text-sm ${
                        pathname === '/webhooks'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setDeveloperMenuOpen(false)}
                    >
                      Webhooks
                    </Link>
                    <Link
                      href="/api-keys"
                      className={`block px-4 py-2 text-sm ${
                        pathname === '/api-keys'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setDeveloperMenuOpen(false)}
                    >
                      API Keys
                    </Link>
                    <Link
                      href="/whatsapp"
                      className={`block px-4 py-2 text-sm ${
                        pathname === '/whatsapp'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setDeveloperMenuOpen(false)}
                    >
                      WhatsApp
                    </Link>
                                    <Link
                  href="/sms"
                  className={`block px-4 py-2 text-sm ${
                    pathname === '/sms'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setDeveloperMenuOpen(false)}
                >
                  SMS
                </Link>
                <Link
                  href="/personalization"
                  className={`block px-4 py-2 text-sm ${
                    pathname === '/personalization'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setDeveloperMenuOpen(false)}
                >
                  Personalization
                </Link>
                    <Link
                      href="/debug"
                      className={`block px-4 py-2 text-sm ${
                        pathname === '/debug'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setDeveloperMenuOpen(false)}
                    >
                      Debug
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={handleSignOut}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Close dropdown when clicking outside */}
      {developerMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setDeveloperMenuOpen(false)}
        />
      )}
    </nav>
  );
} 