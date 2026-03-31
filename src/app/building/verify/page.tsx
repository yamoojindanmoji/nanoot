'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { ChevronLeft } from 'lucide-react';

interface BuildingInfo {
  id: string;
  name: string;
}

function BuildingVerifyContent() {
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
      router.replace('/');
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

    // 1. Validate invite code for the specific building
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

    // 2. Handle user state
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ building_id: buildingId })
        .eq('id', user.id);

      if (updateError) {
        setError('건물 등록 중 오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }
      if (userStore) {
        setUser({ ...userStore, buildingId });
      }
    }
    
    // 3. Store verified building ID in cookie as well for consistency
    document.cookie = `guest_building_id=${buildingId}; path=/; max-age=31536000`;
    
    alert(`[${buildingData.name}] 인증이 완료되었습니다!`);
    router.push('/');
    setIsLoading(false);
  };

  if (!buildingData) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-12 pb-10 h-screen bg-white max-w-[440px] mx-auto">
      <header className="flex items-center mb-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-900 border border-gray-100 rounded-full bg-gray-50 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
      </header>

      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-3 text-gray-900">건물 인증을 해주세요</h1>
        <p className="text-gray-500 mb-10 text-[15px] leading-relaxed">
          거주 인증이 되어야 공동구매 공구 신청 및 <br />
          등록이 가능합니다.
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">선택한 건물</label>
            <div className="w-full h-14 px-4 bg-gray-50 rounded-xl flex items-center border border-gray-100 font-medium text-gray-700">
               {buildingData.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">건물 초대 코드</label>
            <Input
              placeholder="전달 받으신 코드를 입력해주세요"
              required
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setError(null);
              }}
              className={`h-14 text-center tracking-widest font-bold text-lg ${error ? 'border-rose-300 bg-rose-50' : ''}`}
            />
            {error && (
              <p className="mt-2 text-sm text-rose-500 font-medium pl-1">
                초대 코드가 일치하지 않습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          variant="secondary" 
          className="w-full h-14 rounded-xl text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 border-none"
          onClick={() => router.push('/')}
        >
          나중에 인증하기
        </Button>
        <Button 
          type="submit" 
          className="w-full h-14 rounded-xl font-bold text-[16px] bg-[#C1EB3B] text-gray-900 hover:bg-[#A3CE2A]"
          onClick={handleSubmit}
          disabled={isLoading || !inviteCode}
        >
          {isLoading ? '인증 중...' : '건물 인증하기'}
        </Button>
      </div>
    </div>
  );
}

export default function BuildingVerifyPage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <BuildingVerifyContent />
    </Suspense>
  );
}
