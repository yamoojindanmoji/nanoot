'use client';

import { useState } from 'react';
import { Onboarding } from './Onboarding';

export function GuestLanding() {
  // 항상 온보딩부터 시작. 완료/스킵 시 건물 선택 페이지(/building/setup)로 이동
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />
    );
  }

  // 온보딩 완료 후 — 건물 선택 페이지로 이동 (실제로는 Onboarding 내부에서 처리)
  return null;
}
