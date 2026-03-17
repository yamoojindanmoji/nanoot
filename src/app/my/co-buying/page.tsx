import { createClient } from '@/lib/supabase/server';
import { CoBuyingCard } from '@/components/CoBuyingCard';
import { BottomNav } from '@/components/BottomNav';

export default async function MyCoBuyingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // Middlewares handle redirect
  }

  // Get user's participated co-buyings
  const { data: joinerData } = await supabase
    .from('joiners')
    .select(`
      id,
      co_buyings (
        id,
        title,
        category,
        status,
        total_quantity,
        deadline,
        building_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Map data to expected shape for CoBuyingCard
  const participatedItems = joinerData?.map(j => j.co_buyings).filter(Boolean) || [];

  return (
    <div className="flex flex-col flex-1 pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">참여한 공구 목록</h1>
      </header>

      {/* List */}
      <div className="flex-1 bg-white">
        {participatedItems.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            참여한 공구가 없습니다.
          </div>
        ) : (
          participatedItems.map((item: any) => (
            <CoBuyingCard
              key={item.id}
              id={item.id}
              buildingId={item.building_id || '1'}
              href={`/my/co-buying/${item.id}`} // go to detailed participated page
              title={item.title}
              category={item.category}
              status={item.status}
              totalQuantity={item.total_quantity}
              currentQuantity={0} // TODO: DB에서 현재 수량 집계 조회 또는 joiner data에서 가져오기
              deadline={item.deadline}
              thumbnailUrl={'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop'} // 더미
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
