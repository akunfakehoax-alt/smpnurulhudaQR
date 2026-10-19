'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  ChevronRight,
  School,
  FileSpreadsheet,
  Award,
  RefreshCw
} from 'lucide-react';
import { 
  GuruMapel, 
  SchoolProfile, 
  User, 
  HariSekolah, 
  JadwalPelajaranItem 
} from '@/types/attendance';
import { 
  DAFTAR_HARI, 
  SLOT_WAKTU_STANDAR, 
  generateWeeklySchedule, 
  getMapelColor, 
  getHariSekolahFromDate,
  checkLessonStatus 
} from '@/lib/schedule-generator';

interface JadwalPelajaranSectionProps {
  guruMapelList: GuruMapel[];
  availableClasses: string[];
  schoolProfile: SchoolProfile;
  currentUser?: User;
  onSelectScheduleForJurnal?: (schedule: JadwalPelajaranItem) => void;
  compactMode?: boolean;
}

export const JadwalPelajaranSection: React.FC<JadwalPelajaranSectionProps> = ({
  guruMapelList,
  availableClasses,
  schoolProfile,
  currentUser,
  onSelectScheduleForJurnal,
  compactMode = false
}) => {
  // Today's Indonesian school day name
  const todayDayName = useMemo(() => getHariSekolahFromDate(new Date()), []);

  // Filter state
  const [selectedHari, setSelectedHari] = useState<string>('HARI_INI');
  const [selectedGuruId, setSelectedGuruId] = useState<string>('SEMUA');
  const [selectedKelas, setSelectedKelas] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'matrix' | 'beban'>('card');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Generate complete schedule reactively based on guruMapelList
  const allSchedules = useMemo(() => {
    return generateWeeklySchedule(
      guruMapelList,
      availableClasses.length > 0 ? availableClasses : ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'],
      schoolProfile?.zonaWaktu || 'WIT'
    );
  }, [guruMapelList, availableClasses, schoolProfile?.zonaWaktu]);

  // If current user is GURU, determine matching teacher
  const loggedInGuru = useMemo(() => {
    if (!currentUser || currentUser.role !== 'GURU') return null;
    return guruMapelList.find(g => 
      g.nama.toLowerCase().includes(currentUser.nama.toLowerCase()) || 
      currentUser.nama.toLowerCase().includes(g.nama.toLowerCase())
    );
  }, [currentUser, guruMapelList]);

  // Active day filter resolution
  const effectiveHari = useMemo(() => {
    if (selectedHari === 'HARI_INI') return todayDayName;
    return selectedHari;
  }, [selectedHari, todayDayName]);

  // Filtered schedule list
  const filteredSchedule = useMemo(() => {
    return allSchedules.filter(item => {
      // Filter Hari
      if (selectedHari !== 'SEMUA') {
        if (selectedHari === 'HARI_INI') {
          if (item.hari !== todayDayName) return false;
        } else if (item.hari !== selectedHari) {
          return false;
        }
      }

      // Filter Guru
      if (selectedGuruId !== 'SEMUA' && item.guruId !== selectedGuruId) {
        return false;
      }

      // Filter Kelas
      if (selectedKelas !== 'SEMUA' && item.kelas !== selectedKelas) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.mapel.toLowerCase().includes(q) ||
          item.guruNama.toLowerCase().includes(q) ||
          item.kelas.toLowerCase().includes(q) ||
          item.ruangan.toLowerCase().includes(q) ||
          item.hari.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allSchedules, selectedHari, todayDayName, selectedGuruId, selectedKelas, searchQuery]);

  // Lesson currently in session
  const activeNowLesson = useMemo(() => {
    return allSchedules.find(item => {
      const status = checkLessonStatus(item.hari, item.jamMulai, item.jamSelesai, schoolProfile?.zonaWaktu || 'WIT');
      return status === 'BERLANGSUNG';
    });
  }, [allSchedules, schoolProfile?.zonaWaktu]);

  // Workload statistics per teacher
  const teacherWorkload = useMemo(() => {
    const map = new Map<string, { guru: GuruMapel; totalJTM: number; classes: Set<string>; days: Set<HariSekolah> }>();

    guruMapelList.filter(g => g.status === 'AKTIF').forEach(guru => {
      map.set(guru.id, {
        guru,
        totalJTM: 0,
        classes: new Set(),
        days: new Set()
      });
    });

    allSchedules.forEach(item => {
      const entry = map.get(item.guruId);
      if (entry) {
        // Standard period: Jam 1-2 counts as 2 Jam Tatap Muka (JTM)
        entry.totalJTM += 2;
        entry.classes.add(item.kelas);
        entry.days.add(item.hari);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalJTM - a.totalJTM);
  }, [guruMapelList, allSchedules]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredSchedule.map((item, idx) => ({
      No: idx + 1,
      Hari: item.hari,
      'Jam Ke': item.jamKe,
      'Waktu Mulai': item.jamMulai,
      'Waktu Selesai': item.jamSelesai,
      Kelas: item.kelas,
      'Mata Pelajaran': item.mapel,
      'Guru Pengampu': item.guruNama,
      NIP: item.nip || '-',
      Ruangan: item.ruangan
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal_Pelajaran');
    const filename = `Jadwal_Pelajaran_${schoolProfile?.namaSekolah?.replace(/\s+/g, '_') || 'Sekolah'}_TP_${schoolProfile?.tahunPelajaran?.replace(/\//g, '-') || '2026-2027'}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Trigger Print View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Title */}
      {!compactMode && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Otomatis Sinkron GuruMapelList</span>
                <span className="text-emerald-400/60">•</span>
                <span>TP {schoolProfile?.tahunPelajaran || '2026/2027'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                <span>Jadwal Pelajaran & KBM Mingguan</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Jadwal mengajar seluruh guru per hari terstruktur otomatis berdasarkan mata pelajaran dan rombongan belajar kelas. Terhubung langsung dengan pengisian Jurnal KBM harian.
              </p>
            </div>

            {/* Quick Actions Button Group */}
            <div className="flex flex-wrap items-center gap-2">
              {loggedInGuru && (
                <button
                  type="button"
                  onClick={() => setSelectedGuruId(loggedInGuru.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                    selectedGuruId === loggedInGuru.id
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                      : 'bg-white/10 text-emerald-300 hover:bg-white/20'
                  }`}
                  title="Tampilkan hanya jadwal mengajar akun saya"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Jadwal Saya</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/60 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                title="Unduh seluruh jadwal dalam format Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                title="Cetak jadwal pelajaran resmi"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Active Lesson Alert Pill (if in session right now) */}
      {activeNowLesson && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300/80 dark:border-emerald-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                KBM Sedang Berlangsung Sekarang ({activeNowLesson.hari}, {activeNowLesson.jamMulai} - {activeNowLesson.jamSelesai} {schoolProfile?.zonaWaktu || 'WIT'})
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Kelas <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{activeNowLesson.kelas}</span> • {activeNowLesson.mapel} — <span className="text-slate-700 dark:text-slate-300">{activeNowLesson.guruNama}</span>
              </div>
            </div>
          </div>

          {onSelectScheduleForJurnal && (
            <button
              type="button"
              onClick={() => onSelectScheduleForJurnal(activeNowLesson)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Isi Jurnal KBM Kelas Ini</span>
            </button>
          )}
        </div>
      )}

      {/* Filter and View Mode Switcher Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Top Control: View Mode Tabs + Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          
          {/* View Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Matriks Mingguan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('beban')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'beban'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Beban Jam Guru (JTM)</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran, guru, kelas, ruangan..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Day Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] mr-1 shrink-0 uppercase tracking-wider">
            Hari:
          </span>

          <button
            type="button"
            onClick={() => setSelectedHari('HARI_INI')}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              selectedHari === 'HARI_INI'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hari Ini ({todayDayName})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedHari('SEMUA')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
              selectedHari === 'SEMUA'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Semua Hari (Senin-Sabtu)
          </button>

          {DAFTAR_HARI.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setSelectedHari(h)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                selectedHari === h
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Dropdowns Filter: Guru & Kelas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-xs">
          
          {/* Guru Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400 block text-[11px]">
              Saring Guru Pengampu:
            </label>
            <select
              value={selectedGuruId}
              onChange={(e) => setSelectedGuruId(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="SEMUA">Semua Guru ({guruMapelList.length} Pengajar)</option>
              {guruMapelList.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nama} ({g.mapel})
                </option>
              ))}
            </select>
          </div>

          {/* Kelas Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400 block text-[11px]">
              Saring Rombongan Belajar (Kelas):
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="SEMUA">Semua Kelas</option>
              {availableClasses.map(k => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Counter Summary */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0 sm:self-end">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Sesi Terjadwal:</div>
              <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {filteredSchedule.length} Jam Pelajaran
              </div>
            </div>
            {(selectedHari !== 'HARI_INI' || selectedGuruId !== 'SEMUA' || selectedKelas !== 'SEMUA' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedHari('HARI_INI');
                  setSelectedGuruId('SEMUA');
                  setSelectedKelas('SEMUA');
                  setSearchQuery('');
                }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[11px] font-bold flex items-center space-x-1"
                title="Reset semua filter"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW MODE 1: TAMPILAN KARTU / HARIAN                      */}
      {/* ========================================================= */}
      {viewMode === 'card' && (
        <div className="space-y-6">
          {filteredSchedule.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 dark:text-slate-300">
                Tidak ada jadwal pelajaran yang cocok dengan filter.
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silakan ganti pilihan hari, guru, atau kelas pada menu filter di atas.
              </p>
            </div>
          ) : (
            // Group by Hari for clear visual grouping
            (() => {
              const groupedByDay: Record<string, JadwalPelajaranItem[]> = {};
              filteredSchedule.forEach(item => {
                if (!groupedByDay[item.hari]) groupedByDay[item.hari] = [];
                groupedByDay[item.hari].push(item);
              });

              return Object.entries(groupedByDay).map(([hari, items]) => {
                const isToday = hari === todayDayName;

                return (
                  <div key={hari} className="space-y-3">
                    {/* Day Group Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          Hari {hari}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-2xs">
                            HARI INI
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          ({items.length} Sesi Pembelajaran)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {hari === 'Jumat' ? '07:15 - 11:15 WIT' : '07:15 - 14:40 WIT'}
                      </div>
                    </div>

                    {/* Lesson Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {items.map(lesson => {
                        const colors = getMapelColor(lesson.mapel);
                        const status = checkLessonStatus(lesson.hari, lesson.jamMulai, lesson.jamSelesai, schoolProfile?.zonaWaktu || 'WIT');
                        const isLive = status === 'BERLANGSUNG';
                        const isDone = status === 'SELESAI';

                        return (
                          <div 
                            key={lesson.id}
                            className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                              isLive
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                                : isDone
                                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 opacity-80'
                                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Top Card Info: Jam Ke & Status Badge */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300 font-mono">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{lesson.jamMulai} - {lesson.jamSelesai}</span>
                                </div>

                                <div>
                                  {isLive ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white flex items-center space-x-1 shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                      <span>BERLANGSUNG</span>
                                    </span>
                                  ) : isDone ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                      Selesai
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                                      {lesson.jamKe.split(' ')[0] || 'Jam KBM'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Class & Subject Details */}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                                    Kelas {lesson.kelas}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                                    {lesson.mapel}
                                  </span>
                                </div>

                                <div className="pt-1">
                                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                                    {lesson.guruNama}
                                  </h3>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    NIP: {lesson.nip || '-'}
                                  </p>
                                </div>
                              </div>

                              {/* Room & Facility */}
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{lesson.ruangan}</span>
                              </div>
                            </div>

                            {/* Card Action: Connect directly to Jurnal KBM */}
                            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-medium">
                                Sesi Tatap Muka Resmi
                              </span>

                              {onSelectScheduleForJurnal ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectScheduleForJurnal(lesson)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center space-x-1 transition shadow-2xs active:scale-95 cursor-pointer"
                                  title="Gunakan sesi ini untuk mengisi Jurnal KBM harian"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>Isi Jurnal</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-600">
                                  Terjadwal
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW MODE 2: TAMPILAN MATRIKS TIMETABLE MINGGUAN           */}
      {/* ========================================================= */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Matriks Jadwal Pelajaran Mingguan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Peta distribusi jam belajar seluruh kelas per hari (Senin s/d Sabtu)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
              {availableClasses.length} Kelas Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-28 shrink-0">Waktu / Jam</th>
                  {DAFTAR_HARI.map(hari => (
                    <th 
                      key={hari} 
                      className={`p-3 text-center border-l border-slate-200 dark:border-slate-700 min-w-[160px] ${
                        hari === todayDayName ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : ''
                      }`}
                    >
                      <div>{hari}</div>
                      {hari === todayDayName && (
                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                          • Hari Ini •
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {SLOT_WAKTU_STANDAR.map(slot => (
                  <tr key={slot.jamKe} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    {/* Time Column */}
                    <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20 align-top">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{slot.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{slot.jamMulai} - {slot.jamSelesai}</div>
                    </td>

                    {/* Day Cells */}
                    {DAFTAR_HARI.map(hari => {
                      // If Friday has no slot 9-10
                      const isFridayDismissed = hari === 'Jumat' && (slot.label === 'Jam 7-8' || slot.label === 'Jam 9-10');

                      const lessonsInSlot = filteredSchedule.filter(
                        s => s.hari === hari && s.jamMulai === slot.jamMulai
                      );

                      return (
                        <td 
                          key={hari} 
                          className={`p-2.5 border-l border-slate-200 dark:border-slate-800 align-top ${
                            hari === todayDayName ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                          }`}
                        >
                          {isFridayDismissed ? (
                            <div className="text-[10px] text-slate-400 italic text-center py-2">
                              Kepulangan / Sholat Jumat
                            </div>
                          ) : lessonsInSlot.length === 0 ? (
                            <div className="text-[11px] text-slate-300 dark:text-slate-600 text-center py-2">
                              -
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {lessonsInSlot.map(l => {
                                const colors = getMapelColor(l.mapel);
                                return (
                                  <div
                                    key={l.id}
                                    className={`p-2 rounded-xl border text-[11px] transition shadow-2xs ${colors.bg} ${colors.border}`}
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white text-[10px]">
                                        {l.kelas}
                                      </span>
                                      <span className={`truncate max-w-[100px] font-bold ${colors.text}`}>
                                        {l.mapel}
                                      </span>
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-200 font-semibold truncate mt-1">
                                      {l.guruNama}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate flex items-center justify-between mt-0.5">
                                      <span>{l.ruangan}</span>
                                      {onSelectScheduleForJurnal && (
                                        <button
                                          type="button"
                                          onClick={() => onSelectScheduleForJurnal(l)}
                                          className="text-teal-700 dark:text-teal-400 hover:underline font-bold"
                                        >
                                          Jurnal →
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW MODE 3: BEBAN JAM MENGAJAR GURU (JTM)                */}
      {/* ========================================================= */}
      {viewMode === 'beban' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Rekap Beban Jam Tatap Muka (JTM) Mingguan Guru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribusi beban jam mengajar pendidik sesuai standar kurikulum SMP Nurul Huda Jayapura
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherWorkload.map(({ guru, totalJTM, classes, days }) => {
              const isFulfilled = totalJTM >= 24; // Standar sertifikasi Kemdikbud: minimal 24 JTM/minggu

              return (
                <div 
                  key={guru.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {guru.nama}
                        </h4>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          {guru.mapel}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isFulfilled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {totalJTM} JTM
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-1 font-mono">
                      <div>NIP: {guru.nip || '-'}</div>
                      <div>No. HP: {guru.noHp || '-'}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Rombel Diajar ({classes.size} Kelas):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(classes).map(c => (
                          <span key={c} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Mengajar di {days.size} Hari
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGuruId(guru.id);
                        setViewMode('card');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-xs flex items-center space-x-1"
                    >
                      <span>Lihat Jadwal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
