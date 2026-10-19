'use client';

import React from 'react';
import { 
  QrCode, 
  GraduationCap, 
  BarChart3, 
  Users, 
  Radio, 
  Send, 
  Database,
  FileText,
  Megaphone,
  Camera,
  Home,
  BookOpen
} from 'lucide-react';
import { Role } from '@/types/attendance';

interface MobileBottomNavProps {
  role: Role;
  activeSimTab: 'scan' | 'sesi' | 'siswa' | 'laporan' | 'wa' | 'sheets' | 'portal' | 'jurnal';
  onSelectSimTab: (tab: 'scan' | 'sesi' | 'siswa' | 'laporan' | 'wa' | 'sheets' | 'portal' | 'jurnal') => void;
  // Siswa inner tab navigation
  activeSiswaTab?: 'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman';
  onSelectSiswaTab?: (tab: 'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman') => void;
  pendingIzinCount?: number;
  unreadPengumumanCount?: number;
  onOpenPanduan?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  role,
  activeSimTab,
  onSelectSimTab,
  activeSiswaTab = 'kartu',
  onSelectSiswaTab,
  pendingIzinCount = 0,
  unreadPengumumanCount = 0,
  onOpenPanduan
}) => {
  if (role === 'SISWA') {
    return (
      <nav 
        aria-label="Navigasi Bawah Siswa"
        className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg flex items-center justify-around max-w-full transition-colors select-none"
      >
        {/* Tab 1: Kartu Pelajar */}
        <button
          type="button"
          onClick={() => {
            onSelectSimTab('portal');
            onSelectSiswaTab?.('kartu');
          }}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer min-w-[54px] ${
            activeSimTab === 'portal' && activeSiswaTab === 'kartu'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className={`w-5 h-5 ${activeSimTab === 'portal' && activeSiswaTab === 'kartu' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">Kartu Siswa</span>
        </button>

        {/* Tab 2: Scan Mandiri (Center Highlight) */}
        <button
          type="button"
          onClick={() => {
            onSelectSimTab('portal');
            onSelectSiswaTab?.('mandiri');
          }}
          className={`relative -top-2 flex flex-col items-center justify-center p-2 rounded-2xl transition cursor-pointer shadow-md active:scale-95 ${
            activeSimTab === 'portal' && activeSiswaTab === 'mandiri'
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
          title="Scan Mandiri dengan Kamera HP"
        >
          <Camera className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5 whitespace-nowrap">Scan HP</span>
        </button>

        {/* Tab 3: Izin / Sakit */}
        <button
          type="button"
          onClick={() => {
            onSelectSimTab('portal');
            onSelectSiswaTab?.('izin');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer min-w-[54px] ${
            activeSimTab === 'portal' && activeSiswaTab === 'izin'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {pendingIzinCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {pendingIzinCount}
            </span>
          )}
          <FileText className={`w-5 h-5 ${activeSimTab === 'portal' && activeSiswaTab === 'izin' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">Izin/Sakit</span>
        </button>

        {/* Tab 4: Pengumuman */}
        <button
          type="button"
          onClick={() => {
            onSelectSimTab('portal');
            onSelectSiswaTab?.('pengumuman');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer min-w-[54px] ${
            activeSimTab === 'portal' && activeSiswaTab === 'pengumuman'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {unreadPengumumanCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadPengumumanCount}
            </span>
          )}
          <Megaphone className={`w-5 h-5 ${activeSimTab === 'portal' && activeSiswaTab === 'pengumuman' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">Pengumuman</span>
        </button>

        {/* Tab 5: Riwayat Presensi */}
        <button
          type="button"
          onClick={() => {
            onSelectSimTab('portal');
            onSelectSiswaTab?.('laporan');
          }}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer min-w-[54px] ${
            activeSimTab === 'portal' && activeSiswaTab === 'laporan'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeSimTab === 'portal' && activeSiswaTab === 'laporan' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">Riwayat</span>
        </button>
      </nav>
    );
  }

  // GURU & ADMIN Navigation (Smooth Scrollable Container to prevent any text collisions)
  return (
    <nav 
      aria-label="Navigasi Bawah Guru dan Admin"
      className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-2xl flex items-center overflow-x-auto scrollbar-none gap-1 justify-start sm:justify-around max-w-full text-slate-500 dark:text-slate-400 transition-colors select-none"
    >
      {/* 1. Scanner QR */}
      <button
        type="button"
        onClick={() => onSelectSimTab('scan')}
        className={`shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] ${
          activeSimTab === 'scan'
            ? 'text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-slate-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <QrCode className={`w-4.5 h-4.5 ${activeSimTab === 'scan' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Scan QR</span>
      </button>

      {/* 2. Jurnal KBM & Absensi Jam */}
      <button
        type="button"
        onClick={() => onSelectSimTab('jurnal')}
        className={`shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] ${
          activeSimTab === 'jurnal'
            ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-slate-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <BookOpen className={`w-4.5 h-4.5 ${activeSimTab === 'jurnal' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Jurnal</span>
      </button>

      {/* 3. Rekap & Laporan */}
      <button
        type="button"
        onClick={() => onSelectSimTab('laporan')}
        className={`shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] ${
          activeSimTab === 'laporan'
            ? 'text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-slate-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <BarChart3 className={`w-4.5 h-4.5 ${activeSimTab === 'laporan' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Rekap</span>
      </button>

      {/* 4. Data Siswa */}
      <button
        type="button"
        onClick={() => onSelectSimTab('siswa')}
        className={`shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] ${
          activeSimTab === 'siswa'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-slate-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Users className={`w-4.5 h-4.5 ${activeSimTab === 'siswa' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Siswa</span>
      </button>

      {/* 5. Sesi QR */}
      <button
        type="button"
        onClick={() => onSelectSimTab('sesi')}
        className={`shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] ${
          activeSimTab === 'sesi'
            ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-slate-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Radio className={`w-4.5 h-4.5 ${activeSimTab === 'sesi' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Sesi QR</span>
      </button>

      {/* 6. WhatsApp Official */}
      <button
        type="button"
        onClick={() => onSelectSimTab('wa')}
        className={`shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] ${
          activeSimTab === 'wa'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-slate-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Send className={`w-4.5 h-4.5 ${activeSimTab === 'wa' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">WhatsApp</span>
      </button>

      {/* 7. Sheets Live */}
      <button
        type="button"
        onClick={() => onSelectSimTab('sheets')}
        className={`shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] ${
          activeSimTab === 'sheets'
            ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-slate-800'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Database className={`w-4.5 h-4.5 ${activeSimTab === 'sheets' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Sheets</span>
      </button>

      {/* 8. Buku Panduan */}
      {onOpenPanduan && (
        <button
          type="button"
          onClick={onOpenPanduan}
          className="shrink-0 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[54px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          title="Buka Buku Panduan Lengkap"
        >
          <BookOpen className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Panduan</span>
        </button>
      )}
    </nav>
  );
};
