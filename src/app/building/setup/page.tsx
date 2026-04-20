'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState } from 'react';
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
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;
    setIsSearching(true);
    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, address')
      .ilike('name', `%${keyword}%`);
    if (!error && data) setBuildings(data);
    setIsSearching(false);
  };

  /** 건물을 선택하면 코드 입력 없이 바로 building_id 업데이트 후 홈으로 이동 */
  const handleSelectBuilding = async (buildingId: string) => {
    setIsSelecting(buildingId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/');
      return;
    }
    await supabase
      .from('users')
      .update({ building_id: buildingId })
      .eq('id', user.id);

    window.location.href = '/';
  };

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
        거주 중인 건물을 검색해주세요.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input
          placeholder="건물명 검색 (예: 나눗아파트)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={(e) => {
            e.preventDefault();
            setTimeout(() => {
              window.scrollTo(0, 0);
            }, 100);
          }}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching} className="w-16">
          검색
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto">
        {buildings.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {isSearching ? '검색 중...' : '검색 결과가 없습니다.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {buildings.map((b) => (
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