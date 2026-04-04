'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { LoginPromptModal } from '@/components/LoginPromptModal';
import { VerificationRequiredModal } from '@/components/VerificationRequiredModal';

export interface ProductOption {
  id: string;
  name: string;
  price: number;
  remain_quantity: number | null;
}

interface JoinBottomSheetClientProps {
  coBuyingId: string;
  buildingId: string;
  buildingName?: string;
  options: ProductOption[];
  totalQuantity: number;
  currentQuantity: number;
}

export function JoinBottomSheetClient({ coBuyingId, buildingId, buildingName, options, totalQuantity, currentQuantity }: JoinBottomSheetClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, [supabase]);

  const handleOpen = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // Check if building is verified for this user
    const { data: profile } = await supabase
      .from('users')
      .select('building_id')
      .eq('id', user.id)
      .single();

    if (!profile?.building_id || profile.building_id !== buildingId) {
      setIsVerifyModalOpen(true);
      return;
    }

    const initial: Record<string, number> = {};
    if (options.length > 0) {
      options.forEach(o => initial[o.id] = 0);
    } else {
      initial['default'] = 0;
    }
    setQuantities(initial);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinus = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  };

  const totalSelectedCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handlePlus = (id: string, max: number | null) => {
    // 잔여 수량 계산
    const remainingCapacity = totalQuantity - currentQuantity;
    
    if (totalSelectedCount >= remainingCapacity) {
      alert(`${remainingCapacity}개까지만 신청 가능합니다.`);
      return;
    }

    const limit = max === null ? 999 : max;
    setQuantities(prev => ({ ...prev, [id]: Math.min(limit, (prev[id] || 0) + 1) }));
  };

  const totalPay = options.length > 0
    ? options.reduce((sum, opt) => sum + ((quantities[opt.id] || 0) * opt.price), 0)
    : 0;
  const totalCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    if (totalCount === 0) {
      alert('수량을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-verify user just in case
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setIsLoginModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      // Check current available quantities
      for (const opt of options) {
        if (opt.remain_quantity !== null && quantities[opt.id] > 0) {
          const { data: latestOpt } = await supabase
            .from('product_options')
            .select('remain_quantity')
            .eq('id', opt.id)
            .single();

          if (latestOpt && latestOpt.remain_quantity !== null && latestOpt.remain_quantity < quantities[opt.id]) {
            alert('신청 가능한 수량 정보가 변경되었습니다. 다시 확인해주세요.');
            handleClose();
            window.location.reload();
            return;
          }
        }
      }

      // 1. Create a Joiner record
      const { data: joinerData, error: joinerError } = await supabase
        .from('joiners')
        .insert({
          user_id: currentUser.id,
          co_buying_id: coBuyingId,
          joiner_total_pay: totalPay,
          joiner_total_quantity: totalCount,
          pay_status: 'UNPAID'
        })
        .select()
        .single();

      if (joinerError) {
        if (joinerError.code === '23505') {
          alert('이미 참여 중인 공구입니다.');
          handleClose();
          return;
        }
        throw joinerError;
      }

      // 2. Create Joiner Product Details
      if (options.length > 0) {
        const detailsToInsert = options
          .filter(opt => quantities[opt.id] > 0)
          .map(opt => ({
            joiner_id: joinerData.id,
            product_option_id: opt.id,
            joiner_quantity: quantities[opt.id]
          }));

        if (detailsToInsert.length > 0) {
          const { error: detailsError } = await supabase
            .from('joiner_product_details')
            .insert(detailsToInsert);
          if (detailsError) throw detailsError;
        }
      }

      // 3. 목표 수량 달성 시 상태 자동 변경
      const newTotalQuantity = currentQuantity + totalCount;
      if (newTotalQuantity >= totalQuantity) {
        await supabase
          .from('co_buyings')
          .update({ status: 'PAYMENT_WAITING' })
          .eq('id', coBuyingId);
      }

      alert('참여가 완료되었습니다!');
      handleClose();
      window.location.reload();
    } catch (err: any) {
      console.error('Error joining co-buying:', err);
      alert('참여 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Detail Page Sticky Bottom Bar */}
      <div 
        style={{ bottom: 'var(--gnb-total-height)' }}
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-gray-100 p-4 flex items-center justify-between z-30 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)]"
      >
        <Button
          onClick={handleOpen}
          className="w-full h-[52px] !bg-black !text-white hover:!bg-gray-800 rounded-xl font-bold text-[16px] flex items-center justify-center transition-all shadow-md active:scale-95"
        >
          공구 신청하기
        </Button>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* Verification Required Modal */}
      <VerificationRequiredModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        buildingId={buildingId}
        buildingName={buildingName}
      />

      {/* Bottom Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={handleClose}>
          <div 
            className="w-full max-w-[440px] bg-white rounded-t-3xl pt-8 pb-8 px-6 flex flex-col relative animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-[17px] font-bold text-gray-900 mb-6">구매하려는 상품의 수량을 선택해주세요.</h2>

            <div className="flex flex-col gap-4 mb-6 max-h-[40vh] overflow-y-auto">
              {options.length > 0 ? (
                options.map((opt) => (
                  <div key={opt.id} className="flex justify-between items-center py-2">
                    <span className="font-medium text-[15px] text-gray-800 flex-1 pr-4">{opt.name}</span>
                    <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-9 w-[100px] flex-shrink-0">
                      <button 
                        onClick={() => handleMinus(opt.id)}
                        className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                        disabled={isSubmitting}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-[14px] font-bold text-gray-900">{quantities[opt.id]}</span>
                      <button 
                        onClick={() => handlePlus(opt.id, opt.remain_quantity)}
                        className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-[15px] text-gray-800 flex-1">수량을 선택해주세요.</span>
                  <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-9 w-[100px] flex-shrink-0">
                    <button 
                      onClick={() => handleMinus('default')}
                      className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                      disabled={isSubmitting}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-[14px] font-bold text-gray-900">{quantities['default'] || 0}</span>
                    <button 
                      onClick={() => handlePlus('default', null)}
                      className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                      disabled={isSubmitting}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-100">
              <span className="text-[16px] font-bold text-gray-900">총 {totalCount}개</span>
              <span className="text-[18px] font-bold text-[#84CC16]">{totalPay.toLocaleString()}원</span>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full h-[52px] !bg-[#C1EB3B] !text-gray-900 hover:!bg-[#A3CE2A] rounded-xl font-bold text-[16px] flex items-center justify-center transition-all"
              disabled={isSubmitting || totalCount === 0}
            >
              {isSubmitting ? '신청 중...' : '공구 신청하기'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

