'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const STATUS_OPTIONS = [
  { value: 'RECRUITING', label: '모집중' },
  { value: 'PAYMENT_WAITING', label: '결제대기' },
  { value: 'ORDER_IN_PROGRESS', label: '주문진행' },
  { value: 'READY_FOR_PICKUP', label: '픽업대기' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소됨' },
  { value: 'RECRUITING_FAILED', label: '모집실패' },
];

const statusColors: Record<string, string> = {
  RECRUITING: 'bg-green-100 text-green-700',
  PAYMENT_WAITING: 'bg-yellow-100 text-yellow-700',
  ORDER_IN_PROGRESS: 'bg-blue-100 text-blue-700',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-gray-200 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
  RECRUITING_FAILED: 'bg-red-100 text-red-700',
};

export default function AdminClient({ coBuyings: initial }: { coBuyings: any[] }) {
  const [coBuyings, setCoBuyings] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);

    const { error } = await supabase
      .from('co_buyings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setCoBuyings(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
      );
    } else {
      alert('상태 변경 중 오류가 발생했습니다.');
    }

    setLoadingId(null);
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold">어드민</h1>
        <span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">ADMIN</span>
      </header>

      <div className="p-4 flex flex-col gap-3">
        <div className="text-xs text-gray-500 font-medium px-1">전체 공구 {coBuyings.length}건</div>

        {coBuyings.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 mr-2">
                <div className="text-[11px] text-gray-400 mb-0.5">{item.buildings?.name || '건물 미지정'}</div>
                <div className="font-semibold text-gray-900 text-[15px] leading-snug">{item.title}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${statusColors[item.status] || 'bg-gray-100 text-gray-500'}`}>
                {STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
              </span>
            </div>

            <div className="text-xs text-gray-400 mb-3">
              마감: {new Date(item.deadline).toLocaleDateString()} · 목표 {item.total_quantity}개
            </div>

            {/* 상태 변경 버튼 */}
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  disabled={item.status === opt.value || loadingId === item.id}
                  onClick={() => handleStatusChange(item.id, opt.value)}
                  className={`text-[11px] px-3 py-1 rounded-lg border transition-all disabled:opacity-40 ${
                    item.status === opt.value
                      ? 'border-gray-900 bg-gray-900 text-white font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {coBuyings.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            등록된 공구가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
