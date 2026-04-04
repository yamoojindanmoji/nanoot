'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CoBuyingCard } from '@/components/CoBuyingCard';
import { GuestLanding } from '@/components/GuestLanding';
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
  const [showGuestLanding, setShowGuestLanding] = useState(false);
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

    // 2. Resolve buildingId — only for authenticated users
    if (!currentUser) {
      // Not logged in → always show landing, never show home content
      setShowGuestLanding(true);
      setIsLoading(false);
      return;
    }

    let bId: string | null = null;

    const { data: profile } = await supabase
      .from('users')
      .select('building_id')
      .eq('id', currentUser.id)
      .single();

    bId = profile?.building_id || null;

    if (!bId) {
      // Logged-in but no building → send to building setup
      router.replace('/building/setup');
      setIsLoading(false);
      return;
    }

    setBuildingId(bId);
    // Store in localStorage for other parts of the app
    localStorage.setItem('last_browsed_building_id', bId);

    // 3. Fetch building info
    const { data: bData } = await supabase
      .from('buildings')
      .select('name')
      .eq('id', bId)
      .single();
    setBuilding(bData);

    // 4. Fetch co-buying items
    const { data: cbItems } = await supabase
      .from('co_buyings')
      .select('*, joiners(joiner_total_quantity)')
      .eq('building_id', bId)
      .order('created_at', { ascending: false });
    
    const itemsWithQuantity = (cbItems || []).map(item => {
      const hostQuantity = item.host_quantity || 0;
      const joinersQuantity = item.joiners?.reduce((sum: number, j: any) => sum + (j.joiner_total_quantity || 0), 0) || 0;
      return {
        ...item,
        current_quantity: hostQuantity + joinersQuantity
      };
    });
    
    setItems(itemsWithQuantity);
    
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
  }, [supabase]);

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


  if (showGuestLanding) {
    return <GuestLanding />;
  }
  const filteredItems = items.filter(item => {
    if (activeTab === '전체') return true;
    return item.category === activeTab;
  });

  const displayCategories = ['전체', ...CATEGORIES.map(c => c.value)];

  return (
    <div className="flex flex-col flex-1 pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold">{building?.name || '우리 건물'} 나눗</h1>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <Search size={18} />
          </button>
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
      
      {/* Banner */}
      <div className="bg-[#D2E762] py-3.5 px-4 text-center">
        <p className="text-[13px] font-bold text-black leading-tight">
          우리 건물에서 진행중인 공구 상품을 확인해보세요!
        </p>
      </div>

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
            key={cat}
            onClick={() => !hasMoved && setActiveTab(cat)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all border ${
              activeTab === cat 
                ? 'bg-[#D2E762] text-black border-[#D2E762]' 
                : 'bg-gray-100 text-gray-400 border-gray-100'
            }`}
          >
            {cat}
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
              deadline={item.deadline}
              thumbnailUrl={item.image_url || 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop'} 
            />
          ))
        )}
      </div>

    </div>
  );
}
