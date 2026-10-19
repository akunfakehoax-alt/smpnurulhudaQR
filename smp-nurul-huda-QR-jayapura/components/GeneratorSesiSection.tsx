'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { SesiQR, Siswa, TipeSesi } from '@/types/attendance';
import { 
  QrCode, 
  Clock, 
  Layers, 
  Check, 
  Maximize2, 
  Minimize2, 
  Printer, 
  PlusCircle, 
  Radio, 
  ShieldCheck,
  Calendar,
  Smartphone
} from 'lucide-react';

interface GeneratorSesiSectionProps {
  activeSesi: SesiQR;
  siswaList: Siswa[];
  onUpdateSesi: (newSesi: SesiQR) => void;
  isPresensiMandiriEnabled?: boolean;
  onTogglePresensiMandiri?: () => void;
}

const StudentBadgeQR = ({ value }: { value: string }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, { width: 120, margin: 1 }, (err, url) => {
      if (!err && url && isMounted) {
        setDataUrl(url);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [value]);

  if (!dataUrl) {
    return <div className="w-24 h-24 bg-white flex items-center justify-center text-[10px] text-slate-400">Loading QR...</div>;
  }

  return <Image src={dataUrl} alt="QR Siswa" width={96} height={96} unoptimized className="w-24 h-24" />;
};

export const GeneratorSesiSection: React.FC<GeneratorSesiSectionProps> = ({
  activeSesi,
  siswaList,
  onUpdateSesi,
  isPresensiMandiriEnabled,
  onTogglePresensiMandiri
}) => {
  const [tipe, setTipe] = useState<TipeSesi>(activeSesi.tipe);
  const [kelas, setKelas] = useState<string>(activeSesi.kelas);
  const [jamMulai, setJamMulai] = useState<string>(activeSesi.jamMulai);
  const [jamSelesai, setJamSelesai] = useState<string>(activeSesi.jamSelesai);
  const [batasTerlambat, setBatasTerlambat] = useState<string>(activeSesi.batasTerlambat);
  const effectiveAllowSelfScan = isPresensiMandiriEnabled !== undefined 
    ? isPresensiMandiriEnabled 
    : (activeSesi.allowSelfScan ?? true);

  const [countdown, setCountdown] = useState<number>(30);
  const [dynamicToken, setDynamicToken] = useState<string>(activeSesi.tokenQR);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPrintBadges, setShowPrintBadges] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const projectorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR Code on canvas
  const renderQRCode = (tokenString: string) => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, tokenString, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error('QR Render Error:', err);
      });
    }

    if (projectorCanvasRef.current) {
      QRCode.toCanvas(projectorCanvasRef.current, tokenString, {
        width: 420,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error('Projector QR Error:', err);
      });
    }
  };

  // Dynamic token rotation every 30s
  useEffect(() => {
    renderQRCode(dynamicToken);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Generate new dynamic token
          const timeWindow = Math.floor(Date.now() / 30000);
          const newToken = `DYN_${activeSesi.id}_${timeWindow}_${Math.random().toString(36).substring(2, 7)}`;
          setDynamicToken(newToken);
          renderQRCode(newToken);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSesi.id, dynamicToken]);

  const handleCreateNewSesi = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `SESI-${Date.now()}`;
    const token = `QR-ATT-${tipe}-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 7)}`;
    
    const judul = `Presensi ${tipe === 'DATANG' ? 'Masuk Pagi' : 'Pulang Sekolah'} - Kelas ${kelas}`;
    const newSesi: SesiQR = {
      id: newId,
      kodeSesi: `SESI-${tipe}-${kelas.replace(/\s+/g, '_')}`,
      judul: judul,
      namaSesi: judul,
      tipe: tipe,
      kelas: kelas,
      tanggal: new Date().toISOString().split('T')[0],
      jamMulai: jamMulai,
      jamSelesai: jamSelesai,
      batasTerlambat: batasTerlambat,
      tokenQR: token,
      aktif: true,
      isActive: true,
      allowSelfScan: effectiveAllowSelfScan,
      refreshIntervalDetik: 30,
      createdAt: new Date().toISOString(),
      createdBy: 'Guru Piket',
      createdById: 'Guru Piket'
    };

    onUpdateSesi(newSesi);
    setDynamicToken(token);
    setCountdown(30);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-sky-600" />
            <span>Generator Sesi QR Presensi (Guru / Admin)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Sesi QR menggunakan token dinamis yang berganti tiap 30 detik untuk mencegah siswa mengirim foto QR ke teman.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onTogglePresensiMandiri && (
            <button
              type="button"
              onClick={onTogglePresensiMandiri}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 shadow-2xs transition cursor-pointer ${
                effectiveAllowSelfScan
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800 hover:bg-sky-100'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
              title="Sakelar Cepat Izin Presensi Mandiri Siswa"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Mandiri:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                effectiveAllowSelfScan ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {effectiveAllowSelfScan ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPrintBadges(!showPrintBadges)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">{showPrintBadges ? 'Tutup Kartu Siswa' : 'Cetak Kartu QR Siswa'}</span>
            <span className="sm:hidden">{showPrintBadges ? 'Tutup Kartu' : 'Cetak Kartu'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Layar Penuh Proyektor</span>
            <span className="sm:hidden">Layar Penuh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Live QR Display vs Session Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Active QR Display Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-between">
          <div className="w-full">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
              <span>Sesi Sedang Tayang</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {activeSesi.judul}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelas: <strong>{activeSesi.kelas}</strong> • Batas Terlambat: <strong className="text-rose-600">{activeSesi.batasTerlambat} WIB</strong>
            </p>
          </div>

          {/* QR Canvas Box */}
          <div className="my-5 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner relative group">
            <canvas ref={canvasRef} className="rounded-xl mx-auto shadow-sm" />
            
            {/* Dynamic refresh countdown badge */}
            <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-mono text-slate-600">
              <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Refresh Token: <strong className="text-sky-700">{countdown}s</strong></span>
            </div>
            {/* Progress bar */}
            <div className="w-48 mx-auto h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-sky-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 30) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="w-full text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">ID Sesi:</span>
              <span className="font-mono text-slate-800 text-[11px]">{activeSesi.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Token Aktif:</span>
              <span className="font-mono text-slate-800 text-[11px] truncate max-w-[170px]">{dynamicToken}</span>
            </div>
          </div>
        </div>

        {/* Create/Update Session Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Konfigurasi Sesi Presensi Baru</span>
            </h3>
            <p className="text-xs text-slate-500">
              Guru piket dapat mengatur jadwal absensi harian, toleransi jam keterlambatan, dan target kelas.
            </p>
          </div>

          <form onSubmit={handleCreateNewSesi} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Presensi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipe('DATANG')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      tipe === 'DATANG'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${tipe === 'DATANG' ? 'opacity-100' : 'opacity-0'}`} />
                    <span>Masuk (DATANG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipe('PULANG')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      tipe === 'PULANG'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${tipe === 'PULANG' ? 'opacity-100' : 'opacity-0'}`} />
                    <span>Pulang (PULANG)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Kelas
                </label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  <option value="SEMUA">Semua Kelas (Umum)</option>
                  <option value="XII RPL 1">XII RPL 1</option>
                  <option value="XII RPL 2">XII RPL 2</option>
                  <option value="XI TKJ 1">XI TKJ 1</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Selesai
                </label>
                <input
                  type="time"
                  value={jamSelesai}
                  onChange={(e) => setJamSelesai(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-rose-600 font-bold">
                  Batas Terlambat
                </label>
                <input
                  type="time"
                  value={batasTerlambat}
                  onChange={(e) => setBatasTerlambat(e.target.value)}
                  className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/40"
                  required
                />
              </div>
            </div>

            {/* Toggle Izin Presensi Mandiri Siswa */}
            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-950 block">
                  Izin Presensi Mandiri Siswa (Scanner Proyektor)
                </span>
                <span className="text-[11px] text-sky-700">
                  {effectiveAllowSelfScan 
                    ? 'Siswa diizinkan membuka kamera web app untuk scan QR proyektor guru' 
                    : 'Dinonaktifkan: Siswa wajib di-scan oleh guru/gerbang dengan Kartu Pelajar'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={effectiveAllowSelfScan}
                  onChange={() => {
                    if (onTogglePresensiMandiri) {
                      onTogglePresensiMandiri();
                    } else {
                      onUpdateSesi({ ...activeSesi, allowSelfScan: !effectiveAllowSelfScan });
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Otomatisasi Anti-Duplikasi Server:</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Membuat sesi baru dengan tipe dan tanggal yang sama akan otomatis menonaktifkan sesi lama di Google Sheets (kolom STATUS_AKTIF = &quot;NONAKTIF&quot;).
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-sm"
            >
              Simpan & Aktifkan Sesi Ini Sekarang
            </button>
          </form>
        </div>
      </div>

      {/* Printable Student Badges Gallery */}
      {showPrintBadges && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kartu Pelajar Digital dengan QR Code Pribadi
              </h3>
              <p className="text-xs text-slate-500">
                Kartu ini dapat dicetak untuk siswa yang melakukan scan di gerbang sekolah (Guru scanner mode).
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
            >
              Cetak Semua Kartu
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {siswaList.map((siswa) => (
              <div
                key={siswa.nisn}
                className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow border border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">KARTU SISWA</span>
                      <h4 className="font-bold text-sm text-white">{siswa.nama}</h4>
                    </div>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono">
                      {siswa.kelas}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">NISN: {siswa.nisn}</div>
                </div>

                <div className="my-3 bg-white p-2 rounded-lg self-center">
                  <StudentBadgeQR value={siswa.qrBadgeToken || siswa.nisn} />
                </div>

                <div className="text-[10px] text-slate-400 flex justify-between pt-2 border-t border-slate-700">
                  <span>Wali: {siswa.namaOrtu}</span>
                  <span>WA: {siswa.noHpOrtu}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Projector Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 text-white">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
                PROYEKTOR LAYAR KELAS & GERBANG
              </span>
              <h1 className="text-2xl font-bold mt-1">{activeSesi.judul}</h1>
              <p className="text-sm text-slate-400">
                Kelas: {activeSesi.kelas} • Batas Terlambat: <span className="text-rose-400 font-bold">{activeSesi.batasTerlambat} WIB</span>
              </p>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 border border-slate-700"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Tutup Layar Penuh</span>
            </button>
          </div>

          <div className="text-center my-auto flex flex-col items-center space-y-4">
            <div className="p-6 bg-white rounded-3xl shadow-2xl">
              <canvas ref={projectorCanvasRef} className="rounded-2xl" />
            </div>
            <div className="flex items-center space-x-3 text-lg font-mono text-slate-300">
              <Clock className="w-5 h-5 text-sky-400 animate-spin" />
              <span>QR Dinamis berganti dalam: <strong className="text-sky-400">{countdown} detik</strong></span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Silakan buka kamera HP Anda di aplikasi web presensi siswa dan pindai kode QR di atas.
            </p>
          </div>

          <div className="text-xs text-slate-500 text-center">
            Sistem Presensi QR Code • Terintegrasi Google Sheets & WhatsApp Resmi
          </div>
        </div>
      )}
    </div>
  );
};
