'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';

interface DetailOption {
  id: string; // joiner_product_details.id
  optionId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ParticipatedDetailClientProps {
  initialDetails: DetailOption[];
  joinerId: string;
  coBuyingInfo: {
    id: string;
    title: string;
    status: 'RECRUITING' | 'PAYMENT_WAITING' | 'ORDER_IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'RECRUITING_FAILED';
    totalQuantity: number;
    currentQuantity: number;
    deadline: string;
    buildingId: string;
  };
}

export function ParticipatedDetailClient({ initialDetails, coBuyingInfo, joinerId }: ParticipatedDetailClientProps) {
  const [details, setDetails] = useState(initialDetails);
  const [toastMessage, setToastMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  const isRecruiting = coBuyingInfo.status === 'RECRUITING';

  const handleMinus = (id: string) => {
    if (!isRecruiting) return;
    setDetails(prev => prev.map(d => d.id === id ? { ...d, quantity: Math.max(1, d.quantity - 1) } : d));
  };

  const handlePlus = (id: string) => {
    if (!isRecruiting) return;
    setDetails(prev => prev.map(d => d.id === id ? { ...d, quantity: d.quantity + 1 } : d));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Update each changed detail
      for (const d of details) {
        await supabase
          .from('joiner_product_details')
          .update({ joiner_quantity: d.quantity })
          .eq('id', d.id);
      }
      setToastMessage('수량이 수정되었습니다.');
    } catch (error) {
       console.error(error);
       setToastMessage('수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const totalCount = details.reduce((sum, d) => sum + d.quantity, 0);
  const totalPay = details.reduce((sum, d) => sum + d.quantity * d.price, 0);

  // Check if modified
  const isModified = JSON.stringify(initialDetails) !== JSON.stringify(details);

  return (
    <>
      <div className="mt-2 bg-white p-5 border-b border-gray-100 flex-1">
        <h3 className="font-bold text-gray-900 mb-4 text-[15px]">참여 신청 상세 내역</h3>
        
        <div className="flex flex-col gap-4">
          {details.map((opt) => (
             <div key={opt.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
               <div className="flex justify-between items-start">
                 <span className="font-medium text-gray-900">{opt.name}</span>
                 <span className="font-bold">₩{opt.price.toLocaleString()}</span>
               </div>
               
               {isRecruiting ? (
                 <div className="flex justify-between items-center mt-2">
                   <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-1 rounded">수량 조절 가능</span>
                   <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9">
                     <button 
                       onClick={() => handleMinus(opt.id)}
                       className="w-9 h-full flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                     >
                       -
                     </button>
                     <span className="w-10 text-center text-sm font-semibold">{opt.quantity}</span>
                     <button 
                       onClick={() => handlePlus(opt.id)}
                       className="w-9 h-full flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                     >
                       +
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="flex justify-end mt-2">
                   <span className="text-[15px] font-medium text-gray-700">{opt.quantity}개</span>
                 </div>
               )}
             </div>
          ))}
        </div>

        <div className="mt-5 p-4 bg-gray-50 rounded-xl">
           <div className="flex justify-between items-center mb-2">
             <span className="text-sm text-gray-500">총 신청 개수</span>
             <span className="text-sm font-semibold text-gray-900">{totalCount}개</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-[15px] font-bold text-gray-900">결제 예정 금액</span>
             <span className="text-[18px] font-bold text-rose-600">₩{totalPay.toLocaleString()}</span>
           </div>
        </div>
      </div>

      {/* Dynamic CTA Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-gray-100 p-4 pb-8 z-30 flex gap-2">
        {coBuyingInfo.status === 'RECRUITING' && (
          <>
            <Button variant="outline" className="flex-1" onClick={() => window.location.href=`/${coBuyingInfo.buildingId}/co-buying/${coBuyingInfo.id}`}>
              공구 전체보기
            </Button>
            {isModified ? (
               <Button className="flex-1" onClick={handleUpdate} disabled={isUpdating || totalCount === 0}>
                 수정 완료
               </Button>
            ) : (
               <Button className="flex-1 bg-gray-300 pointer-events-none" disabled>
                 모집 중 (D-3)
               </Button>
            )}
          </>
        )}
        
        {coBuyingInfo.status === 'PAYMENT_WAITING' && (
          <Button className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500" onClick={() => alert('오픈채팅방으로 이동합니다.')}>
            입금하기 (오픈채팅)
          </Button>
        )}
        
        {coBuyingInfo.status === 'ORDER_IN_PROGRESS' && (
          <Button className="w-full bg-blue-600 hover:bg-blue-700 pointer-events-none" disabled>
            주문 진행 중
          </Button>
        )}
        
        {coBuyingInfo.status === 'READY_FOR_PICKUP' && (
          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => alert('수령 처리되었습니다.')}>
            수령 완료
          </Button>
        )}
        
        {coBuyingInfo.status === 'COMPLETED' && (
          <Button className="w-full bg-gray-300 text-gray-600 pointer-events-none" disabled>
            완료됨
          </Button>
        )}
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </>
  );
}
