'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

export function UserProfileClient({ 
  initialProfile, 
  isBuildingVerified 
}: { 
  initialProfile: { nickname: string, profileImageUrl: string, buildingName: string | null }, 
  isBuildingVerified: boolean 
}) {
  const [showVerifyPopup, setShowVerifyPopup] = useState(!isBuildingVerified);
  const [toastMessage, setToastMessage] = useState('');

  return (
    <>
      <div className="flex items-center gap-4">
        <div 
          onClick={() => setToastMessage('프로필 이미지 변경 기능은 준비 중입니다.')}
          className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative group cursor-pointer border border-gray-100"
        >
          {initialProfile.profileImageUrl ? (
            <Image src={initialProfile.profileImageUrl} alt="profile" width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
             <span className="text-white text-xs font-bold">변경</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-900">{initialProfile.nickname}</h2>
          </div>
          
          {isBuildingVerified ? (
            <div className="flex items-center gap-1.5 text-[14px] text-gray-600">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
               {initialProfile.buildingName}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[14px] text-rose-500 font-medium">
               건물 미인증 상태
               <button onClick={() => setShowVerifyPopup(true)} className="ml-1 text-xs bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full hover:bg-rose-100 transition-colors">
                 인증하기
               </button>
            </div>
          )}
        </div>
      </div>

      {showVerifyPopup && !isBuildingVerified && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-xl flex flex-col gap-4">
             <h3 className="text-lg font-bold text-gray-900 text-center">건물 인증이 필요해요</h3>
             <p className="text-gray-500 text-[15px] text-center mb-2">
               우리 건물 이웃들과 공구를 시작하려면<br />건물 인증이 필수입니다.
             </p>
             <div className="flex gap-2">
               <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setShowVerifyPopup(false)}>다음에</Button>
               <Button className="flex-1 rounded-xl" onClick={() => {
                 // 로컬 스토리지 등에 저장된 마지막 방문 건물 ID가 있으면 사용, 없으면 setup으로
                 const buildingId = typeof window !== 'undefined' ? localStorage.getItem('last_browsed_building_id') || '1' : '1';
                 window.location.href=`/building/verify?id=${buildingId}`;
               }}>인증하러 가기</Button>
             </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </>
  );
}
