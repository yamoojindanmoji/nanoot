'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { Pencil, Camera, Loader2 } from 'lucide-react';

export function UserProfileClient({ 
  initialProfile, 
  isBuildingVerified 
}: { 
  initialProfile: { nickname: string, profileImageUrl: string, buildingName: string | null }, 
  isBuildingVerified: boolean 
}) {
  const [showVerifyPopup, setShowVerifyPopup] = useState(!isBuildingVerified);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(initialProfile.nickname);
  const [editNicknameValue, setEditNicknameValue] = useState(initialProfile.nickname);
  const [profileImageUrl, setProfileImageUrl] = useState(initialProfile.profileImageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleNicknameClick = () => {
    setEditNicknameValue(nickname);
    setIsEditingNickname(true);
  };

  const handleUpdateNickname = async () => {
    if (!editNicknameValue.trim()) {
      setToastMessage('닉네임을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('users')
        .update({ nickname: editNicknameValue.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setNickname(editNicknameValue.trim());
      setIsEditingNickname(false);
      setToastMessage('닉네임이 변경되었습니다.');
    } catch (error) {
      console.error('Error updating nickname:', error);
      setToastMessage('닉네임 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    if (isUploadingImage) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (optional, e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // 3. Update Database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Update UI
      setProfileImageUrl(publicUrl);
      setToastMessage('프로필 이미지가 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('Error uploading image:', error);
      setToastMessage('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Profile Image Container */}
        <div 
          onClick={handleImageClick}
          className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative group cursor-pointer border border-gray-100"
        >
          {profileImageUrl ? (
            <Image 
              src={profileImageUrl} 
              alt="profile" 
              width={64} 
              height={64} 
              className={`w-full h-full object-cover transition-opacity ${isUploadingImage ? 'opacity-40' : 'opacity-100'}`} 
            />
          ) : (
            <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${isUploadingImage ? 'opacity-40' : 'opacity-100'}`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          )}
          
          {/* Overlay for hover */}
          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
             <Camera size={20} className="text-white opacity-80" />
          </div>

          {/* Loader Overlay */}
          {isUploadingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <Loader2 className="w-6 h-6 text-[#84CC16] animate-spin" />
            </div>
          )}

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex flex-col">
          <div 
            onClick={handleNicknameClick}
            className="flex items-center gap-1.5 mb-1 cursor-pointer group"
          >
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors">{nickname}</h2>
            <Pencil size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
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

      {/* 닉네임 수정 모달 */}
      {isEditingNickname && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-xl flex flex-col gap-4">
             <div className="flex flex-col gap-1 text-center">
               <h3 className="text-lg font-bold text-gray-900">닉네임 수정</h3>
               <p className="text-[13px] text-emerald-600 font-medium leading-relaxed">
                 닉네임을 카카오톡 오픈채팅방 이름<br />
                 <span className="font-bold">(닉네임/층 수)</span>로 변경해주세요!
               </p>
             </div>
             
             <div className="py-2">
               <Input 
                 value={editNicknameValue}
                 onChange={(e) => setEditNicknameValue(e.target.value)}
                 placeholder="닉네임 입력 (예: 홍길동/12층)"
                 className="text-center h-12 text-base"
                 autoFocus
               />
             </div>

             <div className="flex gap-2">
               <Button 
                 variant="secondary" 
                 className="flex-1 rounded-xl h-12" 
                 onClick={() => setIsEditingNickname(false)}
                 disabled={isLoading}
               >
                 취소
               </Button>
               <Button 
                 className="flex-1 rounded-xl h-12" 
                 onClick={handleUpdateNickname}
                 disabled={isLoading}
               >
                 {isLoading ? '저장 중...' : '저장하기'}
               </Button>
             </div>
          </div>
        </div>
      )}

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

