import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { UserProfileClient } from './UserProfileClient';
import { Settings, Info, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile data and building info
  const { data: profile } = await supabase
    .from('users')
    .select(`
      id,
      name,
      nickname,
      profile_image_url,
      building_id,
      buildings (
        name,
        open_chat_link
      )
    `)
    .eq('id', user.id)
    .single();

  const isBuildingVerified = !!profile?.building_id;

  return (
    <div className="flex flex-col flex-1 pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">마이나눗</h1>
      </header>

      {/* Profile Card */}
      <div className="bg-white p-5 mb-2 border-b border-gray-100">
        <UserProfileClient 
          initialProfile={{
            nickname: profile?.nickname || '이름없음',
            profileImageUrl: profile?.profile_image_url || 'https://i.pravatar.cc/150?u=' + user.id,
            buildingName: isBuildingVerified ? profile.buildings.name : null,
          }}
          isBuildingVerified={isBuildingVerified}
        />
      </div>

      {/* Menus */}
      <div className="bg-white mb-2 border-b border-gray-100 border-t">
        <div className="flex flex-col">
          <MenuLink icon={<Settings size={20} />} title="알림 설정" href="/my/settings" />
          <MenuLink 
             icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>} 
             title="건물 단톡방" 
             href={isBuildingVerified && profile.buildings?.open_chat_link ? profile.buildings.open_chat_link : '#'} 
             target={isBuildingVerified && profile.buildings?.open_chat_link ? '_blank' : undefined}
             onClick={(!isBuildingVerified || !profile.buildings?.open_chat_link) ? () => alert('등록된 건물 단톡방이 없습니다.') : undefined}
           />
          <MenuLink icon={<Info size={20} />} title="공지사항 / 서비스안내" href="/my/notices" />
          <MenuLink icon={<HelpCircle size={20} />} title="문의하기" href="/my/contact" />
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white px-5 py-4 flex flex-col gap-4">
         <form action="/auth/signout" method="post">
            <button type="submit" className="text-[15px] font-medium text-gray-600 flex items-center gap-2">
               <LogOut size={18} />
               로그아웃
            </button>
         </form>
         <button className="text-[14px] text-gray-400 text-left w-fit hover:underline">회원 탈퇴</button>
      </div>

      {/* Footer Nav */}
      <BottomNav />
    </div>
  );
}

function MenuLink({ icon, title, href, target, onClick }: { icon: React.ReactNode, title: string, href: string, target?: string, onClick?: () => void }) {
  if (onClick) {
    return (
      <button onClick={onClick} className="flex justify-between items-center p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 w-full text-left">
        <div className="flex items-center gap-3 text-gray-800">
          <span className="text-gray-500">{icon}</span>
          <span className="text-[16px] font-medium">{title}</span>
        </div>
        <ChevronRight size={20} className="text-gray-300" />
      </button>
    );
  }
  
  return (
    <Link href={href} target={target} className="flex justify-between items-center p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 text-gray-800">
        <span className="text-gray-500">{icon}</span>
        <span className="text-[16px] font-medium">{title}</span>
      </div>
      <ChevronRight size={20} className="text-gray-300" />
    </Link>
  );
}
