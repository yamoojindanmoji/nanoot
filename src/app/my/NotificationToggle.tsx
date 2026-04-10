'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { registerPushNotification } from '@/lib/pushNotification';

export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await registerPushNotification();
      setEnabled(Notification.permission === 'granted');
    } else {
      // 알림 해제 로직은 필요 시 추가 (현재는 인터페이스 유지)
      setEnabled(false);
    }
  };

  return (
    <div className="flex justify-between items-center p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 text-gray-800">
        <span className="text-gray-500">
          <Settings size={20} />
        </span>
        <span className="text-[16px] font-medium">알림 설정</span>
      </div>
      <Switch checked={enabled} onCheckedChange={handleToggle} />
    </div>
  );
}
