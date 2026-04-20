'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CoBuyingCard } from '@/components/CoBuyingCard';
import { CATEGORIES } from '@/lib/categories';
import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // Drag interaction for PC
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    // 1. Get current session
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    // 2. Resolve buildingId — only for authenticated users OR default public building for guests
    let bId: string | null = null;

    if (!currentUser) {
      // 비회원은 기본 건물(장안뉴시티) 공구 리스트 노출
      bId = 'b1622719-ed13-4ed4-b40e-ebbcbe9e920c';
    } else {
      // --- 사용자 프로필 조회 (재시도 로직 포함) ---
      let profile = null;
      let retryCount = 0;
      const MAX_RETRIES = 2;

      while (retryCount <= MAX_RETRIES) {
        const { data: profiles } = await supabase
          .from('users')
          .select('building_id')
          .eq('id', currentUser.id);
        
        if (profiles && profiles.length > 0) {
          profile = profiles[0];
          break;
        }

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 대기 후 재시도
        } else {
          break;
        }
      }

      bId = profile?.building_id || null;
      
      if (!bId) {
        // 로그인이 되어있지만 여전히 건물이 없는 경우만 설정 페이지로 이동
        // invite 파라미터가 있다면 building/setup 페이지에서 처리하도록 내버려둠
        router.replace('/building/setup' + window.location.search);
        setIsLoading(false);
        return;
      }
    }

    setBuildingId(bId);
    // Store in localStorage for other parts of the app
    localStorage.setItem('last_browsed_building_id', bId);

    // 3. Fetch building info
    const { data: bData } = await supabase
      .from('buildings')
      .select('name')
      .eq('id', bId)
      .maybeSingle();
    setBuilding(bData);

    // 4. Fetch co-buying items (API route를 통해 서버에서 집계 — RLS 우회)
    const res = await fetch(`/api/co-buyings-with-qty?buildingId=${bId}`);
    const { items: itemsWithQuantity = [] } = res.ok ? await res.json() : { items: [] };
    
    // 정렬: 모집중(deadline ASC) → 모집마감(created_at DESC)
    const now = new Date().getTime();
    const sorted = itemsWithQuantity.sort((a: any, b: any) => {
      const aRecruiting = a.status === 'RECRUITING' && new Date(a.deadline).getTime() > now;
      const bRecruiting = b.status === 'RECRUITING' && new Date(b.deadline).getTime() > now;
      
      if (aRecruiting && !bRecruiting) return -1;
      if (!aRecruiting && bRecruiting) return 1;
      
      if (aRecruiting && bRecruiting) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setItems(sorted);
    
    // 5. Fetch unread notifications
    if (currentUser) {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);
      setHasUnreadNotifications((count || 0) > 0);
    }

    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-speed
    if (Math.abs(x - startX) > 5) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };



  const filteredItems = items.filter(item => {
    if (activeTab === '전체') return true;
    return item.category === activeTab;
  });

  const displayCategories = [{ value: '전체', emoji: '📦' }, ...CATEGORIES];

  return (
    <div className="flex flex-col flex-1 pb-20 min-h-[100dvh]">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold">{building?.name || '우리 건물'} 나눗</h1>
        <div className="flex items-center gap-2">
          <Link 
            href="/notifications" 
            className="w-8 h-8 flex items-center justify-center text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors relative"
          >
            <Bell size={18} />
            {hasUnreadNotifications && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            )}
          </Link>
        </div>
      </header>
      


      {/* Tabs */}
      <div 
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={`px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {displayCategories.map(cat => (
          <button 
            key={cat.value}
            onClick={() => !hasMoved && setActiveTab(cat.value)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              activeTab === cat.value 
                ? 'bg-[#84CC16] text-white border-[#84CC16]' 
                : 'bg-gray-100 text-gray-400 border-gray-100 hover:bg-gray-200'
            }`}
          >
            <span className="text-base">{cat.emoji}</span>
            {cat.value}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 bg-white">
        {isLoading ? (
          <div className="flex flex-col">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-50 flex gap-4">
                <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            진행 중인 공동구매가 없습니다.
          </div>
        ) : (
          filteredItems.map(item => (
            <CoBuyingCard
              key={item.id}
              id={item.id}
              buildingId={buildingId || '1'}
              title={item.title}
              category={item.category}
              status={item.status}
              totalQuantity={item.total_quantity || 0}
              currentQuantity={item.current_quantity || 0} 
              totalPrice={item.total_price || 0}
              deadline={item.deadline}
              thumbnailUrl={item.image_url || 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop'} 
            />
          ))
        )}
      </div>

    </div>
  );
}
