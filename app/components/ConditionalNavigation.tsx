'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from './Navigation';

export default function ConditionalNavigation() {
  const pathname = usePathname();
  const [didMount, setDidMount] = useState(false);

  useEffect(() => {
    setDidMount(true);
  }, []);

  // During server render and initial client render, show nothing
  // This ensures server and client render the same content initially
  if (!didMount) {
    return null;
  }

  // After hydration, check the pathname and conditionally render
  const isLandingPage = pathname === '/landing';

  if (isLandingPage) {
    return null;
  }

  return <Navigation />;
} 