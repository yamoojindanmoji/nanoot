'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Building {
  id: string;
  name: string;
  address: string;
}

export default function BuildingSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, address')
      .ilike('name', `%${keyword}%`);

    if (!error && data) {
      setBuildings(data);
    }

    setIsLoading(false);
  };

  const handleSelectBuilding = (buildingId: string) => {
    // 선택한 건물 ID를 쿼리 파라미터로 넘겨서 코드 입력 페이지로 이동
    router.push(`/building/setup/code?id=${buildingId}`);
  };

  return (
    <div className="flex flex-col flex-1 px-6 pt-16">
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
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading} className="w-16">
          검색
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto">
        {buildings.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {isLoading ? '검색 중...' : '검색 결과가 없습니다.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {buildings.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBuilding(b.id)}
                className="flex flex-col items-start p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-900 transition-colors text-left"
              >
                <div className="font-semibold text-gray-900 mb-1">{b.name}</div>
                <div className="text-xs text-gray-500">{b.address}</div>
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
