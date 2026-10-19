'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ActivityLog, 
  ActivityLogCategory, 
  User, 
  SchoolProfile 
} from '@/types/attendance';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Clock, 
  User as UserIcon, 
  CheckCircle2, 
  Settings, 
  Users, 
  Database, 
  Radio, 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

interface ActivityLogSectionProps {
  activityLogs: ActivityLog[];
  onClearLogs?: () => void;
  currentUser?: User;
  schoolProfile?: SchoolProfile;
}

export const ActivityLogSection: React.FC<ActivityLogSectionProps> = ({
  activityLogs,
  onClearLogs,
  currentUser,
  schoolProfile
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Filter logs based on category and search query
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      // Category filter
      if (selectedCategory !== 'SEMUA' && log.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchActor = log.actor.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchTimestamp = log.timestamp.toLowerCase().includes(q);
        const matchTarget = log.targetId?.toLowerCase().includes(q) || false;
        return matchActor || matchAction || matchDetails || matchTimestamp || matchTarget;
      }
      return true;
    });
  }, [activityLogs, selectedCategory, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      SEMUA: activityLogs.length,
      KONFIGURASI: activityLogs.filter(l => l.category === 'KONFIGURASI').length,
      DATA_SISWA: activityLogs.filter(l => l.category === 'DATA_SISWA').length,
      SISTEM: activityLogs.filter(l => l.category === 'SISTEM').length,
      PRESENSI: activityLogs.filter(l => l.category === 'PRESENSI').length,
      PERIZINAN: activityLogs.filter(l => l.category === 'PERIZINAN').length,
    };
  }, [activityLogs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID Log', 'Waktu', 'Pelaksana', 'Kategori', 'Kode Aksi', 'Rincian Perubahan', 'Target ID'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.targetId || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `log_aktivitas_admin_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccessToast('File log aktivitas CSV berhasil diunduh.');
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  // Helper badge color
  const getCategoryBadge = (cat: ActivityLogCategory) => {
    switch (cat) {
      case 'KONFIGURASI':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: <Settings className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
          label: 'Konfigurasi'
        };
      case 'DATA_SISWA':
        return {
          bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
          icon: <Users className="w-3 h-3 text-sky-600 dark:text-sky-400" />,
          label: 'Data Siswa'
        };
      case 'SISTEM':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: <Database className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
          label: 'Sistem'
        };
      case 'PRESENSI':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: <Radio className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
          label: 'Presensi'
        };
      case 'PERIZINAN':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: <FileText className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
          label: 'Perizinan'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          icon: <Clock className="w-3 h-3 text-slate-500" />,
          label: cat
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessToast}</span>
          <button onClick={() => setDownloadSuccessToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Live Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-sky-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight">Log Audit & Aktivitas Administrator</h3>
                <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-Time Live</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pencatatan real-time perubahan konfigurasi WA, pembaruan data siswa, dan reset database {schoolProfile?.namaSekolah || 'Sekolah'}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end md:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
            title="Unduh riwayat log ke format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {onClearLogs && (
            <button
              onClick={() => {
                if (window.confirm('Bersihkan seluruh riwayat log aktivitas saat ini?')) {
                  onClearLogs();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 active:scale-95 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              title="Kosongkan daftar log aktivitas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Aktivitas</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{activityLogs.length}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Terekam</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Konfigurasi WA & Sistem</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{counts.KONFIGURASI}</span>
            <span className="text-[10px] text-slate-400">perubahan</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Operasi Data Siswa</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono">{counts.DATA_SISWA}</span>
            <span className="text-[10px] text-slate-400">transaksi</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Aksi Kritis Database</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">{counts.SISTEM}</span>
            <span className="text-[10px] text-slate-400">peristiwa</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {(['SEMUA', 'KONFIGURASI', 'DATA_SISWA', 'SISTEM', 'PRESENSI', 'PERIZINAN'] as const).map(cat => {
              const count = counts[cat];
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>
                    {cat === 'SEMUA' ? 'Semua Log' : 
                     cat === 'KONFIGURASI' ? 'Konfigurasi WA' : 
                     cat === 'DATA_SISWA' ? 'Data Siswa' : 
                     cat === 'SISTEM' ? 'Sistem & Reset' : 
                     cat === 'PRESENSI' ? 'Presensi' : 'Perizinan'}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive 
                      ? 'bg-white/20 dark:bg-slate-900/20' 
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aksi, admin, atau detail..."
              className="w-full pl-8.5 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log Feed / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Tidak Ada Log Aktivitas Ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery 
                ? `Tidak ada catatan aktivitas yang cocok dengan kata kunci "${searchQuery}".`
                : 'Belum ada tindakan yang dicatat pada kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-44">Waktu (Real-Time)</th>
                  <th className="py-3 px-4 w-48">Pelaksana</th>
                  <th className="py-3 px-4 w-36">Kategori</th>
                  <th className="py-3 px-4 w-48">Kode Aksi</th>
                  <th className="py-3 px-4">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <AnimatePresence initial={false}>
                  {filteredLogs.map((log) => {
                    const badge = getCategoryBadge(log.category);
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{log.timestamp}</span>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                              <UserIcon className="w-3 h-3" />
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={log.actor}>
                              {log.actor}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bg}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Action Code */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                            {log.action}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                          <div>
                            <span>{log.details}</span>
                            {log.targetId && (
                              <span className="ml-2 font-mono text-[10px] px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                Target: {log.targetId}
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
