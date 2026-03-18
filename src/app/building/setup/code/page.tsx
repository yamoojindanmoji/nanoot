'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

interface BuildingInfo {
  id: string;
  name: string;
}

function BuildingCodeContent() {
  const searchParams = useSearchParams();
  const buildingId = searchParams.get('id');
  
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buildingData, setBuildingData] = useState<BuildingInfo | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const setUser = useAuthStore((state) => state.setUser);
  const userStore = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!buildingId) {
      router.replace('/building/setup');
      return;
    }

    const fetchBuilding = async () => {
      const { data } = await supabase.from('buildings').select('id, name').eq('id', buildingId).single();
      if (data) setBuildingData(data);
    };
    fetchBuilding();
  }, [buildingId, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId || !buildingData) return;

    setIsLoading(true);
    setError(null);

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.');
      setIsLoading(false);
      return;
    }

    // 2. Validate invite code for the specific building
    const { data: buildingMatch, error: buildingError } = await supabase
      .from('buildings')
      .select('id')
      .eq('id', buildingId)
      .eq('invite_code', inviteCode)
      .single();

    if (buildingError || !buildingMatch) {
      setError('초대 코드가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 3. Update user's buildingId
    const { error: updateError } = await supabase
      .from('users')
      .update({ building_id: buildingId })
      .eq('id', user.id);

    if (updateError) {
      setError('건물 등록 중 오류가 발생했습니다.');
      setIsLoading(false);
      return;
    }

    // 4. Update Zustand Store & Redirect
    if (userStore) {
      setUser({ ...userStore, buildingId });
    }
    
    alert(`[${buildingData.name}] (으)로 인증되었습니다!`);
    router.push('/');
    setIsLoading(false);
  };

  if (!buildingData) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-12 pb-8 h-screen bg-white">
      <header className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </header>

      <h1 className="text-2xl font-bold mb-2">건물 인증 코드</h1>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed">
        <span className="font-semibold text-gray-900">{buildingData.name}</span>의<br/>
        입장 코드를 입력해주세요.
      </p>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-600 bg-red-100/50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
        <Input
          placeholder="영문/숫자 코드 입력"
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="text-lg tracking-wider font-medium text-center"
        />

        <div className="mt-auto pt-4 border-t border-gray-100">
          <Button type="submit" className="w-full h-14 text-[15px]" disabled={isLoading || !inviteCode}>
            {isLoading ? '인증 중...' : '인증 완료하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function BuildingCodePage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <BuildingCodeContent />
    </Suspense>
  );
}
