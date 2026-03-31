'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { CoBuyingTimeline } from '@/components/common/CoBuyingTimeline';

interface DetailOption {
  id: string; // joiner_product_details.id (or joinerId if fallback)
  optionId: string;
  name: string;
  price: number;
  quantity: number;
  maxAvailable: number;
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
    remainingQuantity: number;
  };
}

export function ParticipatedDetailClient({ initialDetails, joinerId, coBuyingInfo }: ParticipatedDetailClientProps) {
  const [toastMessage, setToastMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Edit sheet state
  const [editOpen, setEditOpen] = useState(false);
  const [editDetails, setEditDetails] = useState<DetailOption[]>(initialDetails.map(d => ({ ...d })));

  // Cancel dialog state
  const [cancelOpen, setCancelOpen] = useState(false);

  const supabase = createClient();

  const isRecruiting = coBuyingInfo.status === 'RECRUITING';

  // Read-only totals from initialDetails
  const totalCount = initialDetails.reduce((sum, d) => sum + d.quantity, 0);
  const totalPay = initialDetails.reduce((sum, d) => sum + d.quantity * d.price, 0);

  // Edit sheet totals
  const editTotalCount = editDetails.reduce((sum, d) => sum + d.quantity, 0);
  const editTotalPay = editDetails.reduce((sum, d) => sum + d.quantity * d.price, 0);

  const handleEditMinus = (id: string) => {
    setEditDetails(prev => prev.map(d => d.id === id ? { ...d, quantity: Math.max(1, d.quantity - 1) } : d));
  };

  const handleEditPlus = (id: string) => {
    setEditDetails(prev => prev.map(d => d.id === id ? { ...d, quantity: Math.min(d.maxAvailable, d.quantity + 1) } : d));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      for (const d of editDetails) {
        if (!d.optionId) continue; // skip fallback rows
        await supabase
          .from('joiner_product_details')
          .update({ joiner_quantity: d.quantity })
          .eq('id', d.id);
      }
      // Also update joiner totals
      const newTotalQty = editDetails.reduce((sum, d) => sum + d.quantity, 0);
      const newTotalPay = editDetails.reduce((sum, d) => sum + d.quantity * d.price, 0);
      await supabase
        .from('joiners')
        .update({ joiner_total_quantity: newTotalQty, joiner_total_pay: newTotalPay })
        .eq('id', joinerId);

      setToastMessage('수량이 수정되었습니다.');
      setEditOpen(false);
      setTimeout(() => { window.location.reload(); }, 800);
    } catch (error) {
      console.error(error);
      setToastMessage('수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      // Delete joiner_product_details first (FK)
      await supabase.from('joiner_product_details').delete().eq('joiner_id', joinerId);
      // Delete joiner
      const { error } = await supabase.from('joiners').delete().eq('id', joinerId);
      if (error) throw error;

      setToastMessage('신청이 취소되었습니다.');
      setCancelOpen(false);
      setTimeout(() => { window.location.href = '/my/co-buying?tab=participated'; }, 800);
    } catch (error) {
      console.error(error);
      setToastMessage('취소 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      {/* Timeline Section */}
      <div className="bg-white px-5 py-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2 text-[15px]">공구 진행 상황</h3>
        <div className="px-1">
          <CoBuyingTimeline status={coBuyingInfo.status} />
        </div>
      </div>

      {/* Order Detail — Read-only */}
      <div className="mt-2 bg-white p-5 border-b border-gray-100 flex-1">
        <h3 className="font-bold text-gray-900 mb-4 text-[15px]">참여 신청 상세 내역</h3>

        <div className="flex flex-col gap-3">
          {initialDetails.map((opt) => (
            <div key={opt.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-900 text-[14px]">{opt.name}</span>
                <span className="text-[13px] text-gray-400">개당 {Math.round(opt.price).toLocaleString()}원</span>
              </div>
              <span className="font-bold text-gray-900 text-[15px]">{opt.quantity}개</span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[14px] text-gray-500">총 신청 개수</span>
            <span className="text-[14px] font-semibold text-gray-900">{totalCount}개</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-[15px] font-bold text-gray-900">결제 예정 금액</span>
            <span className="text-[16px] font-bold text-rose-600">₩{Math.round(totalPay).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-gray-100 p-4 pb-8 z-30 flex gap-2">
        {isRecruiting ? (
          <>
            <Button
              variant="outline"
              className="flex-1 h-[52px] rounded-xl font-bold text-[15px]"
              onClick={() => { setEditDetails(initialDetails.map(d => ({ ...d }))); setEditOpen(true); }}
            >
              신청 수정하기
            </Button>
            <Button
              className="flex-1 h-[52px] rounded-xl font-bold text-[15px] !bg-gray-900 !text-white hover:!bg-gray-700"
              onClick={() => setCancelOpen(true)}
            >
              신청 취소
            </Button>
          </>
        ) : coBuyingInfo.status === 'PAYMENT_WAITING' ? (
          <Button className="w-full h-[52px] !bg-yellow-400 !text-yellow-900 hover:!bg-yellow-500 rounded-xl font-bold">
            입금하기 (오픈채팅 이동)
          </Button>
        ) : coBuyingInfo.status === 'ORDER_IN_PROGRESS' ? (
          <Button className="w-full h-[52px] rounded-xl font-bold" disabled>주문 진행 중</Button>
        ) : coBuyingInfo.status === 'READY_FOR_PICKUP' ? (
          <Button className="w-full h-[52px] !bg-purple-600 hover:!bg-purple-700 !text-white rounded-xl font-bold">수령 완료</Button>
        ) : (
          <Button className="w-full h-[52px] rounded-xl font-bold" disabled>완료됨</Button>
        )}
      </div>

      {/* ── Edit Bottom Sheet ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setEditOpen(false)}>
          <div
            className="w-full max-w-[440px] bg-white rounded-t-3xl pt-8 pb-8 px-6 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-[17px] font-bold text-gray-900 mb-6">수량을 수정해주세요</h2>

            <div className="flex flex-col gap-4 mb-6 max-h-[40vh] overflow-y-auto">
              {editDetails.map((opt) => (
                <div key={opt.id} className="flex justify-between items-center py-2">
                  <span className="font-medium text-[15px] text-gray-800 flex-1 pr-4">{opt.name}</span>
                  <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-9 w-[100px] flex-shrink-0">
                    <button
                      onClick={() => handleEditMinus(opt.id)}
                      className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                      disabled={isUpdating || opt.quantity <= 1}
                    >-</button>
                    <span className="w-8 text-center text-[14px] font-bold text-gray-900">{opt.quantity}</span>
                    <button
                      onClick={() => handleEditPlus(opt.id)}
                      className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                      disabled={isUpdating || opt.quantity >= opt.maxAvailable}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-100">
              <span className="text-[16px] font-bold text-gray-900">총 {editTotalCount}개</span>
              <span className="text-[18px] font-bold text-rose-500">{Math.round(editTotalPay).toLocaleString()}원</span>
            </div>

            <Button
              onClick={handleUpdate}
              className="w-full h-[52px] !bg-gray-900 hover:!bg-gray-700 !text-white rounded-xl font-bold text-[16px]"
              disabled={isUpdating || editTotalCount === 0}
            >
              {isUpdating ? '수정 중...' : '수정 완료'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Dialog ── */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setCancelOpen(false)}>
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2 text-center">
              <h3 className="text-[17px] font-bold text-gray-900">신청을 취소하시겠어요?</h3>
              <p className="text-[14px] text-gray-500">취소 후에는 다시 신청해야 합니다.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-[48px] rounded-xl font-bold"
                onClick={() => setCancelOpen(false)}
                disabled={isCancelling}
              >
                돌아가기
              </Button>
              <Button
                className="flex-1 h-[48px] rounded-xl font-bold !bg-red-500 hover:!bg-red-600 !text-white"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? '취소 중...' : '신청 취소'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </>
  );
}
