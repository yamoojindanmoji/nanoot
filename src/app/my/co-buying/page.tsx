'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ParticipatedCoBuyingCard, ParticipatedCoBuyingCardProps } from '@/components/ParticipatedCoBuyingCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function MyCoBuyingPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'participated'; // 'participated' | 'hosted'

  const [user, setUser] = useState<any>(null);
  const [ongoingItems, setOngoingItems] = useState<any[]>([]);
  const [finishedItems, setFinishedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ONGOING_STATUSES = ['RECRUITING', 'PAYMENT_WAITING', 'ORDER_IN_PROGRESS', 'READY_FOR_PICKUP'];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }
      setUser(user);

      if (tab === 'participated') {
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
              deadline,
              pay_deadline,
              pickup_location,
              image_url,
              pickup_location
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && participationData) {
          const items = await Promise.all((participationData as any[]).map(async (p) => {
            const cb = p.co_buyings;
            if (!cb) return null;

            const { data: allJoiners } = await supabase
              .from('joiners')
              .select('joiner_total_quantity')
              .eq('co_buying_id', cb.id);
            
            const currentTotal = allJoiners?.reduce((sum: number, j: any) => sum + j.joiner_total_quantity, 0) || 0;
            const remaining = Math.max(0, cb.total_quantity - currentTotal);

            return {
              id: cb.id,
              title: cb.title,
              status: cb.status,
              myQuantity: p.joiner_total_quantity,
              myTotalPay: p.joiner_total_pay,
              remainingQuantity: remaining,
              quantityLabel: '신청',
              pickupLocation: cb.pickup_location || '',
              thumbnailUrl: cb.image_url || 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop',
            };
          }));

          const filteredItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
          setOngoingItems(filteredItems.filter(item => ONGOING_STATUSES.includes(item.status)));
          setFinishedItems(filteredItems.filter(item => !ONGOING_STATUSES.includes(item.status)));
        }
      } else if (tab === 'hosted') {
        const { data: hostedData, error } = await supabase
          .from('co_buyings')
          .select(`
            id,
            title,
            status,
            total_price,
            total_quantity,
            host_quantity,
            deadline,
            pay_deadline,
            image_url
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && hostedData) {
          const items = await Promise.all((hostedData as any[]).map(async (cb) => {
            const { data: allJoiners } = await supabase
              .from('joiners')
              .select('joiner_total_quantity, joiner_total_pay')
              .eq('co_buying_id', cb.id);
            
            const joinerTotalQuantity = allJoiners?.reduce((sum: number, j: any) => sum + j.joiner_total_quantity, 0) || 0;
            const joinerTotalPay = allJoiners?.reduce((sum: number, j: any) => sum + j.joiner_total_pay, 0) || 0;
            
            const hostQuantity = cb.host_quantity || 0;
            const currentTotalQuantity = joinerTotalQuantity + hostQuantity;
            const remaining = Math.max(0, cb.total_quantity - currentTotalQuantity);

            return {
              id: cb.id,
              title: cb.title,
              status: cb.status,
              myQuantity: currentTotalQuantity,
              myTotalPay: cb.total_quantity > 0 ? Math.floor(cb.total_price / cb.total_quantity) : 0,
              remainingQuantity: remaining,
              quantityLabel: '모집',
              thumbnailUrl: cb.image_url || 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop',
            };
          }));

          const filteredItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
          setOngoingItems(filteredItems.filter(item => ONGOING_STATUSES.includes(item.status)));
          setFinishedItems(filteredItems.filter(item => !ONGOING_STATUSES.includes(item.status)));
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [tab]);


  if (!user) {
    return null;
  }

  const isEmpty = ongoingItems.length === 0 && finishedItems.length === 0;

  return (
    <div className="flex flex-col flex-1 pb-20 bg-gray-50 min-h-[100dvh]">
      <header className="sticky top-0 bg-white z-20 flex flex-col items-center justify-center border-b border-gray-100">
        <h1 className="text-[17px] font-bold text-gray-900 py-4">내 공구</h1>
        <div className="flex w-full px-4 pt-1">
          <Link 
            href="/my/co-buying?tab=participated"
            className={`flex-1 text-center pb-3 border-b-[3px] font-bold text-[15px] transition-colors ${
              tab === 'participated' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            참여한 공구
          </Link>
          <Link 
            href="/my/co-buying?tab=hosted"
            className={`flex-1 text-center pb-3 border-b-[3px] font-bold text-[15px] transition-colors ${
              tab === 'hosted' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            주최한 공구
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col pt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-4 border-b border-gray-100 bg-white flex gap-4">
                <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center p-10 mt-20 text-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium whitespace-pre-wrap">
              {tab === 'participated' ? '아직 참여한 공구가 없어요' : '아직 주최한 공구가 없어요'}
            </p>
            <Link href={tab === 'participated' ? '/' : '/admin/co-buying/new'}>
              <Button className="px-8 h-12 rounded-full font-bold bg-white text-gray-700 border border-gray-200">
                {tab === 'participated' ? '진행 중인 공구 보기' : '새 공구 주최하기'}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Ongoing Section */}
            {ongoingItems.length > 0 && (
              <div className="flex flex-col pt-2">
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
                    quantityLabel={item.quantityLabel}
                    payDeadline={item.payDeadline}
                    pickupLocation={item.pickupLocation}
                    from={tab === 'participated' ? 'participated' : 'hosted'}
                  />
                ))}
              </div>
            )}

            {/* Finished Section */}
            {finishedItems.length > 0 && (
              <div className="flex flex-col mt-4">
                <div className="px-5 py-3 text-[14px] font-bold text-gray-500 bg-gray-50 border-y border-gray-100">
                  진행 완료/취소된 공구
                </div>
                <div className="pt-2">
                  {finishedItems.map((item) => (
                    <ParticipatedCoBuyingCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      status={item.status as ParticipatedCoBuyingCardProps['status']}
                      thumbnailUrl={item.thumbnailUrl}
                      myQuantity={item.myQuantity}
                      myTotalPay={item.myTotalPay}
                      quantityLabel={item.quantityLabel}
                      from={tab === 'participated' ? 'participated' : 'hosted'}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MyCoBuyingPage() {
  return (
    <Suspense fallback={null}>
      <MyCoBuyingPageContent />
    </Suspense>
  );
}
