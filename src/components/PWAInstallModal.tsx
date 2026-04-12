'use client';

import { X, Share, MoreVertical, PlusSquare } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-6 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[340px] bg-white rounded-[32px] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <PlusSquare size={32} className="text-blue-500" />
          </div>

          <h3 className="text-[20px] font-bold text-gray-900 mb-4 leading-tight">
            홈 화면에 추가하는 방법
          </h3>
          
          <div className="space-y-4 text-left w-full bg-gray-50 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-500">1</div>
              <p className="text-gray-600 text-[14px] leading-relaxed">
  먼저 <span className="font-bold text-gray-900">사파리(Safari)</span>로 열어주세요. 그 다음 하단 가운데 공유 버튼(<Share size={14} className="inline mb-1" />)을 누릅니다.
</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-500">2</div>
              <p className="text-gray-600 text-[14px] leading-relaxed">
                메뉴에서 <span className="font-bold text-gray-900">'홈 화면에 추가'</span>를 찾아 클릭합니다.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-500">3</div>
              <p className="text-gray-600 text-[14px] leading-relaxed">
                오른쪽 상단의 <span className="font-bold text-gray-900">'추가'</span>를 누르면 완료!
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full h-14 bg-gray-900 text-white font-bold text-[16px] rounded-2xl hover:bg-gray-800 transition-colors active:scale-95 duration-200 shadow-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
