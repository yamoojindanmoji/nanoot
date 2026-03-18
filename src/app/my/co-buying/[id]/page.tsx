export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ParticipatedDetailClient } from './ParticipatedDetailClient';
import Image from 'next/image';

export default async function ParticipatedDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch cobuying info and joiner details
  const { data: detailData, error: detailError } = await supabase
    .from('co_buyings')
    .select(`
      *,
      creator:creator_id (name, nickname),
      joiners!inner (
        id,
        user_id,
        joiner_product_details (
          id,
          joiner_quantity,
          product_options (
            id,
            name,
            price
          )
        )
      )
    `)
    .eq('id', id)
    .eq('joiners.user_id', user.id)
    .single();

  if (detailError || !detailData) {
    console.error('Fetch error:', detailError);
    notFound();
  }

  const joiner = detailData.joiners[0];
  const joinerDetails = joiner.joiner_product_details;

  // Fetch all joiner counts for this cobuying to calculate remaining quantity
  const { data: allJoiners } = await supabase
    .from('joiners')
    .select('joiner_total_quantity')
    .eq('co_buying_id', id);
  
  const currentTotalQuantity = allJoiners?.reduce((sum, j) => sum + j.joiner_total_quantity, 0) || 0;
  const remainingQuantity = Math.max(0, detailData.total_quantity - currentTotalQuantity);

  interface JoinerDetail {
    id: string;
    joiner_quantity: number;
    product_options: {
      id: string;
      name: string;
      price: number;
      remain_quantity?: number;
    };
  }

  // Format the data for the client component
  const initialDetails = (joinerDetails as unknown as JoinerDetail[]).map((detail) => ({
    id: detail.id,
    optionId: detail.product_options.id,
    name: detail.product_options.name,
    price: detail.product_options.price,
    quantity: detail.joiner_quantity,
    maxAvailable: detail.joiner_quantity + (detail.product_options.remain_quantity ?? remainingQuantity), 
  }));

  const coBuyingInfo = {
    id: detailData.id,
    title: detailData.title,
    status: detailData.status as 'RECRUITING' | 'PAYMENT_WAITING' | 'ORDER_IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'RECRUITING_FAILED',
    totalQuantity: detailData.total_quantity,
    currentQuantity: currentTotalQuantity,
    remainingQuantity: remainingQuantity,
    deadline: detailData.deadline,
    category: detailData.category,
    thumbnailUrl: 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop',
    buildingId: detailData.building_id
  };

  return (
    <div className="flex flex-col flex-1 pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
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

      {/* Participated Co-Buying Summary */}
      <div className="bg-white p-5 flex gap-4 border-b border-gray-100">
        <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
           <Image src={coBuyingInfo.thumbnailUrl} alt={coBuyingInfo.title} width={80} height={80} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm w-fit mb-1">
             {coBuyingInfo.status === 'RECRUITING' ? '모집중' : 
              coBuyingInfo.status === 'PAYMENT_WAITING' ? '결제대기' : 
              coBuyingInfo.status === 'ORDER_IN_PROGRESS' ? '주문진행' : 
              coBuyingInfo.status === 'READY_FOR_PICKUP' ? '픽업대기' : '완료됨'}
          </span>
          <h2 className="font-semibold text-gray-900 leading-snug line-clamp-2">
            {coBuyingInfo.title}
          </h2>
        </div>
      </div>

      {/* Client Component for Interactive Details */}
      <ParticipatedDetailClient 
        initialDetails={initialDetails} 
        coBuyingInfo={coBuyingInfo} 
        joinerId={joiner.id}
      />
    </div>
  );
}
