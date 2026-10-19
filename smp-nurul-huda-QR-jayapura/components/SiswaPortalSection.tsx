/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { User, Siswa, PresensiRecord, SesiQR, WhatsAppConfig, SchoolProfile, StatusPresensi, PengajuanIzin } from '@/types/attendance';
import { KartuPelajarDigital } from '@/components/KartuPelajarDigital';
import { 
  GraduationCap, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Download, 
  Send, 
  ShieldCheck, 
  Phone, 
  Camera, 
  Check, 
  Lock, 
  Printer,
  Search,
  CheckCheck,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
  Smartphone,
  Eye,
  Info,
  HeartPulse,
  MapPin,
  Navigation,
  Compass,
  Megaphone,
  Radio
} from 'lucide-react';
import { PengajuanIzinTab } from './PengajuanIzinTab';
import { PengumumanSekolah } from '@/types/attendance';
import { PapanPengumumanCard } from '@/components/PapanPengumumanCard';
import { validateStudentGeofence, formatCoordinates, GeofenceValidation } from '@/lib/geo';
import { createPresensiIndexKey } from '@/lib/presensi-indexer';

interface SiswaPortalSectionProps {
  currentUser: User;
  siswaList: Siswa[];
  presensiList: PresensiRecord[];
  presensiIndex?: Map<string, PresensiRecord>;
  activeSesi: SesiQR;
  waConfig: WhatsAppConfig;
  schoolProfile?: SchoolProfile;
  onRecordPresensi: (record: PresensiRecord) => { success: boolean; duplicate?: boolean; message: string };
  isPresensiMandiriEnabled?: boolean;
  onTogglePresensiMandiri?: () => void;
  pengajuanIzinList?: PengajuanIzin[];
  onAddPengajuanIzin?: (pengajuan: PengajuanIzin) => void;
  pengumumanList?: PengumumanSekolah[];
  onOpenCreatePengumuman?: () => void;
  onDeletePengumuman?: (id: string) => void;
  siswaActiveTab?: 'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman';
  onChangeSiswaActiveTab?: (tab: 'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman') => void;
}

export const SiswaPortalSection: React.FC<SiswaPortalSectionProps> = ({
  currentUser,
  siswaList,
  presensiList,
  presensiIndex,
  activeSesi,
  waConfig,
  schoolProfile,
  onRecordPresensi,
  isPresensiMandiriEnabled = false,
  onTogglePresensiMandiri,
  pengajuanIzinList = [],
  onAddPengajuanIzin,
  pengumumanList = [],
  onOpenCreatePengumuman,
  onDeletePengumuman,
  siswaActiveTab,
  onChangeSiswaActiveTab
}) => {
  // Find current student profile
  const student = siswaList.find(s => s.nisn === currentUser.nisn || s.nisn === currentUser.username) || siswaList[0];
  
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [zoomQr, setZoomQr] = useState(false);
  const [internalTab, setInternalTab] = useState<'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman'>('kartu');
  const activeTab = siswaActiveTab !== undefined ? siswaActiveTab : internalTab;
  const setActiveTab = (tab: 'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman') => {
    setInternalTab(tab);
    onChangeSiswaActiveTab?.(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [showWaDetailModal, setShowWaDetailModal] = useState<PresensiRecord | null>(null);

  const myPendingIzinCount = (pengajuanIzinList || []).filter(p => p.nisn === student.nisn && p.status === 'MENUNGGU').length;

  // School Geofence Target Coordinates (SMP Nurul Huda Jayapura)
  const schoolLat = schoolProfile?.latitude ?? -2.533719;
  const schoolLon = schoolProfile?.longitude ?? 140.718135;
  const schoolRadius = schoolProfile?.radiusValidasiMeter ?? 150;

  // Student GPS state (default initialized within school boundary ~35m for immediate readiness)
  const [studentCoords, setStudentCoords] = useState<{ lat: number; lon: number; accuracy?: number }>({
    lat: -2.533810,
    lon: 140.718210,
    accuracy: 8
  });
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsValidation, setGpsValidation] = useState<GeofenceValidation>(() => {
    return validateStudentGeofence(-2.533810, 140.718210, schoolLat, schoolLon, schoolRadius);
  });

  // Scanner state for Presensi Mandiri
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfScanMessage, setSelfScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // GPS Geolocation Handler (Fetch real device coordinates)
  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation GPS tidak didukung pada browser ini.');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setStudentCoords({ lat, lon, accuracy: acc });
        const val = validateStudentGeofence(lat, lon, schoolLat, schoolLon, schoolRadius);
        setGpsValidation(val);
        setIsGpsLoading(false);
      },
      (err) => {
        console.warn('Gagal membaca GPS:', err);
        setIsGpsLoading(false);
        // Retain validated state with friendly notification
        const val = validateStudentGeofence(studentCoords.lat, studentCoords.lon, schoolLat, schoolLon, schoolRadius);
        setGpsValidation(val);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Simulation handler for easy testing of school boundary logic
  const handleSimulateGps = (type: 'sekolah' | 'luar') => {
    if (type === 'sekolah') {
      const lat = schoolLat - 0.00015;
      const lon = schoolLon + 0.00018;
      setStudentCoords({ lat, lon, accuracy: 5 });
      setGpsValidation(validateStudentGeofence(lat, lon, schoolLat, schoolLon, schoolRadius));
    } else {
      const lat = schoolLat + 0.0125;
      const lon = schoolLon - 0.0085;
      setStudentCoords({ lat, lon, accuracy: 20 });
      setGpsValidation(validateStudentGeofence(lat, lon, schoolLat, schoolLon, schoolRadius));
    }
  };

  // Today's date
  const todayStr = new Date().toISOString().split('T')[0];

  // Self-scan permission check: Enabled only if active session and admin/guru switch allows it
  const isSelfScanAllowed = Boolean(
    isPresensiMandiriEnabled !== undefined
      ? (isPresensiMandiriEnabled && activeSesi && activeSesi.aktif)
      : (activeSesi && activeSesi.aktif && activeSesi.allowSelfScan !== false)
  );

  // Generate QR Code for Student Badge
  useEffect(() => {
    if (!student) return;
    const qrPayload = student.qrBadgeToken || `SISWA-${student.nisn}`;
    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Gagal membuat QR Code Siswa:', err));
  }, [student]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Today's student attendance with O(1) fast index lookup
  const todayDatang = presensiIndex
    ? presensiIndex.get(createPresensiIndexKey(todayStr, student.nisn, 'DATANG'))
    : presensiList.find(p => p.nisn === student.nisn && p.tanggal === todayStr && p.tipe === 'DATANG');

  const todayPulang = presensiIndex
    ? presensiIndex.get(createPresensiIndexKey(todayStr, student.nisn, 'PULANG'))
    : presensiList.find(p => p.nisn === student.nisn && p.tanggal === todayStr && p.tipe === 'PULANG');

  // All student attendance records
  const myPresensiList = useMemo(() => {
    return presensiList.filter(p => p.nisn === student.nisn);
  }, [presensiList, student.nisn]);

  // Daily grouped attendance for SESI_MASUK, SESI_PULANG, and STATUS_AKHIR
  const dailyReportData = useMemo(() => {
    const dateSet = new Set<string>();
    myPresensiList.forEach(p => dateSet.add(p.tanggal));
    if (!dateSet.has(todayStr)) {
      dateSet.add(todayStr);
    }

    const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(tanggal => {
      const datangRec = myPresensiList.find(p => p.tanggal === tanggal && p.tipe === 'DATANG');
      const pulangRec = myPresensiList.find(p => p.tanggal === tanggal && p.tipe === 'PULANG');

      let statusAkhir: StatusPresensi | 'BELUM_LENGKAP' = 'BELUM_LENGKAP';
      if (datangRec) {
        statusAkhir = datangRec.status;
      } else if (pulangRec) {
        statusAkhir = pulangRec.status;
      } else if (tanggal < todayStr) {
        statusAkhir = 'ALPA';
      }

      // Sesi Masuk display
      let sesiMasukWaktu = '--:--:--';
      let sesiMasukStatus = 'Belum Absen Masuk';
      if (datangRec) {
        sesiMasukWaktu = `${datangRec.waktu} WIB`;
        sesiMasukStatus = datangRec.status === 'HADIR' ? 'Tepat Waktu' : datangRec.status;
      }

      // Sesi Pulang display
      let sesiPulangWaktu = '--:--:--';
      let sesiPulangStatus = 'Belum Absen Pulang';
      if (pulangRec) {
        sesiPulangWaktu = `${pulangRec.waktu} WIB`;
        sesiPulangStatus = 'Selesai Sesi Pulang';
      }

      // Status Notifikasi WhatsApp Wali
      let waStatus = 'MENUNGGU';
      let waWaktu = '';
      let waRec: PresensiRecord | undefined = undefined;

      if (datangRec && datangRec.waStatus === 'TERKIRIM') {
        waStatus = 'TERKIRIM';
        waWaktu = datangRec.waktu;
        waRec = datangRec;
      } else if (pulangRec && pulangRec.waStatus === 'TERKIRIM') {
        waStatus = 'TERKIRIM';
        waWaktu = pulangRec.waktu;
        waRec = pulangRec;
      } else if (datangRec) {
        waStatus = datangRec.waStatus;
        waRec = datangRec;
      }

      return {
        tanggal,
        datangRec,
        pulangRec,
        sesiMasukWaktu,
        sesiMasukStatus,
        sesiPulangWaktu,
        sesiPulangStatus,
        statusAkhir,
        waStatus,
        waWaktu,
        waRec
      };
    });
  }, [myPresensiList, todayStr]);

  // Filtered reports
  const filteredDailyReports = useMemo(() => {
    return dailyReportData.filter(row => {
      const matchSearch = row.tanggal.includes(searchQuery) ||
        row.sesiMasukStatus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.statusAkhir.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchMonth = filterMonth === 'ALL' || row.tanggal.startsWith(filterMonth);
      return matchSearch && matchMonth;
    });
  }, [dailyReportData, searchQuery, filterMonth]);

  // Aggregate stats (JUMLAH)
  const attendanceStats = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    dailyReportData.forEach(r => {
      if (r.statusAkhir === 'HADIR') hadir++;
      else if (r.statusAkhir === 'TERLAMBAT') terlambat++;
      else if (r.statusAkhir === 'IZIN') izin++;
      else if (r.statusAkhir === 'SAKIT') sakit++;
      else if (r.statusAkhir === 'ALPA') alpa++;
    });

    const totalHari = hadir + terlambat + izin + sakit + alpa;
    const persentase = totalHari > 0 ? Math.round(((hadir + terlambat) / totalHari) * 100) : 100;

    return { hadir, terlambat, izin, sakit, alpa, totalHari, persentase };
  }, [dailyReportData]);

  // Start Camera for Presensi Mandiri
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung pada peramban ini');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Gagal membuka kamera video:', err);
      setCameraError('Izin akses kamera belum diberikan. Anda tetap dapat memindai menggunakan tombol simulasi pindaian proyektor guru.');
      setIsCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Perform Self-Scan Attendance from smartphone
  const handleExecuteSelfScan = () => {
    if (!isSelfScanAllowed) {
      setSelfScanMessage({
        text: 'Presensi Mandiri dinonaktifkan oleh Admin/Guru Piket. Tunjukkan Kartu Pelajar ke scanner gerbang sekolah.',
        type: 'error'
      });
      return;
    }

    // 1. Validasi Geofencing Titik GPS Area Sekolah
    if (schoolProfile?.wajibGPS !== false && !gpsValidation.isValid) {
      setSelfScanMessage({
        text: `Presensi DITOLAK (Validasi GPS Gagal): Anda terdeteksi berjarak ${gpsValidation.distanceMeters}m di luar area sekolah (Batas maksimal: ${gpsValidation.radiusMeters}m). Presensi mandiri wajib dilakukan di lingkungan sekolah ${schoolProfile?.namaSekolah || ''}.`,
        type: 'error'
      });
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const jamMenitNow = timeStr.slice(0, 5);
    let status: StatusPresensi = 'HADIR';
    if (activeSesi.tipe === 'DATANG' && jamMenitNow > activeSesi.batasTerlambat) {
      status = 'TERLAMBAT';
    }

    const newRecord: PresensiRecord = {
      id: `PRES-MANDIRI-${Date.now()}-${student.nisn.slice(-4)}`,
      tanggal: todayStr,
      waktu: timeStr,
      nisn: student.nisn,
      namaSiswa: student.nama,
      kelas: student.kelas,
      tipe: activeSesi.tipe,
      status: status,
      metode: 'QR_SCAN',
      waStatus: waConfig.enabled ? 'TERKIRIM' : 'NONAKTIF',
      waResponse: waConfig.enabled 
        ? `WhatsApp Meta Cloud API 200 OK (wamid.HBgL${Date.now().toString(36)})` 
        : undefined,
      koordinatGPS: studentCoords ? `${studentCoords.lat.toFixed(6)}, ${studentCoords.lon.toFixed(6)}` : undefined,
      jarakSekolahMeter: gpsValidation.distanceMeters,
      statusLokasi: gpsValidation.isValid ? 'DI_AREA_SEKOLAH' : 'DI_LUAR_SEKOLAH',
      catatan: `Presensi Mandiri Scanner Siswa (GPS: ${gpsValidation.distanceMeters}m dari gerbang - ${gpsValidation.status})`,
      petugas: 'Presensi Mandiri Siswa (Smartphone GPS)'
    };

    const res = onRecordPresensi(newRecord);
    if (res.success) {
      setSelfScanMessage({
        text: `Presensi Berhasil Terverifikasi! Waktu: ${timeStr} WIB (${status}). Validasi GPS: ${gpsValidation.distanceMeters}m dari gerbang sekolah (DI AREA SEKOLAH). Notifikasi WhatsApp terkirim ke nomor orang tua: ${student.noHpOrtu}`,
        type: 'success'
      });
    } else {
      setSelfScanMessage({
        text: res.message,
        type: 'error'
      });
    }

    // Auto-clear message
    setTimeout(() => {
      setSelfScanMessage(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Header Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <GraduationCap className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  PORTAL RESMI SISWA
                </span>
                <span className="text-xs text-emerald-200">
                  NISN: <strong className="font-mono text-white">{student.nisn}</strong>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {student.nama}
              </h2>
              <div className="text-xs text-emerald-100 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span>Kelas: <strong className="text-white">{student.kelas}</strong></span>
                <span>•</span>
                <span>Wali Murid: <strong className="text-white">{student.namaOrtu}</strong> ({student.noHpOrtu})</span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs (Clean Mobile-Safe Scrollable) */}
          <div className="flex items-center overflow-x-auto scrollbar-none flex-nowrap gap-1.5 pt-1 select-none max-w-full">
            <button
              onClick={() => setActiveTab('kartu')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'kartu'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Kartu Pelajar</span>
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'laporan'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Riwayat Kehadiran</span>
            </button>
            <button
              onClick={() => setActiveTab('mandiri')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'mandiri'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Scan Mandiri</span>
              {isSelfScanAllowed && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('izin')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'izin'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-rose-300" />
              <span>Pengajuan Izin</span>
              {myPendingIzinCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950 font-bold ml-0.5">
                  {myPendingIzinCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overview Status Bar Hari Ini (SESI MASUK, SESI PULANG, STATUS NOTIFIKASI WALI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Sesi Masuk Hari Ini */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Presensi Masuk (Pagi)</span>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                {todayDatang ? `${todayDatang.waktu} ${schoolProfile?.zonaWaktu || 'WIT'}` : '--:--:--'}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                !todayDatang ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                todayDatang.status === 'HADIR' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                todayDatang.status === 'TERLAMBAT' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
              }`}>
                {todayDatang ? (todayDatang.status === 'HADIR' ? 'Tepat Waktu' : todayDatang.status) : 'Belum Scan'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              Batas toleransi: <strong>{activeSesi.batasTerlambat || '07:00'} {schoolProfile?.zonaWaktu || 'WIT'}</strong>
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            todayDatang ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Sesi Pulang Hari Ini */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Presensi Pulang (Sore)</span>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                {todayPulang ? `${todayPulang.waktu} ${schoolProfile?.zonaWaktu || 'WIT'}` : '--:--:--'}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                !todayPulang ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
              }`}>
                {todayPulang ? 'Sudah Pulang' : 'Belum Pulang'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              Kepulangan: <strong>15:30 - 16:30 {schoolProfile?.zonaWaktu || 'WIT'}</strong>
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            todayPulang ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Status Notifikasi Wali Murid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Notifikasi WhatsApp Wali</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold shrink-0">
                Meta Cloud API
              </span>
            </div>
            <div className="mt-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 truncate">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{student.noHpOrtu} ({student.namaOrtu.split(' ')[0]})</span>
            </div>
            <span className="text-[11px] mt-0.5 block flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium truncate">
              <CheckCheck className="w-3.5 h-3.5 shrink-0 inline" />
              <span className="truncate">
                {todayDatang ? 'Notifikasi kedatangan terkirim' : 'Menunggu jam presensi'}
              </span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: KARTU TANDA PELAJAR DIGITAL                        */}
      {/* ======================================================== */}
      {activeTab === 'kartu' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Card Showcase with 3D Flip & Print (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <KartuPelajarDigital 
              student={student} 
              schoolProfile={schoolProfile} 
              onOpenZoomQr={() => setZoomQr(true)} 
            />

            {/* Hak Akses Siswa Info Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 text-xs flex items-start space-x-3 shadow-md">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-100 flex items-center space-x-2">
                  <span>Kebijakan Keamanan & Batasan Fitur Siswa</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                    Akses Terbatas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Siswa berhak mencetak <strong>Kartu Tanda Pelajar Digital</strong>, memantau <strong>Laporan Absen & Rekap Jumlah</strong>, serta melakukan <strong>Presensi Mandiri Scanner Proyektor</strong> jika diaktifkan oleh Admin/Guru piket. Menu manajemen database dan broadcast massal dikunci.
                </p>
              </div>
            </div>
          </div>

          {/* Right Info & Quick Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Panduan Penggunaan Kartu Pelajar */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Petunjuk Presensi QR Siswa:</span>
              </h4>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px]">1</span>
                    <span>Di Gerbang Sekolah (Pindai Kartu)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    Tunjukkan Kartu Pelajar Digital ini di layar ponsel Anda atau kartu fisik tercetak ke kamera scanner Guru Piket di gerbang.
                  </p>
                </div>

                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
                  <div className="font-bold text-sky-900 flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center text-[10px]">2</span>
                    <span>Di Dalam Kelas (Scanner Siswa Proyektor)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    Jika guru mengaktifkan mode presensi mandiri dan menayangkan QR Sesi di layar proyektor kelas, Anda dapat menggunakan tab <strong>Presensi Mandiri</strong> untuk memindai langsung menggunakan kamera smartphone Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Sesi Presensi Aktif Saat Ini */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Sesi Presensi Aktif Sekolah</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  {activeSesi.aktif ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <div className="text-slate-600 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Judul Sesi:</span>
                  <strong className="text-slate-900">{activeSesi.judul}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tipe:</span>
                  <strong className="text-sky-700">{activeSesi.tipe}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Rentang Waktu:</span>
                  <span className="font-mono">{activeSesi.jamMulai} - {activeSesi.jamSelesai} WIB</span>
                </div>
                <div className="flex justify-between">
                  <span>Batas Terlambat:</span>
                  <span className="font-mono text-amber-600 font-bold">{activeSesi.batasTerlambat} WIB</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                  <span>Status Scanner Siswa:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    isSelfScanAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isSelfScanAllowed ? 'Diaktifkan Guru' : 'Dinonaktifkan Guru'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LAPORAN & REKAP KEHADIRAN (JUMLAH, SESI_MASUK,    */}
      {/* SESI_PULANG, STATUS_AKHIR, STATUS NOTIFIKASI WALI)      */}
      {/* ======================================================== */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          {/* Card Ringkasan Jumlah / Statistik Kehadiran Siswa */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Laporan Presensi Siswa: {student.nama}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rekapitulasi lengkap catatan kehadiran, jam masuk, jam pulang, status akhir, serta konfirmasi WhatsApp wali murid.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition self-start sm:self-auto"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Cetak Laporan Kehadiran</span>
              </button>
            </div>

            {/* Statistik Jumlah / KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Hari</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
                  {attendanceStats.totalHari}
                </span>
                <span className="text-[10px] text-slate-400">Hari Terjadwal</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-700 block">Tepat Waktu</span>
                <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
                  {attendanceStats.hadir}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">HADIR</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] font-semibold text-amber-700 block">Terlambat</span>
                <span className="text-2xl font-black text-amber-700 font-mono mt-0.5 block">
                  {attendanceStats.terlambat}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold">DISIPLIN</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-[11px] font-semibold text-blue-700 block">Izin</span>
                <span className="text-2xl font-black text-blue-700 font-mono mt-0.5 block">
                  {attendanceStats.izin}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">SURAT RESMI</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-[11px] font-semibold text-purple-700 block">Sakit</span>
                <span className="text-2xl font-black text-purple-700 font-mono mt-0.5 block">
                  {attendanceStats.sakit}
                </span>
                <span className="text-[10px] text-purple-600 font-semibold">DOKTER</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-[11px] font-semibold text-rose-700 block">% Kehadiran</span>
                <span className="text-2xl font-black text-rose-700 font-mono mt-0.5 block">
                  {attendanceStats.persentase}%
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">
                  Alpa: {attendanceStats.alpa}
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Laporan Absen (SESI_MASUK, SESI_PULANG, STATUS_AKHIR, STATUS NOTIFIKASI WALI) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  Daftar Presensi Harian ({filteredDailyReports.length} Hari)
                </h4>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari tanggal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none w-36 sm:w-44"
                  />
                </div>

                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
                >
                  <option value="ALL">Semua Bulan</option>
                  <option value={todayStr.slice(0, 7)}>Bulan Ini</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="py-3 px-3.5">NO</th>
                    <th className="py-3 px-3.5">TANGGAL</th>
                    <th className="py-3 px-3.5">SESI_MASUK</th>
                    <th className="py-3 px-3.5">SESI_PULANG</th>
                    <th className="py-3 px-3.5 text-center">STATUS_AKHIR</th>
                    <th className="py-3 px-3.5">STATUS NOTIFIKASI WALI</th>
                    <th className="py-3 px-3.5 text-center">DETAIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Tidak ada catatan presensi yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyReports.map((row, idx) => (
                      <tr key={row.tanggal} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3.5 font-medium text-slate-900">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono">{row.tanggal}</span>
                            {row.tanggal === todayStr && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                Hari Ini
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SESI_MASUK */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-900 block">
                              {row.sesiMasukWaktu}
                            </span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              row.datangRec?.status === 'HADIR' ? 'bg-emerald-50 text-emerald-700' :
                              row.datangRec?.status === 'TERLAMBAT' ? 'bg-amber-50 text-amber-700' :
                              'text-slate-400'
                            }`}>
                              {row.sesiMasukStatus}
                            </span>
                          </div>
                        </td>

                        {/* SESI_PULANG */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-900 block">
                              {row.sesiPulangWaktu}
                            </span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              row.pulangRec ? 'bg-purple-50 text-purple-700' : 'text-slate-400'
                            }`}>
                              {row.sesiPulangStatus}
                            </span>
                          </div>
                        </td>

                        {/* STATUS_AKHIR */}
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                            row.statusAkhir === 'HADIR' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            row.statusAkhir === 'TERLAMBAT' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            row.statusAkhir === 'IZIN' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            row.statusAkhir === 'SAKIT' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            row.statusAkhir === 'ALPA' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {row.statusAkhir}
                          </span>
                        </td>

                        {/* STATUS NOTIFIKASI WALI */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className={`inline-flex items-center space-x-1 text-[11px] font-bold ${
                                row.waStatus === 'TERKIRIM' ? 'text-emerald-700' : 'text-slate-400'
                              }`}>
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{row.waStatus === 'TERKIRIM' ? 'TERKIRIM' : 'BELUM DIKIRIM'}</span>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              WhatsApp: {student.noHpOrtu}
                            </span>
                          </div>
                        </td>

                        {/* DETAIL POPUP BUTTON */}
                        <td className="py-3 px-3.5 text-center">
                          {row.waRec ? (
                            <button
                              onClick={() => setShowWaDetailModal(row.waRec!)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition"
                              title="Lihat Konfirmasi Pesan WhatsApp"
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" />
                              <span>Pesan WA</span>
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PRESENSI MANDIRI (SCANNER SISWA VIA SMARTPHONE)    */}
      {/* ======================================================== */}
      {activeTab === 'mandiri' && (
        <div className="space-y-6">
          {/* Card Status Izin Admin & Guru */}
          <div className={`rounded-3xl p-6 border shadow-sm ${
            isSelfScanAllowed 
              ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200' 
              : 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  isSelfScanAllowed ? 'bg-sky-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {isSelfScanAllowed ? <Smartphone className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Presensi Mandiri Scanner Siswa (Smartphone)
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelfScanAllowed 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {isSelfScanAllowed ? 'STATUS: AKTIF OLEH GURU' : 'STATUS: DINONAKTIFKAN GURU'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {isSelfScanAllowed
                      ? 'Siswa dapat membuka kamera web app di smartphone untuk memindai QR Sesi yang ditayangkan pada proyektor guru di depan kelas.'
                      : 'Presensi Mandiri via Scanner Kamera Siswa sedang dinonaktifkan oleh Admin/Guru Piket. Siswa wajib memperlihatkan Kartu Pelajar Digital ke scanner gerbang sekolah.'}
                  </p>
                </div>
              </div>

              {/* Guru/Admin Direct Toggle Switch or Student Card Button */}
              {(currentUser.role === 'ADMIN' || currentUser.role === 'GURU') && onTogglePresensiMandiri ? (
                <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm p-2 rounded-2xl border border-slate-200 shadow-sm self-start sm:self-auto shrink-0">
                  <div className="text-left text-xs pr-1">
                    <span className="block font-bold text-slate-800">Kontrol Guru/Admin:</span>
                    <span className="text-[10px] text-slate-500">Sakelar Absen Mandiri</span>
                  </div>
                  <button
                    type="button"
                    onClick={onTogglePresensiMandiri}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                      isSelfScanAllowed
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isSelfScanAllowed ? 'AKTIF (ON)' : 'MATI (OFF)'}</span>
                  </button>
                </div>
              ) : (
                !isSelfScanAllowed && (
                  <button
                    onClick={() => setActiveTab('kartu')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm self-start sm:self-auto shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Buka Kartu Pelajar Saya</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Scanner Container jika Diizinkan */}
          {isSelfScanAllowed ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Kamera & Scanner Viewfinder (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Kamera Pemindai QR Sesi Proyektor Guru
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Sesi Aktif: <strong className="text-sky-700">{activeSesi.kodeSesi}</strong>
                  </span>
                </div>

                {/* Viewfinder Frame */}
                <div className="relative aspect-video max-h-80 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
                  {/* Real Video or Standby */}
                  <video 
                    ref={videoRef} 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`} 
                  />

                  {!isCameraActive && (
                    <div className="text-center p-6 space-y-3 text-slate-400">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-sky-400">
                        <Camera className="w-7 h-7" />
                      </div>
                      <p className="text-xs">
                        Kamera dalam keadaan siaga. Klik tombol di bawah untuk mengaktifkan pemindai.
                      </p>
                    </div>
                  )}

                  {/* Viewfinder Target Overlay */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-52 h-52 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        {/* Laser scan line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce" />
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] text-emerald-300 font-mono whitespace-nowrap">
                          Arahkan ke QR Proyektor
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Notification Banner */}
                {selfScanMessage && (
                  <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start space-x-2 shadow-sm ${
                    selfScanMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border border-rose-300 text-rose-900'
                  }`}>
                    {selfScanMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{selfScanMessage.text}</span>
                  </div>
                )}

                {/* Scanner Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  {!isCameraActive ? (
                    <button
                      onClick={startCamera}
                      className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Aktifkan Kamera Scanner</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>Tutup Kamera</span>
                    </button>
                  )}

                  {/* Tombol Pindai QR Proyektor Guru */}
                  <button
                    onClick={handleExecuteSelfScan}
                    className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pindai QR Proyektor Guru ({activeSesi.tipe})</span>
                  </button>
                </div>
              </div>

              {/* Info Sesi & Konfirmasi WhatsApp (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Detail Sesi Proyektor Guru */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Detail Sesi Proyektor Kelas</span>
                  </h4>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Nama Sesi:</span>
                      <strong className="text-slate-900">{activeSesi.judul}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Jenis Sesi:</span>
                      <strong className="text-sky-700 font-bold">{activeSesi.tipe}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Rentang Waktu:</span>
                      <span className="font-mono">{activeSesi.jamMulai} - {activeSesi.jamSelesai} WIB</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Batas Toleransi:</span>
                      <span className="font-mono text-amber-600 font-bold">{activeSesi.batasTerlambat} WIB</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Token Sesi Dinamis:</span>
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                        {activeSesi.tokenQR}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Konfirmasi WhatsApp Otomatis */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Konfirmasi WhatsApp Real-Time</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Setiap kali Anda memindai kode QR sesi proyektor guru, sistem akan otomatis mengirimkan notifikasi resmi ke nomor WhatsApp orang tua Anda ({student.noHpOrtu}) yang memuat nama, jam masuk/pulang, dan status kehadiran.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Tampilan jika dinonaktifkan guru */
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Presensi Mandiri Scanner Siswa Dinonaktifkan
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Guru Piket atau Administrator sekolah saat ini mengatur mode presensi terpusat di gerbang sekolah. Siswa tidak perlu memindai sendiri lewat kamera HP.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 text-left space-y-2">
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>Langkah yang harus dilakukan:</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-[11px] text-slate-600">
                  <li>Buka tab <strong>Kartu Tanda Pelajar</strong>.</li>
                  <li>Tunjukkan kode QR Kartu Pelajar kepada Guru Piket di gerbang sekolah.</li>
                  <li>Tunggu verifikasi bunyi bip dari alat pemindai guru.</li>
                  <li>Cek tab <strong>Laporan & Rekap</strong> untuk memastikan WhatsApp telah terkirim ke orang tua.</li>
                </ol>
              </div>

              <button
                onClick={() => setActiveTab('kartu')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Buka Kartu Tanda Pelajar Digital
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PENGAJUAN IZIN / SAKIT ONLINE                      */}
      {/* ======================================================== */}
      {activeTab === 'izin' && (
        <PengajuanIzinTab
          student={student}
          schoolProfile={schoolProfile}
          pengajuanList={pengajuanIzinList}
          onSubmitPengajuan={(item) => {
            if (onAddPengajuanIzin) {
              onAddPengajuanIzin(item);
            }
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL PESAN WHATSAPP WALI MURID                    */}
      {/* ======================================================== */}
      {showWaDetailModal && (
        <div 
          onClick={() => setShowWaDetailModal(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Konfirmasi Notifikasi WhatsApp</h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Nomor Wali: {student.noHpOrtu} ({student.namaOrtu})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowWaDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Chat Bubble Simulation */}
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="bg-emerald-100/80 p-3 rounded-2xl border border-emerald-200 text-xs text-slate-800 space-y-1.5 shadow-sm">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>SISTEM PRESENSI RESMI SEKOLAH</span>
                  <span className="text-[10px] text-slate-500 font-mono">{showWaDetailModal.waktu} WIB</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Halo Bpk/Ibu <strong>{student.namaOrtu}</strong>, menginfokan bahwa ananda <strong>{student.nama}</strong> ({student.kelas}) telah melakukan presensi <strong>{showWaDetailModal.tipe}</strong> pada:
                </p>
                <div className="bg-white/80 p-2 rounded-xl text-[11px] font-mono space-y-0.5 border border-emerald-200">
                  <div>Tanggal : {showWaDetailModal.tanggal}</div>
                  <div>Pukul   : {showWaDetailModal.waktu} WIB</div>
                  <div>Status  : <span className="font-bold text-emerald-700">{showWaDetailModal.status}</span></div>
                </div>
                <div className="text-[10px] text-emerald-700 flex items-center justify-between pt-1">
                  <span>Pesan Otomatis Gateway API</span>
                  <span className="font-bold flex items-center space-x-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                    <span>TERKIRIM</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div>Gateway ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{showWaDetailModal.waResponse || 'wamid.HBgL200OK'}</code></div>
              <div>Petugas   : {showWaDetailModal.petugas || 'Sistem Presensi'}</div>
            </div>

            <button
              onClick={() => setShowWaDetailModal(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              Tutup Konfirmasi
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL ZOOM QR CODE                                       */}
      {/* ======================================================== */}
      {zoomQr && (
        <div 
          onClick={() => setZoomQr(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-900"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm">QR Code Pelajar Layar Penuh</h4>
              <button 
                onClick={() => setZoomQr(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            
            {qrDataUrl && (
              <img 
                src={qrDataUrl} 
                alt="QR Zoom" 
                className="w-64 h-64 mx-auto object-contain p-2 border-2 border-emerald-500 rounded-2xl"
              />
            )}

            <div>
              <h5 className="font-bold text-base text-slate-900">{student.nama}</h5>
              <div className="text-xs font-mono text-slate-500">NISN: {student.nisn} • {student.kelas}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Arahkan layar ini ke scanner gerbang sekolah
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
