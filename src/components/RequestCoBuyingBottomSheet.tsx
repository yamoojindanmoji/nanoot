'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';

interface RequestCoBuyingBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestCoBuyingBottomSheet({ isOpen, onClose }: RequestCoBuyingBottomSheetProps) {
  const [productName, setProductName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 바텀시트가 열릴 때 입력창 최상단으로 포커스 및 키패드 유도
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      setProductName('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!productName.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: 실제 서버 저장 로직이 필요하다면 여기에 추가 (현재는 기획상 알림 후 종료)
      console.log('공구 신청 상품:', productName);
      
      // 딜레이를 주어 로딩 스피너 확인 가능하게 함 (규칙 준수)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      alert('신청이 완료되었습니다! 나눗팀이 확인 후 연락드릴게요.');
      onClose();
    } catch (error) {
      console.error('Error submitting co-buying request:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[440px] bg-white rounded-t-[32px] pt-10 pb-8 px-6 flex flex-col relative animate-in slide-in-from-bottom duration-300 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar for visual cue */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-8">
          <h2 className="text-[20px] font-bold text-gray-900 leading-tight mb-2">
            나눗팀에게 공구하고 싶은<br />상품을 알려주세요!
          </h2>
          <p className="text-[14px] text-gray-500 font-medium">
            신청해주신 상품은 검토 후 공동구매로 오픈됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <Input
            ref={inputRef}
            placeholder="예) 닭가슴살 20팩, 휴지 30롤, 청소용품"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="!h-14 !text-[16px] !rounded-2xl !bg-gray-50 !border-gray-100 focus:!bg-white focus:!border-gray-900 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
          <span className="text-[12px] text-gray-400 px-1">
            원하시는 정확한 상품명과 수량을 적어주시면 더 빨라요!
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-14 !bg-[#84CC16] !text-white hover:!bg-[#75b513] rounded-2xl font-bold text-[17px] flex items-center justify-center transition-all shadow-lg active:scale-[0.98] disabled:!bg-gray-200 disabled:!text-gray-400"
          disabled={isSubmitting || !productName.trim()}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>신청 중...</span>
            </div>
          ) : (
            '신청하기'
          )}
        </Button>
      </div>
    </div>
  );
}
