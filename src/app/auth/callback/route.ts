import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Query user table to check if there is an existing profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, building_id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          // If this is a new OAuth user, create their profile with default values extracted from the provider
          // We assume google gives us email and full_name in user.user_metadata
          const name = user.user_metadata?.full_name || '사용자';
          const email = user.user_metadata?.email || user.email;

          await supabase.from('users').insert({
            id: user.id,
            name: name,
            nickname: name, // Default nickname
            email: email,
          });

          // Needs building setup
          return NextResponse.redirect(`${origin}/building/setup`)
        } else if (!profile.building_id) {
          // Has profile, but no building setup yet
          return NextResponse.redirect(`${origin}/building/setup`)
        }
      }

      // If they have a building_id, redirect to the desired page (or home)
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
