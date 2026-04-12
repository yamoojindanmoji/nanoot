'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// ── 코드 입력 뷰 (?buildingId=xxx 있을 때) ─────────────────────────
function CodeEntryView({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [inviteCode, setInviteCode] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('buildings')
      .select('name')
      .eq('id', buildingId)
      .single()
      .then(({ data }) => { if (data) setBuildingName(data.name); });
  }, [buildingId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // invite_code 일치 여부 확인
    const { data: match } = await supabase
      .from('buildings')
      .select('id')
      .eq('id', buildingId)
      .eq('invite_code', inviteCode.trim())
      .single();

    if (!match) {
      setError('초대 코드가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // users.building_id 업데이트
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/'); return; }

    const { error: updateError } = await supabase
      .from('users')
      .update({ building_id: buildingId })
      .eq('id', user.id);

    if (updateError) {
      setError('건물 등록 중 오류가 발생했습니다.');
      setIsLoading(false);
      return;
    }

    window.location.href = '/';
  };

  return (
    <div className="flex flex-col flex-1 px-6 pt-12 pb-10 overflow-y-auto">
      <header className="flex items-center mb-8">
        <button
          onClick={() => router.push('/building/setup')}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </header>

      <h1 className="text-2xl font-bold mb-2">건물 인증 코드</h1>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed">
        <span className="font-semibold text-gray-900">{buildingName}</span>의<br />
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
          onFocus={(e) => {
            e.preventDefault();
            setTimeout(() => {
              window.scrollTo(0, 0);
            }, 100);
          }}
          className="text-lg tracking-wider font-medium text-center"
        />
        <div className="mt-auto pt-4 border-t border-gray-100">
          <Button
            type="submit"
            className="w-full h-14 text-[15px]"
            disabled={isLoading || !inviteCode.trim()}
          >
            {isLoading ? '인증 중...' : '인증 완료하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── 건물 검색 뷰 (query param 없을 때) ────────────────────────────
function BuildingSearchView() {
  const router = useRouter();
  const supabase = createClient();
  const [keyword, setKeyword] = useState('');
  const [buildings, setBuildings] = useState<{ id: string; name: string; address: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, address')
      .ilike('name', `%${keyword}%`);
    if (!error && data) setBuildings(data);
    setIsLoading(false);
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
                onClick={() => router.push(`/building/setup?buildingId=${b.id}`)}
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

// ── query param에 따라 뷰 분기 ─────────────────────────────────────
function BuildingSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const buildingId = searchParams.get('buildingId');

  if (buildingId) {
    return <CodeEntryView buildingId={buildingId} />;
  }
  return <BuildingSearchView />;
}

export default function BuildingSetupPage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <BuildingSetupContent />
    </Suspense>
  );
}
