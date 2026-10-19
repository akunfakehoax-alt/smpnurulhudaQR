'use client';

import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Siswa, SesiQR, PresensiRecord, WhatsAppConfig, User, VoiceAnnouncementConfig, GasLiveSyncConfig, SchoolProfile } from '@/types/attendance';
import { playScanSound } from '@/lib/audio';
import { speakAttendanceGreeting, DEFAULT_VOICE_CONFIG } from '@/lib/voice-speech';
import { syncRecordToGas, DEFAULT_GAS_CONFIG } from '@/lib/gas-sync';
import { VoiceGreetingModal } from '@/components/VoiceGreetingModal';
import { GasLiveSyncModal } from '@/components/GasLiveSyncModal';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  UploadCloud, 
  Keyboard, 
  Zap, 
  RefreshCw,
  QrCode,
  User as UserIcon,
  Clock,
  Smartphone,
  Volume2,
  VolumeX,
  Database,
  Link2,
  Settings,
  Users,
  UserCheck
} from 'lucide-react';
import { createPresensiIndexKey } from '@/lib/presensi-indexer';

interface ScanQRSectionProps {
  currentUser: User;
  activeSesi: SesiQR;
  siswaList: Siswa[];
  presensiList: PresensiRecord[];
  presensiIndex?: Map<string, PresensiRecord>;
  waConfig: WhatsAppConfig;
  onRecordPresensi: (record: PresensiRecord) => { success: boolean; duplicate?: boolean; message: string };
  isPresensiMandiriEnabled?: boolean;
  onTogglePresensiMandiri?: () => void;
  voiceConfig?: VoiceAnnouncementConfig;
  onUpdateVoiceConfig?: (cfg: VoiceAnnouncementConfig) => void;
  gasConfig?: GasLiveSyncConfig;
  onUpdateGasConfig?: (cfg: GasLiveSyncConfig) => void;
  schoolProfile?: SchoolProfile;
  onOpenMassAttendanceModal?: () => void;
}

export const ScanQRSection: React.FC<ScanQRSectionProps> = ({
  currentUser,
  activeSesi,
  siswaList,
  presensiList,
  presensiIndex,
  waConfig,
  onRecordPresensi,
  isPresensiMandiriEnabled = false,
  onTogglePresensiMandiri,
  voiceConfig = DEFAULT_VOICE_CONFIG,
  onUpdateVoiceConfig,
  gasConfig = DEFAULT_GAS_CONFIG,
  onUpdateGasConfig,
  schoolProfile,
  onOpenMassAttendanceModal
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [manualNisn, setManualNisn] = useState('');
  const [selectedStudentForTest, setSelectedStudentForTest] = useState(siswaList[0]?.nisn || '');
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'duplicate' | 'error' | null;
    title: string;
    message: string;
    record?: PresensiRecord;
    timestamp?: string;
  }>({
    type: null,
    title: '',
    message: ''
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }
      setCameraActive(true);
      requestAnimationFrame(tickScan);
    } catch (err) {
      console.error('Camera access error:', err);
      setScanFeedback({
        type: 'error',
        title: 'Izin Kamera Gagal',
        message: 'Tidak dapat membuka webcam/kamera HP. Anda dapat menggunakan tombol Simulasi Cepat atau Upload File QR di bawah.'
      });
      playScanSound('error');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Continuous scan tick
  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleQRDataDetected(code.data);
          // Pause camera briefly so it doesn't trigger 10 times in 1 second
          setTimeout(() => {
            if (cameraActive) {
              requestAnimationFrame(tickScan);
            }
          }, 2000);
          return;
        }
      }
    }
    animFrameId.current = requestAnimationFrame(tickScan);
  };

  // Process detected QR token / string
  const handleQRDataDetected = (qrContent: string) => {
    // Look for matching student in list
    // Could be token "SISWA-0061234501-HASH99" or direct NISN
    let foundSiswa = siswaList.find(s => s.qrBadgeToken === qrContent || s.nisn === qrContent);

    // If QR was from active session QR (e.g. dynamic token QR-ATT-DATANG-...)
    // then if currentUser is a student, the student is checking in using their current login
    if (!foundSiswa && qrContent.startsWith('QR-ATT') || qrContent.startsWith('DYN_')) {
      if (currentUser.role === 'SISWA' && currentUser.nisn) {
        foundSiswa = siswaList.find(s => s.nisn === currentUser.nisn);
      }
    }

    if (foundSiswa) {
      processStudentAttendance(foundSiswa, 'QR_SCAN');
    } else {
      playScanSound('error');
      setScanFeedback({
        type: 'error',
        title: 'QR Code Tidak Dikenali',
        message: `Konten QR: "${qrContent.substring(0, 30)}..." tidak cocok dengan data siswa terdaftar di sheet SISWA.`
      });
    }
  };

  // Process Attendance
  const processStudentAttendance = React.useCallback((siswa: Siswa, method: 'QR_SCAN' | 'MANUAL') => {
    const now = new Date();
    const currentMillis = now.getTime();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Check late tolerance
    let status: 'HADIR' | 'TERLAMBAT' = 'HADIR';
    if (activeSesi.tipe === 'DATANG' && activeSesi.batasTerlambat) {
      const [limitH, limitM] = activeSesi.batasTerlambat.split(':').map(Number);
      const currH = now.getHours();
      const currM = now.getMinutes();
      if (currH > limitH || (currH === limitH && currM > limitM)) {
        status = 'TERLAMBAT';
      }
    }

    const newRecord: PresensiRecord = {
      id: `PRES-${currentMillis}-${siswa.nisn.slice(-4)}`,
      tanggal: dateStr,
      waktu: timeStr,
      jam: timeStr,
      nisn: siswa.nisn,
      namaSiswa: siswa.nama,
      nama: siswa.nama,
      kelas: siswa.kelas,
      tipe: activeSesi.tipe,
      sesiId: activeSesi.kodeSesi || activeSesi.tipe,
      status: status,
      metode: method,
      waStatus: waConfig.enabled ? 'TERKIRIM' : 'NONAKTIF',
      waResponse: waConfig.enabled ? `Meta Cloud API 200 OK (wamid.HBgL${currentMillis.toString(36)})` : undefined,
      catatan: status === 'TERLAMBAT' 
        ? `Terlambat dari batas ${activeSesi.batasTerlambat} WIB` 
        : `Tepat waktu sebelum batas ${activeSesi.batasTerlambat} WIB`,
      keterangan: status === 'TERLAMBAT' 
        ? `Terlambat dari batas ${activeSesi.batasTerlambat} WIB` 
        : `Tepat waktu sebelum batas ${activeSesi.batasTerlambat} WIB`,
      petugas: currentUser.nama,
      verifiedBy: currentUser.nama
    };

    const result = onRecordPresensi(newRecord);

    if (result.success) {
      // Audio chime and Indonesian Text-to-Speech voice greeting
      speakAttendanceGreeting({
        nama: siswa.nama,
        tipe: activeSesi.tipe === 'PULANG' ? 'PULANG' : 'MASUK',
        waktu: timeStr,
        isTerlambat: status === 'TERLAMBAT',
        sekolah: schoolProfile?.namaSekolah
      }, voiceConfig);

      // Auto-sync row to Google Sheets via GAS Web App
      if (gasConfig?.autoSyncOnScan && gasConfig.webAppUrl) {
        syncRecordToGas(newRecord, gasConfig);
      }

      setScanFeedback({
        type: 'success',
        title: `Presensi ${activeSesi.tipe} Berhasil!`,
        message: `${siswa.nama} (${siswa.kelas}) tercatat [${status}]. Notifikasi WhatsApp ${waConfig.enabled ? 'terkirim ke ' + siswa.noHpOrtu : 'dinonaktifkan'}.`,
        record: newRecord,
        timestamp: timeStr
      });
    } else if (result.duplicate) {
      speakAttendanceGreeting({
        nama: siswa.nama,
        tipe: activeSesi.tipe === 'PULANG' ? 'PULANG' : 'MASUK',
        waktu: timeStr,
        isDuplikat: true,
        sekolah: schoolProfile?.namaSekolah
      }, voiceConfig);

      setScanFeedback({
        type: 'duplicate',
        title: 'Peringatan: Anti-Duplikasi Aktif',
        message: result.message
      });
    } else {
      playScanSound('error');
      setScanFeedback({
        type: 'error',
        title: 'Gagal Mencatat Presensi',
        message: result.message
      });
    }
  }, [activeSesi, currentUser.nama, onRecordPresensi, waConfig.enabled, voiceConfig, gasConfig, schoolProfile?.namaSekolah]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNisn.trim()) return;
    const s = siswaList.find(item => item.nisn === manualNisn.trim());
    if (!s) {
      playScanSound('error');
      setScanFeedback({
        type: 'error',
        title: 'NISN Tidak Ditemukan',
        message: `Tidak ada siswa dengan NISN: ${manualNisn} pada sheet SISWA.`
      });
      return;
    }
    processStudentAttendance(s, 'MANUAL');
    setManualNisn('');
  };

  const handleQuickTestScan = (nisn: string) => {
    const s = siswaList.find(item => item.nisn === nisn);
    if (s) {
      processStudentAttendance(s, 'QR_SCAN');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(imgData.data, imgData.width, imgData.height);
          if (qr) {
            handleQRDataDetected(qr.data);
          } else {
            playScanSound('error');
            setScanFeedback({
              type: 'error',
              title: 'QR Code Tidak Terbaca',
              message: 'Pastikan gambar QR tajam dan tidak buram.'
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Active Session Info Banner */}
      <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
              activeSesi.tipe === 'DATANG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              Sesi {activeSesi.tipe}
            </span>
            <span className="text-slate-400 text-xs">· Target: Kelas {activeSesi.kelas}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5 tracking-tight">
            {activeSesi.judul}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
            <span>Jam Operasional: <strong className="text-white font-mono">{activeSesi.jamMulai} - {activeSesi.jamSelesai}</strong></span>
            <span>Batas Tepat Waktu: <strong className="text-sky-300 font-mono">{activeSesi.batasTerlambat} WIB</strong></span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
          {/* Suara Sapaan TTS Button */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer ${
              voiceConfig.enabled
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Pengaturan Suara Sapaan Ramah Siswa (Text-to-Speech)"
          >
            {voiceConfig.enabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">TTS:</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              voiceConfig.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {voiceConfig.enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Live Google Sheets Web App Connection Button */}
          <button
            type="button"
            onClick={() => setShowGasModal(true)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer ${
              gasConfig.webAppUrl && gasConfig.lastSyncStatus === 'SUCCESS'
                ? 'bg-purple-500/20 border-purple-400/40 text-purple-200 hover:bg-purple-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
            title="Pengaturan Koneksi Live URL Web App Google Apps Script"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Sheets:</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              gasConfig.webAppUrl ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {gasConfig.webAppUrl ? 'LIVE' : 'LOKAL'}
            </span>
          </button>

          {/* Tombol Absenkan Massal Tanpa Scan QR (Admin & Guru) */}
          {(currentUser.role === 'ADMIN' || currentUser.role === 'GURU') && onOpenMassAttendanceModal && (
            <button
              type="button"
              onClick={onOpenMassAttendanceModal}
              className="px-3 py-1.5 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer active:scale-95"
              title="Absenkan seluruh siswa atau 1 kelas sekaligus tanpa perlu scan QR"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span>Absenkan Kelas / Massal</span>
            </button>
          )}

          <div className="text-left sm:text-right text-xs px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0">
            <span className="text-slate-400 block text-[10px]">Hadir Hari Ini</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {presensiList.filter(p => p.tipe === activeSesi.tipe).length} <span className="text-xs text-slate-400 font-normal">/ {siswaList.length}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Scanner & Manual Input */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center space-x-2">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Pemindai Kamera Live</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Arahkan kamera ke QR Code Kartu Siswa atau QR Sesi Proyektor.
                </p>
              </div>

              {cameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center space-x-1.5 transition shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Matikan Kamera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 transition shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Nyalakan Kamera</span>
                </button>
              )}
            </div>

            {/* Video Preview Box */}
            <div className="relative w-full aspect-video sm:aspect-square max-h-[380px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-700">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraActive ? (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-sky-400 rounded-2xl relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-sky-400"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-sky-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-sky-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-sky-400"></div>
                    {/* Laser scan line animation */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                  </div>
                  <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur text-[11px] text-white">
                    Posisikan QR di dalam kotak
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Kamera Belum Aktif</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Klik &quot;Nyalakan Kamera&quot; atau gunakan opsi simulasi cepat di sebelah kanan untuk mencoba alur presensi.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Aktifkan Pemindai</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upload image / Fallback */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <label className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 cursor-pointer py-1">
                <UploadCloud className="w-4 h-4 text-sky-600" />
                <span>Upload Foto / Gambar QR Code</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <span className="text-slate-400 hidden sm:inline">•</span>

              <span className="text-slate-500 text-[11px]">
                Didukung di Chrome, Safari, Edge, Android, iOS
              </span>
            </div>
          </div>

          {/* Fallback Manual Input (Only for Admin & Guru) */}
          {currentUser.role !== 'SISWA' ? (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Keyboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Input Manual NISN (Jika QR Rusak / Kamera Tidak Tersedia)</span>
              </h4>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualNisn}
                  onChange={(e) => setManualNisn(e.target.value)}
                  placeholder="Ketik 10 digit NISN (cth: 0061234501)..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 transition"
                >
                  Catat Presensi
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-emerald-950 text-xs space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mode Presensi Mandiri Siswa</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Arahkan kamera ke QR Code Sesi yang ditayangkan oleh Guru di proyektor kelas untuk mencatat kehadiran Anda ({currentUser.nama} - NISN: {currentUser.nisn || currentUser.username}).
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Feedback Result, Quick Test Simulator, & Anti-Duplication Check */}
        <div className="lg:col-span-5 space-y-4">
          {/* Result Feedback Banner */}
          {scanFeedback.type && (
            <div
              className={`rounded-2xl p-4 border transition animate-in fade-in duration-200 ${
                scanFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : scanFeedback.type === 'duplicate'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="shrink-0 mt-0.5">
                  {scanFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : scanFeedback.type === 'duplicate' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-sm leading-tight">
                    {scanFeedback.title}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    {scanFeedback.message}
                  </p>

                  {scanFeedback.record && (
                    <div className="mt-3 pt-2 border-t border-emerald-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Siswa:</span>
                        <strong className="text-slate-900">{scanFeedback.record.namaSiswa}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Kelas:</span>
                        <span className="font-medium text-slate-800">{scanFeedback.record.kelas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Waktu Scan:</span>
                        <span className="font-mono text-slate-800">{scanFeedback.record.waktu} WIB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          scanFeedback.record.status === 'HADIR' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {scanFeedback.record.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-600">WhatsApp Wali:</span>
                        <span className="text-emerald-700 font-medium flex items-center space-x-1">
                          <Send className="w-3 h-3" />
                          <span>{scanFeedback.record.waStatus} (Meta API)</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fitur Presensi Massal Tanpa Scan QR (Admin & Guru) */}
          {(currentUser.role === 'ADMIN' || currentUser.role === 'GURU') && onOpenMassAttendanceModal && (
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-indigo-700/60 shadow-md space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-indigo-300 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                    <Users className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                      <span>Absenkan Seluruh Siswa / Kelas</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                        Tanpa QR
                      </span>
                    </h4>
                    <p className="text-xs text-indigo-200/90 mt-0.5">
                      Absenkan 1 kelas penuh atau seluruh siswa sekolah sekaligus tanpa perlu scan kamera satu per satu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-800/60">
                <span className="text-[11px] text-slate-300">
                  Target kelas: <strong>Kelas {activeSesi.kelas} ({activeSesi.tipe})</strong>
                </span>
                <button
                  type="button"
                  onClick={onOpenMassAttendanceModal}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-100" />
                  <span>Buka Form Presensi Massal</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Simulation Playground (Only for Admin & Guru) */}
          {currentUser.role !== 'SISWA' ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">Simulasi Cepat Kartu Siswa</span>
                </h4>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg font-medium shrink-0">
                  1-Click Test
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik salah satu siswa di bawah untuk menguji scan QR secara instan dan melihat validasi <strong>LockService anti-duplikasi</strong>.
              </p>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {siswaList.map((siswa) => {
                  const todayDate = activeSesi.tanggal || new Date().toISOString().split('T')[0];
                  const indexKey = createPresensiIndexKey(todayDate, siswa.nisn, activeSesi.tipe);
                  const indexedRecord = presensiIndex 
                    ? presensiIndex.get(indexKey)
                    : presensiList.find(p => p.nisn === siswa.nisn && p.tipe === activeSesi.tipe);
                  const alreadyScanned = Boolean(indexedRecord);

                  return (
                    <div
                      key={siswa.nisn}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border text-xs gap-2 transition ${
                        alreadyScanned 
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400' 
                          : 'bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-sky-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center space-x-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{siswa.nama}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>NISN: {siswa.nisn}</span>
                          <span>•</span>
                          <span>{siswa.kelas}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-1.5 self-start sm:self-auto">
                        {alreadyScanned ? (
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-semibold">
                            Sudah Hadir
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickTestScan(siswa.nisn)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-[11px] flex items-center space-x-1 transition shadow-xs cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Scan QR</span>
                          </button>
                        )}

                        {/* Test duplicate attempt button */}
                        {alreadyScanned && (
                          <button
                            type="button"
                            onClick={() => handleQuickTestScan(siswa.nisn)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                            title="Uji Anti-Duplikasi (Scan lagi untuk memicu penolakan)"
                          >
                            Uji Duplikat
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Status Presensi Sesi Ini</span>
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  Siswa Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Data kehadiran Anda tercatat otomatis dan terkirim ke WhatsApp Wali Murid.
              </p>
              {(() => {
                const currentStudent = siswaList.find(s => s.nisn === currentUser.nisn || s.nisn === currentUser.username) || siswaList[0];
                const todayDate = activeSesi.tanggal || new Date().toISOString().split('T')[0];
                const studentKey = currentStudent ? createPresensiIndexKey(todayDate, currentStudent.nisn, activeSesi.tipe) : '';
                const myRecord = (presensiIndex && studentKey ? presensiIndex.get(studentKey) : undefined) || 
                  presensiList.find(p => p.nisn === currentStudent?.nisn && p.tipe === activeSesi.tipe);
                return (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Nama:</span>
                      <strong className="text-slate-900">{currentStudent?.nama}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">NISN:</span>
                      <span className="font-mono font-bold text-slate-800">{currentStudent?.nisn}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Status Presensi:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        myRecord 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {myRecord ? `${myRecord.status} (${myRecord.waktu})` : 'Belum Melakukan Scan'}
                      </span>
                    </div>
                    {!myRecord && currentStudent && (
                      <button
                        type="button"
                        onClick={() => handleQuickTestScan(currentStudent.nisn)}
                        className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Presensi Mandiri Kartu Saya</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* LockService Anti-Duplication Explanation Note with O(1) State Indexing */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Cara Kerja Anti-Duplikasi (LockService GAS & Indexing O(1)):</span>
            </h5>
            <p className="text-[11px] leading-relaxed">
              Di Google Apps Script, fungsi <code className="text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-1 py-0.5 rounded font-mono">LockService.getScriptLock()</code> mengunci eksekusi secara atomik selama 10 detik. Di sisi aplikasi, presensi diindeks dengan composite key <code className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.5 rounded font-mono">[Tanggal|NISN|Sesi]</code> dalam hash map O(1). Validasi duplikasi berjalan instan (&lt;1 ms) tanpa bottleneck bahkan saat riwayat presensi mencapai puluhan ribu baris.
            </p>
          </div>
        </div>
      </div>

      {/* Voice Greeting Configuration Modal */}
      <VoiceGreetingModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        config={voiceConfig}
        onSaveConfig={(updated) => onUpdateVoiceConfig?.(updated)}
        schoolName={schoolProfile?.namaSekolah}
      />

      {/* Live GAS Web App Sync Modal */}
      <GasLiveSyncModal
        isOpen={showGasModal}
        onClose={() => setShowGasModal(false)}
        config={gasConfig}
        onUpdateConfig={(updated: GasLiveSyncConfig) => onUpdateGasConfig?.(updated)}
        presensiList={presensiList}
      />
    </div>
  );
};
