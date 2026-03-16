import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CoBuyingDetail({ params }: { params: Promise<{ buildingId: string, id: string }> }) {
  const { buildingId, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: detailData, error } = await supabase
    .from('co_buyings')
    .select(`
      *,
      creator:creator_id (name, nickname)
    `)
    .eq('id', id)
    .single();

  if (error || !detailData) {
    notFound();
  }

  // NOTE: product_options 리스트, 현재 모집수량 등 부가정보
  // currentQuantity 등 로직은 조인테이블(joiner_product_details)의 total 필요
  // 일단 UI 표시를 위해 더미 현재 수량 사용 또는 DB 기반 스키마 대응
  // 테이블 구조상 co_buyings.total_quantity 목표량만 있음. 참여량은 추후 쿼리 보완.
  
  const detail = {
    ...detailData,
    currentQuantity: 12, // 임시 고정 (JOIN query로 추후 계산)
    thumbnailUrl: 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop' // DB에 이미지 컬럼 부재 - 더미 이미지
  };

  // Calculate progress
  const progressPercent = Math.min(100, Math.floor((detail.currentQuantity / detail.totalQuantity) * 100));

  return (
    <div className="flex flex-col flex-1 pb-24 bg-gray-50 relative min-h-screen">
      
      {/* ---------- 1. 투명 헤더 (스크롤 시 배경 변하는 것도 가능하지만 일단 뒤로가기만) ---------- */}
      <header className="absolute top-0 left-0 w-full z-20 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </header>

      {/* ---------- 2. 썸네일 영역 ---------- */}
      <div className="w-full aspect-[4/3] bg-gray-200 relative">
        {detail.thumbnailUrl ? (
          <img src={detail.thumbnailUrl} alt={detail.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
      </div>

      {/* ---------- 3. 작성자(방장) 정보 ---------- */}
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-[15px]">나눗이123</div>
          <div className="text-[13px] text-gray-500">나눗아파트 1단지 · 방장</div>
        </div>
      </div>

      {/* ---------- 4. 본문 내용 영역 ---------- */}
      <div className="bg-white px-5 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm">
            {detail.category}
          </span>
          <span className="text-[13px] text-gray-400 flex items-center gap-1">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
             {new Date(detail.deadline).toLocaleDateString()} 마감
          </span>
        </div>
        
        <h1 className="text-xl font-bold leading-snug mb-5 text-gray-900 break-keep">
          {detail.title}
        </h1>
        
        <div className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
          {`안녕하세요 이웃님들! 🤗
달콤하고 맛있는 제철 성주 꿀참외 공구합니다.

마트가면 3~4개에 만원씩 하는데, 산지 직송으로 3kg (10~13과) 한 박스 통째로 저렴하게 가져오려고 해요. 

✅ 최소 수량 20박스 채워지면 바로 주문 넣습니다.
✅ 배송 오면 제가 아파트 정자 쪽에서 나눠드릴게요!
✅ 신선식품이라 픽업 꼭 당일에 해주실 분만 참여 부탁드려요.`}
        </div>
      </div>

      {/* ---------- 5. 모집 현황 게이지 ---------- */}
      <div className="mt-2 bg-white px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[17px]">현재 모집 현황</h3>
          <span className="text-blue-600 font-bold text-lg">{progressPercent}% 달성</span>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          <div className="flex justify-between text-[14px]">
            <span className="font-medium text-gray-900">{detail.currentQuantity}개 신청됨</span>
            <span className="text-gray-500">목표 {detail.totalQuantity}개</span>
          </div>
        </div>
      </div>

      {/* ---------- 6. 안내 사항 (픽업 위주 등) ---------- */}
      <div className="mt-2 bg-white px-5 py-6 mb-8">
        <h3 className="font-bold text-gray-900 text-[17px] mb-4">공동구매 안내</h3>
        
        <ul className="space-y-3 text-[14px] text-gray-600">
           <li className="flex gap-2">
             <span className="flex-shrink-0 mt-0.5 text-blue-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
             <span>진행 상태가 <strong className="font-medium text-gray-900">결제 대기</strong>로 넘어가면 카카오톡 오픈채팅방에서 입금 안내를 진행합니다.</span>
           </li>
           <li className="flex gap-2">
             <span className="flex-shrink-0 mt-0.5 text-blue-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
             <span>상품 수령은 방장이 지정한 지정장소(아파트 로비 등)에서 대면으로 이루어집니다.</span>
           </li>
        </ul>
      </div>

      {/* ---------- 7. 하단 플로팅 참여 버튼 ---------- */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-gray-100 p-4 pb-8 flex items-center justify-between z-30 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)]">
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 mb-0.5">최저 신청금액</span>
          <span className="text-[20px] font-bold text-gray-900">20,000원<span className="text-[14px] font-normal text-gray-500 ml-1">부터</span></span>
        </div>
        <Link 
          href={`/${buildingId}/co-buying/${id}/join`} 
          className="w-[180px] h-[52px] bg-black text-white rounded-xl font-bold flex items-center justify-center hover:bg-gray-800 transition-all shadow-md active:scale-95"
        >
          참여하기
        </Link>
      </div>
    </div>
  );
}

