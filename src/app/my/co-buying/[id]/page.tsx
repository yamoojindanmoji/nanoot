'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ParticipatedDetailClient } from './ParticipatedDetailClient';
import { HostedDetailClient } from './HostedDetailClient';
import Image from 'next/image';
import { getCategoryEmoji } from '@/lib/categories';

function DetailPageContent({ params: paramsPromise, searchParams: searchParamsPromise }: { params: Promise<{ id: string }>, searchParams: Promise<{ from?: string }> }) {
  const params = use(paramsPromise);
  const searchParams = use(searchParamsPromise);
  const id = params.id;
  const from = searchParams.from;

  const [user, setUser] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [allJoiners, setAllJoiners] = useState<any[]>([]);
  const [userJoiner, setUserJoiner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setUser(currentUser);

      const { data: cb, error: cbError } = await supabase
        .from('co_buyings')
        .select('*')
        .eq('id', id)
        .single();

      if (cbError || !cb) {
        setIsLoading(false);
        return;
      }
      setDetailData(cb);

      const { data: joiners } = await supabase
        .from('joiners')
        .select(`
          id,
          joiner_total_quantity,
          joiner_total_pay,
          pay_status,
          user_id,
          users (
            name,
            nickname,
            profile_image_url
          ),
          joiner_product_details (
            joiner_quantity,
            product_options (
              name,
              price
            )
          )
        `)
        .eq('co_buying_id', id);
      
      setAllJoiners(joiners || []);

      const { data: uJoiner } = await supabase
        .from('joiners')
        .select(`
          id,
          user_id,
          joiner_total_quantity,
          joiner_total_pay,
          joiner_product_details (
            id,
            joiner_quantity,
            product_options (
              id,
              name,
              price,
              remain_quantity
            )
          )
        `)
        .eq('co_buying_id', id)
        .eq('user_id', currentUser.id)
        .single();
      
      setUserJoiner(uJoiner);
      setIsLoading(false);
    };

    fetchData();
  }, [id, supabase]);

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

  if (!user || !detailData) {
    return <div className="p-6 text-center text-gray-500">데이터를 찾을 수 없습니다.</div>;
  }

  const isCreator = detailData.creator_id === user.id && from !== 'participated';
  const currentTotalQuantity = allJoiners.reduce((sum, j) => sum + j.joiner_total_quantity, 0);
  const remainingQuantity = Math.max(0, detailData.total_quantity - currentTotalQuantity);

  const coBuyingInfo = {
    id: detailData.id,
    title: detailData.title,
    status: detailData.status,
    totalPrice: detailData.total_price || 0,
    totalQuantity: detailData.total_quantity,
    currentQuantity: currentTotalQuantity,
    remainingQuantity: remainingQuantity,
    deadline: detailData.deadline,
    category: detailData.category,
    thumbnailUrl: detailData.image_url || 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop',
    buildingId: detailData.building_id
  };

  if (isCreator) {
    const basePricePerItem = detailData.total_price ? (detailData.total_price / detailData.total_quantity) : 0;
    const joinersList = allJoiners.map((j: any) => {
      const userObj = Array.isArray(j.users) ? j.users[0] : j.users;
      const opts = (j.joiner_product_details || []).map((detail: any) => {
        const optPrice = detail.product_options?.price ?? basePricePerItem;
        return {
          optionName: detail.product_options?.name || '기본 상품',
          quantity: detail.joiner_quantity,
          totalPrice: Math.round(detail.joiner_quantity * optPrice)
        };
      });

      return {
        id: j.id,
        userId: j.user_id,
        name: userObj?.nickname || userObj?.name || '알 수 없음',
        profileImageUrl: userObj?.profile_image_url || null,
        totalQuantity: j.joiner_total_quantity,
        totalPay: j.joiner_total_pay || (opts.reduce((sum: number, opt: any) => sum + opt.totalPrice, 0)),
        payStatus: (j.pay_status || 'UNPAID') as 'PAID' | 'UNPAID',
        options: opts,
      };
    });

    return (
      <div className="flex flex-col flex-1 bg-gray-50 min-h-screen relative">
        <HostedDetailClient coBuyingInfo={coBuyingInfo as any} joinersList={joinersList} />
      </div>
    );
  }

  // Participated View
  if (!userJoiner) {
    return <div className="p-6 text-center text-gray-500">참여 내역을 찾을 수 없습니다.</div>;
  }

  const joinerDetails = (userJoiner as any).joiner_product_details as any[];
  const basePricePerItem = detailData.total_price ? (detailData.total_price / detailData.total_quantity) : 0;

  const initialDetails = joinerDetails && joinerDetails.length > 0
    ? joinerDetails.map((detail: any) => ({
        id: detail.id,
        optionId: detail.product_options?.id ?? '',
        name: detail.product_options?.name ?? '기본 상품',
        price: detail.product_options?.price ?? basePricePerItem,
        quantity: detail.joiner_quantity,
        maxAvailable: detail.joiner_quantity + (detail.product_options?.remain_quantity ?? remainingQuantity),
      }))
    : [{
        id: userJoiner.id,
        optionId: '',
        name: '기본 상품',
        price: basePricePerItem,
        quantity: userJoiner.joiner_total_quantity,
        maxAvailable: userJoiner.joiner_total_quantity + remainingQuantity,
      }];

  return (
    <div className="flex flex-col flex-1 pb-24 bg-gray-50 min-h-screen relative">
      <header className="sticky top-0 bg-white z-10 px-4 py-4 flex items-center justify-center border-b border-gray-100">
        <Link 
          href="/my/co-buying"
          className="absolute left-4 p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">참여한 공구 상세</h1>
      </header>

      <div className="bg-white p-5 flex gap-4 border-b border-gray-100">
        <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
           <Image src={coBuyingInfo.thumbnailUrl} alt={coBuyingInfo.title} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[11px] font-bold text-[#84CC16] bg-[#84CC16]/10 px-2 py-0.5 rounded flex items-center gap-1">
              <span>{getCategoryEmoji(coBuyingInfo.category)}</span>
              {coBuyingInfo.category}
            </span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
               {coBuyingInfo.status === 'RECRUITING' ? '모집중' : 
                coBuyingInfo.status === 'PAYMENT_WAITING' ? '결제대기' : 
                coBuyingInfo.status === 'ORDER_IN_PROGRESS' ? '주문진행' : 
                coBuyingInfo.status === 'READY_FOR_PICKUP' ? '픽업대기' : '완료됨'}
            </span>
          </div>
          <h2 className="font-semibold text-gray-900 leading-snug line-clamp-2">
            {coBuyingInfo.title}
          </h2>
        </div>
      </div>

      <ParticipatedDetailClient 
        initialDetails={initialDetails} 
        coBuyingInfo={coBuyingInfo as any} 
        joinerId={userJoiner.id}
      />
    </div>
  );
}

export default function DetailPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ from?: string }> }) {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <DetailPageContent {...props} />
    </Suspense>
  );
}
