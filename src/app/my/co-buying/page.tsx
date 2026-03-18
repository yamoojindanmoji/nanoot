export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/BottomNav';
import { ParticipatedCoBuyingCard, ParticipatedCoBuyingCardProps } from '@/components/ParticipatedCoBuyingCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default async function MyCoBuyingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 1. Fetch user's participation data
  // The user request used 'joiner' and 'co_buying', but schema uses plural.
  const { data: participationData, error } = await supabase
    .from('joiners')
    .select(`
      id,
      joiner_total_pay,
      joiner_total_quantity,
      co_buyings (
        id,
        title,
        status,
        total_price,
        total_quantity,
        deadline
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching participations:', error);
  }

  interface Participation {
    id: string;
    joiner_total_pay: number;
    joiner_total_quantity: number;
    co_buyings: {
      id: string;
      title: string;
      status: string;
      total_price: number;
      total_quantity: number;
      deadline: string;
    } | null;
  }

  const items = await Promise.all((participationData as unknown as Participation[] || []).map(async (p) => {
    const cb = p.co_buyings;
    if (!cb) return null;

    // Aggregate total count for remaining quantity logic
    const { data: allJoiners } = await supabase
      .from('joiners')
      .select('joiner_total_quantity')
      .eq('co_buying_id', cb.id);
    
    const currentTotal = allJoiners?.reduce((sum, j) => sum + j.joiner_total_quantity, 0) || 0;
    const remaining = Math.max(0, cb.total_quantity - currentTotal);

    return {
      participationId: p.id,
      id: cb.id,
      title: cb.title,
      status: cb.status,
      myQuantity: p.joiner_total_quantity,
      myTotalPay: p.joiner_total_pay,
      remainingQuantity: remaining,
      // Using dummy image as schema doesn't have image_url yet
      thumbnailUrl: 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop',
    };
  }));

  interface FormattedItem {
    participationId: string;
    id: string;
    title: string;
    status: string;
    myQuantity: number;
    myTotalPay: number;
    remainingQuantity: number;
    thumbnailUrl: string;
  }

  const filteredItems = items.filter((item): item is FormattedItem => item !== null);

  // Grouping logic
  const ONGOING_STATUSES = ['RECRUITING', 'PAYMENT_WAITING', 'ORDER_IN_PROGRESS', 'READY_FOR_PICKUP'];
  const ongoingItems = filteredItems.filter(item => ONGOING_STATUSES.includes(item.status));
  const finishedItems = filteredItems.filter(item => !ONGOING_STATUSES.includes(item.status));

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col flex-1 pb-20 bg-gray-50 min-h-screen">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center justify-center border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">참여한 공구 목록</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium whitespace-pre-wrap">아직 참여한 공구가 없어요</p>
          <Link href="/">
            <Button className="px-8 h-12 rounded-full font-bold">홈으로 가기</Button>
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-20 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">참여한 공구 목록</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Ongoing Section */}
        {ongoingItems.length > 0 && (
          <div className="flex flex-col">
            {ongoingItems.map((item) => (
              <ParticipatedCoBuyingCard
                key={item.id}
                id={item.id}
                title={item.title}
                status={item.status as ParticipatedCoBuyingCardProps['status']}
                thumbnailUrl={item.thumbnailUrl}
                myQuantity={item.myQuantity}
                myTotalPay={item.myTotalPay}
                remainingQuantity={item.remainingQuantity}
              />
            ))}
          </div>
        )}

        {/* Finished Section */}
        {finishedItems.length > 0 && (
          <div className="flex flex-col mt-2">
            <div className="px-5 py-3 text-[14px] font-bold text-gray-500 bg-gray-50">
              진행 완료/취소된 공구
            </div>
            {finishedItems.map((item) => (
              <ParticipatedCoBuyingCard
                key={item.id}
                id={item.id}
                title={item.title}
                status={item.status as ParticipatedCoBuyingCardProps['status']}
                thumbnailUrl={item.thumbnailUrl}
                myQuantity={item.myQuantity}
                myTotalPay={item.myTotalPay}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
