import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { JoinBottomSheetClient } from './JoinBottomSheetClient';

export default async function CoBuyingDetail({ params }: { params: Promise<{ buildingId: string, id: string }> }) {
  const { buildingId, id } = await params;
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: detailData, error } = await supabase
    .from('co_buyings')
    .select(`
      *,
      creator:creator_id (name, nickname, profile_image_url),
      building:building_id (name)
    `)
    .eq('id', id)
    .single();

  if (error || !detailData) {
    notFound();
  }

  // 실제 참여 수량 집계
  const { data: allJoiners } = await supabase
    .from('joiners')
    .select('joiner_total_quantity')
    .eq('co_buying_id', id);

  // 현재 신청 수 = host_quantity + SUM(joiners.joiner_total_quantity)
  const hostQuantity = detailData.host_quantity || 0;
  const joinersQuantity = allJoiners?.reduce((sum, j) => sum + j.joiner_total_quantity, 0) || 0;
  const currentQuantity = hostQuantity + joinersQuantity;

  const creator = Array.isArray(detailData.creator) ? detailData.creator[0] : detailData.creator;
  const building = Array.isArray(detailData.building) ? detailData.building[0] : detailData.building;

  const detail = {
    ...detailData,
    currentQuantity,
    thumbnailUrl: detailData.image_url || '',
  };

  const { data: options } = await supabase
    .from('product_options')
    .select('*')
    .eq('co_buying_id', id);

  // Calculate progress (Fix NaN% bug by checking total_quantity)
  const progressPercent = detail.total_quantity > 0 
    ? Math.min(100, Math.floor((detail.currentQuantity / detail.total_quantity) * 100))
    : 0;

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
          <Image src={detail.thumbnailUrl} alt={detail.title} width={400} height={300} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
      </div>

      {/* ---------- 3. 작성자(방장) 정보 ---------- */}
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
          {creator?.profile_image_url ? (
            <Image src={creator.profile_image_url} alt="profile" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-[15px]">
            {creator?.nickname || creator?.name || '알 수 없음'}
          </div>
          <div className="text-[13px] text-gray-500">
            {building?.name || ''} · 방장
          </div>
        </div>
      </div>

      {/* ---------- 4. 본문 내용 영역 ---------- */}
      <div className="bg-white px-5 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm">
            {detail.category}
          </span>
          <span className="text-[13px] text-gray-400 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {new Date(detail.deadline).toLocaleDateString()} 마감
          </span>
        </div>

        <h1 className="text-xl font-bold leading-snug mb-5 text-gray-900 break-keep">
          {detail.title}
        </h1>

        <div className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
          {detail.description || '반가워요! 이번 공동구매에 대해 소개해 드릴게요.'}
        </div>
      </div>

      {/* ---------- 5. 모집 현황 게이지 ---------- */}
      <div className="mt-2 bg-white px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[17px]">현재 모집 현황</h3>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full bg-blue-600 transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-start text-[14px]">
            <span className="font-medium text-gray-900">{detail.currentQuantity}개 신청 / {detail.total_quantity}개 목표</span>
          </div>
        </div>
      </div>

      {/* ---------- 6. 안내 사항 (픽업 위주 등) ---------- */}
      <div className="mt-2 bg-white px-5 py-6 mb-8">
        <h3 className="font-bold text-gray-900 text-[17px] mb-4">공동구매 안내</h3>

        <ul className="space-y-3 text-[14px] text-gray-600">
          <li className="flex gap-2">
            <span className="flex-shrink-0 mt-0.5 text-blue-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span>
            <span>진행 상태가 <strong className="font-medium text-gray-900">결제 대기</strong>로 넘어가면 카카오톡 오픈채팅방에서 입금 안내를 진행합니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 mt-0.5 text-blue-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg></span>
            <span>상품 수령은 방장이 지정한 지정장소(아파트 로비 등)에서 대면으로 이루어집니다.</span>
          </li>
        </ul>
      </div>

      {/* ---------- 7. 하단 플로팅 참여 버튼 ---------- */}
      {detail.status === 'RECRUITING' ? (
        <JoinBottomSheetClient 
          coBuyingId={id} 
          buildingId={buildingId} 
          buildingName={building?.name}
          options={options || []} 
          totalQuantity={detail.totalQuantity}
          currentQuantity={detail.currentQuantity}
        />
      ) : (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-gray-100 p-4 pb-8 z-30 flex items-center justify-center shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)]">
           <div className="w-full h-[52px] bg-gray-200 text-gray-500 rounded-xl font-bold text-[16px] flex items-center justify-center">
             모집이 마감되었습니다
           </div>
        </div>
      )}
    </div>
  );
}

