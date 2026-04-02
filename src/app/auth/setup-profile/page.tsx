'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Camera } from 'lucide-react';
import Image from 'next/image';

export default function SetupProfilePage() {
  const [nickname, setNickname] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      let profileImageUrl = '';
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, image);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);
          profileImageUrl = publicUrl;
        }
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nickname: nickname,
          profile_image_url: profileImageUrl || undefined,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/'); // Go to home after setup
    } catch (error) {
      console.error('Error setting up profile:', error);
      alert('프로필 설정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-6 pt-12 pb-10 overflow-y-auto">
      <header className="flex items-center mb-8">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </header>

      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-2">프로필을 설정해주세요</h1>
        <p className="text-gray-500 mb-12 text-[15px]">
          나눗에서 사용할 이름과 사진을 등록해주세요.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          {/* Profile Image Upload */}
          <div className="relative mb-10">
            <label className="block w-28 h-28 rounded-full border-2 border-gray-100 bg-gray-50 overflow-hidden cursor-pointer group relative">
              {previewUrl ? (
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black/5 hidden group-hover:block transition-all" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white border-2 border-white pointer-events-none">
              <Camera size={16} />
            </div>
          </div>

          <div className="w-full flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-900 px-1">닉네임</label>
            <Input
              placeholder="사용하실 닉네임을 입력해주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-14 rounded-xl border-gray-200 focus:border-black focus:ring-black translate-all"
              required
              maxLength={20}
            />
            <p className="text-[12px] text-gray-400 px-1">
              최대 20자까지 입력 가능합니다.
            </p>

            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">💡 오픈채팅방 닉네임과 통일을 권장해요!</p>
              <p className="text-xs text-green-700 leading-relaxed">
                건물 오픈채팅방에서 입금 확인 시 닉네임으로 참여자를 확인하기 때문에, 오픈채팅방 닉네임과 동일하게 설정하면 더 원활한 수령이 가능해요.
              </p>
              <p className="text-xs text-green-600 mt-2">(예: 홍길동/7층)</p>
            </div>
          </div>
        </form>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !nickname.trim()}
        className="w-full h-14 rounded-xl font-bold text-[16px] bg-[#C1EB3B] text-gray-900 hover:bg-[#A3CE2A] transition-all mt-8"
      >
        {isSubmitting ? '설정 중...' : '회원가입 완료'}
      </Button>
    </div>
  );
}
