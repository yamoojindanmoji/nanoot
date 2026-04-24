'use client';

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface GuestPlaceholderProps {
  title: string;
  description: string;
}

export function GuestPlaceholder({ title, description }: GuestPlaceholderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 mt-20 text-center gap-6">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
        <p className="text-[15px] font-medium text-gray-500 whitespace-pre-wrap leading-relaxed">
          {description}
        </p>
      </div>
      <Button 
        onClick={handleLogin}
        className="px-10 h-14 rounded-2xl font-bold !bg-[#FEE500] !text-[#3C1E1E] hover:!bg-[#FADA0A] border-none shadow-sm"
      >
        카카오로 시작하기
      </Button>
    </div>
  );
}
