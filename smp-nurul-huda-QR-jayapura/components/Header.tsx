'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Role, User, SchoolProfile, VoiceAnnouncementConfig, GasLiveSyncConfig } from '@/types/attendance';
import { SchoolLogo } from '@/components/SchoolLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  QrCode, 
  UserCheck, 
  ShieldCheck, 
  GraduationCap, 
  Clock, 
  PlayCircle,
  LogOut,
  BellRing,
  Bell,
  BellOff,
  AlertTriangle,
  School,
  Settings,
  FileSpreadsheet,
  BookOpen,
  KeyRound,
  Database
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onSwitchUser?: (role: Role) => void;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  activeMainTab: 'simulator' | 'panduan' | string;
  setActiveMainTab: (tab: any) => void;
  absenceAlertCount?: number;
  onOpenAbsenceAlert?: () => void;
  isAbsenceAlertEnabled?: boolean;
  onToggleAbsenceAlert?: () => void;
  isPresensiMandiriEnabled?: boolean;
  onTogglePresensiMandiri?: () => void;
  schoolProfile?: SchoolProfile;
  onOpenSchoolSettings?: () => void;
  deviceMode?: 'desktop' | 'mobile';
  onChangeDeviceMode?: (mode: 'desktop' | 'mobile') => void;
  showInstallModal?: boolean;
  setShowInstallModal?: (show: boolean) => void;
  voiceConfig?: VoiceAnnouncementConfig;
  onOpenVoiceModal?: () => void;
  gasConfig?: GasLiveSyncConfig;
  onOpenGasSyncModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onLogout,
  onOpenChangePassword,
  activeMainTab,
  setActiveMainTab,
  absenceAlertCount = 0,
  onOpenAbsenceAlert,
  isAbsenceAlertEnabled = true,
  onToggleAbsenceAlert,
  isPresensiMandiriEnabled = false,
  onTogglePresensiMandiri,
  schoolProfile,
  onOpenSchoolSettings,
  deviceMode = 'desktop',
  onChangeDeviceMode,
  showInstallModal,
  setShowInstallModal,
  voiceConfig,
  onOpenVoiceModal,
  gasConfig,
  onOpenGasSyncModal
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = schoolProfile?.zonaWaktu === 'WIB' 
        ? 'Asia/Jakarta' 
        : schoolProfile?.zonaWaktu === 'WITA' 
          ? 'Asia/Makassar' 
          : 'Asia/Jayapura';
      const label = schoolProfile?.zonaWaktu || 'WIT';

      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' ' + label
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [schoolProfile?.zonaWaktu]);

  const isTeacherOrAdmin = currentUser.role === 'GURU' || currentUser.role === 'ADMIN';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-3.5">
            {schoolProfile ? (
              <SchoolLogo profile={schoolProfile} className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0 bg-transparent" iconClassName="w-11 h-11 sm:w-12 sm:h-12 text-emerald-400 drop-shadow-sm" />
            ) : (
              <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0 text-emerald-400 bg-transparent">
                <School className="w-10 h-10 sm:w-11 sm:h-11" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-sm sm:text-base text-white leading-tight tracking-tight">
                  {schoolProfile?.namaSekolah ? `Presensi QR Code ${schoolProfile.namaSekolah}` : 'Presensi QR Code SMP Nurul Huda Jayapura'}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hidden md:inline">
                  TP {schoolProfile?.tahunPelajaran || '2026/2027'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5 flex-wrap">
                <span>Presensi QR Real-Time</span>
                <span className="text-slate-600">·</span>
                <span>Anti-Duplikasi LockService</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400/90 font-medium">WhatsApp Gateway</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
            {/* Quick Status & Utility Controls Pill Group */}
            <div className="flex items-center flex-wrap gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 backdrop-blur-xs">
              {/* Clock (WIT / WIB / WITA) */}
              <div className="flex items-center space-x-1 text-[11px] text-slate-300 font-mono px-2 py-1 shrink-0" title={`Zona Waktu: ${schoolProfile?.zonaWaktu || 'WIT'}`}>
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span suppressHydrationWarning>{timeStr || '07:00:00 WIT'}</span>
              </div>

              {/* Live Google Sheets status button */}
              {isTeacherOrAdmin && onOpenGasSyncModal && (
                <button
                  type="button"
                  onClick={onOpenGasSyncModal}
                  className="px-2 py-1 rounded-lg hover:bg-slate-700/70 text-slate-300 hover:text-white text-[11px] font-medium flex items-center space-x-1.5 transition active:scale-95 shrink-0"
                  title="Status Koneksi Live Google Sheets (Apps Script)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Sheets</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    gasConfig?.lastSyncStatus === 'SUCCESS' ? 'bg-emerald-400 animate-pulse' :
                    gasConfig?.lastSyncStatus === 'ERROR' ? 'bg-rose-400' : 'bg-slate-500'
                  }`} />
                </button>
              )}

              {/* School Settings Button */}
              {isTeacherOrAdmin && onOpenSchoolSettings && (
                <button
                  type="button"
                  onClick={onOpenSchoolSettings}
                  className="px-2.5 py-1 rounded-lg hover:bg-slate-700/70 text-slate-300 hover:text-white text-[11px] font-medium flex items-center space-x-1.5 transition active:scale-95 shrink-0"
                  title="Atur Logo, Profil Sekolah, Guru Mapel, dan Jam Presensi"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pengaturan</span>
                </button>
              )}

              {/* Theme Toggle */}
              <div className="shrink-0 pl-1 border-l border-slate-700/80">
                <ThemeToggle variant="dropdown" />
              </div>
            </div>

            {/* Absence Alert Badge (if alert exists and enabled) */}
            {isTeacherOrAdmin && isAbsenceAlertEnabled && absenceAlertCount > 0 && onOpenAbsenceAlert && (
              <button
                onClick={onOpenAbsenceAlert}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 hover:bg-rose-900/90 text-rose-200 text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
                title={`${absenceAlertCount} Siswa terdeteksi 3 hari berturut-turut alpa`}
              >
                <div className="relative">
                  <BellRing className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                </div>
                <span>{absenceAlertCount} Alpa</span>
              </button>
            )}

            {/* Active User Card & Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 pl-2.5 pr-1 py-1 rounded-xl border border-slate-700/70 text-xs">
              <div className="flex items-center space-x-1.5">
                {currentUser.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />}
                {currentUser.role === 'GURU' && <UserCheck className="w-3.5 h-3.5 text-sky-400" />}
                {currentUser.role === 'SISWA' && <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />}
                <div className="leading-tight text-left">
                  <div className="font-semibold text-white text-[11px] truncate max-w-[110px] sm:max-w-[130px]">
                    {currentUser.nama}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <span className={`font-semibold ${
                      currentUser.role === 'ADMIN' ? 'text-rose-400' :
                      currentUser.role === 'GURU' ? 'text-sky-400' : 'text-emerald-400'
                    }`}>{currentUser.role}</span>
                  </div>
                </div>
              </div>

              {/* Change Password Button */}
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700/80 transition ml-0.5 cursor-pointer"
                  title="Ganti Kata Sandi Akun"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-700/80 transition ml-0.5"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mode Navigation Tabs with Framer Motion Sliding Glider (Admin & Guru Only) */}
        {currentUser.role !== 'SISWA' && (
          <div className="flex items-center space-x-2 pt-2.5 overflow-x-auto relative">
            <button
              onClick={() => setActiveMainTab('simulator')}
              className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shrink-0 z-10 ${
                activeMainTab === 'simulator'
                  ? 'text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {activeMainTab === 'simulator' && (
                <motion.span
                  layoutId="activeMainTabGlider"
                  className="absolute inset-0 bg-sky-600 rounded-lg shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <PlayCircle className="w-4 h-4 text-sky-300" />
              <span>Aplikasi Presensi</span>
            </button>

            {/* Dedicated Tab: Buku Panduan Lengkap (Admin & Guru Only) */}
            <button
              onClick={() => setActiveMainTab('panduan')}
              className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shrink-0 z-10 ${
                activeMainTab === 'panduan'
                  ? 'text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {activeMainTab === 'panduan' && (
                <motion.span
                  layoutId="activeMainTabGlider"
                  className="absolute inset-0 bg-emerald-600 rounded-lg shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Buku Panduan Lengkap</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
