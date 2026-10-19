'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMounted } from '@/lib/utils';
import { 
  BookOpen, 
  Sparkles, 
  QrCode, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  FileSpreadsheet, 
  Send, 
  Volume2, 
  Printer, 
  HelpCircle, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Smartphone, 
  Laptop, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  ArrowRight, 
  Layers, 
  Download, 
  Radio, 
  HeartPulse, 
  Megaphone,
  ChevronDown,
  ChevronRight,
  Info,
  Calendar,
  Lock,
  Database,
  RefreshCw,
  Share2,
  FileCode2,
  Settings,
  Flame,
  CheckCircle,
  XCircle,
  HelpCircle as QuestionIcon,
  Globe,
  Shield,
  Wifi,
  Server
} from 'lucide-react';
import { SchoolProfile, Role } from '@/types/attendance';
import { GAS_FILES } from '@/lib/gas-code';

interface PanduanLengkapSectionProps {
  currentUserRole?: Role;
  schoolProfile?: SchoolProfile;
  onNavigateToTab?: (tab: 'scan' | 'sesi' | 'siswa' | 'laporan' | 'wa' | 'sheets' | 'portal' | 'jurnal') => void;
  onOpenVoiceModal?: () => void;
  onOpenGasModal?: () => void;
  onOpenSchoolSettings?: () => void;
}

export type CategoryId = 
  | 'quickstart'
  | 'full_online'
  | 'admin'
  | 'guru'
  | 'jurnal'
  | 'siswa'
  | 'sheets'
  | 'whatsapp'
  | 'voice'
  | 'hardware'
  | 'pwa'
  | 'import'
  | 'troubleshooting'
  | 'checklist';

interface CategoryItem {
  id: CategoryId;
  title: string;
  shortDesc: string;
  icon: React.ReactNode;
  badge?: string;
}

function subscribeChecklist(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('checklist-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('checklist-change', callback);
  };
}

const DEFAULT_CHECKLIST: Record<string, boolean> = {
  'c1': true,
  'c2': true,
  'c3': true,
  'c4': false,
  'c5': false,
  'c6': false,
  'c7': false,
  'c8': false,
  'c9': false,
  'c10': false
};

function getChecklistSnapshot(): string {
  try {
    return localStorage.getItem('presensi_checklist_state') || '';
  } catch {}
  return '';
}

function getChecklistServerSnapshot(): string {
  return '';
}

export const PanduanLengkapSection: React.FC<PanduanLengkapSectionProps> = ({
  currentUserRole = 'ADMIN',
  schoolProfile,
  onNavigateToTab,
  onOpenVoiceModal,
  onOpenGasModal,
  onOpenSchoolSettings
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': false,
    'faq-3': false,
    'faq-4': false,
    'faq-5': false,
    'faq-6': false,
    'faq-7': false,
    'faq-8': false,
    'faq-9': false,
    'faq-10': false,
    'faq-11': false,
    'faq-12': false
  });
  
  // Interactive checklist state stored in localStorage (SSR hydration safe)
  const isMounted = useIsMounted();
  const storedChecklistStr = useSyncExternalStore(
    subscribeChecklist,
    getChecklistSnapshot,
    getChecklistServerSnapshot
  );
  const [overrideChecklist, setOverrideChecklist] = useState<Record<string, boolean> | null>(null);

  const checklist: Record<string, boolean> = useMemo(() => {
    if (overrideChecklist) return overrideChecklist;
    if (isMounted && storedChecklistStr) {
      try {
        return JSON.parse(storedChecklistStr);
      } catch {}
    }
    return DEFAULT_CHECKLIST;
  }, [overrideChecklist, isMounted, storedChecklistStr]);

  const saveChecklist = (newChecklist: Record<string, boolean>) => {
    setOverrideChecklist(newChecklist);
    try {
      localStorage.setItem('presensi_checklist_state', JSON.stringify(newChecklist));
      window.dispatchEvent(new Event('checklist-change'));
    } catch (e) {
      console.error('Error saving checklist', e);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChecklistItem = (id: string) => {
    const next = { ...checklist, [id]: !checklist[id] };
    saveChecklist(next);
  };

  const handleResetChecklist = () => {
    const reset = {
      'c1': false,
      'c2': false,
      'c3': false,
      'c4': false,
      'c5': false,
      'c6': false,
      'c7': false,
      'c8': false,
      'c9': false,
      'c10': false
    };
    saveChecklist(reset);
  };

  const handleCheckAllChecklist = () => {
    const allChecked = {
      'c1': true,
      'c2': true,
      'c3': true,
      'c4': true,
      'c5': true,
      'c6': true,
      'c7': true,
      'c8': true,
      'c9': true,
      'c10': true
    };
    saveChecklist(allChecked);
  };

  const categories: CategoryItem[] = useMemo(() => [
    {
      id: 'quickstart',
      title: 'Alur Singkat & Memulai (5 Menit)',
      shortDesc: 'Panduan operasional harian sekolah',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      badge: 'Utama'
    },
    {
      id: 'full_online',
      title: 'Akses Full Online & Go-Live',
      shortDesc: 'Rekomendasi hosting, domain & SOP online',
      icon: <Globe className="w-4 h-4 text-sky-500" />,
      badge: 'Penting'
    },
    {
      id: 'admin',
      title: 'Panduan Administrator & Operator',
      shortDesc: 'Profil sekolah, guru, data siswa & sesi',
      icon: <ShieldCheck className="w-4 h-4 text-rose-500" />
    },
    {
      id: 'guru',
      title: 'Panduan Guru Piket Gerbang',
      shortDesc: 'Scanner kamera/USB, izin & sapaan',
      icon: <UserCheck className="w-4 h-4 text-sky-500" />
    },
    {
      id: 'jurnal',
      title: 'Presensi Mapel & Jurnal KBM',
      shortDesc: 'Absensi per rombel & materi kelas',
      icon: <BookOpen className="w-4 h-4 text-teal-500" />,
      badge: 'Baru'
    },
    {
      id: 'siswa',
      title: 'Panduan Siswa & Orang Tua',
      shortDesc: 'Kartu digital, scan mandiri & izin',
      icon: <GraduationCap className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'sheets',
      title: 'Google Sheets & Apps Script',
      shortDesc: 'Sinkronisasi database spreadsheet live',
      icon: <FileSpreadsheet className="w-4 h-4 text-purple-500" />,
      badge: 'Live Sync'
    },
    {
      id: 'whatsapp',
      title: 'Notifikasi WhatsApp Resmi',
      shortDesc: 'Gateway Meta Cloud / Fonnte & template',
      icon: <Send className="w-4 h-4 text-emerald-600" />
    },
    {
      id: 'voice',
      title: 'Suara Sapaan TTS & Chime',
      shortDesc: 'Pengaturan audio sapaan otomatis',
      icon: <Volume2 className="w-4 h-4 text-indigo-500" />
    },
    {
      id: 'hardware',
      title: 'Perangkat Keras & Cetak Kartu',
      shortDesc: 'Scanner USB, webcam & cetak ID Card',
      icon: <Printer className="w-4 h-4 text-amber-600" />
    },
    {
      id: 'pwa',
      title: 'PWA di Android, iOS & PC',
      shortDesc: 'Pasang aplikasi & kerja offline',
      icon: <Smartphone className="w-4 h-4 text-blue-500" />,
      badge: 'Offline'
    },
    {
      id: 'import',
      title: 'Format Data & Template Excel',
      shortDesc: 'Struktur kolom & unduh template CSV',
      icon: <Download className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'troubleshooting',
      title: 'Tanya Jawab & Kendala (FAQ)',
      shortDesc: '12+ solusi praktis masalah operasional',
      icon: <HelpCircle className="w-4 h-4 text-rose-500" />
    },
    {
      id: 'checklist',
      title: 'Checklist Kesiapan Sekolah',
      shortDesc: '10 butir periksa kesiapan harian',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      badge: 'Audit'
    }
  ], []);

  // Filtered categories based on search input
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.shortDesc.toLowerCase().includes(q)
    );
  }, [searchQuery, categories]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsvTemplate = () => {
    const headers = 'NISN,NamaLengkap,Kelas,JenisKelamin,NamaWali,NoWhatsAppWali,Status\n';
    const sampleRows = [
      '0081234567,Ahmad Fauzan Pratama,7A,L,Bambang Pratama,081234567890,AKTIF',
      '0081234568,Siti Nurhaliza,7A,P,Herman Wijaya,081234567891,AKTIF',
      '0071234569,Muhammad Rizky Ramadhan,8A,L,Agus Ramadhan,081234567892,AKTIF',
      '0071234570,Fathia Rahmawati,8A,P,Budi Rahmanto,081234567893,AKTIF',
      '0061234571,Zaki Al-Faruq,9A,L,Supriyadi,081234567894,AKTIF'
    ].join('\n');
    
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + sampleRows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'template_import_siswa_smp_nurul_huda.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const totalChecklistCount = Object.keys(checklist).length;
  const checklistPercentage = Math.round((completedChecklistCount / totalChecklistCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buku Manual & Panduan Resmi Aplikasi Presensi Digital</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Buku Panduan Lengkap Operasional Presensi QR
              <span className="block text-emerald-400 font-bold text-lg sm:text-xl mt-1">
                {schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura'}
              </span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Panduan langkah demi langkah dan petunjuk teknis operasional sistem presensi digital sekolah: pemindaian kartu di gerbang, pengaturan sapaan suara TTS, presensi jam pelajaran & jurnal KBM guru, sinkronisasi Google Sheets live, notifikasi WhatsApp ke wali murid, hingga panduan perangkat keras.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Zona Waktu: <strong>{schoolProfile?.zonaWaktu || 'WIT'}</strong> (Jayapura)</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>Hak Akses: <strong>{currentUserRole}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mendukung HP Android, iOS, Laptop & PC</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-2 transition shadow-sm active:scale-95 cursor-pointer"
              title="Cetak Panduan Lengkap atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('scan')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-900/30 active:scale-95 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Buka Scanner Gerbang</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Sidebar Navigation & Search */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari panduan (scanner, sheets, wa, jurnal, kartu, tts)..."
              className="w-full pl-9 pr-14 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>

          {/* Navigation Menu List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm space-y-1 overflow-hidden">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Isi Buku Panduan</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-600 dark:text-slate-400">
                {filteredCategories.length} Bab
              </span>
            </div>

            <div className="space-y-1 max-h-[580px] overflow-y-auto pr-1">
              {filteredCategories.map((item) => {
                const isActive = activeCategory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveCategory(item.id)}
                    className={`w-full text-left p-2.5 rounded-2xl transition flex items-start space-x-3 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 dark:bg-emerald-950/50 text-white dark:text-emerald-300 shadow-md font-semibold border border-slate-800 dark:border-emerald-800/40'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs truncate">{item.title}</span>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isActive
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-slate-300 dark:text-emerald-400/80' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {item.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-3xl border border-emerald-200 dark:border-emerald-900/40 p-4 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-bold">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Uji Coba Cepat Sistem</span>
            </div>
            <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
              Anda dapat menguji sapaan suara TTS atau sinkronisasi Google Sheets asli dengan sekali klik.
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              {onOpenVoiceModal && (
                <button
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center justify-center space-x-1.5 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Uji Suara TTS Sekarang</span>
                </button>
              )}
              {onOpenGasModal && (
                <button
                  type="button"
                  onClick={onOpenGasModal}
                  className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] flex items-center justify-center space-x-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Koneksi Live Google Sheets</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Detailed Guide Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: ALUR SINGKAT & QUICK START */}
          {activeCategory === 'quickstart' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Alur Cepat 5 Menit</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Langkah Awal Memulai Operasional di Sekolah
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Urutan persiapan harian standar yang disarankan bagi Operator Sekolah dan Guru Piket dari cetak kartu hingga laporan rekap sore.
                </p>
              </div>

              {/* Workflow Timeline Cards */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                    1
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Cetak Kartu Siswa Ber-QR Code (Batch / Massal)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Buka tab <strong>3. Kelola Data Siswa</strong>, lalu klik tombol <strong>&quot;Cetak Kartu Massal (Batch)&quot;</strong>. Anda dapat mencetak kartu satu kelas atau seluruh sekolah sekaligus (Standar ukuran kartu CR80 54x86 mm). Kartu sudah memuat foto/avatar, nama siswa, kelas, NISN, dan QR Code siap scan.
                    </p>
                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('siswa')}
                        className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline pt-1 cursor-pointer"
                      >
                        <span>Menuju Data Siswa & Cetak Kartu</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-sky-600/30">
                    2
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Siapkan Perangkat Scanner di Meja Piket Gerbang
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Buka tab <strong>1. Scan QR Presensi</strong> pada laptop atau tablet sekolah. Pastikan izin kamera aktif (Allow Camera), atau hubungkan Barcode Scanner USB / Wireless fisik. Nyalakan toggle <strong>&quot;Suara TTS&quot;</strong> di header agar sistem otomatis menyebut nama siswa dan jam hadir dengan ramah dan terdengar ke siswa.
                    </p>
                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('scan')}
                        className="inline-flex items-center space-x-1 text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline pt-1 cursor-pointer"
                      >
                        <span>Buka Scanner Gerbang</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
                    3
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Koneksikan ke Google Sheets Asli (Live Sync Cloud)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Klik tombol <strong>&quot;Live Sheets&quot;</strong> di bar atas, masukkan URL Web App Google Apps Script Anda (akhiran <code>/exec</code>), lalu klik <strong>&quot;Uji Koneksi (Ping)&quot;</strong>. Setiap kali siswa men-scan kartu di gerbang, baris data akan otomatis masuk ke spreadsheet Google Drive sekolah secara *real-time* tanpa jeda!
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-teal-600/30">
                    4
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Guru Mapel Mengisi Presensi & Jurnal KBM di Kelas
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Buka tab <strong>7. Presensi Mapel & Jurnal KBM</strong>. Guru memilih kelas (7A s.d. 9B), jam pelajaran (jam 1-10), klik <strong>&quot;Hadir Semua (H)&quot;</strong> jika lengkap, masukkan materi pembelajaran dan catatan hambatan kelas, lalu simpan.
                    </p>
                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('jurnal')}
                        className="inline-flex items-center space-x-1 text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline pt-1 cursor-pointer"
                      >
                        <span>Buka Presensi Mapel & Jurnal KBM</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-amber-600/30">
                    5
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Rekap Sore, Notifikasi WhatsApp & Cetak Laporan Resmi
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Buka tab <strong>4. Dashboard & Rekap</strong> untuk melihat persentase kehadiran siswa, rekap per kelas, siswa terlambat atau alpa. Klik tombol <strong>&quot;Kirim WA Massal (Alpa)&quot;</strong> untuk menyapa wali murid, atau unduh laporan berformat <strong>Excel (.xlsx)</strong> dan <strong>PDF resmi bertanda tangan Kepala Sekolah</strong>.
                    </p>
                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('laporan')}
                        className="inline-flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline pt-1 cursor-pointer"
                      >
                        <span>Buka Dashboard & Rekap Laporan</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PANDUAN FULL ONLINE & GO-LIVE */}
          {activeCategory === 'full_online' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Panduan Go-Live & Akses Publik</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Menjadikan Aplikasi Full Online untuk Semua Pengguna
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Seluruh rekomendasi infrastruktur, konfigurasi database cloud, distribusi akun, dan SOP operasional agar aplikasi dapat diakses lancar oleh seluruh guru, staf, siswa, dan orang tua murid secara online.
                </p>
              </div>

              {/* Status URL Publik Saat Ini */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-900 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-xs sm:text-sm text-sky-200 uppercase tracking-wider">
                      Link Akses Publik Aplikasi Anda (Siap Pakai)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    HTTPS Aktif 24 Jam
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/80">
                  <code className="text-xs font-mono text-emerald-300 flex-1 truncate select-all px-1">
                    https://ais-pre-pe4adta6rgzxnkwdsgfufq-1030323294793.asia-southeast1.run.app
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyText('https://ais-pre-pe4adta6rgzxnkwdsgfufq-1030323294793.asia-southeast1.run.app', 'pub-url')}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'pub-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pub-url' ? 'Tersalin!' : 'Salin Link'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Link ini sudah aktif di cloud server Google Cloud Run, dapat dibuka dari browser HP Android, iPhone, tablet, maupun laptop di mana saja tanpa perlu install aplikasi tambahan atau jaringan khusus.
                </p>
              </div>

              {/* 5 Rekomendasi Utama Full Online */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <Server className="w-4 h-4 text-emerald-500" />
                  <span>5 Rekomendasi Kunci Agar Aplikasi Berjalan Full Online Maksimal:</span>
                </h3>

                {/* Rekomendasi 1: Live Sheets Database */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-purple-900 dark:text-purple-300 flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                      <span>Hubungkan ke Google Sheets Asli (Live Sync Cloud)</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Wajib Dilakukan
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Agar presensi yang di-scan di laptop gerbang langsung tersinkronisasi ke HP guru kelas dan portal siswa secara online, Anda wajib menempelkan <strong>URL Web App Google Apps Script</strong> (akhiran <code>/exec</code>) di menu <strong>Live Sheets</strong>. Data akan tersimpan aman di Google Drive sekolah selamanya tanpa biaya langganan database!
                  </p>
                  {onOpenGasModal && (
                    <button
                      type="button"
                      onClick={onOpenGasModal}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Buka Panel Koneksi Google Sheets</span>
                    </button>
                  )}
                </div>

                {/* Rekomendasi 2: Distribusi Link & Akun Pengguna */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">2</span>
                    <span>Distribusi Link & Akun ke Guru, Siswa, dan Wali Murid</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Bagikan link aplikasi melalui WhatsApp grup sekolah atau surat edaran resmi. Gunakan struktur akun standar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <strong className="text-rose-600">🛡️ Akun Admin:</strong><br />
                      User: <code>admin</code><br />
                      Pass: <code>admin123</code>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <strong className="text-sky-600">👨‍🏫 Akun Guru Piket:</strong><br />
                      User: <code>guru</code><br />
                      Pass: <code>guru123</code>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <strong className="text-emerald-600">🎓 Akun Siswa:</strong><br />
                      User: <code>NISN Masing-masing</code><br />
                      Pass: <code>1234</code> / <code>siswa123</code>
                    </div>
                  </div>
                </div>

                {/* Rekomendasi 3: Pasang PWA di HP Wali Murid & Guru */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">3</span>
                    <span>Pasang Aplikasi di Layar Utama HP (PWA Tanpa Play Store)</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Himbau guru dan wali murid untuk menekan tombol <strong>&quot;Tambahkan ke Layar Utama&quot; (Add to Home screen)</strong> di browser Chrome/Safari masing-masing. Aplikasi akan terpasang dengan ikon resmi logo SMP Nurul Huda Jayapura di menu ponsel, bekerja lebih cepat, dan bisa dibuka saat kuota internet tipis (offline-ready).
                  </p>
                </div>

                {/* Rekomendasi 4: Koneksi Internet Meja Piket Gerbang */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">4</span>
                    <span>Jaringan Meja Piket Gerbang & Hotspot Cadangan</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Pastikan meja piket di gerbang sekolah mendapatkan jangkauan sinyal Wi-Fi sekolah yang stabil. Siapkan modem 4G router kecil atau tethering HP sebagai cadangan. Namun jika internet sempat mati sesaat di Jayapura, jangan khawatir! Pemindai tetap bekerja normal secara offline dan data otomatis di-upload begitu internet kembali tersambung.
                  </p>
                </div>

                {/* Rekomendasi 5: Custom Domain Sekolah */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">5</span>
                    <span>Opsi Domain Resmi Sekolah (Misal: presensi.smpnurulhudajayapura.sch.id)</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Untuk meningkatkan wibawa institusi, sekolah dapat menghubungkan subdomain web resmi sekolah (seperti <code>presensi.smpnurulhudajayapura.sch.id</code>) melalui DNS CNAME Cloudflare atau konfigurasi domain Google Cloud Run secara gratis.
                  </p>
                </div>
              </div>

              {/* Template Chat Siap Sebar ke WhatsApp Wali Murid */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 flex items-center space-x-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Template Pesan WhatsApp Siap Sebar ke Wali Murid / Guru</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`*PEMBERITAHUAN APLIKASI PRESENSI DIGITAL SMP NURUL HUDA JAYAPURA*\n\nAssalamu'alaikum Wr. Wb.\nBapak/Ibu Orang Tua/Wali Murid dan Dewan Guru yang kami hormati,\n\nUntuk meningkatkan ketertiban dan kedisiplinan siswa, SMP Nurul Huda Jayapura kini memberlakukan Sistem Presensi Digital Berbasis QR Code.\n\nAplikasi dapat diakses online melalui tautan berikut:\n👉 https://ais-pre-pe4adta6rgzxnkwdsgfufq-1030323294793.asia-southeast1.run.app\n\n📌 *Panduan Akses Siswa & Orang Tua:*\n1. Buka tautan di atas melalui browser HP (Chrome / Safari).\n2. Pilih tab login *SISWA*.\n3. Masukkan Username: *NISN Siswa* (contoh: 0081234567) dan Password: *1234* atau *siswa123*.\n4. Orang tua dapat melihat kartu digital siswa, mengecek riwayat kehadiran, serta mengirimkan surat izin sakit secara online.\n\nDemikian pemberitahuan ini. Terima kasih atas kerja sama Bapak/Ibu sekalian.\n\nWassalamu'alaikum Wr. Wb.\n*Kepala SMP Nurul Huda Jayapura*`, 'wa-broadcast')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedKey === 'wa-broadcast' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'wa-broadcast' ? 'Tersalin!' : 'Salin Teks Broadcast'}</span>
                  </button>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  *PEMBERITAHUAN APLIKASI PRESENSI DIGITAL SMP NURUL HUDA JAYAPURA*<br /><br />
                  Assalamu&apos;alaikum Wr. Wb.<br />
                  Bapak/Ibu Orang Tua/Wali Murid dan Dewan Guru yang kami hormati,<br /><br />
                  Untuk meningkatkan ketertiban dan kedisiplinan siswa, SMP Nurul Huda Jayapura kini memberlakukan Sistem Presensi Digital Berbasis QR Code.<br /><br />
                  Aplikasi dapat diakses online melalui tautan berikut:<br />
                  👉 https://ais-pre-pe4adta6rgzxnkwdsgfufq-1030323294793.asia-southeast1.run.app<br /><br />
                  📌 *Panduan Akses Siswa &amp; Orang Tua:*<br />
                  1. Buka tautan di atas melalui browser HP (Chrome / Safari).<br />
                  2. Pilih tab login *SISWA*.<br />
                  3. Masukkan Username: *NISN Siswa* dan Password: *1234*.<br />
                  4. Orang tua dapat melihat kartu digital siswa, mengecek riwayat kehadiran, serta mengirimkan surat izin sakit secara online.<br /><br />
                  Wassalamu&apos;alaikum Wr. Wb.<br />
                  *Kepala SMP Nurul Huda Jayapura*
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PANDUAN ADMINISTRATOR */}
          {activeCategory === 'admin' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Modul Administrator & Operator</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Pengelolaan Sekolah, Sesi, dan Akun
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tanggung jawab administrator meliputi pengaturan institusi, data siswa, sesi QR, dan konfigurasi API eksternal.
                </p>
              </div>

              <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {/* 1. Profil Sekolah & Guru Mapel */}
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-rose-900 dark:text-rose-300 flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-rose-600" />
                      <span>1. Profil Sekolah & Guru Mata Pelajaran</span>
                    </h3>
                    {onOpenSchoolSettings && (
                      <button
                        type="button"
                        onClick={onOpenSchoolSettings}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 transition cursor-pointer"
                      >
                        Buka Pengaturan
                      </button>
                    )}
                  </div>
                  <p>
                    Klik tombol <strong>&quot;Pengaturan Sekolah & Guru&quot;</strong> di bilah atas untuk mengatur:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong>Nama Sekolah & NPSN:</strong> Nama resmi yang tercetak pada kartu pelajar dan kop surat laporan (contoh: SMP Nurul Huda Jayapura).</li>
                    <li><strong>Logo Sekolah:</strong> Mengunggah gambar lambang sekolah atau menggunakan logo terintegrasi.</li>
                    <li><strong>Kepala Sekolah & NIP:</strong> Pejabat penandatangan laporan rekap bulanan dan surat panggilan ortu.</li>
                    <li><strong>Jam Operasional:</strong> Jam Masuk (default 07:00 WIT), Batas Toleransi Terlambat (07:15 WIT), dan Jam Pulang (13:30 WIT).</li>
                    <li><strong>Daftar Guru & Mapel:</strong> Menambah daftar guru pengampu dan mata pelajaran untuk modul Jurnal KBM.</li>
                  </ul>
                </div>

                {/* 2. Manajemen Data Siswa */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    2. Mengelola Database Siswa & Cetak Kartu
                  </h3>
                  <p>
                    Di tab <strong>3. Kelola Data Siswa</strong>, Administrator memiliki hak penuh untuk:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong>Tambah Siswa Baru:</strong> Input NISN, Nama Lengkap, Kelas (7A, 7B, 8A, 8B, 9A, 9B, dst.), Nama Orang Tua, dan Nomor WhatsApp Orang Tua (dengan awalan 08 atau 62).</li>
                    <li><strong>Pencarian & Filter Cepat:</strong> Menyaring siswa berdasarkan kelas atau mengetik nama pada kolom pencarian.</li>
                    <li><strong>Import Data Massal:</strong> Memasukkan ratusan siswa sekaligus menggunakan file Excel / CSV (lihat bab Format Excel).</li>
                    <li><strong>Cetak Kartu Satuan atau Massal:</strong> Menghasilkan kartu ID Card QR beresolusi tinggi siap cetak dan laminating.</li>
                  </ul>
                </div>

                {/* 3. Generator Sesi QR */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    3. Generator Sesi QR (Presensi Dinamis)
                  </h3>
                  <p>
                    Tab <strong>2. Generator Sesi QR</strong> digunakan jika sekolah ingin menampilkan QR Code di layar proyektor lobi sekolah yang berganti setiap 30 detik (*Anti-Foto / Anti-Titip Absen*).
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong>Sesi Masuk:</strong> Aktif dari pukul 06:00 s.d. 08:00 WIT.</li>
                    <li><strong>Sesi Pulang:</strong> Aktif dari pukul 12:30 s.d. 15:00 WIT.</li>
                    <li><strong>Toggle Absen Mandiri:</strong> Administrator dapat mengaktifkan atau mematikan izin siswa men-scan QR menggunakan HP pribadi.</li>
                  </ul>
                </div>

                {/* 4. Reset Database */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Perhatian: Fitur Reset Data Sekolah</span>
                  </h4>
                  <p className="text-[11px] text-amber-900 dark:text-amber-200">
                    Pada tab <strong>6. Database Sheets Live</strong>, terdapat tombol reset untuk mengembalikan data awal jika ingin memulai semester/tahun ajaran baru. Pastikan telah mengunduh backup laporan Excel terlebih dahulu sebelum melakukan reset!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: PANDUAN GURU PIKET GERBANG */}
          {activeCategory === 'guru' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Modul Guru Piket Gerbang</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Guru Piket Meja Gerbang & Pemindaian Kartu
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Petunjuk praktis bagi guru piket pagi dan siang saat menyambut dan memindai kartu presensi siswa.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {/* Scanner Gerbang */}
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-sky-900 dark:text-sky-300 flex items-center space-x-2">
                    <QrCode className="w-4 h-4 text-sky-600" />
                    <span>A. Menjalankan Scanner Presensi di Gerbang</span>
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                    <li>Buka menu <strong>1. Scan QR Presensi</strong>.</li>
                    <li>Pilih mode: <strong>&quot;Presensi Masuk&quot;</strong> (pagi hari) atau <strong>&quot;Presensi Pulang&quot;</strong> (siang hari).</li>
                    <li>Arahkan kamera ke kartu QR siswa, atau gunakan Barcode Scanner USB fisik.</li>
                    <li>Sistem otomatis mendeteksi:
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-600 dark:text-slate-400">
                        <li><strong>Sebelum 07:15 WIT:</strong> Status <span className="text-emerald-600 font-bold">HADIR (Tepat Waktu)</span> dengan bunyi chime sukses & suara sapaan TTS ramah.</li>
                        <li><strong>Setelah 07:15 WIT:</strong> Status <span className="text-amber-600 font-bold">TERLAMBAT</span> dengan peringatan suara audio.</li>
                        <li><strong>Scan kedua kali:</strong> Ditolak oleh sistem <span className="text-rose-600 font-bold">(Duplikat Tercegah)</span>.</li>
                      </ul>
                    </li>
                    <li><strong>Jika Siswa Lupa Kartu:</strong> Guru dapat mengklik tombol <em>&quot;Input Presensi Manual&quot;</em>, memilih nama siswa, status, dan menuliskan catatan.</li>
                  </ol>
                </div>

                {/* Penanganan Khusus */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    <span>B. Verifikasi Surat Izin / Sakit dari Siswa</span>
                  </h3>
                  <p className="text-[11px]">
                    Di tab <strong>4. Dashboard & Rekap &gt; Persetujuan Izin Online</strong>, guru piket dapat memeriksa pengajuan izin sakit siswa yang masuk, melihat foto surat dokter atau surat tulisan tangan orang tua, lalu menyetujui (*Approve*) atau menolak (*Reject*). Saat disetujui, status siswa otomatis tercatat sebagai <strong>IZIN</strong> atau <strong>SAKIT</strong> pada rekapan harian.
                  </p>
                </div>

                {/* Deteksi Alpa 3 Hari */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>C. Peringatan Dini Siswa Alpa 3 Hari Berturut-turut</span>
                  </h3>
                  <p className="text-[11px]">
                    Sistem secara otomatis mendeteksi siswa yang tidak hadir 3 hari berturut-turut tanpa keterangan. Banner peringatan merah akan muncul di dashboard. Guru piket atau Wali Kelas dapat langsung mencetak <strong>Surat Panggilan Orang Tua</strong> resmi berlogo sekolah dan mengirimkan pesan WhatsApp darurat ke nomor wali murid.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: PRESENSI MAPEL & JURNAL KBM */}
          {activeCategory === 'jurnal' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Modul Guru Mata Pelajaran</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Presensi Jam Pelajaran & Jurnal KBM di Kelas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mencatat kehadiran per rombel kelas tatap muka dan dokumentasi materi pelajaran harian.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-teal-900 dark:text-teal-300 flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span>Langkah Pengisian Jurnal KBM & Absensi Rombel</span>
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                    <li>Buka menu <strong>7. Presensi Mapel & Jurnal KBM</strong>.</li>
                    <li>Pilih Kelas (misal <strong>7A, 8B, 9A</strong>). Sistem langsung memuat daftar siswa rombel tersebut.</li>
                    <li>Pilih Tanggal dan <strong>Jam Pelajaran</strong> (pilihan Jam 1-2, Jam 3-4, Jam 5-6, Jam 7-8, atau Jam 9-10).</li>
                    <li>Pilih Mata Pelajaran (misal: <em>Matematika, IPA, Bahasa Indonesia, PAI, PJOK, Bahasa Inggris</em>) dan Nama Guru Pengampu.</li>
                    <li>Klik tombol hijau <strong>&quot;Hadir Semua (H)&quot;</strong> jika seluruh siswa hadir di kelas agar tidak perlu mengklik satu per satu.</li>
                    <li>Jika ada siswa yang tidak hadir, klik tombol status pada baris siswa yang bersangkutan:
                      <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">H: Hadir</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">S: Sakit</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">I: Izin</span>
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">A: Alpa</span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">D: Dispensasi</span>
                      </div>
                    </li>
                    <li>Tuliskan <strong>Materi Pokok / Topik Pembelajaran</strong> (misal: <em>Persamaan Linear Satu Variabel - Latihan Soal Halaman 45</em>).</li>
                    <li>Tuliskan <strong>Catatan / Hambatan Pembelajaran</strong> jika ada (misal: <em>2 siswa perlu bimbingan remidi, proyektor ruang kelas sempat redup</em>).</li>
                    <li>Klik tombol <strong>&quot;Simpan Jurnal & Presensi Mapel&quot;</strong>.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Manfaat Presensi Mapel bagi Sekolah
                  </h3>
                  <p className="text-[11px]">
                    Presensi mapel membedakan siswa yang hadir di gerbang pagi namun bolos di jam pelajaran tertentu (*cabut kelas*). Kepala Sekolah dan Tim Kurikulum dapat melihat statistik keterlaksanaan KBM setiap guru secara transparan dan akuntabel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: PANDUAN SISWA & WALI */}
          {activeCategory === 'siswa' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Modul Siswa & Orang Tua / Wali</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Portal Siswa & Kartu Digital
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Petunjuk bagi siswa dan wali murid untuk mengakses kartu pelajar, riwayat presensi, dan mengajukan izin.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    1. Cara Masuk (Login) Siswa
                  </h3>
                  <p>
                    Siswa dapat membuka link aplikasi di smartphone masing-masing, memilih tab <strong>&quot;Siswa&quot;</strong> pada layar masuk:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong>Username:</strong> Masukkan NISN resmi siswa (contoh: <code>0081234567</code>).</li>
                    <li><strong>Kata Sandi Default:</strong> <code>siswa123</code> (atau PIN yang diberikan wali kelas).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    2. Kartu Pelajar Digital Pribadi
                  </h3>
                  <p>
                    Di tab <strong>Kartu Siswa</strong>, siswa dapat melihat kartu pelajar digital resmi dengan QR Code NISN pribadi. Kartu ini dapat disimpan sebagai gambar (*screenshot* atau unduh) dan ditunjukkan ke kamera gerbang saat kartu fisik tertinggal di rumah.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    3. Presensi Mandiri Berbasis Radius GPS (Geofencing)
                  </h3>
                  <p>
                    Jika sekolah mengaktifkan fitur <em>Presensi Mandiri</em>, siswa dapat menekan tombol <strong>&quot;Scan HP&quot;</strong> di ponsel masing-masing:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li>Siswa harus berada di dalam radius gerbang sekolah (maksimal 150 meter dari titik koordinat SMP Nurul Huda Jayapura).</li>
                    <li>Ponsel akan meminta izin lokasi (*GPS*). Jika berada di luar radius, presensi akan otomatis ditolak untuk mencegah kecurangan absen dari rumah.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    4. Mengajukan Surat Izin / Sakit Online
                  </h3>
                  <p>
                    Jika siswa berhalangan hadir ke sekolah:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                    <li>Buka tab <strong>Izin/Sakit</strong> di portal siswa.</li>
                    <li>Pilih jenis izin (Sakit atau Izin Keperluan Keluarga).</li>
                    <li>Tentukan tanggal mulai dan selesai.</li>
                    <li>Tuliskan alasan lengkap dan unggah foto surat keterangan dokter atau surat dari orang tua.</li>
                    <li>Klik <strong>&quot;Kirim Pengajuan Izin&quot;</strong> untuk langsung diverifikasi guru piket.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: GOOGLE SHEETS & APPS SCRIPT */}
          {activeCategory === 'sheets' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Integrasi Cloud Database</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Setup Google Sheets & Google Apps Script
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cara menghubungkan aplikasi ini ke spreadsheet Google Drive sekolah Anda secara gratis tanpa langganan server.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {/* Step A */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-purple-900 dark:text-purple-300">
                      Langkah 1: Buat Spreadsheet Baru di Google Drive
                    </h3>
                    <a 
                      href="https://sheets.new" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                    >
                      <span>Buka sheets.new</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                  <p>
                    Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-purple-700 dark:text-purple-400 font-bold underline inline-flex items-center space-x-0.5"><span>sheets.new</span><ExternalLink className="w-3 h-3 ml-0.5" /></a> menggunakan akun Google sekolah (misal akun belajar.id atau Gmail sekolah). Beri judul spreadsheet: <strong>Database Presensi SMP Nurul Huda Jayapura</strong>.
                  </p>
                </div>

                {/* Step B */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Langkah 2: Buka Apps Script &amp; Salin Skrip 1-File Siap Pakai
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                    <li>Di menu atas Google Sheets, klik <strong>Ekstensi (Extensions) &gt; Apps Script</strong>.</li>
                    <li>Editor kode Apps Script akan terbuka di tab baru.</li>
                    <li>Hapus seluruh teks bawaan pada berkas <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">Code.gs</code>.</li>
                    <li>Salin skrip <strong>Code_Tunggal_Siap_Pakai.gs</strong> dari tab <em>Source Code Google Apps Script</em> di aplikasi ini (atau klik tombol cepat di bawah).</li>
                    <li>Tempelkan (Paste) ke editor Apps Script dan klik ikon <strong>Simpan (Disket)</strong>.</li>
                  </ol>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const code = GAS_FILES[0]?.code || '';
                        navigator.clipboard.writeText(code);
                        setCopiedKey('gas_full_script');
                        setTimeout(() => setCopiedKey(null), 2500);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs inline-flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                    >
                      {copiedKey === 'gas_full_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'gas_full_script' ? 'Skrip Berhasil Tersalin!' : 'Salin Skrip Lengkap Siap Pakai (1-File)'}</span>
                    </button>
                  </div>
                </div>

                {/* Step C */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2.5">
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                    Langkah 3: Jalankan Fungsi &quot;setupDatabase&quot; &amp; Berikan Izin Akun Google
                  </h3>
                  <p>
                    Pada dropdown pilihan fungsi di toolbar atas Apps Script, pilih fungsi <code className="font-bold text-amber-800 dark:text-amber-300 font-mono bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">setupDatabase</code> lalu klik <strong>Jalankan (Run)</strong>.
                  </p>
                  
                  {/* Auth Callout */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-amber-300 dark:border-amber-700/60 text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Panduan Melewati Layar Otorisasi Google (Wajar untuk Skrip Sendiri):</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 pl-1">
                      <li>Saat pop-up muncul, klik tombol <strong>Tinjau Izin (Review Permissions)</strong>.</li>
                      <li>Pilih akun Google Anda yang sedang aktif.</li>
                      <li>Akan muncul layar peringatan bertuliskan <em>&quot;Google belum memverifikasi aplikasi ini&quot;</em>.</li>
                      <li>Klik tautan kecil <strong>Lanjutan (Advanced)</strong> di bagian kiri bawah pop-up.</li>
                      <li>Klik <strong>Buka Presensi QR (tidak aman) / Go to Presensi QR (unsafe)</strong>.</li>
                      <li>Klik tombol biru <strong>Izinkan (Allow)</strong>.</li>
                    </ol>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 italic">
                      *Setelah diizinkan, skrip akan otomatis membuat tabel: PRESENSI, SISWA, SESI_QR, USERS, dan PENGATURAN lengkap dengan format warna resmi sekolah.
                    </p>
                  </div>
                </div>

                {/* Step D */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-purple-900 dark:text-purple-300">
                    Langkah 4: Deploy sebagai Web App (Penerapan Baru)
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                    <li>Di pojok kanan atas Apps Script, klik tombol biru <strong>Deploy (Terapkan) &gt; New deployment (Penerapan baru)</strong>.</li>
                    <li>Klik ikon gerigi di sebelah kiri <em>Select type</em>, lalu pilih <strong>Web app</strong>.</li>
                    <li>Beri deskripsi singkat, misalnya: <code className="bg-purple-100 dark:bg-purple-900 px-1 py-0.5 rounded font-mono">Webhook Presensi v1.0</code>.</li>
                    <li>Pada <strong>Execute as (Jalankan sebagai)</strong>: pilih <strong>Me / Saya (email Anda)</strong>.</li>
                    <li>Pada <strong className="text-rose-600 dark:text-rose-400">Who has access (Siapa yang memiliki akses)</strong>: WAJIB pilih <span className="underline decoration-rose-500 font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded">Anyone (Siapa saja)</span>.</li>
                    <li>Klik tombol <strong>Deploy</strong>.</li>
                    <li>Salin <strong>Web App URL</strong> yang dihasilkan (URL resmi yang berakhiran <code className="font-mono font-bold text-purple-700 dark:text-purple-300">/exec</code>).</li>
                  </ol>
                </div>

                {/* Step E */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                  <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Langkah 5: Masukkan Web App URL ke Aplikasi Ini &amp; Uji Koneksi</span>
                  </h3>
                  <p>
                    Buka modal <strong>Sinkronisasi Sheets (GAS Live)</strong> di aplikasi ini, tempelkan Web App URL yang tadi disalin, lalu klik <strong>Uji Koneksi Ping ke GAS</strong>. Jika lampu hijau menyala dan muncul pesan sukses, Google Sheets Anda telah terhubung secara real-time!
                  </p>
                  {onOpenGasModal && (
                    <button
                      type="button"
                      onClick={onOpenGasModal}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-sm"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Buka Modal Koneksi Live Sheets Sekarang</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: WHATSAPP NOTIFIKASI */}
          {activeCategory === 'whatsapp' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Send className="w-3.5 h-3.5" />
                  <span>Komunikasi Wali Murid</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Notifikasi WhatsApp Otomatis ke Wali Murid
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kirim laporan kedatangan dan kepulangan langsung ke chat WhatsApp orang tua siswa.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    1. Format Nomor Telepon Orang Tua yang Benar
                  </h3>
                  <p>
                    Pastikan nomor WhatsApp orang tua di data siswa menggunakan format internasional atau angka lokal yang valid:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                    <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300">
                      <strong>Format Benar:</strong><br />
                      081234567890 atau 6281234567890
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300">
                      <strong>Format Salah:</strong><br />
                      +62-812-3456 (menggunakan spasi atau tanda hubung)
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    2. Contoh Template Pesan WhatsApp Resmi yang Terkirim
                  </h3>
                  
                  {/* Template Box 1: Hadir Tepat Waktu */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1 font-mono">
                    <div className="flex items-center justify-between text-emerald-600 font-bold">
                      <span>Pemberitahuan Hadir:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`*PRESENSI SMP NURUL HUDA JAYAPURA*\n\nYth. Bapak/Ibu Wali dari *Ahmad Faiz* (Kelas 8A),\n\nAlhamdulillah, ananda telah tiba di sekolah dan melakukan presensi *MASUK* pada pukul *06:45 WIT* dengan status *Tepat Waktu*.\n\nTerima kasih atas kerja sama Bapak/Ibu.`, 'wa1')}
                        className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedKey === 'wa1' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'wa1' ? 'Tersalin' : 'Salin Template'}</span>
                      </button>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      *PRESENSI SMP NURUL HUDA JAYAPURA*<br /><br />
                      Yth. Bapak/Ibu Wali dari *Ahmad Faiz* (Kelas 8A),<br /><br />
                      Alhamdulillah, ananda telah tiba di sekolah dan melakukan presensi *MASUK* pada pukul *06:45 WIT* dengan status *Tepat Waktu*.<br /><br />
                      Terima kasih atas kerja sama Bapak/Ibu.
                    </div>
                  </div>

                  {/* Template Box 2: Terlambat */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1 font-mono">
                    <div className="flex items-center justify-between text-amber-600 font-bold">
                      <span>Pemberitahuan Terlambat:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`*PERINGATAN KETERLAMBATAN SMP NURUL HUDA*\n\nYth. Bapak/Ibu Wali dari *Rizky Ramadhan* (Kelas 7B),\n\nAnanda tercatat hadir pada pukul *07:28 WIT* (Status: *Terlambat*). Mohon bantuan Bapak/Ibu untuk membimbing ananda agar berangkat lebih awal esok hari.\n\nSalam hormat,\nGuru Piket SMP Nurul Huda Jayapura.`, 'wa2')}
                        className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedKey === 'wa2' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'wa2' ? 'Tersalin' : 'Salin Template'}</span>
                      </button>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      *PERINGATAN KETERLAMBATAN SMP NURUL HUDA*<br /><br />
                      Yth. Bapak/Ibu Wali dari *Rizky Ramadhan* (Kelas 7B),<br /><br />
                      Ananda tercatat hadir pada pukul *07:28 WIT* (Status: *Terlambat*). Mohon bantuan Bapak/Ibu untuk membimbing ananda agar berangkat lebih awal esok hari.<br /><br />
                      Salam hormat,<br />Guru Piket SMP Nurul Huda Jayapura.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    3. Integrasi Gateway WhatsApp (Meta Cloud API / Fonnte)
                  </h3>
                  <p>
                    Aplikasi mendukung gateway resmi Meta Cloud API (Graph API) maupun gateway multi-device lokal (Fonnte, Wablas, atau Baileys Gateway) yang dapat dikonfigurasi pada menu <strong>5. Integrasi WhatsApp Resmi</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: SUARA SAPAAN TTS & CHIME */}
          {activeCategory === 'voice' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio & Pengalaman Pengguna</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Suara Sapaan Otomatis (TTS) & Melodi Chime
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Menjadikan gerbang sekolah lebih ramah, interaktif, dan modern dengan sapaan nama siswa secara otomatis.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-300">
                    Cara Mengaktifkan Suara Sapaan
                  </h3>
                  <p>
                    Klik tombol <strong>&quot;Suara TTS [ON/OFF]&quot;</strong> di bilah atas atau pada panel scanner gerbang. Anda dapat mengatur:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong>Volume Suara:</strong> Mengatur keras/lembutnya audio speaker (0% - 100%).</li>
                    <li><strong>Kecepatan Bicara:</strong> Rekomendasi 1.0x (normal) atau 1.1x (cepat untuk antrean padat).</li>
                    <li><strong>Gaya Sapaan:</strong> Pilihan gaya *Ramah & Hangat*, *Cepat & Ringkas*, atau *Formal Sekolah*.</li>
                    <li><strong>Melodi Chime:</strong> Nada digital *two-tone* yang berbunyi sebelum suara berbicara.</li>
                  </ul>
                  {onOpenVoiceModal && (
                    <button
                      type="button"
                      onClick={onOpenVoiceModal}
                      className="mt-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Buka Panel Pengaturan Suara TTS</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Catatan Penting Autoplay Browser:</span>
                  </h4>
                  <p className="text-[11px] text-amber-900 dark:text-amber-200">
                    Browser modern (Chrome, Edge, Safari) membatasi audio berbunyi otomatis sebelum pengguna melakukan minimal 1 kali klik/sentuhan pada layar. Sebelum siswa pertama melakukan scan, pastikan petugas piket telah mengklik tombol atau menguji suara di panel scanner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: PERANGKAT & HARDWARE */}
          {activeCategory === 'hardware' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Spesifikasi Alat & Fisik</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Perangkat Keras (Hardware) & Percetakan ID Card
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Rekomendasi peralatan yang terbukti handal, cepat, dan ekonomis untuk meja gerbang sekolah.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                    A. Pilihan Alat Scanner di Gerbang
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Laptop className="w-4 h-4 text-indigo-500" />
                        <span>1. Barcode Scanner USB Fisik (Sangat Direkomendasikan)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Gunakan Barcode Scanner 2D (tipe tembak atau handsfree desktop). Colokkan ke port USB laptop. Begitu siswa mendekatkan kartu, scanner membaca kurang dari 0.2 detik dan langsung mencatat absensi tanpa perlu menyentuh mouse!
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        <span>2. Kamera Laptop / HP Android Guru</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Jika belum memiliki scanner tembak USB, guru piket dapat langsung menggunakan kamera HP atau webcam laptop. Pastikan pencahayaan cukup dan kartu berjarak sekitar 15-20 cm dari lensa.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    B. Rekomendasi Bahan Cetak Kartu Pelajar
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11px]">
                    <li><strong>Ukuran Standar ID Card:</strong> CR-80 (54 mm x 86 mm) sesuai standar kartu ATM / KTP.</li>
                    <li><strong>Bahan Praktis Ekonomis:</strong> Kertas Foto Glossy 210-230 gsm dicetak dengan printer warna biasa, dipotong rapi, lalu di-laminating panas (*laminating pouch*). Hasilnya kaku, tahan air, tahan luntur, dan awet bertahun-tahun.</li>
                    <li><strong>Bahan PVC Kartu Instan:</strong> Menggunakan lembaran kertas PVC instan (3 lapis) yang dipress dan dipotong dengan plong ID card.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 10: PWA DI ANDROID, IOS & PC */}
          {activeCategory === 'pwa' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Teknologi Progressive Web App</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Panduan Pasang Aplikasi PWA di HP Android, iPhone & Laptop
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Aplikasi dapat diinstal langsung di perangkat tanpa Play Store, bekerja offline, dan memiliki ikon resmi sekolah.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {/* Android Chrome */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
                  <h3 className="font-bold text-sm text-blue-900 dark:text-blue-300 flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>1. Cara Pasang di Smartphone Android (Google Chrome)</span>
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                    <li>Buka link aplikasi di browser Google Chrome pada HP Android.</li>
                    <li>Klik banner atau tombol <strong>&quot;Install Aplikasi&quot;</strong> yang muncul di layar, ATAU:</li>
                    <li>Ketuk ikon titik tiga (<strong>⋮</strong>) di pojok kanan atas browser Chrome.</li>
                    <li>Pilih menu <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (Add to Home screen) atau <strong>&quot;Install Aplikasi&quot;</strong>.</li>
                    <li>Ikon aplikasi <strong>SMP Nurul Huda Jayapura</strong> akan muncul di beranda HP Anda layaknya aplikasi native Android!</li>
                  </ol>
                </div>

                {/* iPhone Safari */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-sky-500" />
                    <span>2. Cara Pasang di iPhone / iPad (Apple Safari)</span>
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                    <li>Buka link aplikasi di browser Safari.</li>
                    <li>Ketuk tombol <strong>Share / Bagikan</strong> (ikon kotak dengan panah ke atas) di bilah bawah.</li>
                    <li>Gulir ke bawah dan pilih <strong>&quot;Add to Home Screen&quot; (Tambah ke Layar Utama)</strong>.</li>
                    <li>Ketuk <strong>Add (Tambah)</strong> di pojok kanan atas.</li>
                  </ol>
                </div>

                {/* PC / Laptop */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <Laptop className="w-4 h-4 text-purple-500" />
                    <span>3. Cara Pasang di Laptop / Komputer (Chrome / Edge)</span>
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                    <li>Buka aplikasi di Chrome atau Edge di laptop Windows / Mac.</li>
                    <li>Klik ikon <strong>Komputer / Install</strong> di sebelah kanan bilah URL browser (address bar).</li>
                    <li>Klik <strong>Install</strong>. Aplikasi akan terbuka di jendela tersendiri tanpa address bar (*standalone window*).</li>
                  </ol>
                </div>

                {/* Offline Support */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Keuntungan Bekerja Offline (Tanpa Internet)</span>
                  </h4>
                  <p className="text-[11px] text-emerald-900 dark:text-emerald-200">
                    Aplikasi menyimpan data siswa dan aset antarmuka di memori cache browser. Ketika internet di sekolah padam, proses scan kartu dan pencatatan presensi tetap dapat berlangsung lancar. Saat internet kembali aktif, data dapat disinkronkan ke Google Sheets sekali klik.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11: FORMAT EXCEL & IMPORT SISWA */}
          {activeCategory === 'import' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Download className="w-3.5 h-3.5" />
                  <span>Migrasi Data Massal</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Format Data Excel & Template Import Siswa Massal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Panduan memasukkan data ratusan siswa dalam hitungan detik menggunakan file spreadsheet.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {/* Download Button Action */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      Unduh Template File Import (.CSV)
                    </h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                      File template sudah berisi header kolom baku dan contoh 5 baris data siswa yang siap Anda ganti dengan data Dapodik sekolah.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-2 transition shrink-0 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Template CSV</span>
                  </button>
                </div>

                {/* Column Table Description */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Struktur Kolom Wajib Template Excel/CSV
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold">
                          <th className="py-2 px-2.5">Nama Kolom</th>
                          <th className="py-2 px-2.5">Tipe Data</th>
                          <th className="py-2 px-2.5">Wajib?</th>
                          <th className="py-2 px-2.5">Contoh Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-600">NISN</td>
                          <td className="py-2 px-2.5">Angka / Teks</td>
                          <td className="py-2 px-2.5 text-rose-500 font-bold">Wajib</td>
                          <td className="py-2 px-2.5 font-mono">0081234567</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-600">NamaLengkap</td>
                          <td className="py-2 px-2.5">Teks</td>
                          <td className="py-2 px-2.5 text-rose-500 font-bold">Wajib</td>
                          <td className="py-2 px-2.5">Ahmad Faiz Pratama</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-600">Kelas</td>
                          <td className="py-2 px-2.5">Teks</td>
                          <td className="py-2 px-2.5 text-rose-500 font-bold">Wajib</td>
                          <td className="py-2 px-2.5 font-mono">7A / 8B / 9A</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-600">JenisKelamin</td>
                          <td className="py-2 px-2.5">L atau P</td>
                          <td className="py-2 px-2.5 text-slate-500">Opsional</td>
                          <td className="py-2 px-2.5 font-mono">L</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-600">NamaWali</td>
                          <td className="py-2 px-2.5">Teks</td>
                          <td className="py-2 px-2.5 text-slate-500">Opsional</td>
                          <td className="py-2 px-2.5">Bambang Wijaya</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-600">NoWhatsAppWali</td>
                          <td className="py-2 px-2.5">Nomor HP</td>
                          <td className="py-2 px-2.5 text-amber-500 font-semibold">Disarankan</td>
                          <td className="py-2 px-2.5 font-mono">081234567890</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-600">Status</td>
                          <td className="py-2 px-2.5">AKTIF / PINDAH</td>
                          <td className="py-2 px-2.5 text-slate-500">Default AKTIF</td>
                          <td className="py-2 px-2.5 font-mono">AKTIF</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 12: TANYA JAWAB & TROUBLESHOOTING (12+ FAQs) */}
          {activeCategory === 'troubleshooting' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Penyelesaian Masalah (FAQ)</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Tanya Jawab & Penyelesaian Kendala (Troubleshooting)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Daftar lengkap solusi praktis atas kendala yang kerap dihadapi saat operasional presensi di sekolah.
                </p>
              </div>

              <div className="space-y-3">
                {/* FAQ 1 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-1')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>1. Bagaimana jika siswa lupa membawa kartu QR fisiknya ke sekolah?</span>
                    {expandedFaq['faq-1'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-1'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p>Tersedia 2 alternatif cepat:</p>
                      <ul className="list-disc list-inside pl-1 text-[11px] space-y-1">
                        <li><strong>Opsi Guru Piket:</strong> Di tab <em>1. Scan QR Presensi</em>, klik tombol <strong>&quot;Input Presensi Manual&quot;</strong>. Ketik nama siswa, pilih Hadir/Terlambat, lalu klik Simpan.</li>
                        <li><strong>Opsi Siswa:</strong> Jika siswa membawa ponsel, siswa dapat membuka Portal Siswa dan menunjukkan QR Digital di layar HP ke kamera/scanner gerbang.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* FAQ 2 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-2')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>2. Kamera scanner tidak menyala atau blank hitam, apa solusinya?</span>
                    {expandedFaq['faq-2'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-2'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px]">
                        Pastikan izin kamera (*Permission*) pada browser tidak terblokir. Klik ikon gembok di sebelah kiri bilah URL browser, ubah izin Kamera menjadi <strong>&quot;Allow / Izinkan&quot;</strong>, lalu segarkan (*refresh*) halaman. Pastikan juga tidak ada aplikasi lain (Zoom, Google Meet) yang sedang memakai webcam laptop.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 3 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-3')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>3. Data scan berhasil di aplikasi tapi belum muncul di Google Sheets?</span>
                    {expandedFaq['faq-3'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-3'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px]">
                        Periksa 2 hal: (1) Pastikan URL di modal Live Sheets berakhiran <code>/exec</code> (bukan <code>/edit</code>), dan (2) Saat deploy Web App di Google Apps Script, opsi <strong>Who has access</strong> wajib diset ke <strong>&quot;Anyone&quot;</strong>. Anda juga bisa menekan tombol <strong>&quot;Kirim Semua Data Lokal&quot;</strong> di modal Live Sheets untuk menyinkronkan data yang sempat tertunda.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 4 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-4')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>4. Bisakah aplikasi dipakai jika internet di sekolah tiba-tiba mati (Offline)?</span>
                    {expandedFaq['faq-4'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-4'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px]">
                        <strong>BISA 100%!</strong> Aplikasi ini sudah didesain sebagai PWA (Progressive Web App) dengan penyimpanan lokal browser (*IndexedDB & Cache Storage*). Proses scanner kartu, validasi hadir, perhitungan jam, dan rekap tetap berjalan normal saat offline. Ketika internet kembali menyala, data dapat disinkronkan ke Google Sheets sekali klik.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 5 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-5')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>5. Bagaimana cara memasang (install) aplikasi di HP Android tanpa Play Store?</span>
                    {expandedFaq['faq-5'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-5'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px]">
                        Buka link aplikasi di Chrome HP Android, klik tombol <strong>&quot;Install Aplikasi&quot;</strong> pada banner atas atau buka menu titik tiga Chrome lalu pilih <strong>&quot;Tambahkan ke Layar Utama&quot; (Add to Home Screen)</strong>. Ikon aplikasi SMP Nurul Huda Jayapura akan langsung muncul di menu HP seperti aplikasi native Android!
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 6 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-6')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>6. Suara sapaan Text-to-Speech (TTS) tidak berbunyi, apa penyebabnya?</span>
                    {expandedFaq['faq-6'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-6'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px]">
                        Periksa: (1) Pastikan volume speaker laptop/HP tidak di-mute, (2) Toggle Suara TTS di header dalam posisi <strong>ON</strong>, (3) Lakukan 1 kali klik pada tombol <em>Uji Coba Suara</em> di panel scanner untuk mengaktifkan izin pemutaran audio browser (Autoplay Policy).
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 7 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-7')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>7. Bagaimana mencegah kecurangan siswa menitipkan kartu QR kepada temannya?</span>
                    {expandedFaq['faq-7'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-7'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px]">
                        Aplikasi dilengkapi 3 lapis perlindungan: (1) Suara TTS menyebut nama siswa dengan lantang sehingga guru piket langsung tahu jika nama yang disebut tidak sesuai dengan siswa yang berdiri, (2) Foto wajah siswa muncul di layar saat scan, (3) Fitur <em>Generator Sesi QR</em> dinamis yang kodenya berganti setiap 30 detik untuk absen mandiri.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 8 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq('faq-8')}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white transition cursor-pointer"
                  >
                    <span>8. Bagaimana cara mengubah jam masuk dan batas toleransi keterlambatan?</span>
                    {expandedFaq['faq-8'] ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedFaq['faq-8'] && (
                    <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px]">
                        Klik tombol <strong>&quot;Pengaturan Sekolah & Guru&quot;</strong> di header atas. Di modal tersebut, Anda dapat mengganti Jam Masuk (default 07:00 WIT), Batas Toleransi Terlambat (default 07:15 WIT), dan Jam Pulang (default 13:30 WIT), lalu klik Simpan.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 13: CHECKLIST KESIAPAN SEKOLAH */}
          {activeCategory === 'checklist' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Audit Kesiapan Operasional</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Daftar Periksa Kesiapan Sistem Presensi Sekolah
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Pastikan seluruh butir di bawah ini terpenuhi sebelum penggunaan harian di SMP Nurul Huda Jayapura.
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {completedChecklistCount} / {totalChecklistCount}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {checklistPercentage}% Siap
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Klik pada kotak centang untuk menandai status kesiapan. Tersimpan otomatis di peramban.
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCheckAllChecklist}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] hover:bg-emerald-200 transition cursor-pointer"
                  >
                    Centang Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleResetChecklist}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] hover:bg-slate-200 transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-3">
                {[
                  { id: 'c1', title: 'Data Profil Sekolah Terisi Lengkap', desc: 'Nama resmi, NPSN, tahun pelajaran, jam masuk (07:00 WIT), toleransi terlambat (07:15 WIT), dan nama Kepala Sekolah beserta NIP.' },
                  { id: 'c2', title: 'Data Siswa & Nomor HP Wali Terdaftar', desc: 'Daftar siswa seluruh kelas (7A-9B) beserta nomor WhatsApp aktif orang tua telah tersimpan di sistem.' },
                  { id: 'c3', title: 'Kartu QR Siswa Telah Dicetak & Dibagikan', desc: 'Siswa telah memegang ID Card QR fisik atau menyimpan QR digital di ponsel masing-masing.' },
                  { id: 'c4', title: 'Perangkat Scanner Gerbang Berfungsi Normal', desc: 'Kamera webcam atau Barcode Scanner USB fisik terhubung dan dapat membaca kode QR dengan lancar kurang dari 1 detik.' },
                  { id: 'c5', title: 'Audio Speaker & Suara Sapaan TTS Telah Diuji', desc: 'Suara sapaan bahasa Indonesia dan nada chime berbunyi jelas untuk menyambut siswa di gerbang.' },
                  { id: 'c6', title: 'Google Sheets Live Sync Berhasil Diuji (Ping OK)', desc: 'URL Web App Apps Script terhubung dan data tes berhasil masuk ke spreadsheet Google Drive secara real-time.' },
                  { id: 'c7', title: 'Guru Mapel Memahami Pengisian Jurnal KBM', desc: 'Guru piket dan pengajar mapel mengetahui cara input presensi rombel per jam pelajaran (jam 1-10).' },
                  { id: 'c8', title: 'Prosedur Verifikasi Izin Sakit Telah Dipahami', desc: 'Petugas piket memahami alur persetujuan surat dokter online yang diajukan siswa lewat portal.' },
                  { id: 'c9', title: 'Broadcast WhatsApp Alpa Siap Dioperasikan', desc: 'Wali kelas atau guru piket memahami cara mengirim pesan rekap alpa massal ke orang tua pada pukul 08:00 WIT.' },
                  { id: 'c10', title: 'Aplikasi Terpasang (PWA) di Komputer Meja Gerbang', desc: 'PWA telah di-install di Chrome atau Edge laptop meja piket gerbang agar siap digunakan offline.' }
                ].map((item) => {
                  const isChecked = checklist[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-3.5 select-none ${
                        isChecked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition ${
                        isChecked
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-400 dark:border-slate-600'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${
                          isChecked ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80' : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.title}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
