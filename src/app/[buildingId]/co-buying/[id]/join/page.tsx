'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

// Dummy options
const options = [
  { id: 'opt1', name: '참외 3kg (10과 내외)', price: 20000, max: 5 },
  { id: 'opt2', name: '참외 5kg (15과 내외)', price: 32000, max: 2 },
];

export default function JoinCoBuying({ params }: { params: Promise<{ buildingId: string, id: string }> }) {
  const { buildingId, id: coBuyingId } = use(params);
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({
    opt1: 0,
    opt2: 0,
  });

  const handleMinus = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
  };

  const handlePlus = (id: string, max: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.min(max, prev[id] + 1) }));
  };

  const totalPay = options.reduce((sum, opt) => sum + (quantities[opt.id] * opt.price), 0);
  const totalCount = Object.values(quantities).reduce((a,b) => a+b, 0);

  const handleSubmit = () => {
    // 실제 DB 연동 구문 (users 확인 후 joiners, joiner_product_details insert)
    if (totalCount === 0) {
      alert('옵션을 한 개 이상 선택해주세요.');
      return;
    }

    alert('참여가 완료되었습니다!');
    router.push(`/${buildingId}/co-buying/${coBuyingId}`);
  };

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
                <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded">잔여 {opt.max}개</span>
                
                {/* Counter */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9">
                  <button 
                    onClick={() => handleMinus(opt.id)}
                    className="w-9 h-full flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantities[opt.id]}</span>
                  <button 
                    onClick={() => handlePlus(opt.id, opt.max)}
                    className="w-9 h-full flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="mt-auto border-t border-gray-100 p-5 pb-8 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-500 mb-0.5">총 결제예정금액</div>
          <div className="text-2xl font-bold text-gray-900">₩{totalPay.toLocaleString()}</div>
        </div>
        <Button onClick={handleSubmit} size="lg" className="w-32 rounded-xl" disabled={totalCount === 0}>
          신청하기
        </Button>
      </div>
    </div>
  );
}
