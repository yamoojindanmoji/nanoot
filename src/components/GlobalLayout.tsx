import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { RequestCoBuyingBottomSheet } from '@/components/RequestCoBuyingBottomSheet';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NO_NAV_PATHS = ['/login', '/signup', '/building', '/auth'];

export function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      
      if (user) {
        // Simple check for admin: you might need a more robust check based on your DB schema
        const { data: profile } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(!!profile?.is_admin);
      }
    };
    checkUser();
  }, [supabase]);

  const showNav = !NO_NAV_PATHS.some(p => pathname.startsWith(p));
  const isHome = pathname === '/' || pathname.match(/^\/[0-9a-f-]{36}$/);

  const handleFabClick = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    
    if (isAdmin) {
      router.push('/admin/co-buying/new');
    } else {
      setIsBottomSheetOpen(true);
    }
  };

  return (
    <>
      <div className={`flex flex-col flex-1 relative ${showNav ? 'pb-16' : ''}`}>
        {children}
        
        {/* Floating Action Button - Moved here to stay within max-width container */}
        {showNav && (
          <button 
            onClick={handleFabClick}
            style={{ bottom: 'calc(var(--gnb-total-height) + 16px)' }}
            className="fixed right-4 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all active:scale-95 z-30"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        )}
      </div>
      
      {showNav && <BottomNav />}
      
      <RequestCoBuyingBottomSheet 
        isOpen={isBottomSheetOpen} 
        onClose={() => setIsBottomSheetOpen(false)} 
      />
    </>
  );
}
