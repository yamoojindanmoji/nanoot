'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { UserProfileClient } from './UserProfileClient';
import { NotificationToggle } from './NotificationToggle';
import { Info, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setUser(currentUser);

      const { data: profileData } = await supabase
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
        .eq('id', currentUser.id)
        .single();
      
      setProfile(profileData);
      setIsLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

  if (!user) {
    return null;
  }

  const isBuildingVerified = !!profile?.building_id;
  const building = Array.isArray(profile?.buildings) ? profile.buildings[0] : profile?.buildings;

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
            profileImageUrl: profile?.profile_image_url || '',
            buildingName: isBuildingVerified ? building?.name : null,
          }}
          isBuildingVerified={isBuildingVerified}
        />
      </div>

      {/* Menus */}
      <div className="bg-white mb-2 border-b border-gray-100 border-t">
        <div className="flex flex-col">
          <NotificationToggle />
          <MenuLink 
             icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>} 
             title="건물 단톡방" 
             href={isBuildingVerified && building?.open_chat_link ? building.open_chat_link : '#'} 
             target={isBuildingVerified && building?.open_chat_link ? '_blank' : undefined}
             onClick={(!isBuildingVerified || !building?.open_chat_link) ? () => alert('등록된 건물 단톡방이 없습니다.') : undefined}
           />
          <MenuLink icon={<Info size={20} />} title="공지사항 / 서비스안내" href="/my/notices" />
          <MenuLink icon={<HelpCircle size={20} />} title="문의하기" href="/my/contact" />
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white px-5 py-4 flex flex-col gap-4 border-b border-gray-100">
         <button onClick={handleSignOut} className="text-[15px] font-medium text-gray-600 flex items-center gap-2 hover:text-gray-900 transition-colors">
            <LogOut size={18} />
            로그아웃
         </button>
         <button className="text-[14px] text-gray-400 text-left w-fit hover:underline">회원 탈퇴</button>
      </div>

      <div className="p-6 pb-24 flex flex-col gap-2">
         <div className="flex gap-4 text-xs text-gray-400 font-medium">
            <Link href="/terms" className="hover:underline text-gray-500">이용약관</Link>
            <span className="text-gray-300">|</span>
            <Link href="/privacy" className="hover:underline text-gray-500 font-bold">개인정보처리방침</Link>
         </div>
         <p className="text-[11px] text-gray-400 leading-relaxed">
            나눗은 이웃 간의 신뢰를 바탕으로 하는 공동구매 나눔 서비스입니다.<br />
            관리자에 의해 부득이하게 서비스 이용이 제한될 수 있습니다.
         </p>
      </div>
    </div>
  );
}

function MenuLink({ icon, title, href, target, onClick }: { icon: React.ReactNode, title: string, href: string, target?: string, onClick?: () => void }) {
  const content = (
    <>
      <div className="flex items-center gap-3 text-gray-800">
        <span className="text-gray-500">{icon}</span>
        <span className="text-[16px] font-medium">{title}</span>
      </div>
      <ChevronRight size={20} className="text-gray-300" />
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex justify-between items-center p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 w-full text-left">
        {content}
      </button>
    );
  }
  
  return (
    <Link href={href} target={target} className="flex justify-between items-center p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      {content}
    </Link>
  );
}
