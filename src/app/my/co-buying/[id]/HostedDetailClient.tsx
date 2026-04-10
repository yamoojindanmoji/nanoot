'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { CoBuyingTimeline } from '@/components/common/CoBuyingTimeline';
import Image from 'next/image';
import Link from 'next/link';

interface JoinerOption {
  optionName: string;
  quantity: number;
  totalPrice: number;
}

interface Joiner {
  id: string;
  userId: string;
  name: string;
  profileImageUrl: string | null;
  totalQuantity: number;
  totalPay: number;
  payStatus: 'PAID' | 'UNPAID';
  options: JoinerOption[];
}

interface HostedDetailClientProps {
  coBuyingInfo: {
    id: string;
    title: string;
    status: 'RECRUITING' | 'PAYMENT_WAITING' | 'ORDER_IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'RECRUITING_FAILED';
    totalPrice: number;
    totalQuantity: number;
    hostQuantity: number;
    currentQuantity: number;
    remainingQuantity: number;
    deadline: string;
    thumbnailUrl: string;
    buildingId: string;
  };
  joinersList: Joiner[];
}

const statusLabel: Record<string, string> = {
  RECRUITING: '모집중',
  PAYMENT_WAITING: '입금중',
  ORDER_IN_PROGRESS: '주문진행',
  READY_FOR_PICKUP: '픽업대기',
  COMPLETED: '완료됨',
  CANCELLED: '취소됨',
  RECRUITING_FAILED: '모집실패',
};

const statusColor: Record<string, string> = {
  RECRUITING: 'bg-blue-50 text-blue-500 border border-blue-100',
  PAYMENT_WAITING: 'bg-yellow-100 text-yellow-700',
  ORDER_IN_PROGRESS: 'bg-blue-100 text-blue-700',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-500',
  RECRUITING_FAILED: 'bg-red-100 text-red-500',
};

export function HostedDetailClient({ coBuyingInfo, joinersList: initialJoinersList }: HostedDetailClientProps) {
  const [toastMessage, setToastMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  // Local pay status state for optimistic updates
  const [payStatuses, setPayStatuses] = useState<Record<string, 'PAID' | 'UNPAID'>>(
    Object.fromEntries(initialJoinersList.map(j => [j.id, j.payStatus]))
  );
  const supabase = createClient();

  const joinersList = initialJoinersList.map(j => ({ ...j, payStatus: payStatuses[j.id] ?? j.payStatus }));

  const formattedDate = new Date(coBuyingInfo.deadline).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isPaymentWaiting = coBuyingInfo.status === 'PAYMENT_WAITING';
  const paidCount = joinersList.filter(j => j.payStatus === 'PAID').length;
  const unpaidCount = joinersList.filter(j => j.payStatus === 'UNPAID').length;
  
  const totalApplicantCount = joinersList.reduce((sum, j) => sum + j.totalQuantity, 0);
  const totalApplicantPeople = joinersList.length;
  const totalApplicantPay = coBuyingInfo.totalPrice * totalApplicantCount;

  const handleCloseRecruitment = async () => {
    const confirmMessage = coBuyingInfo.remainingQuantity > 0
      ? '정말 모집을 종료하시겠어요?\n남은 수량은 주최자에게 귀속됩니다.'
      : '모집을 종료하시겠습니까? (이후 신청을 받을 수 없습니다.)';
    if (!confirm(confirmMessage)) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('co_buyings').update({ status: 'PAYMENT_WAITING' }).eq('id', coBuyingInfo.id);
      if (error) throw error;
      setToastMessage('모집이 종료되었습니다.');
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (error) {
      console.error(error);
      setToastMessage('처리 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const togglePayStatus = async (joinerId: string, current: 'PAID' | 'UNPAID') => {
    const next = current === 'PAID' ? 'UNPAID' : 'PAID';
    // Optimistic update
    setPayStatuses(prev => ({ ...prev, [joinerId]: next }));
    try {
      const { error } = await supabase.from('joiners').update({ pay_status: next }).eq('id', joinerId);
      if (error) throw error;
    } catch (error) {
      console.error(error);
      // Revert 
      setPayStatuses(prev => ({ ...prev, [joinerId]: current }));
      setToastMessage('입금 상태 변경 실패');
    }
  };

  const sendPaymentNotice = (joinerName: string) => {
    setToastMessage(`${joinerName}님에게 입금 안내를 발송했습니다.`);
  };

  const sendAllPaymentNotice = () => {
    const unpaidNames = joinersList.filter(j => j.payStatus === 'UNPAID').map(j => j.name);
    if (unpaidNames.length === 0) {
      setToastMessage('미입금자가 없습니다.');
      return;
    }
    setToastMessage(`${unpaidNames.join(', ')}님에게 입금 안내를 발송했습니다.`);
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 px-4 py-4 flex items-center justify-center border-b border-gray-100">
        <Link
          href="/my/co-buying?tab=hosted"
          className="absolute left-4 p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-[17px] font-bold text-gray-900">주최한 공구 상세</h1>
      </header>

      {/* Product Info Card */}
      <div className="bg-white px-5 py-5 flex gap-4 border-b border-gray-100">
        <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative border border-black/5">
          {coBuyingInfo.thumbnailUrl ? (
            <Image src={coBuyingInfo.thumbnailUrl} alt={coBuyingInfo.title} fill className="object-cover" sizes="72px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] text-center">No Image</div>
          )}
        </div>
        <div className="flex flex-col justify-center flex-1 gap-1.5">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold w-fit ${statusColor[coBuyingInfo.status] || 'bg-gray-100 text-gray-500'}`}>
            {statusLabel[coBuyingInfo.status] || coBuyingInfo.status}
          </span>
          <h2 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2">{coBuyingInfo.title}</h2>
          <p className="text-[13px] text-gray-400">마감: {formattedDate}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white px-5 py-5 border-b border-gray-100 mt-2">
        <h3 className="font-bold text-gray-900 mb-3 text-[15px]">공구 진행 상황</h3>
        <div className="px-1">
          <CoBuyingTimeline status={coBuyingInfo.status} />
        </div>
      </div>

      {/* Participant Section */}
      <div className="bg-white px-5 py-5 mt-2 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 text-[15px]">참여자 신청 목록</h3>

        {/* Summary Box */}
        <div className="bg-gray-50 rounded-xl px-4 py-4 mb-4">
          {isPaymentWaiting ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[14px] text-gray-500">입금 완료</span>
                <span className="text-[14px] font-bold text-emerald-600">{paidCount}명 / {joinersList.length}명</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[14px] text-gray-500">미입금</span>
                <span className="text-[14px] font-bold text-red-500">{unpaidCount}명</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-[15px] font-bold text-gray-900">총 예상 결제액</span>
                <span className="text-[16px] font-bold text-red-500">{totalApplicantPay.toLocaleString()}원</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[14px] text-gray-500">총 신청 인원</span>
                <span className="text-[14px] font-semibold text-gray-900">{totalApplicantPeople}명</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[14px] text-gray-500">총 신청 수량</span>
                <span className="text-[14px] font-semibold text-gray-900">{totalApplicantCount}개</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-[15px] font-bold text-gray-900">총 예상 결제액</span>
                <span className="text-[16px] font-bold text-red-500">{totalApplicantPay.toLocaleString()}원</span>
              </div>
            </>
          )}
        </div>

        {/* Participant Cards */}
        <div className="flex flex-col gap-1.5">
          {joinersList.length === 0 ? (
            <div className="text-[14px] text-gray-400 py-6 text-center">아직 참여자가 없습니다.</div>
          ) : (
            joinersList.map((joiner) => {
              const isPaid = joiner.payStatus === 'PAID';
              return (
                <div
                  key={joiner.id}
                  className={`border rounded-xl px-4 py-4 bg-white transition-colors ${isPaid ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200'}`}
                >
                  {/* Profile + Total */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden relative flex-shrink-0">
                        {joiner.profileImageUrl ? (
                          <Image src={joiner.profileImageUrl} alt={joiner.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-[14px]">{joiner.name}</span>
                        {isPaymentWaiting && (
                          <span className={`text-[11px] font-bold mt-0.5 ${isPaid ? 'text-emerald-600' : 'text-red-400'}`}>
                            {isPaid ? '✓ 입금완료' : '미입금'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-gray-900 text-[14px]">{joiner.totalQuantity}개</span>
                        <span className={`font-bold text-[13px] ${isPaid && isPaymentWaiting ? 'text-emerald-600' : 'text-red-500'}`}>
                          {(joiner.totalPay || 0).toLocaleString()}원
                        </span>
                      </div>
                      {/* Pay status toggle (payment_waiting only) */}
                      {isPaymentWaiting && joiner.id !== 'host' && (
                        <button
                          onClick={() => togglePayStatus(joiner.id, joiner.payStatus)}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                          }`}
                        >
                          {isPaid ? '입금완료 ✓' : '미입금으로 표시'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  {joiner.options.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1.5">
                      {joiner.options.map((opt, idx) => (
                        <div key={idx} className="flex justify-between text-[13px]">
                          <span className="text-gray-500 break-keep pr-4">{opt.optionName}</span>
                          <span className="font-semibold text-gray-700 flex-shrink-0">{opt.quantity}개</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Per-joiner notify button */}
                  {isPaymentWaiting && !isPaid && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => sendPaymentNotice(joiner.name)}
                        className="w-full text-[13px] font-bold text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
                      >
                        입금 안내 알림 보내기
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-gray-100 p-4 z-30">
        {coBuyingInfo.status === 'RECRUITING' ? (
          <Button
            className="w-full h-[52px] rounded-xl font-bold text-[16px] !bg-black hover:!bg-gray-800 !text-white border-none"
            onClick={handleCloseRecruitment}
            disabled={isUpdating}
          >
            모집종료
          </Button>
        ) : isPaymentWaiting ? (
          <Button
            className="w-full h-[52px] rounded-xl font-bold text-[16px] !bg-black hover:!bg-gray-800 !text-white border-none"
            onClick={sendAllPaymentNotice}
            disabled={unpaidCount === 0}
          >
            {unpaidCount > 0 ? `미입금자 ${unpaidCount}명에게 입금 안내 보내기` : '모두 입금 완료!'}
          </Button>
        ) : (
          <Button 
            className="w-full h-[52px] rounded-xl font-bold text-[16px] !bg-black !text-white opacity-50 border-none" 
            disabled
          >
            {statusLabel[coBuyingInfo.status] || '진행 중'}
          </Button>
        )}
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
