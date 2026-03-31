'use client';

import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[340px] bg-white rounded-[24px] p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h3 className="text-[19px] font-bold text-gray-900 mb-2 leading-tight">
            로그인이 필요해요
          </h3>
          
          <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
            공구 신청을 하시려면 로그인이 필요합니다. <br />
            카카오로 3초 만에 시작해보세요!
          </p>

          <div className="flex flex-col gap-2 w-full">
            <Button 
              onClick={handleLogin}
              className="w-full h-14 bg-[#FEE500] text-black hover:bg-[#F4DC00] border-none font-bold text-[15px] rounded-xl flex items-center justify-center gap-2"
            >
              <svg width="20" height="18" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 0C4.92487 0 0 3.86873 0 8.64167C0 11.7589 2.05389 14.4891 5.25301 16.0336C5.02982 16.7589 4.316 19.3486 4.26938 19.5303C4.22276 19.7121 4.37257 19.6894 4.54226 19.5761C4.7825 19.412 8.35474 16.9205 9.17647 16.3268C9.76993 16.4252 10.3789 16.4756 11 16.4756C17.0751 16.4756 22 12.6069 22 7.83398C22 3.06103 17.0751 0 11 0Z" fill="black"/>
              </svg>
              카카오로 시작하기
            </Button>
            
            <button 
              onClick={onClose}
              className="w-full h-10 text-[13px] text-gray-400 font-medium hover:text-gray-600 transition-colors"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
