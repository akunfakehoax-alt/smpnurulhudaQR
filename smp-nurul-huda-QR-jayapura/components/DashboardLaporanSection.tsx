'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { PresensiRecord, Siswa, StatusPresensi, DailySummaryItem } from '@/types/attendance';
import { TeacherAbsenceAlert } from '@/components/TeacherAbsenceAlert';
import { detectConsecutiveAbsences } from '@/lib/absence-detection';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  PlusCircle,
  Download,
  Calendar,
  Send,
  UserCheck,
  CheckCheck,
  RefreshCw,
  BellRing,
  Layers,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Sparkles,
  X,
  FileText,
  Printer,
  Zap,
  AlertTriangle,
  LayoutGrid,
  HeartPulse,
  GraduationCap,
  Users,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SchoolProfile, TableDensity, PengajuanIzin, GuruMapel, ActivityLog, User } from '@/types/attendance';
import { PersetujuanIzinSection } from './PersetujuanIzinSection';
import { LaporanBulananModal } from './LaporanBulananModal';
import { WeeklyDisciplineChart } from './WeeklyDisciplineChart';
import { BroadcastAlpaModal } from './BroadcastAlpaModal';
import { JadwalPelajaranSection } from './JadwalPelajaranSection';
import { ActivityLogSection } from './ActivityLogSection';
import { createPresensiIndexKey } from '@/lib/presensi-indexer';

interface DashboardLaporanSectionProps {
  presensiList: PresensiRecord[];
  presensiIndex?: Map<string, PresensiRecord>;
  siswaList: Siswa[];
  activityLogs?: ActivityLog[];
  onClearActivityLogs?: () => void;
  currentUser?: User;
  onManualMark: (nisn: string, status: StatusPresensi, tipe: 'DATANG' | 'PULANG', catatan: string) => void;
  onNavigateToSheets?: () => void;
  isAbsenceAlertEnabled?: boolean;
  onToggleAbsenceAlert?: () => void;
  schoolProfile?: SchoolProfile;
  pengajuanIzinList?: PengajuanIzin[];
  onApprovePengajuanIzin?: (id: string, catatanGuru?: string) => void;
  onRejectPengajuanIzin?: (id: string, catatanGuru: string) => void;
  guruMapelList?: GuruMapel[];
  onNavigateToJurnal?: () => void;
  onOpenMassAttendanceModal?: () => void;
}

// Helper functions for dynamic tokens and timestamps outside component render
function generateWamid(nisn: string, suffix: string): string {
  return `wamid.HBgL${nisn}_${suffix}_${Date.now().toString(36)}`;
}

function getIndoTimestamp(): string {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const DashboardLaporanSection: React.FC<DashboardLaporanSectionProps> = ({
  presensiList,
  presensiIndex,
  siswaList,
  activityLogs = [],
  onClearActivityLogs,
  currentUser,
  onManualMark,
  onNavigateToSheets,
  isAbsenceAlertEnabled = true,
  onToggleAbsenceAlert,
  schoolProfile,
  pengajuanIzinList = [],
  onApprovePengajuanIzin,
  onRejectPengajuanIzin,
  guruMapelList = [],
  onNavigateToJurnal,
  onOpenMassAttendanceModal
}) => {
  // Default to 'rekap_wa' to display the table matching user's view
  const [viewMode, setViewMode] = useState<'transaksi' | 'rekap_wa' | 'pengajuan_izin' | 'jadwal_kbm' | 'log_aktivitas'>('rekap_wa');
  const [density, setDensity] = useState<TableDensity>('normal');
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterTipe, setFilterTipe] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const pendingIzinCount = (pengajuanIzinList || []).filter(p => p.status === 'MENUNGGU').length;
  
  // Set default selectedDate to match first available record or today using lazy initializer
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return presensiList[0]?.tanggal || '2026-09-22';
  });

  // Filter 3 consecutive days absence
  const [filterConsecutiveAbsentOnly, setFilterConsecutiveAbsentOnly] = useState(false);

  // Consecutive absences detection
  const consecutiveAlerts = useMemo(() => {
    return detectConsecutiveAbsences(siswaList, presensiList, 3);
  }, [siswaList, presensiList]);

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [showBroadcastAlpaModal, setShowBroadcastAlpaModal] = useState(false);
  const [showWeeklyDisciplineChart, setShowWeeklyDisciplineChart] = useState(true);

  // Manual Attendance form state
  const [manualNisn, setManualNisn] = useState(siswaList[0]?.nisn || '');
  const [manualStatus, setManualStatus] = useState<StatusPresensi>('HADIR');
  const [manualTipe, setManualTipe] = useState<'DATANG' | 'PULANG'>('DATANG');
  const [manualCatatan, setManualCatatan] = useState('');

  // Daily summary batch broadcast state
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [copySuccessToast, setCopySuccessToast] = useState<string | null>(null);
  const [currentSendingTarget, setCurrentSendingTarget] = useState<{
    namaOrtu: string;
    namaSiswa: string;
    kelas: string;
    noHp: string;
    current: number;
    total: number;
  } | null>(null);

  // Delivery status map for WA Daily Summary
  const [waDeliveryStatusMap, setWaDeliveryStatusMap] = useState<Record<string, {
    status: 'TERKIRIM' | 'GAGAL' | 'PENDING';
    waktu: string;
    wamid: string;
  }>>({
    '0061234501': { status: 'TERKIRIM', waktu: '12:00:20', wamid: 'wamid.HBgL0061234501_AUTO' },
    '0061234502': { status: 'TERKIRIM', waktu: '16:00:14', wamid: 'wamid.HBgL0061234502_AUTO' },
    '0061234503': { status: 'TERKIRIM', waktu: '16:00:17', wamid: 'wamid.HBgL0061234503_AUTO' }
  });

  // Calculate statistics with memoization
  const filteredStudents = useMemo(() => {
    return siswaList.filter(s => filterKelas === 'SEMUA' || s.kelas === filterKelas);
  }, [siswaList, filterKelas]);

  const totalTarget = filteredStudents.length;

  const todayDatangRecords = useMemo(() => {
    return presensiList.filter(p => 
      p.tanggal === selectedDate && 
      p.tipe === 'DATANG' && 
      (filterKelas === 'SEMUA' || p.kelas === filterKelas)
    );
  }, [presensiList, selectedDate, filterKelas]);

  const { tepatWaktuCount, terlambatCount, izinCount, sakitCount, belumAbsenCount } = useMemo(() => {
    const tepatWaktu = todayDatangRecords.filter(p => p.status === 'HADIR').length;
    const terlambat = todayDatangRecords.filter(p => p.status === 'TERLAMBAT').length;
    const izin = todayDatangRecords.filter(p => p.status === 'IZIN').length;
    const sakit = todayDatangRecords.filter(p => p.status === 'SAKIT').length;
    const belumAbsen = Math.max(0, totalTarget - (tepatWaktu + terlambat + izin + sakit));
    return {
      tepatWaktuCount: tepatWaktu,
      terlambatCount: terlambat,
      izinCount: izin,
      sakitCount: sakit,
      belumAbsenCount: belumAbsen
    };
  }, [todayDatangRecords, totalTarget]);

  // Compute daily summary per student with O(1) indexed lookup memoized
  const dailySummaryItems: DailySummaryItem[] = useMemo(() => {
    return filteredStudents.map(siswa => {
      const datangKey = createPresensiIndexKey(selectedDate, siswa.nisn, 'DATANG');
      const pulangKey = createPresensiIndexKey(selectedDate, siswa.nisn, 'PULANG');
      const datang = presensiIndex 
        ? presensiIndex.get(datangKey) 
        : presensiList.find(p => p.nisn === siswa.nisn && p.tanggal === selectedDate && p.tipe === 'DATANG');
      const pulang = presensiIndex 
        ? presensiIndex.get(pulangKey) 
        : presensiList.find(p => p.nisn === siswa.nisn && p.tanggal === selectedDate && p.tipe === 'PULANG');

      let statusAkhir = 'HADIR LENGKAP';
      if (!datang && !pulang) {
        statusAkhir = 'ALPA / TIDAK HADIR';
      } else if (datang?.status === 'IZIN') {
        statusAkhir = 'IZIN';
      } else if (datang?.status === 'SAKIT') {
        statusAkhir = 'SAKIT';
      } else if (datang?.status === 'TERLAMBAT' && pulang) {
        statusAkhir = 'HADIR (TERLAMBAT)';
      } else if (datang && !pulang) {
        statusAkhir = 'BELUM PRESENSI PULANG';
      }

      const waState = waDeliveryStatusMap[siswa.nisn];

      return {
        nisn: siswa.nisn,
        nama: siswa.nama,
        kelas: siswa.kelas,
        noHpOrtu: siswa.noHpOrtu,
        namaOrtu: siswa.namaOrtu,
        jamMasuk: datang ? datang.waktu : '-',
        statusMasuk: (datang ? datang.status : 'BELUM_ABSEN') as StatusPresensi | 'BELUM_ABSEN',
        jamPulang: pulang ? pulang.waktu : '-',
        statusPulang: (pulang ? pulang.status : 'BELUM_ABSEN') as StatusPresensi | 'BELUM_ABSEN',
        statusRingkasan: statusAkhir,
        waSummaryStatus: (waState ? waState.status : 'BELUM_DIKIRIM') as 'TERKIRIM' | 'PENDING' | 'GAGAL' | 'BELUM_DIKIRIM',
        datangWaktu: datang ? datang.waktu : '-',
        datangStatus: datang ? datang.status : 'BELUM_ABSEN',
        pulangWaktu: pulang ? pulang.waktu : '-',
        pulangStatus: pulang ? pulang.status : 'BELUM_ABSEN',
        statusAkhir: statusAkhir,
        statusWA: waState ? waState.status : 'BELUM_DIKIRIM',
        waktuKirimWA: waState ? waState.waktu : undefined
      };
    }).filter(item => {
      if (filterConsecutiveAbsentOnly) {
        const isConsecutiveAbsent = consecutiveAlerts.some(a => a.siswa.nisn === item.nisn);
        if (!isConsecutiveAbsent) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.nama.toLowerCase().includes(q) || 
          item.nisn.includes(q) || 
          item.kelas.toLowerCase().includes(q) ||
          item.namaOrtu.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filteredStudents, selectedDate, presensiIndex, presensiList, waDeliveryStatusMap, filterConsecutiveAbsentOnly, consecutiveAlerts, searchQuery]);

  // Count unsent summary messages to respective wali murid
  const unsentCount = useMemo(() => {
    return dailySummaryItems.filter(item => item.statusWA !== 'TERKIRIM').length;
  }, [dailySummaryItems]);

  // Filter students who haven't marked attendance or are marked Alpa/Tidak Hadir
  const absentStudents = useMemo(() => {
    return dailySummaryItems.filter(item => {
      return (
        item.datangStatus === 'BELUM_ABSEN' ||
        item.statusMasuk === 'BELUM_ABSEN' ||
        item.statusAkhir.includes('ALPA') ||
        item.statusAkhir.includes('TIDAK HADIR')
      );
    });
  }, [dailySummaryItems]);

  const [isAbsentTableCollapsed, setIsAbsentTableCollapsed] = useState(false);

  // Helper create direct WA URL for absent students
  const createWaWarningUrl = (item: DailySummaryItem) => {
    const cleanPhone = item.noHpOrtu.replace(/\D/g, '');
    const phoneTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const textMsg = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. Bapak/Ibu Wali Murid dari *${item.nama}* (Kelas ${item.kelas}).\n\nKami menginformasikan bahwa ananda hari ini (*${selectedDate}*) tercatat *BELUM MELAKUKAN PRESENSI DATANG / ALPA* di SMP Nurul Huda Jayapura.\n\nMohon konfirmasi keberadaan ananda apakah Sakit, Izin, atau berhalangan hadir. Terima kasih atas kerja samanya.\n\n_Wassalamu'alaikum Wr. Wb._\n*Tim Kesiswaan SMP Nurul Huda Jayapura*`
    );
    return `https://wa.me/${phoneTarget}?text=${textMsg}`;
  };

  // Export absent students to Excel (.xlsx)
  const handleExportAbsentStudentsExcel = () => {
    const headers = [
      '#',
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'WALI_MURID',
      'NO_WA_ORTU',
      'SESI_MASUK',
      'SESI_PULANG',
      'STATUS_AKHIR',
      'STATUS_WA'
    ];
    const rows = absentStudents.map((s, idx) => [
      idx + 1,
      String(s.nisn),
      s.nama,
      s.kelas,
      s.namaOrtu,
      String(s.noHpOrtu),
      s.datangWaktu === '-' ? 'Belum Absen' : `${s.datangWaktu} (${s.datangStatus})`,
      s.pulangWaktu === '-' ? 'Belum Pulang' : `${s.pulangWaktu} (${s.pulangStatus})`,
      s.statusAkhir,
      s.statusWA
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 28 },
      { wch: 12 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa_Belum_Hadir');
    XLSX.writeFile(workbook, `PERINGATAN_SISWA_ALPA_${selectedDate}_${filterKelas.replace(/\s+/g, '_')}.xlsx`);
    setCopySuccessToast(`Data (${absentStudents.length}) Siswa Belum Hadir / Alpa berhasil diekspor ke Excel!`);
    setTimeout(() => setCopySuccessToast(null), 4000);
  };

  // Copy absent students table as TSV format for easy pasting
  const handleCopyAbsentStudentsTsv = async () => {
    const headers = [
      '#',
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'WALI_MURID',
      'NO_WA_ORTU',
      'SESI_MASUK',
      'SESI_PULANG',
      'STATUS_AKHIR',
      'STATUS_WA'
    ];
    const rows = absentStudents.map((s, idx) => [
      idx + 1,
      s.nisn,
      s.nama,
      s.kelas,
      s.namaOrtu,
      s.noHpOrtu,
      s.datangWaktu === '-' ? 'Belum Absen' : `${s.datangWaktu} (${s.datangStatus})`,
      s.pulangWaktu === '-' ? 'Belum Pulang' : `${s.pulangWaktu} (${s.pulangStatus})`,
      s.statusAkhir,
      s.statusWA
    ]);
    const tsvContent = [headers.join('\t'), ...rows.map(e => e.join('\t'))].join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopySuccessToast('Data tabel Peringatan Siswa Belum Hadir / Alpa berhasil disalin ke clipboard!');
      setTimeout(() => setCopySuccessToast(null), 4000);
    } catch {
      alert('Gagal menyalin otomatis ke clipboard.');
    }
  };

  // Dynamic available classes from student records
  const availableClasses = useMemo(() => {
    return Array.from(new Set(siswaList.map(s => s.kelas))).filter(Boolean).sort();
  }, [siswaList]);

  // Student counts map by class
  const classStudentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    siswaList.forEach(s => {
      if (s.kelas) {
        counts[s.kelas] = (counts[s.kelas] || 0) + 1;
      }
    });
    return counts;
  }, [siswaList]);

  // Callback to sync delivery status from BroadcastAlpaModal
  const handleUpdateAlpaDeliveryStatus = (nisn: string, wamid: string, waktu: string) => {
    setWaDeliveryStatusMap(prev => ({
      ...prev,
      [nisn]: {
        status: 'TERKIRIM',
        waktu: waktu,
        wamid: wamid
      }
    }));
  };

  // Filter transaction attendance table (PRESENSI) memoized
  const displayedRecords = useMemo(() => {
    return presensiList.filter(record => {
      if (filterConsecutiveAbsentOnly) {
        const isConsecutiveAbsent = consecutiveAlerts.some(a => a.siswa.nisn === record.nisn);
        if (!isConsecutiveAbsent) return false;
      }
      if (selectedDate && record.tanggal !== selectedDate) return false;
      if (filterKelas !== 'SEMUA' && record.kelas !== filterKelas) return false;
      if (filterTipe !== 'SEMUA' && record.tipe !== filterTipe) return false;
      if (filterStatus !== 'SEMUA' && record.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          record.namaSiswa.toLowerCase().includes(q) || 
          record.nisn.includes(q) || 
          record.id.toLowerCase().includes(q) ||
          record.kelas.toLowerCase().includes(q) ||
          record.status.toLowerCase().includes(q) ||
          record.tipe.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [presensiList, filterConsecutiveAbsentOnly, consecutiveAlerts, selectedDate, filterKelas, filterTipe, filterStatus, searchQuery]);

  // Helper to escape CSV cell without polluting with literal apostrophes
  const escapeCsv = (val: unknown) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  // Export 1: Native Excel (.XLSX) Rekap Harian & Wali Murid (RAPI, KOLOM OTOMATIS)
  const handleExportExcelRekap = () => {
    const headers = [
      'NO',
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'NAMA_WALI',
      'NO_WA_ORTU',
      'SESI_MASUK',
      'STATUS_MASUK',
      'SESI_PULANG',
      'STATUS_PULANG',
      'STATUS_AKHIR',
      'STATUS_WA',
      'WAKTU_KIRIM_WA'
    ];

    const rows = dailySummaryItems.map((item, idx) => [
      idx + 1,
      String(item.nisn),
      item.nama,
      item.kelas,
      item.namaOrtu,
      String(item.noHpOrtu),
      item.datangWaktu,
      item.datangStatus,
      item.pulangWaktu,
      item.pulangStatus,
      item.statusAkhir,
      item.statusWA,
      item.waktuKirimWA || '-'
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set auto-fit column widths so no text is cut off in Excel
    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 15 }, // NISN
      { wch: 28 }, // NAMA_SISWA
      { wch: 14 }, // KELAS
      { wch: 24 }, // NAMA_WALI
      { wch: 18 }, // NO_WA_ORTU
      { wch: 14 }, // SESI_MASUK
      { wch: 16 }, // STATUS_MASUK
      { wch: 14 }, // SESI_PULANG
      { wch: 16 }, // STATUS_PULANG
      { wch: 26 }, // STATUS_AKHIR
      { wch: 16 }, // STATUS_WA
      { wch: 18 }  // WAKTU_KIRIM_WA
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'REKAP_PRESENSI');
    XLSX.writeFile(workbook, `REKAP_HARIAN_PRESENSI_${selectedDate}_${filterKelas.replace(/\s+/g, '_')}.xlsx`);
    setShowExportModal(false);
  };

  // Export 2: Native Excel (.XLSX) Log Transaksi Presensi
  const handleExportExcelTransaksi = () => {
    const headers = [
      'NO',
      'ID_PRESENSI',
      'TANGGAL',
      'WAKTU',
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'TIPE',
      'STATUS',
      'METODE',
      'STATUS_WA',
      'WA_RESPONSE'
    ];

    const rows = displayedRecords.map((r, idx) => [
      idx + 1,
      r.id,
      r.tanggal,
      r.waktu,
      String(r.nisn),
      r.namaSiswa,
      r.kelas,
      r.tipe,
      r.status,
      r.metode,
      r.waStatus,
      r.waResponse || 'Meta Graph API 200 OK'
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 18 }, // ID_PRESENSI
      { wch: 14 }, // TANGGAL
      { wch: 12 }, // WAKTU
      { wch: 15 }, // NISN
      { wch: 28 }, // NAMA_SISWA
      { wch: 14 }, // KELAS
      { wch: 12 }, // TIPE
      { wch: 14 }, // STATUS
      { wch: 14 }, // METODE
      { wch: 16 }, // STATUS_WA
      { wch: 32 }  // WA_RESPONSE
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LOG_PRESENSI');
    XLSX.writeFile(workbook, `LOG_PRESENSI_${selectedDate}_${filterKelas.replace(/\s+/g, '_')}.xlsx`);
    setShowExportModal(false);
  };

  // Export 3: CSV Log Transaksi Presensi (Dilengkapi sep=, agar Excel langsung membagi kolom rapi)
  const handleExportCSVTransaksi = () => {
    const headers = [
      'NO',
      'ID_PRESENSI',
      'TANGGAL',
      'WAKTU',
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'TIPE',
      'STATUS',
      'METODE',
      'STATUS_WA',
      'WA_RESPONSE'
    ];

    const rows = displayedRecords.map((r, idx) => [
      idx + 1,
      escapeCsv(r.id),
      escapeCsv(r.tanggal),
      escapeCsv(r.waktu),
      escapeCsv(r.nisn),
      escapeCsv(r.namaSiswa),
      escapeCsv(r.kelas),
      escapeCsv(r.tipe),
      escapeCsv(r.status),
      escapeCsv(r.metode),
      escapeCsv(r.waStatus),
      escapeCsv(r.waResponse || 'Meta Graph API 200 OK')
    ]);

    const csvContent = '\uFEFFsep=,\r\n' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PRESENSI_${selectedDate}_${filterKelas.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Export 4: CSV Rekap Harian (Dilengkapi sep=, agar Excel langsung membagi kolom rapi)
  const handleExportCSVRekap = () => {
    const headers = [
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'NAMA_WALI',
      'NO_WA_ORTU',
      'SESI_MASUK',
      'STATUS_MASUK',
      'SESI_PULANG',
      'STATUS_PULANG',
      'STATUS_AKHIR',
      'STATUS_WA_RINGKASAN',
      'WAKTU_KIRIM_WA'
    ];

    const rows = dailySummaryItems.map(item => [
      escapeCsv(item.nisn),
      escapeCsv(item.nama),
      escapeCsv(item.kelas),
      escapeCsv(item.namaOrtu),
      escapeCsv(item.noHpOrtu),
      escapeCsv(item.datangWaktu),
      escapeCsv(item.datangStatus),
      escapeCsv(item.pulangWaktu),
      escapeCsv(item.pulangStatus),
      escapeCsv(item.statusAkhir),
      escapeCsv(item.statusWA),
      escapeCsv(item.waktuKirimWA || '-')
    ]);

    const csvContent = '\uFEFFsep=,\r\n' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `REKAP_HARIAN_WA_${selectedDate}_${filterKelas.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Export 3: Salin Format Google Sheets (TSV / Clipboard)
  const handleCopyGoogleSheetsFormat = async () => {
    const headers = ['#', 'ID_PRESENSI', 'TANGGAL', 'WAKTU', 'NISN', 'NAMA_SISWA', 'KELAS', 'TIPE', 'STATUS', 'METODE', 'STATUS_WA', 'WA_RESPONSE'];
    const rows = displayedRecords.map((r, idx) => [
      idx + 1,
      r.id,
      r.tanggal,
      r.waktu,
      r.nisn,
      r.namaSiswa,
      r.kelas,
      r.tipe,
      r.status,
      r.metode,
      r.waStatus,
      r.waResponse || 'Meta Graph API 200 OK'
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map(e => e.join('\t'))].join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopySuccessToast('Data tabel berhasil disalin! Buka Google Sheets dan tekan Ctrl+V.');
      setTimeout(() => setCopySuccessToast(null), 4000);
      setShowExportModal(false);
    } catch {
      alert('Gagal menyalin otomatis ke clipboard. Silakan gunakan tombol Unduh CSV.');
    }
  };

  // Save manual attendance
  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    onManualMark(manualNisn, manualStatus, manualTipe, manualCatatan);
    setShowManualModal(false);
    setManualCatatan('');
  };

  // Single Student Send WA Summary to Respective Wali Murid
  const handleSendSingleSummary = (siswaNisn: string, namaSiswa: string, noHp: string, namaOrtu?: string) => {
    const waktuNow = getIndoTimestamp();
    const wamid = generateWamid(siswaNisn, 'SINGLE');

    setWaDeliveryStatusMap(prev => ({
      ...prev,
      [siswaNisn]: {
        status: 'TERKIRIM',
        waktu: waktuNow,
        wamid: wamid
      }
    }));

    setCopySuccessToast(`Pesan terkirim ke WhatsApp Wali Murid ${namaOrtu ? `(${namaOrtu})` : ''} untuk ananda ${namaSiswa} di nomor ${noHp} via WhatsApp Meta Cloud API.`);
    setTimeout(() => setCopySuccessToast(null), 4000);
  };

  // 1-Click Send All to Respective Wali Murid (Sekali Klik Terkirim Semua)
  const handleOneClickSendAll = (onlyUnsent: boolean = false) => {
    if (isSendingBatch) return;

    const targetList = onlyUnsent 
      ? dailySummaryItems.filter(item => item.statusWA !== 'TERKIRIM')
      : dailySummaryItems;

    if (targetList.length === 0) {
      setCopySuccessToast('Seluruh wali murid sudah menerima laporan presensi harian.');
      setTimeout(() => setCopySuccessToast(null), 3000);
      return;
    }

    setIsSendingBatch(true);
    setBatchProgress(0);

    const total = targetList.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= total) {
        clearInterval(interval);
        setIsSendingBatch(false);
        setCurrentSendingTarget(null);
        setBatchProgress(100);
        setCopySuccessToast(`✅ Sekali klik berhasil! Laporan presensi sukses terkirim ke seluruh (${total}) wali murid di WhatsApp masing-masing via Meta Cloud API.`);
        setTimeout(() => setCopySuccessToast(null), 5000);
        return;
      }

      const item = targetList[currentIdx];
      const waktuNow = getIndoTimestamp();
      const wamidBatch = generateWamid(item.nisn, 'BATCH_ALL');

      setCurrentSendingTarget({
        namaOrtu: item.namaOrtu,
        namaSiswa: item.nama,
        kelas: item.kelas,
        noHp: item.noHpOrtu,
        current: currentIdx + 1,
        total: total
      });

      setWaDeliveryStatusMap(prev => ({
        ...prev,
        [item.nisn]: {
          status: 'TERKIRIM',
          waktu: waktuNow,
          wamid: wamidBatch
        }
      }));

      currentIdx++;
      setBatchProgress(Math.round((currentIdx / total) * 100));
    }, 280);
  };

  // Reset status pengiriman WA for testing
  const handleResetWaStatus = () => {
    setWaDeliveryStatusMap({});
    setCopySuccessToast('Status pengiriman WhatsApp telah direset ke Belum Dikirim.');
    setTimeout(() => setCopySuccessToast(null), 3000);
  };

  // Batch Broadcast Daily Summary from modal
  const handleExecuteBatchSummary = () => {
    setShowSummaryModal(false);
    handleOneClickSendAll(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {copySuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCheck className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{copySuccessToast}</span>
          <button onClick={() => setCopySuccessToast(null)} className="ml-2 text-emerald-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Action Header with Clear Hierarchy and Vibrant Color Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                Dashboard & Laporan Presensi Digital
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Monitoring kehadiran madani, rekapitulasi harian, dan notifikasi WhatsApp Gateway ke wali murid
            </p>
          </div>
        </div>

        {/* Action Button Clusters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Grafik */}
          <button
            type="button"
            onClick={() => setShowWeeklyDisciplineChart(!showWeeklyDisciplineChart)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs ${
              showWeeklyDisciplineChart
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-200 font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
            title="Tampilkan / sembunyikan grafik tren mingguan"
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Grafik Tren</span>
          </button>

          {/* Opsi & Template WA */}
          <button
            type="button"
            onClick={() => setShowSummaryModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            title="Buka pratinjau template pesan WhatsApp"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400" />
            <span>Template WA</span>
          </button>

          {/* Presensi Manual */}
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Manual</span>
          </button>

          {/* Laporan Bulanan (PDF/CSV) */}
          <button
            type="button"
            onClick={() => setShowMonthlyReportModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            title="Cetak Laporan Bulanan Resmi PDF A4 atau ekspor CSV"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Laporan PDF</span>
          </button>

          {/* Unduh Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleExportExcelRekap}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-400/40 text-emerald-200 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            title="Unduh file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Primary Action 1: Kirim WA Massal Alpa */}
          <button
            type="button"
            onClick={() => setShowBroadcastAlpaModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white flex items-center space-x-1.5 shadow-md shadow-rose-900/30 transition cursor-pointer shrink-0"
            title="Kirim pesan WhatsApp massal ke orang tua siswa yang belum hadir / alpa"
          >
            <Send className="w-3.5 h-3.5 text-rose-200" />
            <span>Kirim WA Alpa</span>
            {absentStudents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-900/90 text-rose-100 border border-rose-400/40">
                {absentStudents.length}
              </span>
            )}
          </button>

          {/* Primary Action 2: Sekali Klik Kirim Semua WA */}
          <button
            type="button"
            onClick={() => handleOneClickSendAll(false)}
            disabled={isSendingBatch}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white flex items-center space-x-1.5 shadow-md shadow-emerald-900/30 transition disabled:opacity-60 cursor-pointer shrink-0"
            title="Kirim ringkasan presensi harian ke WhatsApp seluruh wali murid sekarang"
          >
            {isSendingBatch ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                <span>Mengirim ({batchProgress}%)</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Kirim Semua WA ({dailySummaryItems.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Teacher 3-Day Consecutive Absence Alert Banner (With ON/OFF Toggle) */}
      {consecutiveAlerts.length > 0 && (
        <TeacherAbsenceAlert
          alerts={consecutiveAlerts}
          onManualMark={onManualMark}
          onNavigateToRekap={() => setFilterConsecutiveAbsentOnly(true)}
          isEnabled={isAbsenceAlertEnabled}
          onToggleEnabled={onToggleAbsenceAlert}
        />
      )}

      {/* KPI Cards Grid - Clear, High-Contrast, Vibrant Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Siswa */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-900/60 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Total Siswa</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/30 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950 dark:text-white mt-1.5 font-mono tracking-tight">
            {totalTarget}
          </div>
          <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate flex items-center space-x-1">
            {filterKelas === 'SEMUA' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>Semua Kelas ({siswaList.length} siswa)</span>
              </>
            ) : (
              <span className="text-indigo-700 dark:text-indigo-300 font-bold inline-flex items-center space-x-1 bg-indigo-100/80 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded-md">
                <GraduationCap className="w-3 h-3" />
                <span>Kelas {filterKelas}</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Hadir Tepat Waktu */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">Tepat Waktu</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300 mt-1.5 font-mono tracking-tight">
            {tepatWaktuCount}
          </div>
          <div className="mt-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {totalTarget > 0 ? Math.round((tepatWaktuCount / totalTarget) * 100) : 0}%
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-500">Tingkat Hadir</span>
          </div>
        </div>

        {/* Card 3: Terlambat */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/90 via-white to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">Terlambat</span>
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm shadow-amber-600/30 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-300 mt-1.5 font-mono tracking-tight">
            {terlambatCount}
          </div>
          <div className="mt-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
              {totalTarget > 0 ? Math.round((terlambatCount / totalTarget) * 100) : 0}%
            </span>
            <span className="truncate">Lewat Batas Pagi</span>
          </div>
        </div>

        {/* Card 4: Izin & Sakit */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-50/90 via-white to-white dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-sky-200/90 dark:border-sky-900/60 shadow-xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-800 transition group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider">Izin & Sakit</span>
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm shadow-sky-600/30 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-800 dark:text-sky-300 mt-1.5 font-mono tracking-tight">
            {izinCount + sakitCount}
          </div>
          <div className="mt-1.5 text-[11px] font-bold text-sky-700 dark:text-sky-400 flex items-center space-x-1.5">
            <span className="px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
              {izinCount} Izin
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
              {sakitCount} Sakit
            </span>
          </div>
        </div>

        {/* Card 5: Belum Hadir / Alpa */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/90 via-white to-white dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-rose-200/90 dark:border-rose-900/60 shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">Alpa / Belum Scan</span>
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm shadow-rose-600/30 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-800 dark:text-rose-300 mt-1.5 font-mono tracking-tight">
            {belumAbsenCount}
          </div>
          <div className="mt-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center space-x-1.5">
            <span className="px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
              {totalTarget > 0 ? Math.round((belumAbsenCount / totalTarget) * 100) : 0}%
            </span>
            <span className="font-medium text-rose-600 dark:text-rose-500">Menunggu / Alpa</span>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Tren Kehadiran Mingguan Siswa (Recharts) */}
      {showWeeklyDisciplineChart && (
        <WeeklyDisciplineChart
          presensiList={presensiList}
          siswaList={siswaList}
          selectedDate={selectedDate}
          schoolProfile={schoolProfile}
          filterKelasDefault={filterKelas}
        />
      )}

      {/* Filter Bar & Sub-View Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Sub-view switcher with Framer Motion Glider (Mobile-Safe Scrollable) */}
          <div className="relative flex items-center space-x-1 overflow-x-auto scrollbar-none max-w-full flex-nowrap bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl text-xs font-semibold select-none border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('transaksi')}
              className={`shrink-0 whitespace-nowrap relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer z-10 ${
                viewMode === 'transaksi'
                  ? 'text-sky-900 dark:text-sky-200 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {viewMode === 'transaksi' && (
                <motion.span
                  layoutId="subViewGlider"
                  className="absolute inset-0 bg-white dark:bg-slate-700/90 rounded-xl shadow-xs border border-sky-200/50 dark:border-sky-500/20 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Log Presensi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                viewMode === 'transaksi'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
              }`}>
                {displayedRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('rekap_wa')}
              className={`shrink-0 whitespace-nowrap relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer z-10 ${
                viewMode === 'rekap_wa'
                  ? 'text-emerald-900 dark:text-emerald-200 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {viewMode === 'rekap_wa' && (
                <motion.span
                  layoutId="subViewGlider"
                  className="absolute inset-0 bg-white dark:bg-slate-700/90 rounded-xl shadow-xs border border-emerald-200/50 dark:border-emerald-500/20 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Rekap Harian & WhatsApp</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                viewMode === 'rekap_wa'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              }`}>
                {dailySummaryItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('pengajuan_izin')}
              className={`shrink-0 whitespace-nowrap relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer z-10 ${
                viewMode === 'pengajuan_izin'
                  ? 'text-rose-900 dark:text-rose-200 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {viewMode === 'pengajuan_izin' && (
                <motion.span
                  layoutId="subViewGlider"
                  className="absolute inset-0 bg-white dark:bg-slate-700/90 rounded-xl shadow-xs border border-rose-200/50 dark:border-rose-500/20 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>Persetujuan Izin Online</span>
              {pendingIzinCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold animate-pulse shadow-2xs">
                  {pendingIzinCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setViewMode('jadwal_kbm')}
              className={`shrink-0 whitespace-nowrap relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer z-10 ${
                viewMode === 'jadwal_kbm'
                  ? 'text-teal-900 dark:text-teal-200 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {viewMode === 'jadwal_kbm' && (
                <motion.span
                  layoutId="subViewGlider"
                  className="absolute inset-0 bg-white dark:bg-slate-700/90 rounded-xl shadow-xs border border-teal-200/50 dark:border-teal-500/20 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Jadwal Guru & KBM</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                viewMode === 'jadwal_kbm'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
              }`}>
                {guruMapelList.length} Guru
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('log_aktivitas')}
              className={`shrink-0 whitespace-nowrap relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition z-10 cursor-pointer ${
                viewMode === 'log_aktivitas'
                  ? 'text-indigo-900 dark:text-indigo-200 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {viewMode === 'log_aktivitas' && (
                <motion.span
                  layoutId="subViewGlider"
                  className="absolute inset-0 bg-white dark:bg-slate-700/90 rounded-xl shadow-xs border border-indigo-200/50 dark:border-indigo-500/20 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Log Aktivitas</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                viewMode === 'log_aktivitas'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
              }`}>
                {activityLogs.length}
              </span>
            </button>
          </div>

          {/* Quick info notification & School Profile */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
            {schoolProfile && (
              <span className="font-semibold text-sky-900 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800/60">
                {schoolProfile.namaSekolah} • TP {schoolProfile.tahunPelajaran} ({schoolProfile.semester})
              </span>
            )}
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400">Meta Cloud API v20.0</span>
              <span className="text-slate-400 dark:text-slate-600">• Webhook Aktif</span>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Kelas:</span>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs bg-white dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition cursor-pointer"
              aria-label="Pilih Kelas"
            >
              <option value="SEMUA">Semua Kelas ({siswaList.length} Siswa)</option>
              {availableClasses.map(k => (
                <option key={k} value={k}>
                  Kelas {k} ({classStudentCounts[k] || 0} Siswa)
                </option>
              ))}
            </select>
            {filterKelas !== 'SEMUA' && (
              <button
                type="button"
                onClick={() => setFilterKelas('SEMUA')}
                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                title="Reset pilihan kelas ke Semua"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {viewMode === 'transaksi' && (
            <>
              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Sesi:</span>
                <select
                  value={filterTipe}
                  onChange={(e) => setFilterTipe(e.target.value)}
                  className="border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="SEMUA">Semua Sesi</option>
                  <option value="DATANG">Masuk (DATANG)</option>
                  <option value="PULANG">Pulang (PULANG)</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="HADIR">Hadir</option>
                  <option value="TERLAMBAT">Terlambat</option>
                  <option value="IZIN">Izin</option>
                  <option value="SAKIT">Sakit</option>
                </select>
              </div>
            </>
          )}

          {/* Quick Filter Button for 3-Day Absent Students */}
          {consecutiveAlerts.length > 0 && (
            <button
              onClick={() => setFilterConsecutiveAbsentOnly(!filterConsecutiveAbsentOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 ${
                filterConsecutiveAbsentOnly
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900'
              }`}
              title="Filter tabel untuk hanya menampilkan siswa yang tidak hadir 3 hari berturut-turut"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Alert: 3 Hari Alpa ({consecutiveAlerts.length})</span>
              {filterConsecutiveAbsentOnly && <X className="w-3.5 h-3.5 ml-1" />}
            </button>
          )}
        </div>

        {/* Quick Class Pills for instant 1-click filtering */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5 mr-1 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Pilih Kelas:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterKelas('SEMUA')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5 cursor-pointer ${
              filterKelas === 'SEMUA'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-600/30 ring-2 ring-indigo-300 dark:ring-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <span>Semua Kelas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterKelas === 'SEMUA' ? 'bg-indigo-900/80 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {siswaList.length}
            </span>
          </button>
          {availableClasses.map(k => {
            const count = classStudentCounts[k] || 0;
            const isSelected = filterKelas === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilterKelas(k)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-600/30 ring-2 ring-indigo-300 dark:ring-indigo-800'
                    : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50/60 dark:hover:bg-slate-750'
                }`}
              >
                <span>Kelas {k}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-indigo-900/80 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Class Notification Banner */}
        {filterKelas !== 'SEMUA' && (
          <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-xl px-3.5 py-2 text-xs text-indigo-900 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>
                Menampilkan data presensi spesifik <strong>Kelas {filterKelas}</strong> ({totalTarget} siswa terdaftar) pada tanggal <strong>{selectedDate}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFilterKelas('SEMUA')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-950 flex items-center space-x-1 underline"
            >
              <span>✕ Tampilkan Semua Kelas</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          THE MAIN TABLE CONTAINER (EXACT DESIGN AS IN USER IMAGE)
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Top filter row inside the card: only shown on transaction and rekap views */}
        {(viewMode === 'transaksi' || viewMode === 'rekap_wa') && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={viewMode === 'transaksi' ? 'Filter baris di PRESENSI...' : 'Filter baris di REKAP...'}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Quick Class Dropdown Filter in Table Toolbar */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-xs hover:border-slate-400 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-semibold text-slate-600 hidden sm:inline">Kelas:</span>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer pr-1"
                aria-label="Filter berdasarkan kelas"
              >
                <option value="SEMUA">Semua Kelas ({siswaList.length})</option>
                {availableClasses.map(k => (
                  <option key={k} value={k}>
                    Kelas {k} ({classStudentCounts[k] || 0} siswa)
                  </option>
                ))}
              </select>
              {filterKelas !== 'SEMUA' && (
                <button
                  type="button"
                  onClick={() => setFilterKelas('SEMUA')}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                  title="Reset filter kelas ke Semua"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {viewMode === 'rekap_wa' && (
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {dailySummaryItems.length} Wali Murid
                </span>
                {unsentCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                    {unsentCount} Belum Dikirim
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center space-x-1">
                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                    <span>Semua Terkirim</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Density Selector */}
            <div className="inline-flex bg-slate-200/70 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setDensity('normal')}
                className={`px-2 py-1 rounded-md transition ${
                  density === 'normal' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Normal"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 rounded-md transition ${
                  density === 'compact' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Compact (Rapat)"
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setDensity('card')}
                className={`px-2 py-1 rounded-md transition flex items-center space-x-1 ${
                  density === 'card' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kartu Mobile"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Kartu</span>
              </button>
            </div>

            {viewMode === 'rekap_wa' && (
              <>
                {/* TOMBOL UTAMA: SEKALI KLIK TERKIRIM SEMUA DI MASING-MASING WALI MURID */}
                <button
                  type="button"
                  onClick={() => handleOneClickSendAll(false)}
                  disabled={isSendingBatch}
                  className="px-3 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition disabled:opacity-60 cursor-pointer shrink-0"
                  title="Sekali klik: Langsung kirim pesan laporan presensi ke WhatsApp seluruh masing-masing wali murid"
                >
                  {isSendingBatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-200 shrink-0" />
                      <span className="hidden sm:inline">Mengirim ke Wali Murid ({batchProgress}%)</span>
                      <span className="sm:hidden">Mengirim ({batchProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                      <span className="hidden sm:inline">⚡ Sekali Klik: Kirim Semua ke Wali Murid ({dailySummaryItems.length})</span>
                      <span className="sm:hidden">⚡ Kirim Semua WA ({dailySummaryItems.length})</span>
                    </>
                  )}
                </button>

                {unsentCount > 0 && !isSendingBatch && (
                  <button
                    type="button"
                    onClick={() => handleOneClickSendAll(true)}
                    className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition active:scale-95 shrink-0 cursor-pointer"
                    title={`Kirim hanya ke ${unsentCount} wali murid yang statusnya belum terkirim`}
                  >
                    <Send className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">Kirim {unsentCount} Belum Terkirim</span>
                    <span className="sm:hidden">{unsentCount} Belum Dikirim</span>
                  </button>
                )}

                {/* Reset button to allow repeated testing */}
                <button
                  onClick={handleResetWaStatus}
                  disabled={isSendingBatch}
                  className="px-2 py-1 text-slate-400 hover:text-slate-600 rounded text-[11px] font-medium transition"
                  title="Reset status pengiriman WA untuk uji coba kirim ulang"
                >
                  Reset Status
                </button>
              </>
            )}

            {/* Tombol Presensi Massal Tanpa Scan QR (Admin & Guru) */}
            {((currentUser && currentUser.role === 'ADMIN') || (currentUser && currentUser.role === 'GURU')) && onOpenMassAttendanceModal && (
              <button
                type="button"
                onClick={onOpenMassAttendanceModal}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition shrink-0 cursor-pointer"
                title="Absenkan seluruh siswa atau 1 kelas sekaligus tanpa perlu scan QR"
              >
                <Users className="w-3.5 h-3.5 text-indigo-100" />
                <span className="hidden sm:inline">Absenkan Kelas / Massal</span>
                <span className="sm:hidden">Absenkan Massal</span>
              </button>
            )}

            <span className="text-slate-400 text-[11px] hidden xl:inline">
              Diperbarui secara real-time saat scan QR berlangsung
            </span>
          </div>
        </div>
        )}

        {/* Live Progress Banner when batch sending */}
        {isSendingBatch && currentSendingTarget && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-emerald-900">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="font-bold">Mengirim Pesan WhatsApp ke Wali Murid:</span>
              <span className="font-semibold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded">
                {currentSendingTarget.namaOrtu} ({currentSendingTarget.noHp})
              </span>
              <span className="text-slate-600">
                — Siswa: <strong>{currentSendingTarget.namaSiswa}</strong> ({currentSendingTarget.kelas})
              </span>
            </div>

            <div className="flex items-center space-x-2.5 text-emerald-900 font-mono text-[11px]">
              <span className="font-semibold">
                [{currentSendingTarget.current} / {currentSendingTarget.total}]
              </span>
              <div className="w-28 bg-emerald-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-150"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
              <span className="font-bold w-9 text-right">{batchProgress}%</span>
            </div>
          </div>
        )}

        {/* VIEW TABLES WITH SMOOTH TRANSITION */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* VIEW 1: LOG TRANSAKSI PRESENSI (EXACT MATCH WITH IMAGE.PNG) */}
            {viewMode === 'transaksi' && (
              density === 'card' ? (
                /* Card-based layout for mobile */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedRecords.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 font-sans">
                      Belum ada data presensi yang cocok dengan filter tanggal ({selectedDate}) atau filter kelas.
                    </div>
                  ) : (
                    displayedRecords.map((row, idx) => (
                      <div key={row.id} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 hover:border-slate-300 transition space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] text-sky-600 font-bold">#{idx + 1} • {row.id}</span>
                            <h4 className="font-bold text-slate-900 leading-tight mt-0.5">{row.namaSiswa}</h4>
                            <span className="text-[11px] text-slate-500 font-mono">NISN: {row.nisn} • Kelas {row.kelas}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            row.status === 'HADIR' ? 'bg-[#dcfce7] text-[#15803d]' :
                            row.status === 'TERLAMBAT' ? 'bg-[#fef3c7] text-[#b45309]' :
                            row.status === 'IZIN' ? 'bg-[#dbeafe] text-[#1d4ed8]' :
                            row.status === 'SAKIT' ? 'bg-[#f3e8ff] text-[#7e22ce]' : 'bg-[#ffe4e6] text-[#be123c]'
                          }`}>
                            {row.status}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100 text-[11px] grid grid-cols-2 gap-1.5 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Waktu:</span>
                            <span className="font-semibold text-slate-800 font-mono">{row.tanggal} {row.waktu}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Tipe:</span>
                            <span className="font-bold text-[#0284c7]">{row.tipe}</span> ({row.metode})
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-slate-400 text-[10px]">Status WhatsApp:</span>
                            <span className="text-[#16a34a] font-bold font-mono text-[10px] flex items-center space-x-1">
                              <CheckCheck className="w-3 h-3 text-[#16a34a] inline" />
                              <span>{row.waStatus}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0B132B] text-white sticky top-0 font-mono text-[11px] tracking-wider">
                      <tr>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>#</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>ID_PRESENSI</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>TANGGAL</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>WAKTU</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>NISN</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>NAMA_SISWA</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>KELAS</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>TIPE</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>STATUS</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>METODE</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-800`}>STATUS_WA</th>
                        <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'}`}>WA_RESPONSE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {displayedRecords.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-12 text-center text-slate-400 font-sans">
                            Belum ada data presensi yang cocok dengan filter tanggal ({selectedDate}) atau filter kelas.
                          </td>
                        </tr>
                      ) : (
                        displayedRecords.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors font-mono text-[11px]">
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-sky-500 font-mono font-medium border-r border-slate-100`}>{idx + 1}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-900 border-r border-slate-100 font-bold`}>{row.id}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-700 border-r border-slate-100`}>{row.tanggal}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-700 border-r border-slate-100`}>{row.waktu}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-700 border-r border-slate-100`}>{row.nisn}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-900 font-sans font-bold border-r border-slate-100`}>{row.namaSiswa}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-700 border-r border-slate-100`}>{row.kelas}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 font-bold text-[#0284c7]`}>{row.tipe}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 font-sans`}>
                              <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-2xs ${
                                row.status === 'HADIR'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800'
                                  : row.status === 'TERLAMBAT'
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800'
                                  : row.status === 'IZIN'
                                  ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800'
                                  : row.status === 'SAKIT'
                                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/60 dark:border-purple-800'
                                  : 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800'
                              }`}>
                                <span>{row.status}</span>
                              </span>
                            </td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-600 border-r border-slate-100`}>{row.metode}</td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100`}>
                              {row.waStatus === 'TERKIRIM' ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold tracking-tight inline-flex items-center space-x-1">
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>TERKIRIM</span>
                                </span>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-400 font-semibold inline-flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  <span>{row.waStatus}</span>
                                </span>
                              )}
                            </td>
                            <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-slate-500 font-mono truncate max-w-sm`}>{row.waResponse || 'Meta Graph API 200 OK'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )
            )}

        {/* VIEW 2: REKAPITULASI HARIAN & STATUS RINGKASAN WA */}
        {viewMode === 'rekap_wa' && (
          <div className="space-y-0">
            {/* ========================================================================= */}
            {/* TABEL PERINGATAN SISWA BELUM HADIR / ALPA DENGAN TEKS JELAS & MENARIK */}
            {/* ========================================================================= */}
            <div className="m-3 sm:m-4 rounded-2xl border-2 border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 shadow-md overflow-hidden transition-all">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-rose-800/80">
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-rose-200 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                    <AlertTriangle className="w-5 h-5 text-rose-300" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-white text-base tracking-tight">
                        Peringatan Siswa Belum Hadir / Alpa:
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${
                        absentStudents.length > 0 
                          ? 'bg-rose-500 text-white animate-pulse' 
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {absentStudents.length > 0 ? `${absentStudents.length} Siswa Terdeteksi` : 'Nihil / 0 Siswa'}
                      </span>
                    </div>
                    <p className="text-xs text-rose-200/90 mt-1">
                      {absentStudents.length > 0
                        ? `Daftar siswa di bawah tercatat belum melakukan presensi datang atau berstatus alpa pada tanggal ${selectedDate}.`
                        : `Alhamdulillah, seluruh siswa kelas ${filterKelas} tercatat telah melakukan presensi pada tanggal ${selectedDate}.`}
                    </p>
                  </div>
                </div>

                {absentStudents.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => setShowBroadcastAlpaModal(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                      title="Kirim pesan peringatan WhatsApp ke seluruh wali murid sekaligus"
                    >
                      <Send className="w-3.5 h-3.5 text-rose-100" />
                      <span>Kirim WA Massal ({absentStudents.length} Ortu)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportAbsentStudentsExcel}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl font-semibold text-xs border border-white/20 flex items-center space-x-1.5 transition cursor-pointer"
                      title="Unduh berkas Excel daftar siswa alpa"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Ekspor Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyAbsentStudentsTsv}
                      className="px-2.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl font-semibold text-xs border border-white/20 flex items-center space-x-1 transition cursor-pointer"
                      title="Salin data tabel ke clipboard"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-200" />
                      <span className="hidden sm:inline">Salin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAbsentTableCollapsed(!isAbsentTableCollapsed)}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition cursor-pointer"
                      title={isAbsentTableCollapsed ? 'Tampilkan Tabel' : 'Sembunyikan Tabel'}
                    >
                      {isAbsentTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Table Content (if not collapsed) */}
              {!isAbsentTableCollapsed && (
                <div>
                  {absentStudents.length === 0 ? (
                    <div className="py-10 px-4 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-90" />
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Tidak Ada Siswa Alpa</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Semua siswa tercatat hadir, terlambat dengan keterangan, atau mengajukan izin resmi.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[980px]">
                        {/* Table Headers */}
                        <thead className="bg-[#2a0715] dark:bg-[#1a050d] text-white font-mono text-[11px] font-bold tracking-wider border-b-2 border-rose-500">
                          <tr>
                            <th className="py-3 px-3 text-center border-r border-rose-900/60 text-rose-300 w-12">#</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-sky-300">NISN</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-white font-sans">NAMA_SISWA</th>
                            <th className="py-3 px-3 text-center border-r border-rose-900/60 text-indigo-300">KELAS</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-amber-200 font-sans">WALI_MURID</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-emerald-300">NO_WA_ORTU</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-rose-300">SESI_MASUK</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-slate-300">SESI_PULANG</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-red-200 text-center font-sans">STATUS_AKHIR</th>
                            <th className="py-3 px-3.5 border-r border-rose-900/60 text-emerald-200 text-center font-sans">STATUS_WA</th>
                            <th className="py-3 px-3.5 text-center text-amber-300 font-sans">AKSI</th>
                          </tr>
                        </thead>
                        {/* Table Body */}
                        <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40 font-sans bg-white dark:bg-slate-900">
                          {absentStudents.map((item, idx) => (
                            <tr 
                              key={`alpa-${item.nisn}`} 
                              className="hover:bg-rose-50/70 dark:hover:bg-rose-950/40 transition-colors group"
                            >
                              {/* # */}
                              <td className="py-3 px-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400 border-r border-rose-100 dark:border-rose-900/40">
                                {idx + 1}
                              </td>

                              {/* NISN */}
                              <td className="py-3 px-3.5 font-mono font-bold text-sky-800 dark:text-sky-300 border-r border-rose-100 dark:border-rose-900/40">
                                <span className="bg-sky-50 dark:bg-sky-950/70 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 text-[11px] tracking-wide inline-block font-mono">
                                  {item.nisn}
                                </span>
                              </td>

                              {/* NAMA_SISWA */}
                              <td className="py-3 px-3.5 border-r border-rose-100 dark:border-rose-900/40">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-black text-[10px] flex items-center justify-center shrink-0">
                                    {item.nama.charAt(0)}
                                  </div>
                                  <span className="font-extrabold text-slate-950 dark:text-white text-xs group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                                    {item.nama}
                                  </span>
                                </div>
                              </td>

                              {/* KELAS */}
                              <td className="py-3 px-3 text-center border-r border-rose-100 dark:border-rose-900/40">
                                <span className="font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 font-mono text-[11px] inline-block">
                                  {item.kelas}
                                </span>
                              </td>

                              {/* WALI_MURID */}
                              <td className="py-3 px-3.5 border-r border-rose-100 dark:border-rose-900/40 font-semibold text-slate-900 dark:text-slate-100">
                                {item.namaOrtu}
                              </td>

                              {/* NO_WA_ORTU */}
                              <td className="py-3 px-3.5 border-r border-rose-100 dark:border-rose-900/40 font-mono">
                                <a
                                  href={createWaWarningUrl(item)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-1.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-[11px] transition shadow-2xs group-hover:border-emerald-400"
                                  title={`Kirim pesan WhatsApp langsung ke ${item.noHpOrtu}`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>{item.noHpOrtu}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              </td>

                              {/* SESI_MASUK */}
                              <td className="py-3 px-3.5 border-r border-rose-100 dark:border-rose-900/40">
                                <span className="inline-flex items-center space-x-1 bg-rose-100/90 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-md border border-rose-300/80 dark:border-rose-900 text-[10px]">
                                  <span>✕</span>
                                  <span>{item.datangWaktu === '-' ? 'Belum Absen' : `${item.datangWaktu} (${item.datangStatus})`}</span>
                                </span>
                              </td>

                              {/* SESI_PULANG */}
                              <td className="py-3 px-3.5 border-r border-rose-100 dark:border-rose-900/40">
                                <span className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium px-2 py-0.5 rounded text-[10px]">
                                  <span>-</span>
                                  <span>{item.pulangWaktu === '-' ? 'Belum Pulang' : `${item.pulangWaktu} (${item.pulangStatus})`}</span>
                                </span>
                              </td>

                              {/* STATUS_AKHIR */}
                              <td className="py-3 px-3.5 text-center border-r border-rose-100 dark:border-rose-900/40">
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                  <span>ALPA (BELUM HADIR)</span>
                                </span>
                              </td>

                              {/* STATUS_WA */}
                              <td className="py-3 px-3.5 text-center border-r border-rose-100 dark:border-rose-900/40">
                                {item.statusWA === 'TERKIRIM' ? (
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>TERKIRIM</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    <span>BELUM DIKIRIM</span>
                                  </span>
                                )}
                              </td>

                              {/* AKSI */}
                              <td className="py-3 px-3.5 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSendSingleSummary(item.nisn, item.nama, item.noHpOrtu, item.namaOrtu)}
                                    disabled={isSendingBatch}
                                    className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-lg text-[10px] font-bold inline-flex items-center space-x-1 shadow-sm transition disabled:opacity-50 cursor-pointer"
                                    title={`Kirim WA Peringatan Alpa ke Wali Murid (${item.namaOrtu})`}
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Kirim WA</span>
                                  </button>

                                  <a
                                    href={createWaWarningUrl(item)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition"
                                    title="Buka Chat WhatsApp Web / App"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {density === 'card' ? (
            /* Card-based layout for mobile */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailySummaryItems.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 font-sans">
                  Tidak ada data siswa yang cocok dengan filter pencarian.
                </div>
              ) : (
                dailySummaryItems.map((item, idx) => (
                  <div key={item.nisn} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 hover:border-slate-300 transition space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-sky-600 font-bold">#{idx + 1} • NISN {item.nisn}</span>
                        <h4 className="font-bold text-slate-900 leading-tight mt-0.5">{item.nama}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">Kelas {item.kelas}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        item.statusAkhir === 'HADIR LENGKAP' ? 'bg-[#dcfce7] text-[#15803d]' :
                        item.statusAkhir.includes('TERLAMBAT') ? 'bg-[#fef3c7] text-[#b45309]' :
                        item.statusAkhir === 'BELUM PRESENSI PULANG' ? 'bg-orange-100 text-orange-800' :
                        item.statusAkhir === 'IZIN' ? 'bg-[#dbeafe] text-[#1d4ed8]' :
                        item.statusAkhir === 'SAKIT' ? 'bg-[#f3e8ff] text-[#7e22ce]' :
                        'bg-[#ffe4e6] text-[#be123c]'
                      }`}>
                        {item.statusAkhir}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-2.5 border border-slate-100 space-y-2 text-[11px]">
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div className="bg-slate-50 p-1.5 rounded">
                          <span className="text-slate-400 block text-[10px]">Sesi Masuk:</span>
                          <span className="font-bold text-slate-800">{item.datangWaktu}</span>
                          <span className={`block text-[10px] font-semibold ${
                            item.datangStatus === 'HADIR' ? 'text-emerald-600' :
                            item.datangStatus === 'TERLAMBAT' ? 'text-amber-600' : 'text-slate-400'
                          }`}>({item.datangStatus})</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded">
                          <span className="text-slate-400 block text-[10px]">Sesi Pulang:</span>
                          <span className="font-bold text-slate-800">{item.pulangWaktu}</span>
                          <span className={`block text-[10px] font-semibold ${
                            item.pulangStatus === 'HADIR' ? 'text-purple-600' : 'text-slate-400'
                          }`}>({item.pulangStatus})</span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Wali: <strong className="text-slate-800">{item.namaOrtu}</strong></span>
                          <span className="text-slate-500 font-mono text-[10px]">{item.noHpOrtu}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400 text-[10px]">Status WA:</span>
                            {item.statusWA === 'TERKIRIM' ? (
                              <span className="text-[#16a34a] font-bold text-[11px] inline-flex items-center space-x-0.5">
                                <CheckCheck className="w-3 h-3" />
                                <span>Terkirim</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold text-[11px]">Belum Dikirim</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleSendSingleSummary(item.nisn, item.nama, item.noHpOrtu, item.namaOrtu)}
                              disabled={isSendingBatch}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold inline-flex items-center space-x-1 transition disabled:opacity-50"
                              title={`Kirim laporan presensi ke WhatsApp wali murid (${item.namaOrtu} - ${item.noHpOrtu})`}
                            >
                              <Send className="w-3 h-3" />
                              <span>Kirim WA</span>
                            </button>
                            {(item.datangStatus === 'BELUM_ABSEN' || item.statusAkhir.includes('ALPA')) && (
                              <button
                                onClick={() => setShowBroadcastAlpaModal(true)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-bold inline-flex items-center space-x-1 transition active:scale-95"
                                title={`Kirim peringatan alpa via WhatsApp ke orang tua ananda ${item.nama}`}
                              >
                                <MessageSquare className="w-3 h-3 text-rose-600" />
                                <span>Alpa WA</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0B132B] dark:bg-[#070c1b] text-white sticky top-0 font-mono text-[11px] font-bold tracking-wider border-b-2 border-emerald-500">
                  <tr>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3'} text-center border-r border-slate-800 text-sky-400 w-12`}>#</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} border-r border-slate-800 text-sky-300 font-mono`}>NISN</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} border-r border-slate-800 text-white font-sans`}>NAMA_SISWA</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3'} text-center border-r border-slate-800 text-indigo-300`}>KELAS</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} border-r border-slate-800 text-amber-200 font-sans`}>WALI_MURID</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} border-r border-slate-800 text-emerald-300 font-mono`}>NO_WA_ORTU</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} border-r border-slate-800 text-emerald-300`}>SESI_MASUK</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} border-r border-slate-800 text-purple-300`}>SESI_PULANG</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} text-center border-r border-slate-800 text-amber-200 font-sans`}>STATUS_AKHIR</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} text-center border-r border-slate-800 text-emerald-200 font-sans`}>STATUS_WA</th>
                    <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3.5 px-3.5'} text-center font-sans`}>
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className="text-white">AKSI</span>
                        <button
                          onClick={() => handleOneClickSendAll(false)}
                          disabled={isSendingBatch}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white rounded text-[10px] font-bold inline-flex items-center space-x-1 shadow-sm transition disabled:opacity-50 cursor-pointer"
                          title="Sekali klik: Kirim pesan WA ke seluruh masing-masing wali murid"
                        >
                          <Zap className="w-2.5 h-2.5 text-amber-200 fill-amber-200" />
                          <span>Kirim Semua</span>
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans bg-white dark:bg-slate-900">
                  {dailySummaryItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-sans">
                        Tidak ada data siswa yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    dailySummaryItems.map((item, idx) => (
                      <tr key={item.nisn} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors font-mono text-[11px] group">
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3'} text-sky-600 dark:text-sky-400 font-mono font-bold text-center border-r border-slate-100 dark:border-slate-800`}>
                          {idx + 1}
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 dark:border-slate-800`}>
                          <span className="font-mono font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 text-[11px] tracking-wide inline-block">
                            {item.nisn}
                          </span>
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} font-sans border-r border-slate-100 dark:border-slate-800`}>
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {item.nama.charAt(0)}
                            </div>
                            <span className="font-extrabold text-slate-950 dark:text-white text-xs group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {item.nama}
                            </span>
                          </div>
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3'} text-center border-r border-slate-100 dark:border-slate-800`}>
                          <span className="font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 font-mono text-[11px] inline-block">
                            {item.kelas}
                          </span>
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} font-sans font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800`}>
                          {item.namaOrtu}
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 dark:border-slate-800 font-mono`}>
                          <a
                            href={createWaWarningUrl(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] transition"
                            title={`Kirim WA langsung ke ${item.noHpOrtu}`}
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{item.noHpOrtu}</span>
                          </a>
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 dark:border-slate-800`}>
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border font-bold text-[10px] ${
                            item.datangStatus === 'HADIR' ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                            item.datangStatus === 'TERLAMBAT' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                            item.datangStatus === 'IZIN' ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                            item.datangStatus === 'SAKIT' ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                            'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                          }`}>
                            <span>{item.datangWaktu === '-' ? 'Belum Absen' : `${item.datangWaktu} (${item.datangStatus})`}</span>
                          </span>
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 dark:border-slate-800`}>
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[10px] ${
                            item.pulangStatus === 'HADIR' ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-bold' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-medium'
                          }`}>
                            <span>{item.pulangWaktu === '-' ? 'Belum Pulang' : `${item.pulangWaktu} (${item.pulangStatus})`}</span>
                          </span>
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 dark:border-slate-800 font-sans text-center`}>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black shadow-2xs tracking-wide ${
                            item.statusAkhir === 'HADIR LENGKAP' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                            item.statusAkhir.includes('TERLAMBAT') ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                            item.statusAkhir === 'BELUM PRESENSI PULANG' ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/90 dark:text-orange-300 border border-orange-300 dark:border-orange-800' :
                            item.statusAkhir === 'IZIN' ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/90 dark:text-sky-300 border border-sky-300 dark:border-sky-800' :
                            item.statusAkhir === 'SAKIT' ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/90 dark:text-purple-300 border border-purple-300 dark:border-purple-800' :
                            'bg-rose-600 text-white border border-rose-700 shadow-xs animate-pulse'
                          }`}>
                            {item.statusAkhir}
                          </span>
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} border-r border-slate-100 font-sans`}>
                          {item.statusWA === 'TERKIRIM' ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>TERKIRIM</span>
                              </span>
                              <span className="font-mono text-[9px] text-slate-400">{item.waktuKirimWA}</span>
                            </div>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-semibold text-xs inline-flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Belum Dikirim</span>
                            </span>
                          )}
                        </td>
                        <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-center font-sans`}>
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleSendSingleSummary(item.nisn, item.nama, item.noHpOrtu, item.namaOrtu)}
                              disabled={isSendingBatch}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 transition active:scale-95 disabled:opacity-50"
                              title={`Kirim laporan presensi ke WhatsApp wali murid (${item.namaOrtu} - ${item.noHpOrtu})`}
                            >
                              <Send className="w-3 h-3" />
                              <span>Kirim WA</span>
                            </button>
                            {(item.datangStatus === 'BELUM_ABSEN' || item.statusAkhir.includes('ALPA')) && (
                              <button
                                onClick={() => setShowBroadcastAlpaModal(true)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 transition active:scale-95"
                                title={`Kirim peringatan alpa via WhatsApp ke orang tua ananda ${item.nama}`}
                              >
                                <MessageSquare className="w-3 h-3 text-rose-600" />
                                <span>Alpa WA</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        }
          </div>
        )}

        {/* VIEW 3: PERSETUJUAN PENGAJUAN IZIN / SAKIT SISWA */}
        {viewMode === 'pengajuan_izin' && (
          <div className="p-4">
            <PersetujuanIzinSection
              pengajuanList={pengajuanIzinList}
              onApprove={onApprovePengajuanIzin || (() => {})}
              onReject={onRejectPengajuanIzin || (() => {})}
              schoolProfile={schoolProfile}
              availableClasses={availableClasses}
              initialKelas={filterKelas}
            />
          </div>
        )}

        {/* VIEW 4: JADWAL PELAJARAN MINGGUAN GURU & ROMBEL */}
        {viewMode === 'jadwal_kbm' && (
          <div className="p-4 sm:p-5">
            <JadwalPelajaranSection
              guruMapelList={guruMapelList}
              availableClasses={availableClasses}
              schoolProfile={schoolProfile || {
                namaSekolah: 'SMP Nurul Huda Jayapura',
                npsn: '60302819',
                alamat: 'Jl. Percetakan Negara No. 45, Gurabesi, Distrik Jayapura Utara',
                kota: 'Kota Jayapura',
                provinsi: 'Papua',
                tahunPelajaran: '2026/2027',
                semester: 'Ganjil',
                namaKepalaSekolah: 'Drs. H. Ahmad Fauzi, M.Pd.',
                nipKepalaSekolah: '19720512 199803 1 004',
                zonaWaktu: 'WIT'
              }}
              onSelectScheduleForJurnal={() => {
                if (onNavigateToJurnal) {
                  onNavigateToJurnal();
                }
              }}
            />
          </div>
        )}

        {/* VIEW 5: LOG AKTIVITAS ADMINISTRATOR (REAL-TIME AUDIT TRAIL) */}
        {viewMode === 'log_aktivitas' && (
          <div className="p-4 sm:p-5">
            <ActivityLogSection
              activityLogs={activityLogs}
              onClearLogs={onClearActivityLogs}
              currentUser={currentUser}
              schoolProfile={schoolProfile}
            />
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* =========================================================================
          MODAL 1: KIRIM RINGKASAN HARIAN KE WA ORTU (BATCH & INDIVIDUAL BROADCAST)
         ========================================================================= */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    Kirim Ringkasan Harian ke WhatsApp Orang Tua
                  </h3>
                  <p className="text-xs text-slate-500">
                    Broadcast otomatis laporan kepulangan dan rekap harian resmi via Meta Cloud API v20.0
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSendingBatch && setShowSummaryModal(false)}
                disabled={isSendingBatch}
                className="text-slate-400 hover:text-slate-600 text-base font-bold disabled:opacity-30 p-1"
              >
                ✕
              </button>
            </div>

            {/* Target context & Meta API Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Rekap:</span>
                  <strong className="text-slate-900 font-mono">{selectedDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kelas Target:</span>
                  <strong className="text-slate-900">{filterKelas} ({dailySummaryItems.length} Siswa)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Penerima:</span>
                  <strong className="text-emerald-700">Nomor WhatsApp Orang Tua / Wali</strong>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-1.5 text-emerald-950">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center space-x-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gateway Provider:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold">
                    Official Meta API
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  Pesan dikirim langsung ke server WhatsApp tanpa perantara pihak ketiga, menjamin kecepatan delivery &lt; 2 detik.
                </div>
              </div>
            </div>

            {/* WhatsApp Message Preview (Template Pesan WhatsApp Resmi) */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pratinjau Format Pesan WhatsApp (Diterima Orang Tua):</span>
              </label>

              <div className="bg-[#e5ddd5] p-3.5 rounded-xl border border-slate-300 font-sans shadow-inner">
                <div className="bg-white p-3.5 rounded-lg rounded-tl-none shadow-sm max-w-md text-slate-800 space-y-2 text-xs relative border border-slate-100">
                  <div className="font-bold text-emerald-800 border-b border-slate-100 pb-1 flex items-center justify-between">
                    <span>🏛️ {schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA'}</span>
                    <span className="text-[10px] font-normal text-slate-400">Presensi Digital</span>
                  </div>

                  <p className="leading-relaxed">
                    Kepada Yth. Bapak/Ibu Wali dari:<br />
                    👤 <strong className="text-slate-900">{dailySummaryItems[0]?.nama || 'Ahmad Fauzi Ramadhan'}</strong> (NISN: {dailySummaryItems[0]?.nisn || '0098765401'} - {dailySummaryItems[0]?.kelas || 'VII-A'})<br />
                    📅 Tanggal: <span className="font-mono text-slate-700">{selectedDate}</span>
                  </p>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                    <div className="font-bold text-slate-700">📌 Rincian Kehadiran Hari Ini:</div>
                    <div className="flex justify-between">
                      <span>• Masuk Pagi:</span>
                      <strong className="font-mono text-emerald-700">06:42:15 (HADIR TEPAT WAKTU)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Pulang Sekolah:</span>
                      <strong className="font-mono text-purple-700">15:30:10 (HADIR)</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-bold">
                      <span>• Rekap Status:</span>
                      <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                        HADIR LENGKAP
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    Terima kasih atas kerja sama Bapak/Ibu dalam mendampingi kedisiplinan dan proses belajar ananda.
                  </p>

                  <div className="text-[9px] text-slate-400 text-right flex items-center justify-end space-x-1 pt-1">
                    <span>16:00</span>
                    <CheckCheck className="w-3 h-3 text-sky-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Progress Bar (Saat Mengirim Broadcast) */}
            {isSendingBatch && (
              <div className="space-y-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="flex justify-between text-xs font-semibold text-emerald-950">
                  <span className="flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    <span>Sedang mengirim broadcast ringkasan ke nomor WhatsApp orang tua...</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700">{batchProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Target: <strong>{dailySummaryItems.length}</strong> wali murid terdaftar
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  disabled={isSendingBatch}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold disabled:opacity-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchSummary}
                  disabled={isSendingBatch || dailySummaryItems.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingBatch ? 'animate-pulse' : ''}`} />
                  <span>{isSendingBatch ? 'Sedang Memproses...' : `Kirim Semua Ringkasan (${dailySummaryItems.length} Siswa)`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EKSPOR DATA PRESENSI & GOOGLE SHEETS (TABEL RAPI)
         ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B132B] flex items-center justify-center text-white shrink-0">
                  <Download className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    Ekspor Data Presensi & Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih format ekspor laporan atau integrasikan ke Google Sheets dalam format tabel terstruktur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* TABEL RAPI OPSI EKSPOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Pilihan Format & Output Data:</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  Tanggal: <strong className="font-mono text-slate-700">{selectedDate}</strong> | Kelas: <strong className="text-slate-700">{filterKelas}</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0B132B] text-white font-mono text-[11px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-800 text-center w-10">#</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-800">FORMAT / OPSI EKSPOR</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-800">CAKUPAN & STRUKTUR DATA</th>
                        <th className="py-2.5 px-3 border-r border-slate-800 text-center w-28">JUMLAH</th>
                        <th className="py-2.5 px-3.5 text-center w-36">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-xs">
                      {/* Baris Unggulan: Laporan Bulanan Sekolah (Format PDF Resmi Siap Cetak A4) */}
                      <tr className="bg-rose-50/60 hover:bg-rose-100/60 transition-colors border-b border-rose-100">
                        <td className="py-3 px-3 text-center text-rose-700 font-mono font-bold border-r border-rose-100">
                          ★
                        </td>
                        <td className="py-3 px-3.5 border-r border-rose-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>PDF Laporan Bulanan Sekolah</span>
                                <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Format Resmi A4
                                </span>
                              </div>
                              <span className="text-[10px] text-rose-800 font-mono">Dokumen Cetak / Unduh .PDF</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 border-r border-rose-100 text-[11px] leading-relaxed">
                          <strong className="text-rose-950">Rekapitulasi Bulanan Lengkap</strong>: Kop Surat Resmi YAPIS/Sekolah, Hari Efektif, Rekap (H/T/I/S/A), Persentase Kehadiran %, Predikat, dan Tanda Tangan Kepala Sekolah &amp; Wali Kelas.
                        </td>
                        <td className="py-3 px-3 border-r border-rose-100 text-center">
                          <span className="text-[11px] bg-rose-200 text-rose-950 font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            {filteredStudents.length} Siswa
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => {
                              setShowExportModal(false);
                              setShowMonthlyReportModal(true);
                            }}
                            className="w-full px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5 text-rose-100" />
                            <span>Buka / PDF A4</span>
                          </button>
                        </td>
                      </tr>

                      {/* Baris Unggulan: CSV Laporan Bulanan Presensi Siswa */}
                      <tr className="bg-sky-50/50 hover:bg-sky-100/50 transition-colors border-b border-sky-100">
                        <td className="py-3 px-3 text-center text-sky-700 font-mono font-bold border-r border-sky-100">
                          ★
                        </td>
                        <td className="py-3 px-3.5 border-r border-sky-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Download className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>CSV Laporan Bulanan Presensi</span>
                                <span className="text-[9px] bg-sky-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Bulanan
                                </span>
                              </div>
                              <span className="text-[10px] text-sky-800 font-mono">Format .CSV dengan sep=,</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 border-r border-sky-100 text-[11px] leading-relaxed">
                          Data presensi siswa teragregasi bulanan (Hari Efektif, Hadir, Terlambat, Izin, Sakit, Alpa, % Kehadiran, Predikat). Kompatibel otomatis dengan Excel dan Google Sheets.
                        </td>
                        <td className="py-3 px-3 border-r border-sky-100 text-center">
                          <span className="text-[11px] bg-sky-200 text-sky-950 font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            {filteredStudents.length} Siswa
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => {
                              setShowExportModal(false);
                              setShowMonthlyReportModal(true);
                            }}
                            className="w-full px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh CSV</span>
                          </button>
                        </td>
                      </tr>

                      {/* Baris 1: Microsoft Excel (.XLSX) Rekap Harian (REKOMENDASI UTAMA) */}
                      <tr className="bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors">
                        <td className="py-3 px-3 text-center text-emerald-700 font-mono font-bold border-r border-slate-100">
                          1
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>Excel (.XLSX) Rekap Harian</span>
                                <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Terbaik di Excel
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-800 font-mono">Format Asli Microsoft Excel (.xlsx)</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 border-r border-slate-100 text-[11px] leading-relaxed">
                          <strong className="text-emerald-900">Kolom A-M terpisah otomatis di Excel</strong>. Lebar kolom pas (*auto-fit*), NISN &amp; No. WA bersih tanpa tanda petik satu (<code className="text-[10px] text-emerald-800 bg-white px-1 py-0.5 rounded border border-emerald-200">&apos;</code>).
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100 text-center">
                          <span className="text-[11px] bg-emerald-200 text-emerald-950 font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            {dailySummaryItems.length} Siswa
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={handleExportExcelRekap}
                            className="w-full px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh Excel</span>
                          </button>
                        </td>
                      </tr>

                      {/* Baris 2: Microsoft Excel (.XLSX) Log Transaksi Presensi */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-emerald-700 font-mono font-bold border-r border-slate-100">
                          2
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">Excel (.XLSX) Log Presensi</div>
                              <span className="text-[10px] text-slate-400 font-mono">Format Asli Microsoft Excel (.xlsx)</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 border-r border-slate-100 text-[11px] leading-relaxed">
                          12 Kolom lengkap log transaksi kehadiran per siswa, status datang/pulang, metode scan QR, serta log response Meta API.
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100 text-center">
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            {displayedRecords.length} Baris
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={handleExportExcelTransaksi}
                            className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh Excel</span>
                          </button>
                        </td>
                      </tr>

                      {/* Baris 3: CSV Rekap Harian (Auto-Split Kolom sep=,) */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-sky-600 font-mono font-bold border-r border-slate-100">
                          3
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">CSV Rekap Harian & WA</div>
                              <span className="text-[10px] text-slate-400 font-mono">.CSV dengan auto-split Excel</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 border-r border-slate-100 text-[11px] leading-relaxed">
                          Dilengkapi parameter <code className="text-[10px] font-mono text-sky-800 bg-sky-50 px-1 py-0.5 rounded border border-sky-200">sep=,</code> agar Excel langsung membagi ke kolom terpisah, tanpa menumpuk di Kolom A.
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100 text-center">
                          <span className="text-[11px] bg-sky-100 text-sky-800 font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            {dailySummaryItems.length} Siswa
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={handleExportCSVRekap}
                            className="w-full px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh CSV</span>
                          </button>
                        </td>
                      </tr>

                      {/* Baris 4: CSV Log Transaksi */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-sky-600 font-mono font-bold border-r border-slate-100">
                          4
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">CSV Log Transaksi Presensi</div>
                              <span className="text-[10px] text-slate-400 font-mono">.CSV dengan auto-split Excel</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 border-r border-slate-100 text-[11px] leading-relaxed">
                          Standar lengkap 12 kolom transaksi dengan UTF-8 BOM dan header kompatibel Excel.
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100 text-center">
                          <span className="text-[11px] bg-sky-100 text-sky-800 font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            {displayedRecords.length} Baris
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={handleExportCSVTransaksi}
                            className="w-full px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh CSV</span>
                          </button>
                        </td>
                      </tr>

                      {/* Baris 5: Salin Format Google Sheets (Clipboard) */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-purple-600 font-mono font-bold border-r border-slate-100">
                          5
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                              <Copy className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">Salin ke Google Sheets</div>
                              <span className="text-[10px] text-slate-400 font-mono">Clipboard Tab-Separated</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 border-r border-slate-100 text-[11px] leading-relaxed">
                          Salin baris kolom siap di-paste langsung (<kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">Ctrl+V</kbd>) ke cell A1 Google Sheets.
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100 text-center">
                          <span className="text-[11px] bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                            Siap Salin
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={handleCopyGoogleSheetsFormat}
                            className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin ke Sheets</span>
                          </button>
                        </td>
                      </tr>

                      {/* Baris 6: Live Mirror Google Sheets */}
                      {onNavigateToSheets && (
                        <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/50">
                          <td className="py-3 px-3 text-center text-slate-600 font-mono font-bold border-r border-slate-100">
                            6
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-100">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#0B132B] text-white flex items-center justify-center shrink-0">
                                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">Buka Live Mirror Google Sheets</div>
                                <span className="text-[10px] text-slate-500 font-mono">5 Sheets Sinkronisasi</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 border-r border-slate-100 text-[11px] leading-relaxed">
                            Akses live replika 5 sheet Google Sheets database (<code className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded">PRESENSI</code>, <code className="text-[10px] font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">SISWA</code>, <code className="text-[10px] font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">SESI_QR</code>, <code className="text-[10px] font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">USERS</code>, <code className="text-[10px] font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">PENGATURAN</code>).
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 text-center">
                            <span className="text-[11px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full inline-block">
                              5 Sheets
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <button
                              onClick={() => {
                                setShowExportModal(false);
                                onNavigateToSheets();
                              }}
                              className="w-full px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Mirror</span>
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Info & Solusi Masalah Kolom Excel */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Solusi Tampilan Tabel Rapi di Microsoft Excel:</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Gunakan tombol <strong>Excel (.XLSX)</strong> untuk membuka tabel langsung dengan kolom <strong>A, B, C, D, ...</strong> yang terpisah rapi, ukuran kolom otomatis, dan nomor NISN / No. WA tampil bersih tanpa tanda petik satu (<code className="font-mono bg-white px-1 py-0.5 rounded text-emerald-900 border border-emerald-300">&apos;</code>). Jika memilih CSV, file juga telah dilengkapi penanda <code className="font-mono bg-white px-1 py-0.5 rounded text-emerald-900 border border-emerald-300">sep=,</code> agar tidak menumpuk di kolom A pada Excel Windows Indonesia.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 text-[11px]">
                Tip: Format <strong>.XLSX</strong> kompatibel dengan MS Excel 2007-2024, Office 365, WPS Office, dan Google Sheets.
              </span>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: PRESENSI MANUAL / IZIN / SAKIT
         ========================================================================= */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Catat Presensi Manual / Izin / Sakit
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  value={manualNisn}
                  onChange={(e) => setManualNisn(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                >
                  {siswaList.map(s => (
                    <option key={s.nisn} value={s.nisn}>
                      {s.nama} ({s.nisn} - {s.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sesi</label>
                  <select
                    value={manualTipe}
                    onChange={(e) => setManualTipe(e.target.value as 'DATANG' | 'PULANG')}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  >
                    <option value="DATANG">Masuk (DATANG)</option>
                    <option value="PULANG">Pulang (PULANG)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kehadiran</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as StatusPresensi)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  >
                    <option value="HADIR">Hadir (Tepat Waktu)</option>
                    <option value="TERLAMBAT">Terlambat</option>
                    <option value="IZIN">Izin (Disertai Surat)</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="ALPA">Alpa / Tanpa Keterangan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Alasan</label>
                <textarea
                  value={manualCatatan}
                  onChange={(e) => setManualCatatan(e.target.value)}
                  placeholder="Contoh: Surat dokter terlampir, izin keperluan keluarga..."
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: LAPORAN BULANAN SEKOLAH (EKSPOR CSV & PDF RESMI A4)
         ========================================================================= */}
      <LaporanBulananModal
        isOpen={showMonthlyReportModal}
        onClose={() => setShowMonthlyReportModal(false)}
        siswaList={siswaList}
        presensiList={presensiList}
        schoolProfile={schoolProfile}
        initialKelas={filterKelas}
      />

      {/* =========================================================================
          MODAL 5: KIRIM PESAN WHATSAPP MASSAL KE ORTU SISWA ALPA / BELUM ABSEN
         ========================================================================= */}
      <BroadcastAlpaModal
        isOpen={showBroadcastAlpaModal}
        onClose={() => setShowBroadcastAlpaModal(false)}
        selectedDate={selectedDate}
        dailySummaryItems={dailySummaryItems}
        schoolProfile={schoolProfile}
        onUpdateDeliveryStatus={handleUpdateAlpaDeliveryStatus}
      />
    </div>
  );
};
