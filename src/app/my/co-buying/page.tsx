import { createClient } from '@/lib/supabase/server';
import { CoBuyingCard } from '@/components/CoBuyingCard';

const statusOrder = ['RECRUITING', 'PAYMENT_WAITING', 'ORDER_IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'];

const statusKoMap: Record<string, { label: string; color: string }> = {
  RECRUITING: { label: '모집중', color: 'bg-green-100 text-green-700' },
  PAYMENT_WAITING: { label: '결제대기', color: 'bg-yellow-100 text-yellow-700' },
  ORDER_IN_PROGRESS: { label: '주문중', color: 'bg-blue-100 text-blue-700' },
  READY_FOR_PICKUP: { label: '픽업대기', color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: '완료', color: 'bg-gray-200 text-gray-500' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-500' },
};

export default async function MyCoBuyingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
        로그인이 필요합니다.
      </div>
    );
  }

  // 내가 참여한 공구 목록 (joiners → co_buyings)
  const { data: joiners } = await supabase
    .from('joiners')
    .select(`
      id,
      joiner_total_pay,
      joiner_total_quantity,
      pay_status,
      co_buying:co_buying_id (
        id, title, category, status, total_quantity, deadline, building_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const coBuyings = (joiners || []).map(j => j.co_buying).filter(Boolean);

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-5 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold">내 공구</h1>
      </header>

      {coBuyings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-400">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <div className="text-center">
            <p className="font-medium text-gray-500 mb-1">참여한 공구가 없어요</p>
            <p className="text-sm">홈에서 이웃의 공동구매에 참여해보세요!</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white">
          {coBuyings.map((item: any) => (
            <CoBuyingCard
              key={item.id}
              id={item.id}
              buildingId={item.building_id}
              title={item.title}
              category={item.category}
              status={item.status}
              totalQuantity={item.total_quantity}
              currentQuantity={0}
              deadline={item.deadline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
