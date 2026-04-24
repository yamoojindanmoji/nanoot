'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    title: (
      <>
        <span className="font-bold text-black">나눗</span>에서 <span className="text-blue-500 font-bold">같은 건물 이웃과 나눠사고</span><br />
        공간과 생활비를 절약해요!
      </>
    ),
    subtitle: (
      <>
        <span className="text-lime-500 text-[13px] font-medium tracking-tight">"대용량으로 사면 저렴하지만 보관이 애매해요"</span><br />
        <span className="text-gray-400 text-xs text-center block mt-1 tracking-tight">1인가구 86.9% 공간 부족 경험</span>
      </>
    ),
    image: '/images/onboarding/slide_001.svg',
  },
  {
    id: 2,
    title: (
      <>
        <span className="text-gray-400 text-[15px] block mb-2 font-medium tracking-tight">우리 건물에서 진행중인</span>
        <span className="text-xl">공구 상품을 <span className="font-bold text-black">쉽게 확인하세요!</span></span>
      </>
    ),
    subtitle: null,
    image: '/images/onboarding/slide_002.svg',
  },
  {
    id: 3,
    title: (
      <>
        <span className="text-gray-400 text-[15px] block mb-2 font-medium tracking-tight">참여한 공구를 놓치지 않도록</span>
        <span className="text-xl">공구 상태를 <span className="font-bold text-black">한눈에 보여드려요!</span></span>
      </>
    ),
    subtitle: null,
    image: '/images/onboarding/slide_003.svg',
  },
  {
    id: 4,
    title: (
      <>
        <span className="text-gray-400 text-[15px] block mb-2 font-medium tracking-tight">공구 진행 상태를 알림으로 받아보려면?</span>
        <span className="text-xl"><span className="font-bold text-black">'나눗'</span>을 홈화면에 추가해보세요</span>
      </>
    ),
    subtitle: null,
    image: '/images/onboarding/slide_004.svg',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const router = useRouter();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const isLastSlide = selectedIndex === slides.length - 1;

  const handleComplete = () => {
    onComplete();
    router.push('/building/setup');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col pt-[max(env(safe-area-inset-top),48px)] pb-[max(env(safe-area-inset-bottom),32px)]">
      {/* Header (Logo) */}
      <div className="flex justify-center items-center h-14 mb-2 flex-shrink-0">
        <div className="font-black text-3xl tracking-tighter">
          nan<span className="text-[#B9F115]">o</span><span className="text-[#3E73FB]">o</span>t
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-hidden relative" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {slides.map((slide) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0 flex flex-col items-center px-6">
              
              <div className="text-center mb-8 w-full flex-shrink-0">
                <h2 className="text-[22px] leading-[1.3] text-gray-800 tracking-tight">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <div className="mt-4">
                    {slide.subtitle}
                  </div>
                )}
              </div>

              {/* Image Container */}
              <div className="flex-1 w-full max-w-[340px] relative flex flex-col items-center justify-center bg-gray-50 rounded-[32px] overflow-hidden mb-4 border border-gray-100 shadow-sm">
                <Image
                  src={slide.image}
                  alt={`Slide ${slide.id}`}
                  fill
                  sizes="340px"
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.classList.add('bg-[#f4fce3]');
                      parent.innerHTML = `
                        <div class="text-[#84cc16] font-semibold p-4 text-center">
                          이미지를 여기에 추가해주세요!<br/>
                          <span class="text-xs font-normal text-gray-500 block mt-2">
                            public/images/onboarding/slide_00${slide.id}.svg
                          </span>
                        </div>
                      `;
                    }
                  }}
                />
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Controls & Pagination */}
      <div className="px-6 flex flex-col items-center flex-shrink-0 mt-4 h-[100px] justify-between">
        {/* Pagination Dots */}
        <div className="flex gap-2 mb-6">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === selectedIndex ? 'bg-[#A3E635]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="w-full flex gap-3 h-[52px]">
          {!isLastSlide ? (
            <>
              <button
                onClick={handleComplete}
                className="w-[100px] bg-gray-100 text-gray-500 font-semibold rounded-xl text-[16px] active:bg-gray-200 transition-colors"
              >
                스킵
              </button>
              <button
                onClick={scrollNext}
                className="flex-1 bg-[#B9F115] text-black font-bold rounded-xl text-[16px] hover:bg-[#A3E635] active:bg-[#84cc16] transition-colors"
              >
                계속하기
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleComplete}
                className="w-[100px] bg-gray-100 text-gray-500 font-semibold rounded-xl text-[16px] active:bg-gray-200 transition-colors"
              >
                스킵
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-[#B9F115] text-black font-bold rounded-xl text-[16px] hover:bg-[#A3E635] active:bg-[#84cc16] transition-colors"
              >
                건물 선택하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
