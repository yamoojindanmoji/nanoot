'use client';

import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingName?: string;
}

export function LoginPromptModal({ isOpen, onClose, buildingName }: LoginPromptModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = async () => {
    const supabase = createClient();
    // 현재 공구 상세 페이지 URL을 next 파라미터로 전달, 로그인 후 복귀용
    const nextPath = encodeURIComponent(window.location.pathname);
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
      },
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[440px] mx-auto bg-white rounded-t-[32px] p-8 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for Bottom Sheet */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h3 className="text-[22px] font-bold text-gray-900 mb-2 leading-tight">
            같은 건물 이웃이 맞나요? 🏠
          </h3>
          
          <p className="text-gray-500 text-[15px] font-medium leading-relaxed mb-10">
            신청하려면 카카오 로그인이 필요해요. <br />
            같은 건물 이웃 확인 및 공구 신청 내역 관리를 위해 사용돼요. <br />
            가입하면 {buildingName || '우리 건물'} 공구를 바로 신청할 수 있어요!
          </p>

          <div className="flex flex-col gap-3 w-full pb-safe">
            <Button 
              onClick={handleLogin}
              className="w-full h-15 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FADA0A] border-none font-bold text-[16px] rounded-2xl flex items-center justify-center gap-2"
            >
              <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 0C4.92487 0 0 3.86873 0 8.64167C0 11.7589 2.05389 14.4891 5.25301 16.0336C5.02982 16.7589 4.316 19.3486 4.26938 19.5303C4.22276 19.7121 4.37257 19.6894 4.54226 19.5761C4.7825 19.412 8.35474 16.9205 9.17647 16.3268C9.76993 16.4252 10.3789 16.4756 11 16.4756C17.0751 16.4756 22 12.6069 22 7.83398C22 3.06103 17.0751 0 11 0Z" fill="#3C1E1E"/>
              </svg>
              카카오로 시작하기
            </Button>
            
            <button 
              onClick={onClose}
              className="w-full h-12 text-[15px] text-gray-400 font-medium hover:text-gray-600 transition-colors"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
