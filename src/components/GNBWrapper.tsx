import { createClient } from '@/lib/supabase/server';
import { GNB } from '@/components/GNB';

// 인증 페이지들(GNB 숨김)
const NO_GNB_PATHS = ['/login', '/signup', '/building', '/auth'];

export default async function GNBWrapper({ pathname }: { pathname: string }) {
  const showGNB = !NO_GNB_PATHS.some(p => pathname.startsWith(p));
  if (!showGNB) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return <GNB />;
}
