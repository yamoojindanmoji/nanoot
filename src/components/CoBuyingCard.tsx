import Link from 'next/link';

export interface CoBuyingCardProps {
  id: string;
  title: string;
  category: string;
  status: 'RECRUITING' | 'PAYMENT_WAITING' | 'ORDER_IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'RECRUITING_FAILED' | string;
  totalQuantity: number;
  currentQuantity: number;
  deadline: string;
  thumbnailUrl?: string;
  buildingId?: string;
  href?: string;
}

const statusMap: Record<string, { label: string; colorClass: string }> = {
  RECRUITING: { label: '모집중', colorClass: 'bg-green-100 text-green-700' },
  PAYMENT_WAITING: { label: '결제대기', colorClass: 'bg-yellow-100 text-yellow-700' },
  ORDER_IN_PROGRESS: { label: '주문진행', colorClass: 'bg-blue-100 text-blue-700' },
  READY_FOR_PICKUP: { label: '픽업대기', colorClass: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: '완료', colorClass: 'bg-gray-200 text-gray-600' },
  CANCELLED: { label: '취소됨', colorClass: 'bg-red-100 text-red-700' },
  RECRUITING_FAILED: { label: '모집실패', colorClass: 'bg-red-100 text-red-700' },
};

export function CoBuyingCard({
  id,
  title,
  category,
  status,
  totalQuantity,
  currentQuantity,
  deadline,
  thumbnailUrl,
  buildingId = '1',
  href,
}: CoBuyingCardProps) {
  const currentStatus = statusMap[status] || { label: status, colorClass: 'bg-gray-100 text-gray-700' };
  
  // Calculate D-Day
  const limitDate = new Date(deadline);
  const now = new Date();
  const diffTime = limitDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffTime < 0;

  const dDayText = isExpired ? '마감' : diffDays === 0 ? 'D-Day' : `D-${diffDays}`;
  const linkHref = href || `/${buildingId}/co-buying/${id}`;
  
  return (
    <Link href={linkHref} className="block">
      <div className="flex gap-4 p-4 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
        {/* Thumbnail */}
        <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-sm">No Image</span>
          )}
          
          {/* Status Badge Positioned on Image */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded shadow-sm text-[10px] font-bold bg-white text-gray-800">
            {dDayText}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 justify-between py-0.5">
          <div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs text-gray-500">{category || '기타'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${currentStatus.colorClass}`}>
                {currentStatus.label}
              </span>
            </div>
            <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 text-gray-900">
              {title}
            </h3>
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-blue-600 font-semibold">{currentQuantity}개 신청</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">{totalQuantity}개 목표</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
