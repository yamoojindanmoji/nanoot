'use client';

export const dynamic = 'force-dynamic';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface ProductOption {
  id: string;
  name: string;
  price: number;
  remain_quantity: number | null;
  quantity: number;
}

export default function JoinCoBuying({ params }: { params: Promise<{ buildingId: string, id: string }> }) {
  const { buildingId, id: coBuyingId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real options from Supabase
  useEffect(() => {
    async function fetchOptions() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_options')
          .select('*')
          .eq('co_buying_id', coBuyingId);

        if (error) throw error;
        
        if (data) {
          setOptions(data);
          // Initialize quantities
          const initialQtys: Record<string, number> = {};
          data.forEach(opt => {
            initialQtys[opt.id] = 0;
          });
          setQuantities(initialQtys);
        }
      } catch (err) {
        console.error('Error fetching options:', err);
        alert('옵션 정보를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOptions();
  }, [coBuyingId, supabase]);

  const handleMinus = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
  };

  const handlePlus = (id: string, max: number | null) => {
    const limit = max === null ? 999 : max;
    setQuantities(prev => ({ ...prev, [id]: Math.min(limit, prev[id] + 1) }));
  };

  const totalPay = options.reduce((sum, opt) => sum + (quantities[opt.id] * opt.price), 0);
  const totalCount = Object.values(quantities).reduce((a,b) => a+b, 0);

  const handleSubmit = async () => {
    if (totalCount === 0) {
      alert('옵션을 한 개 이상 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      // 1. Create a Joiner record
      const { data: joinerData, error: joinerError } = await supabase
        .from('joiners')
        .insert({
          user_id: user.id,
          co_buying_id: coBuyingId,
          joiner_total_pay: totalPay,
          joiner_total_quantity: totalCount,
          pay_status: 'UNPAID'
        })
        .select()
        .single();

      if (joinerError) throw joinerError;

      // 2. Create Joiner Product Details
      const detailsToInsert = options
        .filter(opt => quantities[opt.id] > 0)
        .map(opt => ({
          joiner_id: joinerData.id,
          product_option_id: opt.id,
          joiner_quantity: quantities[opt.id]
        }));

      const { error: detailsError } = await supabase
        .from('joiner_product_details')
        .insert(detailsToInsert);

      if (detailsError) throw detailsError;

      alert('참여가 완료되었습니다!');
      router.push(`/${buildingId}/co-buying/${coBuyingId}`);
    } catch (err: unknown) {
      console.error('Error joining co-buying:', err);
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === '23505') {
        alert('이미 참여 중인 공구입니다.');
      } else {
        alert('참여 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen bg-white">
      {/* Header */}
      <header className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold flex-1">수량 선택</h1>
      </header>

      <div className="p-5 flex-1 overflow-y-auto">
        <h2 className="font-bold text-gray-900 mb-4">옵션을 선택해주세요.</h2>
        
        <div className="flex flex-col gap-4">
          {options.map((opt) => (
            <div key={opt.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-900">{opt.name}</span>
                <span className="font-bold">₩{opt.price.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded">
                  잔여 {opt.remain_quantity !== null ? `${opt.remain_quantity}개` : '무제한'}
                </span>
                
                {/* Counter */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9">
                  <button 
                    onClick={() => handleMinus(opt.id)}
                    className="w-9 h-full flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantities[opt.id]}</span>
                  <button 
                    onClick={() => handlePlus(opt.id, opt.remain_quantity)}
                    className="w-9 h-full flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
          {options.length === 0 && (
            <p className="text-center text-gray-500 py-10">등록된 옵션이 없습니다.</p>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="mt-auto border-t border-gray-100 p-5 pb-8 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-500 mb-0.5">총 결제예정금액</div>
          <div className="text-2xl font-bold text-gray-900">₩{totalPay.toLocaleString()}</div>
        </div>
        <Button onClick={handleSubmit} size="lg" className="w-32 rounded-xl" disabled={totalCount === 0 || isSubmitting}>
          {isSubmitting ? '신청 중...' : '신청하기'}
        </Button>
      </div>
    </div>
  );
}
