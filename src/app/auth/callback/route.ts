import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const invite = searchParams.get('invite')
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
              nickname: null,
              profile_image_url: null,
              building_id: null,
              role: 'USER',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );

          return NextResponse.redirect(`${origin}/auth/setup-profile${queryString}`);
        }

        // nickname 없음 → 프로필 설정 필요
        if (!profile.nickname) {
          return NextResponse.redirect(`${origin}/auth/setup-profile${queryString}`);
        }

        // Existing user with nickname → redirect based on building_id
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

        if (!profile.building_id || invite) {
          return NextResponse.redirect(`${baseUrl}/building/setup${queryString}`);
        }
        return NextResponse.redirect(`${baseUrl}/${queryString}`);
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
