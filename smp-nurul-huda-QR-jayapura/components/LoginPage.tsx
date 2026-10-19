'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { User, Siswa, SchoolProfile } from '@/types/attendance';
import { INITIAL_USERS, INITIAL_SISWA } from '@/lib/initial-data';
import { SchoolLogo } from '@/components/SchoolLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIsMounted } from '@/lib/utils';
import { 
  ShieldCheck, 
  GraduationCap, 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  School, 
  Sparkles, 
  Columns2, 
  Square,
  Clock,
  FileSpreadsheet,
  QrCode
} from 'lucide-react';

interface LoginPageProps {
  usersList: User[];
  siswaList: Siswa[];
  onLoginSuccess: (user: User) => void;
  schoolProfile?: SchoolProfile;
  deviceMode?: 'desktop' | 'mobile';
  onChangeDeviceMode?: (mode: 'desktop' | 'mobile') => void;
}

function subscribeLayout(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('login-layout-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('login-layout-change', callback);
  };
}

function getLayoutSnapshot(): 'split' | 'single' {
  try {
    const saved = localStorage.getItem('presensi_login_layout');
    if (saved === 'split' || saved === 'single') return saved;
  } catch {}
  return 'split';
}

function getLayoutServerSnapshot(): 'split' | 'single' {
  return 'split';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  usersList,
  siswaList,
  onLoginSuccess,
  schoolProfile,
  deviceMode = 'desktop',
  onChangeDeviceMode
}) => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'SISWA'>('STAFF');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nisnInput, setNisnInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [witTime, setWitTime] = useState<string>('');

  const isMounted = useIsMounted();
  const storedLayout = useSyncExternalStore(
    subscribeLayout,
    getLayoutSnapshot,
    getLayoutServerSnapshot
  );
  const [overrideLayout, setOverrideLayout] = useState<'split' | 'single' | null>(null);
  const layoutMode = overrideLayout ?? (isMounted ? storedLayout : 'split');

  const handleToggleLayout = (mode: 'split' | 'single') => {
    setOverrideLayout(mode);
    try {
      localStorage.setItem('presensi_login_layout', mode);
      window.dispatchEvent(new Event('login-layout-change'));
    } catch {}
  };

  // Live School Time in WIT (Jayapura)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = schoolProfile?.zonaWaktu === 'WIB' 
        ? 'Asia/Jakarta' 
        : schoolProfile?.zonaWaktu === 'WITA' 
          ? 'Asia/Makassar' 
          : 'Asia/Jayapura';
      const label = schoolProfile?.zonaWaktu || 'WIT';

      setWitTime(
        now.toLocaleDateString('id-ID', {
          timeZone: tz,
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) + ' • ' +
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

  // Handle Staff/Guru Login
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Username dan kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Search in current usersList
      let matched = usersList.find(u => {
        const uName = (u.username || '').toLowerCase();
        return uName === cleanUser || (u.email && u.email.toLowerCase() === cleanUser);
      });

      // 2. Fallback to INITIAL_USERS if not found in state
      if (!matched) {
        matched = INITIAL_USERS.find(u => {
          const uName = (u.username || '').toLowerCase();
          return uName === cleanUser || (u.email && u.email.toLowerCase() === cleanUser);
        });
      }

      // 3. Fallback: If user enters 'admin' or email, assign default administrator
      if (!matched && (cleanUser === 'admin' || cleanUser === 'akunfakehoax' || cleanUser === 'akunfakehoax@gmail.com')) {
        matched = INITIAL_USERS[0];
      }

      if (!matched) {
        setIsLoading(false);
        setErrorMessage('Username tidak ditemukan. Pastikan menggunakan username resmi sekolah.');
        return;
      }

      // Check if account is deactivated
      if (matched.status === 'NONAKTIF') {
        setIsLoading(false);
        setErrorMessage('Akun ini sedang dinonaktifkan oleh administrator sekolah. Silakan hubungi admin sekolah.');
        return;
      }

      // Check password: allow matched password OR default master passwords
      const isPasswordValid = 
        (matched.password && matched.password === cleanPass) ||
        (matched.role === 'ADMIN' && (cleanPass === 'admin123' || cleanPass === (matched.password || 'admin123'))) ||
        (cleanUser === 'guru_piket' && cleanPass === 'piket123') ||
        (cleanPass === 'admin123' && matched.role === 'ADMIN');

      if (!isPasswordValid) {
        setIsLoading(false);
        setErrorMessage('Kata sandi salah. Silakan coba kembali.');
        return;
      }

      setIsLoading(false);
      onLoginSuccess(matched);
    }, 250);
  };

  // Handle Siswa Login via NISN
  const handleSiswaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanNisn = nisnInput.trim();

    if (!cleanNisn) {
      setErrorMessage('Silakan masukkan nomor NISN Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find student in siswaList or fallback to INITIAL_SISWA
      let matchedStudent = siswaList.find(s => s.nisn === cleanNisn);
      if (!matchedStudent) {
        matchedStudent = INITIAL_SISWA.find(s => s.nisn === cleanNisn);
      }

      if (!matchedStudent) {
        // Also check in usersList if matching
        const matchedUser = usersList.find(u => u.username === cleanNisn || u.nisn === cleanNisn) ||
          INITIAL_USERS.find(u => u.username === cleanNisn || u.nisn === cleanNisn);
        if (matchedUser) {
          setIsLoading(false);
          onLoginSuccess(matchedUser);
          return;
        }

        setIsLoading(false);
        setErrorMessage(`Siswa dengan NISN "${cleanNisn}" tidak ditemukan di database sekolah.`);
        return;
      }

      const siswaUser: User = {
        id: `USR-SISWA-${matchedStudent.nisn}`,
        username: matchedStudent.nisn,
        nama: matchedStudent.nama,
        role: 'SISWA',
        nisn: matchedStudent.nisn,
        kelas: matchedStudent.kelas,
        noHp: matchedStudent.noHpOrtu,
        status: 'AKTIF'
      };

      setIsLoading(false);
      onLoginSuccess(siswaUser);
    }, 250);
  };

  // Login Card Form
  const renderLoginFormCard = (isSingleColumn: boolean) => (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 dark:border-slate-800 relative transition-all duration-200">
      {/* Header Formulir di dalam Kartu */}
      {isSingleColumn ? (
        <div className="text-center pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-center mb-3">
            {schoolProfile ? (
              <SchoolLogo 
                profile={schoolProfile} 
                className="w-20 h-20 sm:w-24 sm:h-24 bg-transparent transition-transform hover:scale-105 duration-200" 
                iconClassName="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-sm text-emerald-600 dark:text-emerald-400" 
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-transparent">
                <School className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm" />
              </div>
            )}
          </div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
            {schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sistem Informasi Presensi QR & Portal Digital Siswa
          </p>
        </div>
      ) : (
        <div className="mb-5">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4" />
            <span>Autentikasi Presensi Resmi</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Masuk ke Sistem Presensi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Masukkan kredensial resmi Anda untuk masuk ke sistem
          </p>
        </div>
      )}

      {/* Auth Mode Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5 text-xs font-bold">
        <button
          type="button"
          onClick={() => { setActiveTab('STAFF'); setErrorMessage(null); }}
          className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'STAFF'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          <span>Staf & Guru</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('SISWA'); setErrorMessage(null); }}
          className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'SISWA'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-500" />
          <span>Siswa (NISN)</span>
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab 1: Guru / Staf / Admin Form */}
      {activeTab === 'STAFF' ? (
        <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Username atau Email:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Contoh: admin atau guru_piket"
                className="w-full pl-10 pr-3.5 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition shadow-2xs font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Kata Sandi (Password):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition duration-150 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      ) : (
        /* Tab 2: Siswa Portal via NISN */
        <form onSubmit={handleSiswaSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              NISN (Nomor Induk Siswa Nasional):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
              </div>
              <input
                type="text"
                value={nisnInput}
                onChange={(e) => setNisnInput(e.target.value)}
                placeholder="Contoh: 0061234501"
                className="w-full pl-10 pr-3.5 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition shadow-2xs font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Masukkan 10 digit NISN yang terdaftar di database sekolah untuk membuka Kartu Pelajar Digital, riwayat kehadiran, dan pengajuan izin.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition duration-150 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mencari Data Siswa...</span>
              </>
            ) : (
              <>
                <span>Buka Portal Siswa</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Security Footnote & Layout Switch */}
      <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-1.5">
        <button
          type="button"
          onClick={() => handleToggleLayout(isSingleColumn ? 'split' : 'single')}
          className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center space-x-1.5 transition cursor-pointer"
        >
          {isSingleColumn ? (
            <>
              <Columns2 className="w-3.5 h-3.5" />
              <span>Tampilan Dua Kolom (Showcase)</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5" />
              <span>Tampilan Satu Kolom (Minimalis)</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          SMP Nurul Huda Jayapura • Sistem Presensi Terpadu & Portal Akademik
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between py-3 sm:py-6 px-3 sm:px-6 lg:px-8 relative selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      {/* Background Subtle Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#059669 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      {/* Top Header Bar */}
      <header className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-2.5 min-w-0">
            {schoolProfile ? (
              <SchoolLogo profile={schoolProfile} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 bg-transparent" iconClassName="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 bg-transparent">
                <School className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white tracking-wide uppercase truncate">
                {schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {schoolProfile?.kota || 'Kota Jayapura'}, {schoolProfile?.provinsi || 'Papua'} • TP {schoolProfile?.tahunPelajaran || '2026/2027'}
              </div>
            </div>
          </div>

          <div className="sm:hidden shrink-0">
            <ThemeToggle variant="compact" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
          <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => handleToggleLayout('split')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                layoutMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Dua Kolom"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayout('single')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                layoutMode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Satu Kolom"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minimalis</span>
            </button>
          </div>

          <div className="hidden sm:block">
            <ThemeToggle variant="dropdown" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto my-auto py-6 sm:py-10">
        {layoutMode === 'single' ? (
          <div className="max-w-md mx-auto w-full">
            {renderLoginFormCard(true)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Showcase & Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sistem Presensi Resmi • SMP Nurul Huda Jayapura</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Presensi Siswa Digital <br className="hidden sm:inline" />
                  <span className="text-emerald-600 dark:text-emerald-400">QR Code & Notifikasi Real-Time</span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Platform absensi komprehensif untuk mendata kehadiran siswa, mencetak kartu pelajar QR digital, memantau kedisiplinan, serta mengirim notifikasi WhatsApp langsung ke wali murid secara otomatis.
                </p>
              </div>

              {/* Three Institutional Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Scan QR Dinamis</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Validasi cepat tanpa antre, anti-duplikasi, dan pendeteksi keterlambatan otomatis.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Kartu Pelajar Digital</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Format cetak massal A4 (10 kartu/lembar) & unduh PDF siap cetak laminasi.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Sinkronisasi Sheets</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Integrasi Google Apps Script (GAS) Web App dua arah dengan database spreadsheet.
                  </div>
                </div>
              </div>

              {/* Live Time Badge */}
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Waktu Resmi Jayapura: <strong className="text-slate-700 dark:text-slate-200">{witTime}</strong></span>
              </div>
            </div>

            {/* Right Column: Form Card */}
            <div className="lg:col-span-5 max-w-md w-full mx-auto">
              {renderLoginFormCard(false)}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto pt-3 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © {new Date().getFullYear()} {schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura'}. Hak Cipta Dilindungi.
        </div>
        <div className="flex items-center space-x-4 text-[11px]">
          <span>Papua, Indonesia</span>
          <span>•</span>
          <span>Sistem Presensi QR V3.2</span>
        </div>
      </footer>

    </div>
  );
};
