'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// ── 건물 검색 뷰 ────────────────────────────────────────────────────
function BuildingSearchView() {
  const router = useRouter();
  const supabase = createClient();
  const [keyword, setKeyword] = useState('');
  const [buildings, setBuildings] = useState<{ id: string; name: string; address: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name, address')
        .order('name');
      
      if (error) {
        console.error('Error fetching buildings:', error);
      } else if (data) {
        console.log('Fetched buildings:', data);
        setBuildings(data);
      }
      setIsLoading(false);
    };
    fetchBuildings();
  }, [supabase]);

  /** 건물을 선택하면 코드 입력 없이 바로 building_id 업데이트 후 홈으로 이동 */
  const handleSelectBuilding = async (buildingId: string) => {
    setIsSelecting(buildingId);
    
    // 선택한 건물을 localStorage에 저장 (비회원/회원 공통)
    localStorage.setItem('last_browsed_building_id', buildingId);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ building_id: buildingId })
        .eq('id', user.id);
    }

    window.location.href = '/';
  };

  const filteredBuildings = buildings.filter(b => 
    b.name.toLowerCase().includes(keyword.toLowerCase()) || 
    b.address.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 px-6 pt-12 pb-10 overflow-y-auto">
      <header className="flex items-center mb-8">
        <button
          onClick={() => router.replace('/')}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </header>

      <h1 className="text-2xl font-bold mb-2">어디에 거주하시나요?</h1>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed">
        이웃과 함께하는 공동구매를 위해<br />
        거주 중인 건물을 선택해주세요.
      </p>

      <form className="flex gap-2 mb-8" onSubmit={(e) => e.preventDefault()}>
        <Input
          placeholder="건물명 검색 (예: 나눗아파트)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1"
        />
      </form>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {keyword ? '검색 결과가 없습니다.' : '등록된 건물이 없습니다.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredBuildings.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBuilding(b.id)}
                disabled={isSelecting === b.id}
                className="flex flex-col items-start p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-900 transition-colors text-left disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="font-semibold text-gray-900 mb-1">{b.name}</div>
                <div className="text-xs text-gray-500">{b.address}</div>
                {isSelecting === b.id && (
                  <div className="mt-2 text-xs text-[#84CC16] font-medium">건물 등록 중...</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pb-12 text-center text-xs text-gray-400">
        원하는 건물이 없나요? 관리자에게 등록을 요청해주세요.
      </div>
    </div>
  );
}

// ── query param에 따라 뷰 분기 ─────────────────────────────────────
function BuildingSetupContent() {
  // buildingId 쿼리 파라미터는 더 이상 코드 입력으로 연결되지 않음
  // (auth/callback에서 자동 처리되므로 이 페이지는 항상 검색 뷰 표시)
  return <BuildingSearchView />;
}

export default function BuildingSetupPage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <BuildingSetupContent />
    </Suspense>
  );
}