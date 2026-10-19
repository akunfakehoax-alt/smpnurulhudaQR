'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  BatteryMedium, 
  Signal, 
  Smartphone, 
  Monitor, 
  Maximize2, 
  Minimize2,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { SchoolProfile } from '@/types/attendance';

interface MobilePhoneContainerProps {
  children: React.ReactNode;
  schoolProfile?: SchoolProfile;
  onSwitchToDesktop: () => void;
  onOpenInstallPWA: () => void;
}

export const MobilePhoneContainer: React.FC<MobilePhoneContainerProps> = ({
  children,
  schoolProfile,
  onSwitchToDesktop,
  onOpenInstallPWA
}) => {
  const [useBezel, setUseBezel] = useState<boolean>(true);
  const [phoneTime, setPhoneTime] = useState<string>('07:15');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = schoolProfile?.zonaWaktu === 'WIB' 
        ? 'Asia/Jakarta' 
        : schoolProfile?.zonaWaktu === 'WITA' 
          ? 'Asia/Makassar' 
          : 'Asia/Jayapura';
      setPhoneTime(now.toLocaleTimeString('id-ID', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [schoolProfile?.zonaWaktu]);

  return (
    <div className="w-full flex flex-col items-center py-2 sm:py-6 px-1 sm:px-4">
      {/* Top Mobile Control Bar for Desktop Users */}
      <div className="w-full max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 mb-3 sm:mb-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs transition-colors">
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5 flex-wrap">
              <span className="truncate">Tampilan HP Android</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                PWA Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Optimal untuk scanner QR & presensi mandiri kamera HP
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-end shrink-0">
          {/* Toggle Bezel Frame vs Full Screen View */}
          <button
            type="button"
            onClick={() => setUseBezel(!useBezel)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold flex items-center space-x-1 transition cursor-pointer text-[11px]"
            title={useBezel ? 'Ubah ke Mode Layar Penuh HP' : 'Tampilkan Bingkai HP Android'}
          >
            {useBezel ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="whitespace-nowrap">Layar Penuh</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="whitespace-nowrap">Bingkai HP</span>
              </>
            )}
          </button>

          {/* Switch back to Desktop PC */}
          <button
            type="button"
            onClick={onSwitchToDesktop}
            className="px-2.5 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold flex items-center space-x-1 transition cursor-pointer text-[11px]"
            title="Kembali ke Mode Desktop PC Lebar"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="whitespace-nowrap">Mode PC</span>
          </button>

          {/* Install PWA Prompt */}
          <button
            type="button"
            onClick={onOpenInstallPWA}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold flex items-center space-x-1 shadow-xs transition active:scale-95 cursor-pointer text-[11px]"
            title="Panduan Pasang Aplikasi PWA di HP Android"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span className="whitespace-nowrap">Pasang PWA</span>
          </button>
        </div>
      </div>

      {/* When Bezel Frame is Active: Render Realistic Android Smartphone */}
      {useBezel ? (
        <div className="relative mx-auto w-full max-w-[420px] my-1 sm:my-2 transition-all">
          {/* Smartphone Hardware Outer Shell */}
          <div className="relative bg-slate-900 dark:bg-slate-950 p-2.5 sm:p-3.5 rounded-[40px] sm:rounded-[46px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border-4 border-slate-700 dark:border-slate-800">
            {/* Speaker Ear-piece Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-800 dark:bg-slate-700 rounded-full z-30" />

            {/* Android Screen Display */}
            <div className="relative bg-slate-50 dark:bg-slate-900 rounded-[30px] sm:rounded-[36px] overflow-hidden border border-slate-300/40 dark:border-slate-700/50 flex flex-col min-h-[680px] sm:min-h-[740px] max-h-[85vh] shadow-inner">
              {/* Android Native Status Bar */}
              <div className="bg-slate-900 text-white px-4 sm:px-5 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-sans font-medium select-none shrink-0 z-30">
                {/* Left: Clock & Notifications */}
                <div className="flex items-center space-x-2">
                  <span suppressHydrationWarning className="font-bold tracking-tight">{phoneTime}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-700/50">
                    {schoolProfile?.zonaWaktu || 'WIT'}
                  </span>
                </div>

                {/* Center: Camera Punch Hole Cutout */}
                <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-slate-800 mx-auto shadow-inner flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-blue-900/60" />
                </div>

                {/* Right: Connectivity & Battery Status */}
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <span className="text-[10px] font-bold text-slate-300 font-mono">5G</span>
                  <Signal className="w-3.5 h-3.5 text-slate-200" />
                  <Wifi className="w-3.5 h-3.5 text-slate-200" />
                  <div className="flex items-center space-x-0.5">
                    <span className="text-[10px] font-bold">98%</span>
                    <BatteryMedium className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Scrollable App Viewport for Smartphone */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col">
                {children}
              </div>

              {/* Android Gesture Bar at Bottom */}
              <div className="bg-slate-900 pt-1 pb-1.5 flex items-center justify-center shrink-0 z-30">
                <div className="w-28 h-1 bg-slate-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Width Mobile Responsive View (Without Phone Frame) */
        <div className="w-full max-w-md mx-auto bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
};
