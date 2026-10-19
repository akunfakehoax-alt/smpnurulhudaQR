'use client';

import React, { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';
import { useIsMounted } from '@/lib/utils';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export const OfflineIndicator: React.FC = () => {
  const isMounted = useIsMounted();

  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );

  if (!isMounted || isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center space-x-2.5 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl font-medium text-xs border border-amber-400 animate-in fade-in slide-in-from-bottom-4">
      <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse shrink-0" />
      <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
      <div className="flex-1">
        <span className="font-bold">Mode Offline</span> — Sedang menggunakan cache lokal. Presensi akan disinkronkan saat terhubung kembali ke internet.
      </div>
    </div>
  );
};

