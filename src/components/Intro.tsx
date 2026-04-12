'use client';
import { createClient } from '@/lib/supabase/client';

export function Intro() {
  const handleKakaoLogin = async () => {
    const supabase = createClient();
    const currentParams = window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${currentParams}`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col pt-[max(env(safe-area-inset-top),48px)] pb-[max(env(safe-area-inset-bottom),32px)] px-6">
      <div className="flex flex-col flex-1 items-center justify-center">
        {/* Logo */}
        <div className="font-black text-[56px] tracking-tighter mb-8 text-center leading-none">
          nan<span className="text-[#B9F115]">o</span><span className="text-[#3E73FB]">o</span>t
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-[#3E73FB] text-[18px] font-bold tracking-tight mb-4">
            이웃과 나눠 사요, 나눗
          </h2>
          <p className="text-gray-900 text-[16px] leading-[1.6] font-medium tracking-tight">
            같은 건물 이웃과<br />
            함께하는 공동구매를 시작해보세요!
          </p>
        </div>
      </div>

      {/* Buttons & Footer */}
      <div className="flex flex-col gap-0 w-full flex-shrink-0 mt-auto">
        <button
          onClick={handleKakaoLogin}
          className="w-full h-[52px] bg-[#FEE500] text-black font-bold rounded-xl text-[16px] flex items-center justify-center gap-[6px] hover:bg-[#F4DC00] active:bg-[#e6c800] transition-colors shadow-sm"
        >
          <svg width="20" height="18" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 0C4.92487 0 0 3.86873 0 8.64167C0 11.7589 2.05389 14.4891 5.25301 16.0336C5.02982 16.7589 4.316 19.3486 4.26938 19.5303C4.22276 19.7121 4.37257 19.6894 4.54226 19.5761C4.7825 19.412 8.35474 16.9205 9.17647 16.3268C9.76993 16.4252 10.3789 16.4756 11 16.4756C17.0751 16.4756 22 12.6069 22 7.83398C22 3.06103 17.0751 0 11 0Z" fill="black"/>
          </svg>
          카카오로 3초만에 시작하기
        </button>

        {/* Terms */}
        <div className="mt-6 mb-2 text-center text-[11px] text-gray-400 font-medium tracking-tight">
          서비스 시작은 <a href="https://nanoot.notion.site/334bdbd837f180389ae0d93ff438d34c" target="_blank" rel="noopener noreferrer" className="underline">서비스 이용약관</a> 및 <a href="https://nanoot.notion.site/333bdbd837f1802dadd4eb059b8c7562" target="_blank" rel="noopener noreferrer" className="underline">개인정보처리방침</a> 동의를 의미합니다.
        </div>
      </div>
    </div>
  );
}
