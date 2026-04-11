'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  link_url?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const formatNotificationTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 60) {
      return `${Math.max(0, diffInMinutes)}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }
  };

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setIsLoading(false);
  }, [supabase, router]);

  const markAsRead = async (id: string, linkUrl?: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    if (linkUrl && linkUrl !== '#') {
      router.push(linkUrl);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 px-4 py-4 flex items-center border-b border-gray-100">
        <Link 
          href="/" 
          className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 ml-2">알림</h1>
      </header>

      {/* List */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex flex-col">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-5 py-5 border-b border-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-full mb-1.5" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400">
            <p className="text-[15px]">새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id, notification.link_url)}
                className={`px-5 py-5 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer relative ${!notification.is_read ? 'bg-blue-50/40' : ''}`}
              >
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                )}
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold text-[15px] truncate pr-4 flex-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-900'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-[12px] text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatNotificationTime(notification.created_at)}
                  </span>
                </div>
                <p className={`text-[14px] leading-snug line-clamp-2 ${notification.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
                  {notification.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
