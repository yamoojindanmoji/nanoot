import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'ADMIN') {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3 text-gray-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <div className="text-center">
          <p className="font-medium text-gray-600">접근 권한이 없습니다</p>
          <p className="text-sm mt-1">어드민 계정으로 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  // 전체 공구 목록
  const { data: coBuyings } = await supabase
    .from('co_buyings')
    .select(`*, buildings(name)`)
    .order('created_at', { ascending: false });

  return <AdminClient coBuyings={coBuyings || []} />;
}
