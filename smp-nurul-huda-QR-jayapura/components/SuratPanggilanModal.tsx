'use client';

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Printer, 
  X, 
  Download, 
  Calendar, 
  UserCheck, 
  Building2, 
  Phone,
  AlertOctagon
} from 'lucide-react';
import { ConsecutiveAbsentAlert } from '@/lib/absence-detection';
import { SchoolProfile } from '@/types/attendance';
import { INITIAL_SCHOOL_PROFILE } from '@/lib/initial-data';
import { SchoolLogo } from './SchoolLogo';

interface SuratPanggilanModalProps {
  alert: ConsecutiveAbsentAlert;
  schoolProfile?: SchoolProfile;
  onClose: () => void;
}

export const SuratPanggilanModal: React.FC<SuratPanggilanModalProps> = ({
  alert,
  schoolProfile,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [printCode] = React.useState(() => `SPBK-${alert.siswa.nisn}-${Date.now().toString(36).toUpperCase()}`);

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Schedule visit 2 days from now (or next workday)
  const meetingDate = new Date();
  meetingDate.setDate(meetingDate.getDate() + 2);
  // If Sunday, move to Monday
  if (meetingDate.getDay() === 0) {
    meetingDate.setDate(meetingDate.getDate() + 1);
  }
  const meetingDateFormatted = meetingDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const nomorSurat = `421.3 / BK-0${alert.siswa.nisn.slice(-2)} / SMPNHJ / IX / 2026`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Container Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-4 max-h-[92vh]"
      >
        {/* Modal Top Bar (Screen Only) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Pratinjau Surat Panggilan Orang Tua (BK/TU)</h3>
              <p className="text-xs text-slate-300">Format Resmi Standar Dinas Pendidikan & SMP Nurul Huda Jayapura</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:p-0">
          <div 
            ref={printRef}
            className="bg-white max-w-[210mm] mx-auto p-8 sm:p-10 shadow-sm border border-slate-300 rounded-lg text-slate-900 font-serif leading-relaxed text-[12px] sm:text-[13px] print:shadow-none print:border-none print:p-0 print:m-0"
          >
            {/* KOP SURAT RESMI */}
            <div className="border-b-[3px] border-slate-900 pb-3 mb-1 text-center relative">
              <div className="flex items-center justify-between gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
                  <SchoolLogo 
                    profile={schoolProfile || INITIAL_SCHOOL_PROFILE} 
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-transparent flex items-center justify-center" 
                    iconClassName="w-20 h-20 sm:w-24 sm:h-24 text-emerald-800"
                  />
                </div>
                <div className="flex-1 text-center">
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 font-sans">
                    YAYASAN PENDIDIKAN ISLAM (YAPIS) DI TANAH PAPUA
                  </h4>
                  <h2 className="text-base sm:text-xl font-extrabold uppercase text-slate-950 font-sans tracking-wide">
                    {schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA'}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-700 font-sans mt-0.5">
                    NPSN: {schoolProfile?.npsn || '60302819'} • Terakreditasi B • NSS: 202256001004
                  </p>
                  <p className="text-[9.5px] sm:text-[11px] text-slate-600 font-sans">
                    {schoolProfile?.alamat || 'Jl. Percetakan Negara No. 45, Kel. Gurabesi, Distrik Jayapura Utara'}, {schoolProfile?.kota || 'Kota Jayapura'}, {schoolProfile?.provinsi || 'Papua'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans">
                    Email: smpnurulhuda.jayapura@gmail.com • Telp: (0967) 532189 • Kode Pos: 99111
                  </p>
                </div>
                <div className="w-20 hidden sm:block shrink-0" />
              </div>
            </div>
            {/* Double Border Divider */}
            <div className="border-b border-slate-900 mb-6" />

            {/* Letter Number and Subject */}
            <div className="flex justify-between items-start mb-6 font-sans text-xs">
              <div className="space-y-0.5">
                <div><span className="inline-block w-20 text-slate-600">Nomor</span>: <strong className="font-mono text-slate-900">{nomorSurat}</strong></div>
                <div><span className="inline-block w-20 text-slate-600">Lampiran</span>: 1 (satu) Berkas Rekap Presensi</div>
                <div><span className="inline-block w-20 text-slate-600">Perihal</span>: <strong>Panggilan Orang Tua / Wali Murid (Peringatan Kehadiran)</strong></div>
              </div>
              <div className="text-right">
                <span>Jayapura, {todayFormatted}</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="mb-5 font-sans text-xs leading-relaxed">
              <p>Kepada Yth.</p>
              <p className="font-bold text-slate-950">Bapak/Ibu Orang Tua / Wali dari: {alert.siswa.nama}</p>
              <p className="text-slate-700">di Tempat</p>
            </div>

            {/* Opening */}
            <div className="space-y-3 text-justify">
              <p className="font-semibold italic font-sans text-xs">
                Assalamu’alaikum Warahmatullahi Wabarakatuh,
              </p>
              <p>
                Dengan hormat, sehubungan dengan hasil evaluasi dan rekapitulasi data absensi elektronik SMP Nurul Huda Jayapura pada Tahun Pelajaran {schoolProfile?.tahunPelajaran || '2026/2027'}, kami memberitahukan bahwa siswa/siswi dengan identitas di bawah ini:
              </p>

              {/* Student Identity Card */}
              <div className="my-3 font-sans text-xs bg-slate-50 print:bg-transparent p-3 rounded-lg border border-slate-200">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-36 py-0.5 text-slate-600">Nama Siswa</td>
                      <td className="w-3 py-0.5">:</td>
                      <td className="py-0.5 font-bold text-slate-900">{alert.siswa.nama}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-600">NISN</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5 font-mono">{alert.siswa.nisn}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-600">Kelas / Jenjang</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5 font-semibold text-slate-900">{alert.siswa.kelas} (SMP)</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-600">Nama Orang Tua/Wali</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{alert.siswa.namaOrtu}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-600">No. WhatsApp/HP Wali</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5 font-mono">{alert.siswa.noHpOrtu}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-slate-600">Alamat Tempat Tinggal</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{alert.siswa.alamat || 'Kota Jayapura, Papua'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Telah <strong>tidak hadir di sekolah tanpa keterangan tertulis (Alpa) selama {alert.consecutiveDays} (tiga) hari berturut-turut</strong>, yaitu pada rincian tanggal berikut:
              </p>

              {/* Table of Missed Dates */}
              <div className="my-2 font-sans text-xs">
                <table className="w-full border-collapse border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-200">
                      <th className="border border-slate-300 px-3 py-1.5 text-center w-12">No</th>
                      <th className="border border-slate-300 px-3 py-1.5">Hari / Tanggal</th>
                      <th className="border border-slate-300 px-3 py-1.5">Sesi Masuk (06:30 - 07:30 WIT)</th>
                      <th className="border border-slate-300 px-3 py-1.5">Keterangan Sistem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alert.missedDates.map((item, idx) => (
                      <tr key={item.date} className="even:bg-slate-50/50">
                        <td className="border border-slate-300 px-3 py-1 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 px-3 py-1 font-semibold">{item.dayLabel}, {item.formattedDate}</td>
                        <td className="border border-slate-300 px-3 py-1 text-rose-600 font-bold">Tidak Melakukan Scan (Alpa)</td>
                        <td className="border border-slate-300 px-3 py-1 text-slate-600">Tidak ada surat dokter / izin tertulis</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p>
                Mengingat pentingnya kelangsungan proses belajar mengajar serta demi pembinaan kedisiplinan dan akhlak ananda di SMP Nurul Huda Jayapura, kami mengharapkan kehadiran Bapak/Ibu Orang Tua / Wali Murid pada:
              </p>

              {/* Meeting Details Card */}
              <div className="my-3 font-sans text-xs bg-slate-50 print:bg-transparent p-3.5 rounded-lg border border-slate-200 space-y-1">
                <div className="grid grid-cols-12 gap-1">
                  <span className="col-span-3 text-slate-600 font-medium">Hari / Tanggal</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-8 font-bold text-slate-900">{meetingDateFormatted}</span>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  <span className="col-span-3 text-slate-600 font-medium">Waktu / Pukul</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-8 font-bold text-slate-900">08:30 WIT s.d. Selesai</span>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  <span className="col-span-3 text-slate-600 font-medium">Tempat</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-8 text-slate-900">Ruang Bimbingan Konseling (BK) SMP Nurul Huda Jayapura</span>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  <span className="col-span-3 text-slate-600 font-medium">Menemui</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-8 font-semibold text-slate-900">Guru BK & Wali Kelas {alert.siswa.kelas}</span>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  <span className="col-span-3 text-slate-600 font-medium">Agenda</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-8 text-rose-700 font-semibold">Klarifikasi & Pembinaan Khusus Ketidakhadiran Siswa</span>
                </div>
              </div>

              <p>
                Demikian surat panggilan ini kami sampaikan. Mengingat pentingnya agenda ini demi masa depan pendidikan ananda, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang telah ditentukan. Atas perhatian, kerja sama, dan kehadiran Bapak/Ibu, kami sampaikan terima kasih.
              </p>

              <p className="font-semibold italic font-sans text-xs pt-1">
                Wassalamu’alaikum Warahmatullahi Wabarakatuh.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-8 pt-4 font-sans text-xs grid grid-cols-2 gap-8 text-center break-inside-avoid">
              <div>
                <p className="text-slate-600">Guru Bimbingan Konseling (BK),</p>
                <div className="h-16 sm:h-20" />
                <p className="font-bold underline text-slate-950">Dra. Sri Wahyuni, M.Pd.</p>
                <p className="text-[11px] text-slate-600">NIP. 19780315 200501 2 006</p>
              </div>

              <div>
                <p className="text-slate-600">Wali Kelas {alert.siswa.kelas},</p>
                <div className="h-16 sm:h-20" />
                <p className="font-bold underline text-slate-950">Budi Santoso, S.Kom.</p>
                <p className="text-[11px] text-slate-600">NIP. 19850912 201001 1 012</p>
              </div>

              <div className="col-span-2 text-center mt-2">
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-semibold text-slate-800">Kepala SMP Nurul Huda Jayapura</p>
                <div className="h-16 sm:h-20" />
                <p className="font-bold underline text-slate-950">{schoolProfile?.namaKepalaSekolah || 'Drs. H. Ahmad Fauzi, M.Pd.'}</p>
                <p className="text-[11px] text-slate-600">NIP. {schoolProfile?.nipKepalaSekolah || '19720512 199803 1 004'}</p>
              </div>
            </div>

            {/* Catatan Kaki Surat */}
            <div className="mt-6 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-sans italic flex justify-between items-center">
              <span>*) Surat ini dicetak otomatis melalui Sistem Absensi QR SMP Nurul Huda Jayapura.</span>
              <span>Kode Cetak: {printCode}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs print:hidden">
          <span className="text-slate-500">
            Tip: Gunakan opsi &quot;Save as PDF&quot; pada dialog cetak peramban untuk menyimpan arsip digital.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
