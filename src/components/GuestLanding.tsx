'use client';

import { useEffect, useState } from 'react';
import { Onboarding } from './Onboarding';
import { Intro } from './Intro';

const SHOW_ONBOARDING = true; // 온보딩 활성화 여부 플래그

export function GuestLanding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!SHOW_ONBOARDING) {
      setShowOnboarding(false);
      return;
    }
    
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    setShowOnboarding(!hasSeen);
  }, []);

  if (showOnboarding === null) {
    // prevent hydration mismatch
    return null; 
  }

  if (showOnboarding) {
    return (
      <Onboarding 
        onComplete={() => {
          localStorage.setItem('hasSeenOnboarding', 'true');
          setShowOnboarding(false);
        }} 
      />
    );
  }

  return <Intro />;
}
