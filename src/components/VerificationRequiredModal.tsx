'use client';

import { Button } from '@/components/ui/Button';
import { X, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  buildingName?: string;
}

export function VerificationRequiredModal({ 
  isOpen, 
  onClose, 
  buildingId,
  buildingName = '이 건물'
}: VerificationRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleVerify = () => {
    router.push(`/building/verify?id=${buildingId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[340px] bg-white rounded-[24px] p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={32} className="text-[#22C55E]" />
          </div>

          <h3 className="text-[19px] font-bold text-gray-900 mb-2 leading-tight">
            건물 인증이 필요해요
          </h3>
          
          <p className="text-gray-500 text-[14px] leading-relaxed mb-8 px-2">
            <strong>{buildingName}</strong> 이웃들과 <br />
            공구에 참여하시려면 거주 인증이 필수입니다. <br />
          </p>

          <div className="flex flex-col gap-2 w-full">
            <Button 
              onClick={handleVerify}
              className="w-full h-14 bg-[#C1EB3B] text-gray-900 hover:bg-[#A3CE2A] border-none font-bold text-[15px] rounded-xl flex items-center justify-center"
            >
              인증하러 가기
            </Button>
            
            <button 
              onClick={onClose}
              className="w-full h-10 text-[13px] text-gray-400 font-medium hover:text-gray-600 transition-colors"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
