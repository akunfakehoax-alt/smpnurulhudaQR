'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Calendar, 
  Filter, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Search, 
  FileSpreadsheet,
  Award,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Siswa, PresensiRecord, SchoolProfile } from '@/types/attendance';
import { INITIAL_SCHOOL_PROFILE } from '@/lib/initial-data';
import { SchoolLogo } from './SchoolLogo';

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface MonthlyStudentSummary {
  no: number;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  namaOrtu: string;
  noHpOrtu: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalKehadiran: number;
  persentase: number;
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Perhatian';
}

interface LaporanBulananModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  presensiList: PresensiRecord[];
  schoolProfile?: SchoolProfile;
  initialMonth?: number; // 1-12
  initialYear?: number;
  initialKelas?: string;
}

export const LaporanBulananModal: React.FC<LaporanBulananModalProps> = ({
  isOpen,
  onClose,
  siswaList,
  presensiList,
  schoolProfile,
  initialMonth,
  initialYear,
  initialKelas = 'SEMUA'
}) => {
  const profile = schoolProfile || INITIAL_SCHOOL_PROFILE;
  const printRef = useRef<HTMLDivElement>(null);

  // Month & Year state (defaults to September 2026 or current active records)
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (initialMonth) return initialMonth;
    if (presensiList.length > 0) {
      const parts = presensiList[0].tanggal.split('-');
      if (parts[1]) return parseInt(parts[1], 10);
    }
    return 9; // September
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (initialYear) return initialYear;
    if (presensiList.length > 0) {
      const parts = presensiList[0].tanggal.split('-');
      if (parts[0]) return parseInt(parts[0], 10);
    }
    return 2026;
  });

  const [selectedKelas, setSelectedKelas] = useState<string>(initialKelas);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tabel' | 'cetak'>('tabel');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Get unique classes from students
  const availableClasses = useMemo(() => {
    const classes = Array.from(new Set(siswaList.map(s => s.kelas))).filter(Boolean).sort();
    return ['SEMUA', ...classes];
  }, [siswaList]);

  // Prefix for matching records, e.g. "2026-09"
  const monthStr = String(selectedMonth).padStart(2, '0');
  const monthPrefix = `${selectedYear}-${monthStr}`;

  // Filter attendance records by month and year
  const monthlyRecords = useMemo(() => {
    return presensiList.filter(p => p.tanggal.startsWith(monthPrefix));
  }, [presensiList, monthPrefix]);

  // Determine distinct dates in this month with attendance
  const distinctAttendanceDates = useMemo(() => {
    const dates = new Set<string>();
    monthlyRecords.forEach(r => dates.add(r.tanggal));
    return Array.from(dates).sort();
  }, [monthlyRecords]);

  // Default effective school days: dynamic count or standard 22 days
  const [customHariEfektif, setCustomHariEfektif] = useState<number>(22);
  const effectiveDays = Math.max(1, customHariEfektif || distinctAttendanceDates.length || 22);

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    return siswaList.filter(s => {
      if (selectedKelas !== 'SEMUA' && s.kelas !== selectedKelas) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.nama.toLowerCase().includes(q) ||
          s.nisn.includes(q) ||
          s.kelas.toLowerCase().includes(q) ||
          s.namaOrtu.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [siswaList, selectedKelas, searchQuery]);

  // Compute student summary statistics for the month
  const studentSummaries: MonthlyStudentSummary[] = useMemo(() => {
    return filteredStudents.map((siswa, idx) => {
      const studentRecords = monthlyRecords.filter(p => p.nisn === siswa.nisn);
      
      // Calculate attendance per distinct day (using 'DATANG' session as primary indicator)
      const datangRecords = studentRecords.filter(p => p.tipe === 'DATANG');
      
      let hadirCount = 0;
      let terlambatCount = 0;
      let izinCount = 0;
      let sakitCount = 0;
      let alpaCount = 0;

      datangRecords.forEach(rec => {
        if (rec.status === 'HADIR') hadirCount++;
        else if (rec.status === 'TERLAMBAT') terlambatCount++;
        else if (rec.status === 'IZIN') izinCount++;
        else if (rec.status === 'SAKIT') sakitCount++;
        else if (rec.status === 'ALPA') alpaCount++;
      });

      // Total presence (Hadir + Terlambat)
      const totalKehadiran = hadirCount + terlambatCount;
      const persentase = Math.min(100, Math.round(((totalKehadiran) / effectiveDays) * 1000) / 10);

      let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Perhatian' = 'Sangat Baik';
      if (persentase >= 95) predikat = 'Sangat Baik';
      else if (persentase >= 85) predikat = 'Baik';
      else if (persentase >= 75) predikat = 'Cukup';
      else predikat = 'Perlu Perhatian';

      return {
        no: idx + 1,
        nisn: siswa.nisn,
        nama: siswa.nama,
        kelas: siswa.kelas,
        jenisKelamin: siswa.jenisKelamin,
        namaOrtu: siswa.namaOrtu,
        noHpOrtu: siswa.noHpOrtu,
        hadir: hadirCount,
        terlambat: terlambatCount,
        izin: izinCount,
        sakit: sakitCount,
        alpa: alpaCount,
        totalKehadiran,
        persentase,
        predikat
      };
    });
  }, [filteredStudents, monthlyRecords, effectiveDays]);

  // Aggregate class statistics
  const totalStudents = studentSummaries.length;
  const avgAttendance = totalStudents > 0
    ? Math.round((studentSummaries.reduce((sum, s) => sum + s.persentase, 0) / totalStudents) * 10) / 10
    : 0;
  const totalHadirAkumulasi = studentSummaries.reduce((sum, s) => sum + s.hadir, 0);
  const totalTerlambatAkumulasi = studentSummaries.reduce((sum, s) => sum + s.terlambat, 0);
  const totalIzinAkumulasi = studentSummaries.reduce((sum, s) => sum + s.izin, 0);
  const totalSakitAkumulasi = studentSummaries.reduce((sum, s) => sum + s.sakit, 0);
  const totalAlpaAkumulasi = studentSummaries.reduce((sum, s) => sum + s.alpa, 0);

  const namaBulanTerpilih = NAMA_BULAN[selectedMonth - 1];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper for CSV escaping
  const escapeCsv = (val: unknown) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  // ==========================================
  // EXPORT FUNCTION 1: CSV Laporan Bulanan
  // ==========================================
  const handleExportCSV = () => {
    const headers = [
      'NO',
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'JENIS_KELAMIN',
      'NAMA_WALI_MURID',
      'NO_HP_WALI',
      'HARI_EFEKTIF',
      'HADIR',
      'TERLAMBAT',
      'IZIN',
      'SAKIT',
      'ALPA',
      'TOTAL_KEHADIRAN',
      'PERSENTASE_KEHADIRAN',
      'PREDIKAT_KEDISIPLINAN'
    ];

    const rows = studentSummaries.map((s, idx) => [
      idx + 1,
      escapeCsv(s.nisn),
      escapeCsv(s.nama),
      escapeCsv(s.kelas),
      escapeCsv(s.jenisKelamin),
      escapeCsv(s.namaOrtu),
      escapeCsv(s.noHpOrtu),
      effectiveDays,
      s.hadir,
      s.terlambat,
      s.izin,
      s.sakit,
      s.alpa,
      s.totalKehadiran,
      `${s.persentase}%`,
      escapeCsv(s.predikat)
    ]);

    // Metadata header info
    const metaInfo = [
      `LAPORAN BULANAN REKAPITULASI PRESENSI SISWA`,
      `SEKOLAH: ${profile.namaSekolah}`,
      `NPSN: ${profile.npsn} | KOTA: ${profile.kota} | PROVINSI: ${profile.provinsi}`,
      `PERIODE: ${namaBulanTerpilih.toUpperCase()} ${selectedYear} | KELAS: ${selectedKelas} | HARI EFEKTIF: ${effectiveDays} HARI`,
      `TAHUN PELAJARAN: ${profile.tahunPelajaran} | SEMESTER: ${profile.semester}`,
      ``
    ];

    const csvContent = '\uFEFFsep=,\r\n' + 
      metaInfo.map(line => escapeCsv(line)).join('\r\n') + '\r\n' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanKelas = selectedKelas.replace(/\s+/g, '_');
    link.setAttribute('download', `LAPORAN_BULANAN_PRESENSI_${namaBulanTerpilih.toUpperCase()}_${selectedYear}_${cleanKelas}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`File CSV Laporan Bulanan (${namaBulanTerpilih} ${selectedYear}) berhasil diunduh!`);
  };

  // ==========================================
  // EXPORT FUNCTION 2: Excel (.XLSX) Laporan Bulanan
  // ==========================================
  const handleExportExcel = () => {
    const headers = [
      'NO',
      'NISN',
      'NAMA SISWA',
      'KELAS',
      'L/P',
      'NAMA WALI MURID',
      'NO. HP WALI',
      'HARI EFEKTIF',
      'HADIR (H)',
      'TERLAMBAT (T)',
      'IZIN (I)',
      'SAKIT (S)',
      'ALPA (A)',
      'TOTAL HADIR',
      'PERSENTASE (%)',
      'PREDIKAT'
    ];

    const rows = studentSummaries.map((s, idx) => [
      idx + 1,
      String(s.nisn),
      s.nama,
      s.kelas,
      s.jenisKelamin,
      s.namaOrtu,
      String(s.noHpOrtu),
      effectiveDays,
      s.hadir,
      s.terlambat,
      s.izin,
      s.sakit,
      s.alpa,
      s.totalKehadiran,
      `${s.persentase}%`,
      s.predikat
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([
      [`LAPORAN BULANAN REKAPITULASI PRESENSI SISWA - ${profile.namaSekolah}`],
      [`Bulan: ${namaBulanTerpilih} ${selectedYear} | Kelas: ${selectedKelas} | Hari Efektif: ${effectiveDays} Hari | Semester: ${profile.semester} TA ${profile.tahunPelajaran}`],
      [],
      headers,
      ...rows
    ]);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 14 }, // NISN
      { wch: 28 }, // NAMA SISWA
      { wch: 10 }, // KELAS
      { wch: 6 },  // L/P
      { wch: 24 }, // NAMA WALI
      { wch: 18 }, // NO. HP WALI
      { wch: 14 }, // HARI EFEKTIF
      { wch: 12 }, // HADIR
      { wch: 14 }, // TERLAMBAT
      { wch: 10 }, // IZIN
      { wch: 10 }, // SAKIT
      { wch: 10 }, // ALPA
      { wch: 14 }, // TOTAL HADIR
      { wch: 16 }, // PERSENTASE
      { wch: 18 }  // PREDIKAT
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LAPORAN_BULANAN');
    const cleanKelas = selectedKelas.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `LAPORAN_BULANAN_PRESENSI_${namaBulanTerpilih.toUpperCase()}_${selectedYear}_${cleanKelas}.xlsx`);

    showToast(`File Excel (.xlsx) Laporan Bulanan berhasil diunduh!`);
  };

  // ==========================================
  // EXPORT FUNCTION 3: Direct PDF File via jsPDF
  // ==========================================
  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    // Landscape A4 for maximum readability of all columns
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Header Kop
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text('YAYASAN PENDIDIKAN ISLAM (YAPIS) DI TANAH PAPUA', 148, 14, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(10, 20, 40);
    doc.text(profile.namaSekolah, 148, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`NPSN: ${profile.npsn} • Alamat: ${profile.alamat}, ${profile.kota}, ${profile.provinsi}`, 148, 25, { align: 'center' });

    // Divider Line
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.6);
    doc.line(14, 28, 283, 28);
    doc.setLineWidth(0.2);
    doc.line(14, 29, 283, 29);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('REKAPITULASI LAPORAN BULANAN KEHADIRAN SISWA', 148, 36, { align: 'center' });

    // Metadata Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(
      `Periode: ${namaBulanTerpilih} ${selectedYear}   |   Kelas: ${selectedKelas}   |   Hari Efektif: ${effectiveDays} Hari   |   Semester: ${profile.semester} TP ${profile.tahunPelajaran}`,
      148,
      41,
      { align: 'center' }
    );

    // Table Columns
    const tableHeaders = [
      ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Efektif', 'Hadir', 'Ters', 'Izin', 'Sakit', 'Alpa', 'Total', '%', 'Predikat']
    ];

    const tableData = studentSummaries.map((s, idx) => [
      idx + 1,
      s.nisn,
      s.nama,
      s.jenisKelamin,
      s.kelas,
      effectiveDays,
      s.hadir,
      s.terlambat,
      s.izin,
      s.sakit,
      s.alpa,
      s.totalKehadiran,
      `${s.persentase}%`,
      s.predikat
    ]);

    // Foot summary
    const tableFoot = [
      [
        { content: 'RATA-RATA / TOTAL AKUMULASI', colSpan: 6, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
        totalHadirAkumulasi,
        totalTerlambatAkumulasi,
        totalIzinAkumulasi,
        totalSakitAkumulasi,
        totalAlpaAkumulasi,
        totalHadirAkumulasi + totalTerlambatAkumulasi,
        `${avgAttendance}%`,
        avgAttendance >= 85 ? 'Baik' : 'Cukup'
      ]
    ];

    autoTable(doc, {
      startY: 45,
      head: tableHeaders,
      body: tableData,
      foot: tableFoot,
      theme: 'grid',
      headStyles: {
        fillColor: [11, 19, 43], // #0B132B
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        2: { cellWidth: 50 },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 14 },
        6: { halign: 'center', cellWidth: 13 },
        7: { halign: 'center', cellWidth: 13 },
        8: { halign: 'center', cellWidth: 13 },
        9: { halign: 'center', cellWidth: 13 },
        10: { halign: 'center', cellWidth: 13 },
        11: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
        12: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        13: { halign: 'center', cellWidth: 28 }
      },
      margin: { left: 14, right: 14 }
    });

    // Signature Block at Bottom
    // @ts-expect-error - autoTable adds lastAutoTable to doc
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 160;
    
    // Check if new page is needed for signatures
    const pageHeight = doc.internal.pageSize.getHeight();
    if (finalY + 35 > pageHeight) {
      doc.addPage();
    }

    const sigY = (finalY + 35 > pageHeight) ? 25 : finalY;
    const todayFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Kiri: Wali Kelas / Guru Piket
    doc.text('Mengetahui / Memeriksa:', 35, sigY);
    doc.text('Wali Kelas / Guru BK,', 35, sigY + 5);
    doc.line(35, sigY + 24, 85, sigY + 24);
    doc.text('Dra. Sri Wahyuni, M.Pd.', 35, sigY + 28);
    doc.text('NIP. 19780315 200501 2 006', 35, sigY + 32);

    // Kanan: Kepala Sekolah
    doc.text(`${profile.kota}, ${todayFormatted}`, 210, sigY);
    doc.text('Kepala Sekolah,', 210, sigY + 5);
    doc.line(210, sigY + 24, 270, sigY + 24);
    doc.text(profile.namaKepalaSekolah, 210, sigY + 28);
    doc.text(`NIP. ${profile.nipKepalaSekolah}`, 210, sigY + 32);

    const cleanKelas = selectedKelas.replace(/\s+/g, '_');
    doc.save(`LAPORAN_BULANAN_PRESENSI_${namaBulanTerpilih.toUpperCase()}_${selectedYear}_${cleanKelas}.pdf`);

    showToast(`Dokumen PDF Resmi (${namaBulanTerpilih} ${selectedYear}) berhasil diunduh!`);
  };

  // ==========================================
  // EXPORT FUNCTION 4: Browser Print to PDF (A4 Dialog)
  // ==========================================
  const handlePrintA4 = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-emerald-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-4 max-h-[94vh]"
      >
        {/* Modal Top Header (Screen Only) */}
        <div className="bg-[#0B132B] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <FileText className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Laporan Bulanan Presensi Siswa
                </h3>
                <span className="text-[10px] bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Ekspor CSV &amp; PDF
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Rekapitulasi kehadiran, persentase kedisiplinan, dan cetak dokumen resmi bulanan sekolah
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls Toolbar (Screen Only) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 space-y-3 print:hidden">
          {/* Top Row Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Bulan Dropdown */}
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Bulan:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer text-xs"
                >
                  {NAMA_BULAN.map((nama, idx) => (
                    <option key={nama} value={idx + 1}>
                      {nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tahun Dropdown */}
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm">
                <span className="text-slate-500 font-medium">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer text-xs"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              {/* Kelas Dropdown */}
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Kelas:</span>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer text-xs"
                >
                  {availableClasses.map(k => (
                    <option key={k} value={k}>
                      {k === 'SEMUA' ? 'Semua Kelas' : `Kelas ${k}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hari Efektif Input */}
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm">
                <span className="text-slate-500 font-medium">Hari Efektif:</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={customHariEfektif}
                  onChange={(e) => setCustomHariEfektif(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 font-bold font-mono text-center text-slate-800 bg-slate-100 rounded px-1 py-0.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  title="Total hari efektif sekolah di bulan ini"
                />
                <span className="text-slate-400 text-[10px]">Hari</span>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('tabel')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'tabel' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Tabel Ringkasan ({studentSummaries.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cetak')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'cetak' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Pratinjau Cetak / PDF Resmi
              </button>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
            {/* Search Input for student table */}
            <div className="relative min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Button 1: CSV Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                title="Unduh file CSV dengan pemisah kolom otomatis sep=,"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh CSV Bulanan</span>
              </button>

              {/* Button 2: Direct PDF File Download */}
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                title="Unduh file .PDF langsung berformat tabel resmi landscape A4"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Unduh PDF Bulanan</span>
              </button>

              {/* Button 3: Print A4 / Browser Print Dialog */}
              <button
                type="button"
                onClick={handlePrintA4}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                title="Buka dialog cetak printer atau simpan ke PDF A4 browser"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak / Simpan PDF (A4)</span>
              </button>

              {/* Button 4: Unduh Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                title="Unduh file Excel (.xlsx) rapi dengan formula dan auto-fit"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0">
          {activeTab === 'tabel' ? (
            /* TAB 1: INTERACTIVE STATS & SUMMARY TABLE */
            <div className="space-y-4 print:hidden">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Total Siswa Terdata</span>
                    <Users className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {totalStudents} <span className="text-xs font-sans font-normal text-slate-500">Siswa</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Kelas: <strong>{selectedKelas}</strong>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Rata-Rata Kehadiran</span>
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    {avgAttendance}%
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    {avgAttendance >= 90 ? '🌟 Sangat Disiplin' : 'Perlu Pemantauan'}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Total Kehadiran Pagi</span>
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-teal-700 mt-1">
                    {totalHadirAkumulasi} <span className="text-xs font-sans font-normal text-slate-500">Hadir</span>
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">
                    {totalTerlambatAkumulasi} Terlambat
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Izin, Sakit &amp; Alpa</span>
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    <span className="text-sky-700">{totalIzinAkumulasi} I</span> • <span className="text-amber-700">{totalSakitAkumulasi} S</span> • <span className="text-rose-700">{totalAlpaAkumulasi} A</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Total Ketidakhadiran: {totalIzinAkumulasi + totalSakitAkumulasi + totalAlpaAkumulasi}
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>Daftar Siswa &amp; Rekapitulasi Presensi Bulan {namaBulanTerpilih} {selectedYear}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Hari Efektif: <strong>{effectiveDays}</strong> Hari
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0B132B] text-white font-mono text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3">NISN</th>
                        <th className="py-2.5 px-3.5">NAMA SISWA</th>
                        <th className="py-2.5 px-2 text-center">L/P</th>
                        <th className="py-2.5 px-3 text-center">KELAS</th>
                        <th className="py-2.5 px-2.5 text-center bg-emerald-950 text-emerald-200" title="Hadir Tepat Waktu">H</th>
                        <th className="py-2.5 px-2.5 text-center bg-amber-950 text-amber-200" title="Terlambat">T</th>
                        <th className="py-2.5 px-2.5 text-center bg-sky-950 text-sky-200" title="Izin">I</th>
                        <th className="py-2.5 px-2.5 text-center bg-purple-950 text-purple-200" title="Sakit">S</th>
                        <th className="py-2.5 px-2.5 text-center bg-rose-950 text-rose-200" title="Alpa / Tanpa Keterangan">A</th>
                        <th className="py-2.5 px-3 text-center bg-slate-800">TOTAL</th>
                        <th className="py-2.5 px-3 text-center bg-emerald-900">% HADIR</th>
                        <th className="py-2.5 px-3 text-center">PREDIKAT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentSummaries.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-8 text-center text-slate-400">
                            Tidak ada siswa yang ditemukan untuk kriteria filter ini.
                          </td>
                        </tr>
                      ) : (
                        studentSummaries.map((s) => (
                          <tr key={s.nisn} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">{s.no}</td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{s.nisn}</td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-900">
                              <div>{s.nama}</div>
                              <div className="text-[10px] text-slate-400 font-normal">Wali: {s.namaOrtu} ({s.noHpOrtu})</div>
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 font-mono">{s.jenisKelamin}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-semibold text-[11px]">
                                {s.kelas}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                              {s.hadir}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                              {s.terlambat}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono text-sky-700 bg-sky-50/40">
                              {s.izin}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono text-purple-700 bg-purple-50/40">
                              {s.sakit}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-bold text-rose-700 bg-rose-50/40">
                              {s.alpa}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-extrabold text-slate-900 bg-slate-50">
                              {s.totalKehadiran}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-extrabold text-emerald-800 bg-emerald-50">
                              {s.persentase}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {s.predikat === 'Sangat Baik' && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                                  Sangat Baik
                                </span>
                              )}
                              {s.predikat === 'Baik' && (
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full font-bold text-[10px]">
                                  Baik
                                </span>
                              )}
                              {s.predikat === 'Cukup' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                                  Cukup
                                </span>
                              )}
                              {s.predikat === 'Perlu Perhatian' && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                                  Perlu Pembinaan
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-800">
                      <tr>
                        <td colSpan={5} className="py-2.5 px-3 text-center font-mono text-xs">
                          TOTAL AKUMULASI KELAS
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-emerald-800">{totalHadirAkumulasi}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-amber-800">{totalTerlambatAkumulasi}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-sky-800">{totalIzinAkumulasi}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-purple-800">{totalSakitAkumulasi}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-rose-800">{totalAlpaAkumulasi}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-900">{totalHadirAkumulasi + totalTerlambatAkumulasi}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-900">{avgAttendance}%</td>
                        <td className="py-2.5 px-3 text-center text-xs">
                          {avgAttendance >= 85 ? 'Kondusif' : 'Evaluasi'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {/* TAB 2 & PRINTABLE PAPER (A4 FORMATTED) */}
          <div 
            ref={printRef}
            className={`${activeTab === 'cetak' ? 'block' : 'hidden print:block'} bg-white max-w-[287mm] mx-auto p-6 sm:p-10 shadow-lg border border-slate-300 rounded-lg text-slate-900 leading-relaxed text-[11px] sm:text-[12px] print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none`}
          >
            {/* KOP SURAT RESMI */}
            <div className="border-b-[3px] border-slate-900 pb-3 mb-1 text-center relative">
              <div className="flex items-center justify-between gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
                  <SchoolLogo 
                    profile={profile} 
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-transparent flex items-center justify-center" 
                    iconClassName="w-20 h-20 sm:w-24 sm:h-24 text-emerald-800"
                  />
                </div>
                <div className="flex-1 text-center">
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 font-sans">
                    YAYASAN PENDIDIKAN ISLAM (YAPIS) DI TANAH PAPUA
                  </h4>
                  <h2 className="text-base sm:text-xl font-extrabold uppercase text-slate-950 font-sans tracking-wide">
                    {profile.namaSekolah}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-700 font-sans mt-0.5">
                    NPSN: {profile.npsn} • Status: Terakreditasi B • NSS: 202256001004
                  </p>
                  <p className="text-[9.5px] sm:text-[11px] text-slate-600 font-sans">
                    {profile.alamat}, {profile.kota}, {profile.provinsi}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans">
                    Email: smpnurulhuda.jayapura@gmail.com • Telp: (0967) 532189 • Kode Pos: 99111
                  </p>
                </div>
                <div className="w-20 hidden sm:block shrink-0" />
              </div>
            </div>
            {/* Double Border Divider */}
            <div className="border-b border-slate-900 mb-5" />

            {/* Document Title & Period Metadata */}
            <div className="text-center mb-5 font-sans">
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide text-slate-950">
                REKAPITULASI LAPORAN BULANAN PRESENSI &amp; KEDISIPLINAN SISWA
              </h3>
              <p className="text-xs text-slate-700 mt-1">
                Bulan: <strong className="text-slate-900">{namaBulanTerpilih} {selectedYear}</strong> • Kelas: <strong className="text-slate-900">{selectedKelas === 'SEMUA' ? 'Semua Kelas (VII, VIII, IX)' : `Kelas ${selectedKelas}`}</strong> • Hari Efektif: <strong className="text-slate-900">{effectiveDays} Hari</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Tahun Pelajaran: {profile.tahunPelajaran} • Semester: {profile.semester}
              </p>
            </div>

            {/* Summary Box in Print */}
            <div className="grid grid-cols-4 gap-2 mb-4 font-sans text-xs bg-slate-50 print:bg-transparent p-2.5 rounded-lg border border-slate-300">
              <div className="text-center">
                <span className="text-slate-500 text-[10px] block">TOTAL SISWA</span>
                <strong className="text-slate-900 text-sm font-mono">{totalStudents} Siswa</strong>
              </div>
              <div className="text-center border-l border-slate-200">
                <span className="text-slate-500 text-[10px] block">RATA-RATA KEHADIRAN</span>
                <strong className="text-emerald-700 text-sm font-mono">{avgAttendance}%</strong>
              </div>
              <div className="text-center border-l border-slate-200">
                <span className="text-slate-500 text-[10px] block">TOTAL HADIR &amp; TERLAMBAT</span>
                <strong className="text-slate-900 text-sm font-mono">{totalHadirAkumulasi + totalTerlambatAkumulasi} Presensi</strong>
              </div>
              <div className="text-center border-l border-slate-200">
                <span className="text-slate-500 text-[10px] block">IZIN / SAKIT / ALPA</span>
                <strong className="text-rose-700 text-sm font-mono">{totalIzinAkumulasi} / {totalSakitAkumulasi} / {totalAlpaAkumulasi}</strong>
              </div>
            </div>

            {/* Official Printable Table */}
            <div className="mb-6 font-sans">
              <table className="w-full border-collapse border border-slate-400 text-left text-[10.5px]">
                <thead>
                  <tr className="bg-slate-200 print:bg-slate-200 text-slate-900 font-bold font-mono text-center">
                    <th className="border border-slate-400 py-1.5 px-1 w-8">No</th>
                    <th className="border border-slate-400 py-1.5 px-2 w-24">NISN</th>
                    <th className="border border-slate-400 py-1.5 px-3 text-left">Nama Lengkap Siswa</th>
                    <th className="border border-slate-400 py-1.5 px-1 w-10">L/P</th>
                    <th className="border border-slate-400 py-1.5 px-2 w-14">Kelas</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 w-12" title="Hari Efektif">Efektif</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 w-11" title="Hadir Tepat Waktu">H</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 w-11" title="Terlambat">T</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 w-11" title="Izin">I</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 w-11" title="Sakit">S</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 w-11" title="Alpa">A</th>
                    <th className="border border-slate-400 py-1.5 px-2 w-14">Total</th>
                    <th className="border border-slate-400 py-1.5 px-2 w-14">%</th>
                    <th className="border border-slate-400 py-1.5 px-2 w-24">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSummaries.map((s) => (
                    <tr key={s.nisn} className="even:bg-slate-50/60">
                      <td className="border border-slate-300 py-1 px-1 text-center font-mono">{s.no}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-mono">{s.nisn}</td>
                      <td className="border border-slate-300 py-1 px-3 font-semibold">{s.nama}</td>
                      <td className="border border-slate-300 py-1 px-1 text-center font-mono">{s.jenisKelamin}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-mono">{s.kelas}</td>
                      <td className="border border-slate-300 py-1 px-1.5 text-center font-mono">{effectiveDays}</td>
                      <td className="border border-slate-300 py-1 px-1.5 text-center font-mono">{s.hadir}</td>
                      <td className="border border-slate-300 py-1 px-1.5 text-center font-mono">{s.terlambat}</td>
                      <td className="border border-slate-300 py-1 px-1.5 text-center font-mono">{s.izin}</td>
                      <td className="border border-slate-300 py-1 px-1.5 text-center font-mono">{s.sakit}</td>
                      <td className="border border-slate-300 py-1 px-1.5 text-center font-mono font-bold text-rose-700">{s.alpa}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-mono font-bold">{s.totalKehadiran}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-mono font-bold">{s.persentase}%</td>
                      <td className="border border-slate-300 py-1 px-2 text-center text-[10px]">{s.predikat}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-center font-mono">
                  <tr>
                    <td colSpan={6} className="border border-slate-400 py-1.5 px-2">
                      RATA-RATA &amp; JUMLAH AKUMULASI
                    </td>
                    <td className="border border-slate-400 py-1.5">{totalHadirAkumulasi}</td>
                    <td className="border border-slate-400 py-1.5">{totalTerlambatAkumulasi}</td>
                    <td className="border border-slate-400 py-1.5">{totalIzinAkumulasi}</td>
                    <td className="border border-slate-400 py-1.5">{totalSakitAkumulasi}</td>
                    <td className="border border-slate-400 py-1.5 text-rose-700">{totalAlpaAkumulasi}</td>
                    <td className="border border-slate-400 py-1.5">{totalHadirAkumulasi + totalTerlambatAkumulasi}</td>
                    <td className="border border-slate-400 py-1.5 text-emerald-800">{avgAttendance}%</td>
                    <td className="border border-slate-400 py-1.5 font-sans text-[10px]">
                      {avgAttendance >= 85 ? 'Baik' : 'Cukup'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Official Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 font-sans text-xs">
              <div className="space-y-1">
                <p>Mengetahui / Memeriksa:</p>
                <p className="font-semibold text-slate-800">Wali Kelas / Guru BK,</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-950">Dra. Sri Wahyuni, M.Pd.</p>
                <p className="text-slate-600 font-mono text-[11px]">NIP. 19780315 200501 2 006</p>
              </div>

              <div className="space-y-1 text-right">
                <p>{profile.kota}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-semibold text-slate-800">Kepala Sekolah,</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-950">{profile.namaKepalaSekolah}</p>
                <p className="text-slate-600 font-mono text-[11px]">NIP. {profile.nipKepalaSekolah}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Screen Only) */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs print:hidden">
          <div className="text-slate-500">
            Keterangan: Format <strong>.CSV</strong> kompatibel dengan MS Excel / Google Sheets, format <strong>.PDF</strong> berorientasi Landscape A4 dengan Kop Resmi Sekolah.
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
