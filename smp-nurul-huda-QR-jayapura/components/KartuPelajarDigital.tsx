/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Siswa, SchoolProfile } from '@/types/attendance';
import { SchoolLogo } from '@/components/SchoolLogo';
import { 
  Printer, 
  Download, 
  RotateCw, 
  Maximize2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  QrCode, 
  X,
  School,
  GraduationCap,
  Calendar,
  FileText,
  Layers,
  Copy,
  Check,
  Camera
} from 'lucide-react';

interface KartuPelajarDigitalProps {
  student: Siswa;
  schoolProfile?: SchoolProfile;
  showControls?: boolean;
  onOpenZoomQr?: () => void;
  onUpdatePhoto?: (fotoUrl: string) => void;
  variant?: 'interactive' | 'printable-only';
}

export const KartuPelajarDigital: React.FC<KartuPelajarDigitalProps> = ({
  student,
  schoolProfile,
  showControls = true,
  onOpenZoomQr,
  onUpdatePhoto,
  variant = 'interactive'
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSideOption, setPrintSideOption] = useState<'both' | 'front' | 'back'>('both');
  const [copiedToken, setCopiedToken] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdatePhoto) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdatePhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate QR Code
  useEffect(() => {
    if (!student) return;
    const qrPayload = student.qrBadgeToken || `SISWA-${student.nisn}`;
    QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 1,
      color: {
        dark: '#0B132B',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Gagal generate QR Code Siswa:', err));
  }, [student]);

  const schoolName = schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA';
  const schoolNpsn = schoolProfile?.npsn || '60301234';
  const schoolAddress = schoolProfile?.alamat || 'Jl. Pendidikan No. 45, Abepura';
  const schoolCity = schoolProfile?.kota || 'Kota Jayapura';
  const schoolProv = schoolProfile?.provinsi || 'Papua';
  const schoolYear = schoolProfile?.tahunPelajaran || '2026/2027';
  const headMasterName = schoolProfile?.namaKepalaSekolah || 'Drs. H. Ahmad Fauzi, M.Pd.';
  const headMasterNip = schoolProfile?.nipKepalaSekolah || '19750812 200003 1 002';

  const handlePrint = (side: 'both' | 'front' | 'back' = printSideOption) => {
    setPrintSideOption(side);
    // Open native browser print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyToken = () => {
    const token = student.qrBadgeToken || `SISWA-${student.nisn}`;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Generate pseudo barcode bars based on NISN
  const renderBarcodeBars = (nisn: string) => {
    const chars = (nisn + '9876543210').slice(0, 16);
    return (
      <div className="flex items-end justify-center h-7 space-x-0.5 px-2 bg-white rounded overflow-hidden">
        {chars.split('').map((char, i) => {
          const num = parseInt(char, 10) || 5;
          const width = (num % 3) + 1.5;
          const height = 18 + (num % 8);
          return (
            <div
              key={i}
              className="bg-slate-900 shrink-0"
              style={{ width: `${width}px`, height: `${height}px` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Interactive Controls Bar */}
      {showControls && variant === 'interactive' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Kartu Tanda Pelajar Digital</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              Sistem Presensi QR
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Flip Button */}
            <button
              type="button"
              id="btn-flip-card"
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition active:scale-95"
              title="Balik ke Sisi Belakang / Sisi Depan"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 ${isFlipped ? 'rotate-180' : ''}`} />
              <span>{isFlipped ? 'Lihat Sisi Depan' : 'Lihat Sisi Belakang'}</span>
            </button>

            {/* Print Modal Trigger */}
            <button
              type="button"
              id="btn-open-print-card-modal"
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
              title="Cetak Kartu Tanda Pelajar Standar (Depan & Belakang)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu</span>
            </button>

            {/* Download QR Button */}
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`QR_Presensi_${student.nisn}_${student.nama.replace(/\s+/g, '_')}.png`}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
                title="Unduh file QR Code Presensi"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Unduh QR</span>
              </a>
            )}

            {/* Zoom Button */}
            {onOpenZoomQr && (
              <button
                type="button"
                onClick={onOpenZoomQr}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                title="Perbesar QR Layar Penuh"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          DIGITAL CARD DISPLAY (SCREEN VIEW WITH 3D FLIP)
         ========================================================================= */}
      <div className="relative perspective-[1200px] w-full max-w-[500px] mx-auto print:hidden">
        <div 
          className={`transition-all duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* =======================
              SISI DEPAN (FRONT)
             ======================= */}
          <div 
            className={`w-full rounded-[24px] overflow-hidden shadow-2xl border border-slate-300/80 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0D1F2D] text-white relative p-5 select-none ${
              isFlipped ? 'hidden pointer-events-none' : 'block'
            }`}
            style={{ backfaceVisibility: 'hidden', minHeight: '310px' }}
          >
            {/* Background Guilloche Wave Decorative Pattern */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* CARD TOP HEADER: INSTITUTION IDENTITY */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center space-x-3">
                {schoolProfile ? (
                  <SchoolLogo 
                    profile={schoolProfile} 
                    className="w-13 h-13 flex items-center justify-center text-white shrink-0 bg-transparent" 
                    iconClassName="w-12 h-12 text-white drop-shadow-md" 
                  />
                ) : (
                  <div className="w-13 h-13 flex items-center justify-center text-white shrink-0 bg-transparent">
                    <GraduationCap className="w-9 h-9 text-white drop-shadow-md" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-wide text-white uppercase leading-tight line-clamp-1">
                    {schoolName}
                  </h3>
                  <div className="text-[10px] text-emerald-300 font-bold tracking-wider uppercase mt-0.5">
                    KARTU TANDA PELAJAR DIGITAL
                  </div>
                  <div className="text-[9px] text-slate-300 line-clamp-1">
                    NPSN: {schoolNpsn} • {schoolAddress}, {schoolCity}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 block text-center">
                  TP {schoolYear}
                </span>
                <span className="text-[8px] text-slate-400 font-mono tracking-widest mt-0.5 block text-center">
                  ID CARD
                </span>
              </div>
            </div>

            {/* CARD SUBTITLE BADGE */}
            <div className="relative z-10 my-2 flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <span className="text-[10px] font-bold text-sky-300 tracking-wider flex items-center space-x-1">
                <QrCode className="w-3 h-3 text-emerald-400" />
                <span>SISTEM PRESENSI QR CODE RESMI</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Pelajar Aktif</span>
              </span>
            </div>

            {/* CARD MAIN BODY: PHOTO, BIODATA & QR CODE */}
            <div className="relative z-10 grid grid-cols-12 gap-3 items-center pt-1">
              {/* Photo & Class Pill (3.5 cols) */}
              <div className="col-span-4 text-center space-y-1.5">
                <div 
                  onClick={() => onUpdatePhoto && photoInputRef.current?.click()}
                  className={`w-24 h-28 mx-auto rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-emerald-400/60 p-1 shadow-lg relative overflow-hidden flex flex-col items-center justify-center ${
                    onUpdatePhoto ? 'cursor-pointer group hover:border-emerald-300 transition' : ''
                  }`}
                  title={onUpdatePhoto ? 'Klik untuk mengganti/upload foto siswa' : undefined}
                >
                  <div className="w-full h-full rounded-lg bg-slate-800 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden">
                    {student.fotoUrl ? (
                      <img 
                        src={student.fotoUrl} 
                        alt={`Foto ${student.nama}`} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        {/* Simulated Student Portrait Avatar with uniform look */}
                        <div className="w-12 h-12 rounded-full bg-emerald-700/80 border border-emerald-300/40 flex items-center justify-center text-emerald-100 font-bold text-lg mb-1 shadow-sm">
                          {student.nama.charAt(0)}
                        </div>
                        <div className="w-16 h-7 bg-slate-700 rounded-t-xl border-t border-slate-600 flex items-center justify-center">
                          <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider">
                            {student.jenisKelamin === 'L' ? 'SISWA' : 'SISWI'}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Camera overlay on hover if update allowed */}
                    {onUpdatePhoto && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
                        <Camera className="w-4 h-4 mb-0.5 text-emerald-300" />
                        <span>Ganti Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-1 right-1 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 block shadow-sm animate-pulse" />
                  </div>
                </div>

                {onUpdatePhoto && (
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                )}

                <div className="px-1.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 font-mono inline-block">
                  {student.kelas}
                </div>
              </div>

              {/* Student Biodata Details (5 cols) */}
              <div className="col-span-5 space-y-1 text-left text-xs">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-semibold">Nama Siswa:</span>
                  <div className="font-extrabold text-white text-[13px] leading-tight line-clamp-2">
                    {student.nama}
                  </div>
                </div>

                <div className="pt-0.5">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-semibold">NISN:</span>
                  <div className="font-mono font-bold text-emerald-300 text-xs tracking-wider">
                    {student.nisn}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[9px] pt-0.5">
                  <div>
                    <span className="text-[8px] text-slate-400 block">J. Kelamin:</span>
                    <span className="font-semibold text-slate-200">{student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block">Kelas:</span>
                    <span className="font-semibold text-slate-200">{student.kelas}</span>
                  </div>
                </div>

                <div className="text-[9px] pt-0.5">
                  <span className="text-[8px] text-slate-400 block">Wali Murid:</span>
                  <span className="text-slate-200 font-medium truncate block">{student.namaOrtu || 'Orang Tua / Wali'}</span>
                </div>
              </div>

              {/* QR Code Section (3 cols) */}
              <div className="col-span-3 text-center space-y-1">
                <div className="bg-white p-1.5 rounded-xl shadow-md border-2 border-emerald-400/50 inline-block">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt={`QR Code Presensi ${student.nama}`} 
                      className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center text-slate-400 text-[9px]">
                      Loading...
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-mono text-emerald-300 font-bold block tracking-wider uppercase">
                  Scan Presensi
                </span>
              </div>
            </div>

            {/* CARD BOTTOM: SIGNATURE & OFFICIAL DIGITAL STAMP */}
            <div className="relative z-10 border-t border-white/10 mt-3 pt-2 flex items-center justify-between text-[9px] text-slate-300">
              {/* Barcode & Security Token */}
              <div className="space-y-0.5">
                <div className="text-[8px] font-mono text-slate-400">
                  TOKEN: <strong className="text-emerald-300">{student.qrBadgeToken || `SISWA-${student.nisn}`}</strong>
                </div>
                {renderBarcodeBars(student.nisn)}
              </div>

              {/* Digital Headmaster Signature & Stamp */}
              <div className="text-right leading-tight relative pr-1">
                {/* Official Circular Digital Stamp Overlay */}
                <div className="absolute right-12 -top-3 w-14 h-14 rounded-full border border-sky-400/40 pointer-events-none opacity-40 flex items-center justify-center text-[7px] font-bold text-sky-300 rotate-[-15deg] uppercase">
                  <div className="w-11 h-11 rounded-full border border-sky-400/30 flex items-center justify-center text-center">
                    SEKOLAH
                  </div>
                </div>

                <span className="text-[8px] text-slate-400 block">Mengetahui, Kepala Sekolah</span>
                {/* Simulated signature graphic stroke */}
                <div className="h-4 flex items-center justify-end">
                  <span className="font-serif italic text-emerald-300 text-xs tracking-widest opacity-90 select-none">
                    ~ {headMasterName.split(' ')[0]} ~
                  </span>
                </div>
                <strong className="text-white text-[9px] block underline decoration-emerald-500/60 decoration-1">
                  {headMasterName}
                </strong>
                <span className="font-mono text-[7px] text-slate-400 block">
                  NIP. {headMasterNip}
                </span>
              </div>
            </div>
          </div>

          {/* =======================
              SISI BELAKANG (BACK)
             ======================= */}
          <div 
            className={`w-full rounded-[24px] overflow-hidden shadow-2xl border border-slate-300/80 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0A1128] text-white relative p-5 select-none ${
              !isFlipped ? 'hidden pointer-events-none' : 'block'
            }`}
            style={{ minHeight: '310px' }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Back Header */}
            <div className="border-b border-white/15 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    KETENTUAN KARTU TANDA PELAJAR
                  </h4>
                  <span className="text-[9px] text-emerald-300">Sistem Presensi QR Code Sekolah</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400">BAGIAN BELAKANG</span>
            </div>

            {/* Terms & Regulations */}
            <div className="py-2.5 space-y-1.5 text-[9px] sm:text-[10px] text-slate-300 leading-relaxed">
              <div className="flex items-start space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Kartu ini adalah tanda pengenal sah pelajar <strong>{schoolName}</strong> dan instrumen resmi absensi digital.
                </span>
              </div>

              <div className="flex items-start space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Wajib dibawa setiap hari dan di-scan ke scanner gerbang/kelas saat datang (masuk) dan pulang sekolah.
                </span>
              </div>

              <div className="flex items-start space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Anti-Titip Presensi:</strong> Dilarang meminjamkan kartu/QR kepada siswa lain. Sistem mendeteksi anti-duplikasi otomatis.
                </span>
              </div>

              <div className="flex items-start space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  Apabila kartu ini hilang atau rusak, segera laporkan ke bagian Tata Usaha / Kesiswaan untuk cetak ulang.
                </span>
              </div>
            </div>

            {/* School Contact Box */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[9px] text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>KONTAK SEKOLAH:</span>
                <span className="text-emerald-400 font-mono">Presensi Online WhatsApp</span>
              </div>
              <div className="text-slate-400 text-[8px]">
                {schoolAddress}, {schoolCity}, {schoolProv}
              </div>
              <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 pt-1 border-t border-white/5">
                <span>NISN: {student.nisn}</span>
                <span>No. Ortu: {student.noHpOrtu}</span>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="mt-2 text-center text-[8px] text-slate-400 italic">
              Barang siapa menemukan kartu ini mohon mengembalikan ke alamat sekolah tertera di atas.
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRINT PREVIEW & PRINT DIALOG MODAL
         ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-slate-900">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    Cetak Kartu Tanda Pelajar Digital
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standar ID Card CR80 (86 × 54 mm) • Sistem Presensi QR
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Configuration Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Sisi yang Ingin Dicetak:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPrintSideOption('both')}
                  className={`p-3 rounded-xl border text-left transition ${
                    printSideOption === 'both'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Depan & Belakang</span>
                    {printSideOption === 'both' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Berdampingan (Siap Gunting & Lipat)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintSideOption('front')}
                  className={`p-3 rounded-xl border text-left transition ${
                    printSideOption === 'front'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Sisi Depan Saja</span>
                    {printSideOption === 'front' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Kartu Foto & QR Presensi
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintSideOption('back')}
                  className={`p-3 rounded-xl border text-left transition ${
                    printSideOption === 'back'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Sisi Belakang Saja</span>
                    {printSideOption === 'back' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Tata Tertib & Kontak Sekolah
                  </span>
                </button>
              </div>
            </div>

            {/* Print Guidance Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-slate-600">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Petunjuk Pencetakan Kertas & Kartu:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-600 pl-1">
                <li>Gunakan kertas tebal (misal Photo Paper, Matte Paper 210-260 gsm, atau PVC Card blank).</li>
                <li>Pilih opsi <strong>&quot;Background Graphics&quot;</strong> pada jendela cetak browser agar warna kartu tercetak penuh.</li>
                <li>Setelah dicetak, gunting mengikuti garis panduan untuk ukuran ID Card standar yang pas masuk ke holder lanyard kartu pelajar.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition"
              >
                Tutup
              </button>
              <button
                type="button"
                id="btn-execute-print-card"
                onClick={() => {
                  setShowPrintModal(false);
                  handlePrint(printSideOption);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Mulai Cetak Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DEDICATED PRINT CONTAINER (VISIBLE ONLY IN @MEDIA PRINT)
          Optimized for A4 or Standard Card Cutout
         ========================================================================= */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <div className="text-center mb-4 text-black border-b pb-2">
          <h2 className="text-lg font-bold uppercase">{schoolName}</h2>
          <p className="text-xs">LEMBAR CETAK KARTU TANDA PELAJAR DIGITAL • SISTEM PRESENSI QR</p>
          <p className="text-[10px] text-gray-500">Siswa: {student.nama} ({student.nisn}) • Kelas: {student.kelas}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {/* PRINT SISI DEPAN */}
          {(printSideOption === 'both' || printSideOption === 'front') && (
            <div className="w-[86mm] h-[54mm] rounded-2xl border-2 border-dashed border-gray-400 p-2.5 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0D1F2D] text-white relative overflow-hidden flex flex-col justify-between shrink-0 shadow-none [box-sizing:border-box]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/20 pb-1">
                <div className="flex items-center space-x-1.5">
                  <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {schoolProfile?.namaSekolah ? schoolProfile.namaSekolah.charAt(0) : 'S'}
                  </div>
                  <div>
                    <div className="font-extrabold text-[8px] uppercase tracking-wide truncate max-w-[170px] leading-none">
                      {schoolName}
                    </div>
                    <div className="text-[7px] text-emerald-400 font-bold tracking-wider leading-none mt-0.5">
                      KARTU TANDA PELAJAR DIGITAL
                    </div>
                  </div>
                </div>
                <span className="text-[6px] font-mono px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  {schoolYear}
                </span>
              </div>

              {/* Main Info */}
              <div className="grid grid-cols-12 gap-1.5 items-center my-0.5">
                <div className="col-span-3 text-center">
                  <div className="w-14 h-16 rounded bg-slate-800 border border-emerald-400/50 mx-auto flex flex-col items-center justify-center overflow-hidden">
                    {student.fotoUrl ? (
                      <img 
                        src={student.fotoUrl} 
                        alt="Foto" 
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <>
                        <span className="text-emerald-300 font-bold text-xs">{student.nama.charAt(0)}</span>
                        <span className="text-[6px] text-slate-300 uppercase">{student.jenisKelamin === 'L' ? 'SISWA' : 'SISWI'}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[6px] font-bold text-emerald-300 font-mono block mt-0.5">{student.kelas}</span>
                </div>

                <div className="col-span-6 text-left leading-tight space-y-0.5">
                  <div>
                    <span className="text-[6px] text-slate-400 block uppercase">NAMA SISWA:</span>
                    <div className="font-extrabold text-[9px] text-white leading-none truncate">{student.nama}</div>
                  </div>
                  <div>
                    <span className="text-[6px] text-slate-400 block uppercase">NISN:</span>
                    <div className="font-mono font-bold text-emerald-300 text-[8px] leading-none">{student.nisn}</div>
                  </div>
                  <div className="text-[7px] text-slate-300 leading-none">
                    Wali: <span className="text-white font-medium">{student.namaOrtu}</span>
                  </div>
                </div>

                <div className="col-span-3 text-center">
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt="QR" 
                      className="w-13 h-13 mx-auto bg-white p-0.5 rounded border border-emerald-400"
                    />
                  )}
                  <span className="text-[6px] font-mono text-emerald-300 block leading-none mt-0.5 font-bold">SCAN QR</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/20 pt-0.5 flex justify-between items-center text-[6px] text-slate-300">
                <span className="font-mono">TOKEN: {student.qrBadgeToken || `SISWA-${student.nisn}`}</span>
                <span className="font-semibold text-right">Kepala Sekolah: {headMasterName}</span>
              </div>
            </div>
          )}

          {/* PRINT SISI BELAKANG */}
          {(printSideOption === 'both' || printSideOption === 'back') && (
            <div className="w-[86mm] h-[54mm] rounded-2xl border-2 border-dashed border-gray-400 p-2.5 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0A1128] text-white relative overflow-hidden flex flex-col justify-between shrink-0 shadow-none [box-sizing:border-box]">
              <div className="border-b border-white/20 pb-0.5 flex justify-between items-center">
                <span className="font-bold text-[7px] uppercase tracking-wider text-emerald-400">
                  KETENTUAN KARTU PRESENSI QR
                </span>
                <span className="text-[6px] font-mono text-slate-400">{schoolNpsn}</span>
              </div>

              <div className="space-y-1 text-[6.5px] text-slate-300 leading-tight my-1">
                <div>1. Kartu pengenal resmi dan identitas presensi QR code siswa <strong>{schoolName}</strong>.</div>
                <div>2. Wajib dibawa setiap hari dan di-scan ke scanner gerbang saat datang & pulang sekolah.</div>
                <div>3. Dilarang meminjamkan QR code kepada orang lain (Anti-Titip Presensi).</div>
                <div>4. Kerusakan/kehilangan kartu harap lapor ke bagian kesiswaan untuk cetak ulang.</div>
              </div>

              <div className="border-t border-white/20 pt-1 flex justify-between items-end text-[6px] text-slate-400">
                <div>
                  <div className="text-[6.5px] text-white font-bold">{schoolAddress}, {schoolCity}</div>
                  <div>Kontak Presensi Ortu: {student.noHpOrtu}</div>
                </div>
                <div className="text-right font-mono">
                  NISN: {student.nisn}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-4 text-[9px] text-gray-500">
          Gunting mengikuti garis putus-putus untuk ukuran ID Card CR80 standar (86 × 54 mm).
        </div>
      </div>
    </div>
  );
};
