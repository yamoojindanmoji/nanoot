'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  email: string;
  profile_image_url?: string;
  created_at: string;
  building_id?: string;
  buildings?: { name: string; address: string } | null;
}

export default function MyPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('users')
        .select('*, buildings(name, address)')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setNickname(data.nickname || '');
      }
    })();
  }, []);

  const handleSaveNickname = async () => {
    if (!profile || !nickname.trim()) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('users')
      .update({ nickname: nickname.trim() })
      .eq('id', profile.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, nickname: nickname.trim() } : prev);
      setMessage('닉네임이 변경되었습니다!');
    } else {
      setMessage('저장 중 오류가 발생했습니다.');
    }
    setIsSaving(false);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!profile) {
    return <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">로딩 중...</div>;
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-5 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold">마이페이지</h1>
      </header>

      {/* 프로필 영역 */}
      <div className="bg-white px-5 py-8 flex flex-col items-center border-b border-gray-100">
        <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-3 flex items-center justify-center">
          {profile.profile_image_url ? (
            <img src={profile.profile_image_url} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <div className="font-bold text-gray-900 text-lg">{profile.nickname}</div>
        <div className="text-sm text-gray-500">{profile.email}</div>
      </div>

      {/* 설정 섹션들 */}
      <div className="flex flex-col gap-3 p-4">

        {/* 닉네임 변경 */}
        <div className="bg-white rounded-2xl px-5 py-5 shadow-sm">
          <div className="text-sm font-bold text-gray-700 mb-3">닉네임 변경</div>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
              placeholder="새 닉네임 입력"
              maxLength={20}
            />
            <button
              onClick={handleSaveNickname}
              disabled={isSaving}
              className="px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              저장
            </button>
          </div>
          {message && <div className="text-xs text-blue-500 mt-2">{message}</div>}
        </div>

        {/* 건물 정보 */}
        <div className="bg-white rounded-2xl px-5 py-5 shadow-sm">
          <div className="text-sm font-bold text-gray-700 mb-3">내 건물 정보</div>
          {profile.buildings ? (
            <div className="text-sm text-gray-700">
              <div className="font-medium">{(profile.buildings as any).name}</div>
              <div className="text-gray-500 text-xs mt-1">{(profile.buildings as any).address}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">등록된 건물 없음</div>
          )}
          <button
            onClick={() => router.push('/building/setup')}
            className="mt-3 text-blue-500 text-xs font-medium hover:underline"
          >
            건물 변경하기 →
          </button>
        </div>

        {/* 계정 정보 */}
        <div className="bg-white rounded-2xl px-5 py-5 shadow-sm">
          <div className="text-sm font-bold text-gray-700 mb-3">계정 정보</div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">이름</span>
              <span>{profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">이메일</span>
              <span>{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">가입일</span>
              <span>{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full py-4 text-sm font-medium text-red-500 bg-white rounded-2xl border border-red-100 hover:bg-red-50 transition-colors shadow-sm"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
