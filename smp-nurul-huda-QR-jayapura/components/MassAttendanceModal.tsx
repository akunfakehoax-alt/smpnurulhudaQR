'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  X, 
  Clock, 
  Calendar, 
  Sparkles, 
  Send, 
  Check, 
  AlertTriangle, 
  Filter, 
  Search, 
  ShieldCheck, 
  Info, 
  Layers,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { 
  Siswa, 
  PresensiRecord, 
  StatusPresensi, 
  TipeSesi, 
  User, 
  SchoolProfile, 
  WhatsAppConfig 
} from '@/types/attendance';

interface MassAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  presensiList: PresensiRecord[];
  currentUser: User;
  activeTipeSesiDefault?: TipeSesi;
  schoolProfile?: SchoolProfile;
  waConfig?: WhatsAppConfig;
  onBatchRecordPresensi: (newRecords: PresensiRecord[], replaceExisting?: boolean) => void;
}

export const MassAttendanceModal: React.FC<MassAttendanceModalProps> = ({
  isOpen,
  onClose,
  siswaList,
  presensiList,
  currentUser,
  activeTipeSesiDefault = 'DATANG',
  schoolProfile,
  waConfig,
  onBatchRecordPresensi
}) => {
  // Target Scope Mode: 'KELAS' (satu kelas) | 'SEMUA' (seluruh siswa) | 'CHECKLIST' (pilih manual)
  const [targetScope, setTargetScope] = useState<'KELAS' | 'SEMUA' | 'CHECKLIST'>('KELAS');
  
  // Available classes
  const availableClasses = useMemo(() => {
    return Array.from(new Set(siswaList.map(s => s.kelas))).filter(Boolean).sort();
  }, [siswaList]);

  const [selectedKelas, setSelectedKelas] = useState<string>(availableClasses[0] || '7A');

  // Attendance Parameters
  const [tipeSesi, setTipeSesi] = useState<TipeSesi>(activeTipeSesiDefault);
  const [statusPresensi, setStatusPresensi] = useState<StatusPresensi>('HADIR');
  
  // Date & Time defaults
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [tanggal, setTanggal] = useState<string>(todayStr);

  const currentTimeStr = useMemo(() => {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // "07:15:00"
  }, []);
  const [waktu, setWaktu] = useState<string>(currentTimeStr);

  // Overwrite policy
  const [skipAlreadyPresent, setSkipAlreadyPresent] = useState<boolean>(true);
  
  // Custom Notes
  const [catatan, setCatatan] = useState<string>('');

  // Search filter inside student checklist
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Selected NISNs for checklist mode
  const [selectedNisns, setSelectedNisns] = useState<string[]>(() => {
    return siswaList.filter(s => s.kelas === (availableClasses[0] || '7A')).map(s => s.nisn);
  });

  // When class changes in checklist mode, update selected NISNs to that class
  const handleSelectKelasChange = (newKelas: string) => {
    setSelectedKelas(newKelas);
    if (targetScope === 'CHECKLIST') {
      const classStudents = siswaList.filter(s => s.kelas === newKelas).map(s => s.nisn);
      setSelectedNisns(classStudents);
    }
  };

  // Target Student Pool based on scope
  const targetStudentsPool = useMemo(() => {
    if (targetScope === 'SEMUA') {
      return siswaList;
    }
    if (targetScope === 'KELAS') {
      return siswaList.filter(s => s.kelas === selectedKelas);
    }
    // CHECKLIST
    return siswaList.filter(s => s.kelas === selectedKelas);
  }, [targetScope, selectedKelas, siswaList]);

  // Existing records map for (tanggal + tipe) to quickly identify who already has attendance
  const existingAttendanceMap = useMemo(() => {
    const map = new Map<string, PresensiRecord>();
    presensiList.forEach(p => {
      if (p.tanggal === tanggal && p.tipe === tipeSesi) {
        map.set(p.nisn, p);
      }
    });
    return map;
  }, [presensiList, tanggal, tipeSesi]);

  // Students who will actually be processed
  const studentsToProcess = useMemo(() => {
    let pool = targetStudentsPool;
    if (targetScope === 'CHECKLIST') {
      pool = pool.filter(s => selectedNisns.includes(s.nisn));
    }

    if (skipAlreadyPresent) {
      // Exclude students who already have attendance record on this date and session
      return pool.filter(s => !existingAttendanceMap.has(s.nisn));
    }

    return pool;
  }, [targetStudentsPool, targetScope, selectedNisns, skipAlreadyPresent, existingAttendanceMap]);

  // Count already present students in this target pool
  const alreadyPresentCount = useMemo(() => {
    let pool = targetStudentsPool;
    if (targetScope === 'CHECKLIST') {
      pool = pool.filter(s => selectedNisns.includes(s.nisn));
    }
    return pool.filter(s => existingAttendanceMap.has(s.nisn)).length;
  }, [targetStudentsPool, targetScope, selectedNisns, existingAttendanceMap]);

  // Loading execution state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Toggle selection for checklist mode
  const handleToggleStudent = (nisn: string) => {
    setSelectedNisns(prev => 
      prev.includes(nisn) ? prev.filter(id => id !== nisn) : [...prev, nisn]
    );
  };

  const handleSelectAllInClass = () => {
    const classNisns = targetStudentsPool.map(s => s.nisn);
    if (selectedNisns.length === classNisns.length) {
      setSelectedNisns([]);
    } else {
      setSelectedNisns(classNisns);
    }
  };

  // Execution: Submit batch attendance
  const handleSubmitBatch = () => {
    if (studentsToProcess.length === 0) return;

    setIsSubmitting(true);

    const nowMillis = Date.now();
    const finalNote = catatan.trim() || `Presensi massal ${targetScope === 'SEMUA' ? 'seluruh siswa' : `kelas ${selectedKelas}`} dicatat oleh ${currentUser.nama}`;

    const newRecords: PresensiRecord[] = studentsToProcess.map((student, idx) => ({
      id: `PRES-MASSAL-${nowMillis + idx}-${student.nisn.slice(-4)}`,
      tanggal: tanggal,
      waktu: waktu,
      nisn: student.nisn,
      namaSiswa: student.nama,
      kelas: student.kelas,
      tipe: tipeSesi,
      status: statusPresensi,
      metode: 'MANUAL',
      waStatus: waConfig?.enabled ? 'TERKIRIM' : 'NONAKTIF',
      waResponse: waConfig?.enabled ? `Meta Cloud API 200 OK (wamid.HBgL${(nowMillis + idx).toString(36)})` : undefined,
      catatan: finalNote,
      petugas: currentUser.nama
    }));

    // Trigger parent callback (replaceExisting = !skipAlreadyPresent)
    onBatchRecordPresensi(newRecords, !skipAlreadyPresent);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Berhasil mengabsenkan ${newRecords.length} siswa dengan status [${statusPresensi}] untuk sesi ${tipeSesi}!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1600);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-indigo-700/60 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Users className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Presensi Massal Tanpa Scan QR
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-2xs">
                  {currentUser.role === 'ADMIN' ? 'Fitur Admin' : 'Fitur Guru'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1">
                Absenkan satu kelas penuh atau seluruh siswa serentak tanpa perlu memindai kartu QR satu per satu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center space-x-2 shadow-lg animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Step 1: Pilih Target Presensi (Scope) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>1. Target Siswa yang Akan Diabsenkan:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option A: Per Kelas */}
              <button
                type="button"
                onClick={() => setTargetScope('KELAS')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  targetScope === 'KELAS'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Per Satu Kelas</span>
                  {targetScope === 'KELAS' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Absenkan semua murid di kelas terpilih (misal: Kelas {selectedKelas})
                </p>
              </button>

              {/* Option B: Seluruh Siswa Sekolah */}
              <button
                type="button"
                onClick={() => setTargetScope('SEMUA')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  targetScope === 'SEMUA'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Seluruh Siswa</span>
                  {targetScope === 'SEMUA' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Semua kelas serentak ({siswaList.length} total siswa)
                </p>
              </button>

              {/* Option C: Checklist Siswa */}
              <button
                type="button"
                onClick={() => setTargetScope('CHECKLIST')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  targetScope === 'CHECKLIST'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Pilih Checklist</span>
                  {targetScope === 'CHECKLIST' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Centang daftar nama murid tertentu
                </p>
              </button>
            </div>

            {/* Sub-selector for Kelas if Scope is KELAS or CHECKLIST */}
            {(targetScope === 'KELAS' || targetScope === 'CHECKLIST') && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pilih Kelas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableClasses.map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleSelectKelasChange(k)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedKelas === k
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Kelas {k} ({siswaList.filter(s => s.kelas === k).length})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Parameter Presensi (Sesi & Status) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Sesi Presensi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Sesi Presensi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipeSesi('DATANG')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                    tipeSesi === 'DATANG'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>🌅 DATANG (Masuk)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipeSesi('PULANG')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                    tipeSesi === 'PULANG'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>🏠 PULANG (Selesai)</span>
                </button>
              </div>
            </div>

            {/* Status Presensi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Status Kehadiran yang Diberikan:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'] as StatusPresensi[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusPresensi(st)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                      statusPresensi === st
                        ? st === 'HADIR' ? 'bg-emerald-600 text-white shadow-xs' :
                          st === 'TERLAMBAT' ? 'bg-amber-600 text-white shadow-xs' :
                          st === 'IZIN' ? 'bg-sky-600 text-white shadow-xs' :
                          st === 'SAKIT' ? 'bg-purple-600 text-white shadow-xs' :
                          'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal & Waktu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Tanggal Presensi:</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Waktu / Jam Tercatat:</span>
              </label>
              <input
                type="time"
                step="1"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Step 3: Opsi Penanganan Siswa Sudah Absen */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
            <div className="flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Proteksi Data Siswa yang Sudah Scan QR:
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  Terdeteksi <strong>{alreadyPresentCount} siswa</strong> sudah memiliki catatan presensi {tipeSesi} pada tanggal ini.
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chkSkipPresent"
                    checked={skipAlreadyPresent}
                    onChange={(e) => setSkipAlreadyPresent(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="chkSkipPresent" className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer text-xs">
                    Lewati siswa yang SUDAH absen (Hanya absenkan {targetStudentsPool.length - alreadyPresentCount} siswa yang belum absen)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Keterangan / Catatan Tambahan */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan / Alasan Presensi Massal (Opsional):
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder={`Contoh: Presensi massal ${targetScope === 'SEMUA' ? 'seluruh siswa' : `kelas ${selectedKelas}`} karena kegiatan upacara / KBM bersama`}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Checklist Student Selector if scope === 'CHECKLIST' */}
          {targetScope === 'CHECKLIST' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 space-y-2 p-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Daftar Siswa Kelas {selectedKelas} ({selectedNisns.length} dipilih):
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllInClass}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {selectedNisns.length === targetStudentsPool.length ? 'Batal Pilih Semua' : 'Pilih Semua Siswa'}
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {targetStudentsPool.map((siswa, idx) => {
                  const isChecked = selectedNisns.includes(siswa.nisn);
                  const isAlreadyPresent = existingAttendanceMap.has(siswa.nisn);
                  return (
                    <div 
                      key={siswa.nisn}
                      onClick={() => handleToggleStudent(siswa.nisn)}
                      className={`p-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer rounded-lg transition ${
                        isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{siswa.nama}</span>
                        <span className="font-mono text-[10px] text-sky-600">({siswa.nisn})</span>
                      </div>
                      <div>
                        {isAlreadyPresent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Sudah Absen
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Belum Absen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Summary Stats Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="text-xs text-indigo-200">Ringkasan Eksekusi Presensi Massal:</div>
              <div className="text-sm font-extrabold text-white mt-0.5 flex items-center space-x-2">
                <span>Total Target: <strong>{targetStudentsPool.length} Siswa</strong></span>
                <span>•</span>
                <span className="text-emerald-400">Akan Diabsenkan: <strong>{studentsToProcess.length} Siswa</strong></span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Sesi: <strong>{tipeSesi}</strong> | Status: <strong className="text-amber-300">{statusPresensi}</strong> | Petugas: <strong>{currentUser.nama}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitBatch}
              disabled={isSubmitting || studentsToProcess.length === 0}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <UserCheck className="w-4 h-4 text-white" />
              <span>
                {isSubmitting 
                  ? 'Menyimpan Presensi...' 
                  : `Absenkan ${studentsToProcess.length} Siswa Sekarang`}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tercatat otomatis di Google Sheets & Log Sistem</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
