'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CoBuyingCard } from '@/components/CoBuyingCard';
import { GuestLanding } from '@/components/GuestLanding';
import { CATEGORIES } from '@/lib/categories';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);
  const [showGuestLanding, setShowGuestLanding] = useState(false);

  // Drag interaction for PC
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    // 1. Get current session
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    // 2. Resolve buildingId (from cookie or user profile)
    let bId: string | null = null;
    
    // Check cookies first
    const cookies = document.cookie.split('; ');
    const guestBuildingCookie = cookies.find(row => row.startsWith('guest_building_id='));
    const guestBuildingId = guestBuildingCookie ? guestBuildingCookie.split('=')[1] : null;

    if (currentUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('building_id')
        .eq('id', currentUser.id)
        .single();
      
      bId = profile?.building_id || guestBuildingId || null;
    } else {
      bId = guestBuildingId || null;
    }

    if (!bId) {
      setShowGuestLanding(true);
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
      .select('*')
      .eq('building_id', bId)
      .order('created_at', { ascending: false });
    
    setItems(cbItems || []);
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

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

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
        <button className="w-8 h-8 flex items-center justify-center text-gray-600 bg-gray-100 rounded-full">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
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
        {filteredItems.length === 0 ? (
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
