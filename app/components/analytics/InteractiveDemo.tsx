'use client';

import { useRouter } from 'next/navigation';

export default function InteractiveDemo() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Interactive Demo</h2>
      <p className="text-gray-600 mb-4">
        Click the buttons below to simulate different user interactions and see how they affect event tracking.
      </p>
      <div className="space-y-2">
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => handleNavigation('/demo/page1')}
        >
          Navigate to Page 1
        </button>
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => handleNavigation('/demo/page2')}
        >
          Navigate to Page 2
        </button>
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => handleNavigation('/demo/page3')}
        >
          Navigate to Page 3
        </button>
      </div>
    </div>
  );
} 