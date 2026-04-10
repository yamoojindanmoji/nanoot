'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { RequestCoBuyingBottomSheet } from '@/components/RequestCoBuyingBottomSheet';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { registerPushNotification } from '@/lib/pushNotification';

const NO_NAV_PATHS = ['/login', '/signup', '/building', '/auth'];

export function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || 'USER');
      }
    };
    checkUser();
  }, [supabase]);

  const showNav = !NO_NAV_PATHS.some(p => pathname.startsWith(p));
  const isHome = pathname === '/' || pathname.match(/^\/[0-9a-f-]{36}$/);

  const handleFabClick = () => {
    if (!isLoggedIn) {
      router.push('/');
      return;
    }
    
    if (userRole === 'ADMIN') {
      router.push('/admin/co-buying/new');
    } else {
      setIsBottomSheetOpen(true);
    }
  };

  return (
    <>
      <div className={`flex flex-col flex-1 relative ${showNav ? 'pb-16' : ''}`}>
        {children}
        
        {/* Floating Action Button - Only visible on home page */}
        {showNav && isHome && (
          <div 
            style={{ bottom: 'var(--fab-bottom-offset)' }}
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-[440px] pointer-events-none z-30"
          >
            <button 
              onClick={handleFabClick}
              className="absolute right-4 bottom-0 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all active:scale-95 pointer-events-auto"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
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
