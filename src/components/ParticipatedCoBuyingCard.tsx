'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CoBuyingTimeline } from '@/components/common/CoBuyingTimeline';

import Image from 'next/image';

export interface ParticipatedCoBuyingCardProps {
  id: string;
  title: string;
  status: 'RECRUITING' | 'PAYMENT_WAITING' | 'ORDER_IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'RECRUITING_FAILED';
  thumbnailUrl?: string;
  myQuantity: number;
  myTotalPay: number;
  remainingQuantity?: number;
  quantityLabel?: string;
}

const statusConfig: Record<string, { label: string; description: string; colorClass: string }> = {
  RECRUITING: { 
    label: '모집중', 
    description: '다른 신청자들을 모집하고 있어요. 모집 완료까지 수량이 조금 남았어요!', 
    colorClass: 'bg-[#84CC16]/10 text-[#84CC16]' 
  },
  PAYMENT_WAITING: { 
    label: '결제대기', 
    description: '입금 기한 내 입금을 완료해주세요', 
    colorClass: 'bg-yellow-100 text-yellow-700' 
  },
  ORDER_IN_PROGRESS: { 
    label: '주문진행', 
    description: '주문이 진행 중이에요', 
    colorClass: 'bg-blue-100 text-blue-700' 
  },
  READY_FOR_PICKUP: { 
    label: '픽업대기', 
    description: '물건이 도착했어요! 수령 장소를 확인하세요', 
    colorClass: 'bg-purple-100 text-purple-700' 
  },
  COMPLETED: { 
    label: '완료됨', 
    description: '공구가 완료됐어요', 
    colorClass: 'bg-gray-100 text-gray-600' 
  },
  CANCELLED: { 
    label: '취소됨', 
    description: '공구가 취소됐어요', 
    colorClass: 'bg-red-100 text-red-700' 
  },
  RECRUITING_FAILED: { 
    label: '모집실패', 
    description: '공구가 취소됐어요', 
    colorClass: 'bg-red-100 text-red-700' 
  },
};

export function ParticipatedCoBuyingCard({
  id,
  title,
  status,
  thumbnailUrl,
  myQuantity,
  myTotalPay,
  remainingQuantity,
  quantityLabel = '신청',
}: ParticipatedCoBuyingCardProps) {
  const config = statusConfig[status] || { label: status, description: '', colorClass: 'bg-gray-100 text-gray-700' };
  
  // Custom description for RECRUITING if remainingQuantity provided
  const description = (status === 'RECRUITING' && remainingQuantity !== undefined)
    ? `다른 신청자들을 모집하고 있어요. 모집 완료까지 ${remainingQuantity}개 남았어요!`
    : config.description;

  return (
    <div className="bg-white px-5 py-6 mb-2 flex flex-col group cursor-pointer border-b border-gray-100 last:border-0 relative">
      <Link href={`/my/co-buying/${id}`} className="absolute inset-0 z-0" />
      
      <div className="flex gap-4 mb-4 relative z-10 pointer-events-none">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-black/5 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={title} fill className="object-cover" sizes="80px" />
          ) : (
            <span className="text-gray-400 text-[10px] text-center">No Image</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 justify-center gap-1.5">
          <div className="flex justify-between items-center">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold w-fit ${config.colorClass}`}>
              {config.label}
            </span>
            <span className="text-[12px] font-bold text-red-500">입금마감: 오늘</span>
          </div>
          <h3 className="font-bold text-[16px] leading-snug text-gray-900 line-clamp-2">
            {title}
          </h3>
          <div className="text-[13px] text-gray-500 font-medium mt-0.5">
            {myTotalPay.toLocaleString()}원 · {myQuantity}개 {quantityLabel}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-2 mb-2 relative z-10 pointer-events-none">
        <CoBuyingTimeline status={status} />
      </div>

      {/* Status Guide Text */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4 relative z-10 pointer-events-none">
        <p className="text-[13px] leading-snug font-medium text-gray-600">
          {description}
        </p>
      </div>

      {/* Button */}
      <div className="relative z-10">
        <Link href={`/my/co-buying/${id}`} className="w-full">
           <Button className="w-full h-[52px] rounded-[16px] font-bold text-[15px] bg-[#84CC16] hover:bg-[#65A30D] text-white transition-colors">
             자세히 보기
           </Button>
        </Link>
      </div>
    </div>
  );
}
