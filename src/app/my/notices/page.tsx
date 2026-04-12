'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function NoticesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 pb-20 bg-gray-50 min-h-[100dvh]">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">
          공지사항 / 서비스안내
        </h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-3">
            서비스 이용 방법은 준비 중이에요.
          </p>
          <p className="text-base text-gray-600">
            문의사항은 문의하기를 이용해주세요 :)
          </p>
        </div>
      </div>
    </div>
  );
}
