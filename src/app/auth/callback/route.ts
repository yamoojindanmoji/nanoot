import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Query user table to check if there is an existing profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, building_id, nickname')
          .eq('id', user.id)
          .single();

        if (!profile) {
          // New OAuth user: upsert row with all required fields
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

          return NextResponse.redirect(`${origin}/auth/setup-profile`);
        }

        // Existing user with no nickname → profile setup required
        if (!profile.nickname) {
          return NextResponse.redirect(`${origin}/auth/setup-profile`);
        }

        // Existing user with nickname → redirect based on building_id
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

        if (!profile.building_id) {
          return NextResponse.redirect(`${baseUrl}/building/setup`);
        }
        return NextResponse.redirect(`${baseUrl}/`);
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
