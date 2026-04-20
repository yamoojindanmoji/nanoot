import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

/**
 * next 파라미터(공구 상세 URL)에서 buildingId를 추출합니다.
 * e.g. "/b1622719-ed13-4ed4-b40e-ebbcbe9e920c/co-buying/abc" → "b1622719-ed13-4ed4-b40e-ebbcbe9e920c"
 */
function extractBuildingIdFromPath(nextPath: string | null): string | null {
  if (!nextPath) return null;
  const match = nextPath.match(/^\/([^/]+)\/co-buying\/[^/]+/);
  return match ? match[1] : null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const invite = searchParams.get('invite')
  // 로그인 전 보던 페이지 경로 (공구 상세 페이지 등)
  const next = searchParams.get('next')

  // invite 파라미터는 레거시 지원용 유지 (next 우선)
  const queryString = invite ? `?invite=${invite}` : ''

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Query user table to check if there is an existing profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, building_id, nickname')
          .eq('id', user.id)
          .single();

        // SELECT 실패(RLS/네트워크 오류) 또는 row 없음 → upsert 후 프로필 설정으로
        if (profileError || !profile) {
          const email = user.user_metadata?.email || user.email;

          await supabase.from('users').upsert(
  {
    id: user.id,
    email: email,
    name: '',
    nickname: '',
    profile_image_url: null,
    building_id: null,
    role: 'USER',
  },
  { onConflict: 'id', ignoreDuplicates: true }
);

          // 신규 유저 → 프로필 설정 페이지로 (next 파라미터 전달)
          const profileSetupParams = next
            ? `?next=${encodeURIComponent(next)}`
            : queryString;
          return NextResponse.redirect(`${origin}/auth/setup-profile${profileSetupParams}`);
        }

        // nickname 없음 → 프로필 설정 필요
        if (!profile.nickname) {
          const profileSetupParams = next
            ? `?next=${encodeURIComponent(next)}`
            : queryString;
          return NextResponse.redirect(`${origin}/auth/setup-profile${profileSetupParams}`);
        }

        // Existing user with nickname → redirect based on building_id
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

        if (!profile.building_id || invite) {
          // next URL에서 buildingId 추출 시도 (공구 상세 링크에서 온 경우)
          const buildingIdFromNext = extractBuildingIdFromPath(next);

          if (buildingIdFromNext && !invite) {
            // 건물 코드 입력 없이 자동으로 building_id 설정 후 홈으로 이동
            await supabase
              .from('users')
              .update({ building_id: buildingIdFromNext })
              .eq('id', user.id);

            return NextResponse.redirect(`${baseUrl}/`);
          }

          // buildingId를 추출할 수 없거나 invite 파라미터가 있는 경우 → building/setup으로
          return NextResponse.redirect(`${baseUrl}/building/setup${queryString}`);
        }

        return NextResponse.redirect(`${baseUrl}/${queryString}`);
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
