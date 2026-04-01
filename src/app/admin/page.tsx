'use client';

// Force dynamic rendering to ensure Supabase client works correctly in build time
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCategoryEmoji } from '@/lib/categories';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type CoBuyingStatus = 'RECRUITING' | 'PAYMENT_WAITING' | 'ORDER_IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'RECRUITING_FAILED';

interface CoBuying {
  id: string;
  title: string;
  category: string;
  status: CoBuyingStatus;
  deadline: string;
  created_at: string;
  image_url?: string;
  joiners_count?: number;
}

const TABS = [
  { label: '전체', value: 'ALL' },
  { label: '모집중', value: 'RECRUITING' },
  { label: '입금대기', value: 'PAYMENT_WAITING' },
  { label: '주문중', value: 'ORDER_IN_PROGRESS' },
  { label: '수령대기', value: 'READY_FOR_PICKUP' },
  { label: '완료', value: 'COMPLETED' },
  { label: '취소', value: 'CANCELLED' },
];

const STATUS_FLOW: Record<string, CoBuyingStatus> = {
  RECRUITING: 'PAYMENT_WAITING',
  PAYMENT_WAITING: 'ORDER_IN_PROGRESS',
  ORDER_IN_PROGRESS: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'COMPLETED',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RECRUITING: { label: '모집중', color: 'bg-blue-100 text-blue-700' },
  PAYMENT_WAITING: { label: '입금대기', color: 'bg-yellow-100 text-yellow-800' },
  ORDER_IN_PROGRESS: { label: '주문중', color: 'bg-indigo-100 text-indigo-700' },
  READY_FOR_PICKUP: { label: '수령대기', color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '취소', color: 'bg-gray-100 text-gray-600' },
  RECRUITING_FAILED: { label: '모집실패', color: 'bg-red-100 text-red-600' },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [coBuyings, setCoBuyings] = useState<CoBuying[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchCoBuyings = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('co_buyings').select('*, joiners(count)');

    if (activeTab !== 'ALL') {
      query = query.eq('status', activeTab);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching co-buyings:', error);
    } else {
      interface RawCoBuying {
        id: string;
        title: string;
        category: string;
        status: CoBuyingStatus;
        deadline: string;
        created_at: string;
        image_url?: string;
        joiners: { count: number }[];
      }
      const formattedData = (data as unknown as RawCoBuying[]).map((item) => ({
        ...item,
        joiners_count: item.joiners?.[0]?.count || 0,
      }));
      setCoBuyings(formattedData);
    }
    setIsLoading(false);
  }, [activeTab, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoBuyings();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchCoBuyings]);

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;

    if (!confirm(`상태를 [${STATUS_LABELS[nextStatus].label}]으로 변경하시겠습니까?`)) return;

    const { error } = await supabase
      .from('co_buyings')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
    } else {
      fetchCoBuyings();
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 min-h-screen max-w-[440px] mx-auto shadow-xl">
      <header className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">공구 관리</h1>
        <Link href="/admin/co-buying/new">
          <Button size="sm" className="rounded-full font-bold">+ 등록</Button>
        </Link>
      </header>

      {/* Tabs */}
      <div className="bg-white flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">로딩 중...</div>
        ) : coBuyings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">공구가 없습니다.</div>
        ) : (
          coBuyings.map((cb) => (
            <div key={cb.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                    <span>{getCategoryEmoji(cb.category)}</span>
                    {cb.category}
                  </span>
                  <h3 className="text-[17px] font-bold text-gray-900 line-clamp-1">{cb.title}</h3>
                </div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold ${STATUS_LABELS[cb.status].color}`}>
                  {STATUS_LABELS[cb.status].label}
                </span>
              </div>

              <div className="flex justify-between items-center text-[13px] text-gray-500">
                <div className="flex gap-3">
                  <span>참여자 <strong className="text-gray-900">{cb.joiners_count}명</strong></span>
                  <span>마감 <strong className="text-gray-900">{new Date(cb.deadline).toLocaleDateString()}</strong></span>
                </div>
                <Link href={`/admin/co-buying/${cb.id}/edit`} className="text-blue-500 font-bold">수정</Link>
              </div>

              {STATUS_FLOW[cb.status] && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1 border-gray-200 text-gray-700 font-bold h-10"
                  onClick={() => handleStatusUpdate(cb.id, cb.status)}
                >
                  {STATUS_LABELS[STATUS_FLOW[cb.status]].label}으로 변경
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
