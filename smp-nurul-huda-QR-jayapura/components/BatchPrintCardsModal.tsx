/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Siswa, SchoolProfile } from '@/types/attendance';
import { 
  Printer, 
  X, 
  Check, 
  CheckCircle2, 
  Users, 
  Filter, 
  GraduationCap, 
  Download,
  AlertCircle
} from 'lucide-react';

interface BatchPrintCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  schoolProfile?: SchoolProfile;
}

export const BatchPrintCardsModal: React.FC<BatchPrintCardsModalProps> = ({
  isOpen,
  onClose,
  siswaList,
  schoolProfile
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [printSide, setPrintSide] = useState<'both' | 'front' | 'back'>('both');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Extract unique classes
  const uniqueClasses = Array.from(new Set(siswaList.map(s => s.kelas))).filter(Boolean);

  // Filtered students
  const filteredStudents = selectedKelas === 'all'
    ? siswaList
    : siswaList.filter(s => s.kelas === selectedKelas);

  // Generate QR codes for all filtered students
  useEffect(() => {
    if (!isOpen || filteredStudents.length === 0) return;

    let isMounted = true;

    const generateAll = async () => {
      setIsGeneratingQr(true);
      const newMap: Record<string, string> = {};
      try {
        await Promise.all(
          filteredStudents.map(async (student) => {
            const token = student.qrBadgeToken || `SISWA-${student.nisn}`;
            const url = await QRCode.toDataURL(token, {
              width: 250,
              margin: 1,
              color: { dark: '#0B132B', light: '#FFFFFF' }
            });
            newMap[student.nisn] = url;
          })
        );
        if (isMounted) {
          setQrMap(newMap);
        }
      } catch (err) {
        console.error('Error generating batch QRs:', err);
      } finally {
        if (isMounted) {
          setIsGeneratingQr(false);
        }
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedKelas, filteredStudents]);

  if (!isOpen) return null;

  const schoolName = schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA';
  const schoolNpsn = schoolProfile?.npsn || '60301234';
  const schoolYear = schoolProfile?.tahunPelajaran || '2026/2027';
  const schoolAddress = schoolProfile?.alamat || 'Jl. Pendidikan No. 45';
  const schoolCity = schoolProfile?.kota || 'Kota Jayapura';
  const headMasterName = schoolProfile?.namaKepalaSekolah || 'Drs. H. Ahmad Fauzi, M.Pd.';

  const handleExecutePrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Container: on screen it's a modal, on print it takes over the page */}
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:h-auto">
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 print:hidden bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Cetak Massal Kartu Tanda Pelajar Digital
              </h3>
              <p className="text-xs text-slate-500">
                Sistem Presensi QR Code • Format Lembar A4 Siap Gunting & Laminating
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1.5 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Toolbar (Hidden on Print) */}
        <div className="p-4 border-b border-slate-100 bg-white print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Filter Kelas */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilih Kelas / Rombel:</span>
              </span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">Semua Kelas ({siswaList.length} Siswa)</option>
                {uniqueClasses.map(k => (
                  <option key={k} value={k}>
                    {k} ({siswaList.filter(s => s.kelas === k).length} Siswa)
                  </option>
                ))}
              </select>
            </div>

            {/* Print Side Selection */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPrintSide('both')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  printSide === 'both' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Depan & Belakang
              </button>
              <button
                type="button"
                onClick={() => setPrintSide('front')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  printSide === 'front' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Depan Saja
              </button>
              <button
                type="button"
                onClick={() => setPrintSide('back')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  printSide === 'back' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belakang Saja
              </button>
            </div>

            {/* Print Button */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500 font-semibold">
                Total: <strong>{filteredStudents.length}</strong> Kartu
              </span>
              <button
                type="button"
                id="btn-print-batch-now"
                onClick={handleExecutePrint}
                disabled={isGeneratingQr}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition active:scale-95 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>{isGeneratingQr ? 'Menyiapkan QR...' : 'Cetak Semua (Print)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Tips Cetak: Centang <strong>&quot;Background Graphics&quot;</strong> di jendela cetak printer. Setiap kartu berukuran standar CR80 dengan garis panduan potong.
            </span>
          </div>
        </div>

        {/* Scrollable Preview Grid (Print target) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* Print Header Header on Paper */}
          <div className="hidden print:block text-center mb-6 pb-2 border-b border-black">
            <h1 className="text-xl font-bold uppercase">{schoolName}</h1>
            <p className="text-xs font-semibold">LEMBAR PENCETAKAN MASSAL KARTU TANDA PELAJAR DIGITAL • SISTEM PRESENSI QR</p>
            <p className="text-[10px] text-gray-600">
              Kelas: {selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas} • Tahun Pelajaran {schoolYear} • Jumlah Siswa: {filteredStudents.length}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:m-0">
            {filteredStudents.map((student) => {
              const qrUrl = qrMap[student.nisn];

              return (
                <div
                  key={student.nisn}
                  className="space-y-2 break-inside-avoid page-break-inside-avoid print:mb-3"
                >
                  <div className="flex flex-col sm:flex-row print:flex-row gap-2 items-center justify-center">
                    {/* SISI DEPAN */}
                    {(printSide === 'both' || printSide === 'front') && (
                      <div className="w-[85.6mm] h-[53.98mm] rounded-xl border border-dashed border-slate-400 p-2.5 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0D1F2D] text-white relative overflow-hidden flex flex-col justify-between shrink-0 shadow-sm print:shadow-none [box-sizing:border-box]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/20 pb-1">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                              {schoolName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-[8px] uppercase tracking-wide truncate max-w-[170px] leading-none">
                                {schoolName}
                              </div>
                              <div className="text-[6.5px] text-emerald-400 font-bold tracking-wider leading-none mt-0.5">
                                KARTU TANDA PELAJAR DIGITAL
                              </div>
                            </div>
                          </div>
                          <span className="text-[6px] font-mono px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                            {schoolYear}
                          </span>
                        </div>

                        {/* Middle info */}
                        <div className="grid grid-cols-12 gap-1 items-center my-0.5">
                          <div className="col-span-3 text-center">
                            <div className="w-13 h-15 rounded bg-slate-800 border border-emerald-400/50 mx-auto flex flex-col items-center justify-center overflow-hidden">
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
                              <span className="text-[5.5px] text-slate-400 block uppercase">NAMA SISWA:</span>
                              <div className="font-extrabold text-[8.5px] text-white leading-none truncate">{student.nama}</div>
                            </div>
                            <div>
                              <span className="text-[5.5px] text-slate-400 block uppercase">NISN:</span>
                              <div className="font-mono font-bold text-emerald-300 text-[8px] leading-none">{student.nisn}</div>
                            </div>
                            <div className="text-[6.5px] text-slate-300 leading-none truncate">
                              Wali: <span className="text-white font-medium">{student.namaOrtu}</span>
                            </div>
                          </div>

                          <div className="col-span-3 text-center">
                            {qrUrl ? (
                              <img 
                                src={qrUrl} 
                                alt="QR" 
                                className="w-12 h-12 mx-auto bg-white p-0.5 rounded border border-emerald-400"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-white/20 mx-auto rounded flex items-center justify-center text-[6px]">
                                QR...
                              </div>
                            )}
                            <span className="text-[5.5px] font-mono text-emerald-300 block leading-none mt-0.5 font-bold">SCAN QR</span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/20 pt-0.5 flex justify-between items-center text-[5.5px] text-slate-300">
                          <span className="font-mono">TOKEN: {student.qrBadgeToken || `SISWA-${student.nisn}`}</span>
                          <span className="font-semibold text-right">Kepsek: {headMasterName}</span>
                        </div>
                      </div>
                    )}

                    {/* SISI BELAKANG */}
                    {(printSide === 'both' || printSide === 'back') && (
                      <div className="w-[85.6mm] h-[53.98mm] rounded-xl border border-dashed border-slate-400 p-2.5 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0A1128] text-white relative overflow-hidden flex flex-col justify-between shrink-0 shadow-sm print:shadow-none [box-sizing:border-box]">
                        <div className="border-b border-white/20 pb-0.5 flex justify-between items-center">
                          <span className="font-bold text-[7px] uppercase tracking-wider text-emerald-400">
                            KETENTUAN KARTU PRESENSI QR
                          </span>
                          <span className="text-[6px] font-mono text-slate-400">{schoolNpsn}</span>
                        </div>

                        <div className="space-y-0.5 text-[6px] text-slate-300 leading-tight my-0.5">
                          <div>1. Tanda pengenal resmi & instrumen presensi digital <strong>{schoolName}</strong>.</div>
                          <div>2. Wajib dibawa dan di-scan ke scanner gerbang saat datang & pulang sekolah.</div>
                          <div>3. Dilarang meminjamkan QR kepada orang lain (Anti-Titip Presensi).</div>
                          <div>4. Kerusakan/kehilangan kartu wajib lapor ke kesiswaan untuk cetak ulang.</div>
                        </div>

                        <div className="border-t border-white/20 pt-1 flex justify-between items-end text-[5.5px] text-slate-400">
                          <div>
                            <div className="text-[6px] text-white font-bold">{schoolAddress}, {schoolCity}</div>
                            <div>Kontak Presensi Ortu: {student.noHpOrtu}</div>
                          </div>
                          <div className="text-right font-mono">
                            NISN: {student.nisn}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden on Print) */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs print:hidden">
          <span className="text-slate-500 text-[11px]">
            Format cetak: A4 Landscape / Portrait bergaris potong putus-putus.
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleExecutePrint}
              disabled={isGeneratingQr}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Halaman Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
