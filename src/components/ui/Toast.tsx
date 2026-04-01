'use client';

import { useState, useEffect } from 'react';

export function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      // Use a small delay to trigger the animation transition correctly after mounting
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 10);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 2500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
        {message}
      </div>
    </div>
  );
}
