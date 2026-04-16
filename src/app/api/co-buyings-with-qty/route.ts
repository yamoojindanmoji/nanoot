import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/co-buyings-with-qty?buildingId={id}
 * 
 * co_buyings 목록에 host_quantity + SUM(joiners.joiner_total_quantity)를
 * 서버 컴포넌트 클라이언트(= 서비스 롤 권한)로 집계하여 반환.
 * 
 * RLS 때문에 클라이언트에서 joiners 관계형 쿼리가 자기 것만 조회되는 문제를 우회.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get('buildingId');

  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // 1. co_buyings 조회
  const { data: cbItems, error } = await supabase
    .from('co_buyings')
    .select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!cbItems || cbItems.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // 2. 해당 건물의 모든 joiners를 한 번에 조회 (co_buying_id 기준 집계)
  const coBuyingIds = cbItems.map((cb) => cb.id);
  const { data: allJoiners } = await supabase
    .from('joiners')
    .select('co_buying_id, joiner_total_quantity')
    .in('co_buying_id', coBuyingIds);

  // 3. co_buying_id별 joiners 합산
  const joinersTotalMap: Record<string, number> = {};
  (allJoiners || []).forEach((j) => {
    joinersTotalMap[j.co_buying_id] = (joinersTotalMap[j.co_buying_id] || 0) + j.joiner_total_quantity;
  });

  // 4. current_quantity = host_quantity + joiners 합산
  const itemsWithQuantity = cbItems.map((item) => {
    const hostQuantity = item.host_quantity || 0;
    const joinersQuantity = joinersTotalMap[item.id] || 0;
    return {
      ...item,
      current_quantity: hostQuantity + joinersQuantity,
    };
  });

  return NextResponse.json({ items: itemsWithQuantity });
}
