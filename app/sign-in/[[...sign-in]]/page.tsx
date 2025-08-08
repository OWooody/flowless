'use client';

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/analytics/chat';

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn redirectUrl={redirectUrl} />
    </div>
  );
} 