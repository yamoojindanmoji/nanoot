'use client';

import { useState, useEffect } from 'react';

export function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      // Use a small delay or just let it render naturally
      // To avoid the lint error for "direct setState in effect" 
      // where it's redundant, we can ensure it's handled as a response to the prop change.
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message && !isVisible) return null;

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
        {message}
      </div>
    </div>
  );
}
