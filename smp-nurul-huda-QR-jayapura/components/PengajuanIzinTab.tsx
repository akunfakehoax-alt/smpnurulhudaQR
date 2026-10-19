'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { 
  HeartPulse, 
  FileText, 
  Calendar, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  X, 
  Eye, 
  Send,
  Sparkles,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Siswa, PengajuanIzin, SchoolProfile } from '@/types/attendance';

interface PengajuanIzinTabProps {
  student: Siswa;
  schoolProfile?: SchoolProfile;
  pengajuanList: PengajuanIzin[];
  onSubmitPengajuan: (pengajuan: PengajuanIzin) => void;
}

export const PengajuanIzinTab: React.FC<PengajuanIzinTabProps> = ({
  student,
  schoolProfile,
  pengajuanList,
  onSubmitPengajuan
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [kategori, setKategori] = useState<'SAKIT' | 'IZIN'>('SAKIT');
  const [tanggalMulai, setTanggalMulai] = useState<string>(todayStr);
  const [tanggalSelesai, setTanggalSelesai] = useState<string>(todayStr);
  const [alasan, setAlasan] = useState<string>('');
  const [lampiranUrl, setLampiranUrl] = useState<string>('');
  const [lampiranNama, setLampiranNama] = useState<string>('');
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Student's own submissions
  const mySubmissions = pengajuanList.filter(p => p.nisn === student.nisn);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLampiranNama(file.name);
    // Convert image to data url for preview
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLampiranUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasan.trim()) return;

    const timeZone = schoolProfile?.zonaWaktu || 'WIT';
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newPengajuan: PengajuanIzin = {
      id: `IZIN-${Date.now().toString(36).toUpperCase()}`,
      nisn: student.nisn,
      namaSiswa: student.nama,
      kelas: student.kelas,
      kategori,
      tanggalMulai,
      tanggalSelesai,
      alasan: alasan.trim(),
      lampiranUrl: lampiranUrl || undefined,
      lampiranNama: lampiranNama || (kategori === 'SAKIT' ? 'Surat_Keterangan_Sakit.jpg' : 'Surat_Izin_Ortu.pdf'),
      status: 'MENUNGGU',
      diajukanPada: `${todayStr} ${nowTimeStr} ${timeZone}`
    };

    onSubmitPengajuan(newPengajuan);

    setSubmitSuccess(`Pengajuan ${kategori === 'SAKIT' ? 'Sakit' : 'Izin'} berhasil dikirim ke Guru Piket/BK SMP Nurul Huda Jayapura.`);
    setAlasan('');
    setLampiranUrl('');
    setLampiranNama('');

    setTimeout(() => {
      setSubmitSuccess(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
              Layanan Online Siswa & Wali Murid
            </span>
            <span className="text-xs text-emerald-300">
              Zona Waktu: <strong>{schoolProfile?.zonaWaktu || 'WIT'}</strong>
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight">Pengajuan Izin & Sakit Elektronik</h3>
          <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
            Siswa yang berhalangan hadir ke sekolah (sakit atau memiliki izin keluarga) wajib mengajukan pemberitahuan sebelum pukul 07:00 {schoolProfile?.zonaWaktu || 'WIT'}. Lampirkan foto surat dokter atau keterangan orang tua agar langsung diverifikasi oleh Guru Piket & BK.
          </p>
        </div>

        <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center text-xs">
          <span className="text-emerald-200 block text-[11px]">Pengajuan Saya</span>
          <span className="text-2xl font-black text-white">{mySubmissions.length}</span>
          <span className="text-[10px] text-emerald-300 block">Total Pengajuan</span>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Main Grid: Form Left, History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Pengajuan (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Formulir Pengajuan Izin / Sakit</h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {student.nama} ({student.kelas})
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Kategori Pilihan */}
            <div>
              <label className="block text-slate-700 font-bold mb-2">
                Pilih Kategori Ketidakhadiran:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKategori('SAKIT')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center space-x-3 ${
                    kategori === 'SAKIT'
                      ? 'border-purple-500 bg-purple-50/70 text-purple-900 ring-2 ring-purple-400/30 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    kategori === 'SAKIT' ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">🏥 Sakit</span>
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Demam, flu, opname, rawat jalan
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setKategori('IZIN')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center space-x-3 ${
                    kategori === 'IZIN'
                      ? 'border-sky-500 bg-sky-50/70 text-sky-900 ring-2 ring-sky-400/30 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    kategori === 'IZIN' ? 'bg-sky-200 text-sky-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">📝 Izin Resmi</span>
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Acara keluarga, duka, dinas luar
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Rentang Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mulai Tanggal:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Sampai Tanggal:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    min={tanggalMulai}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Alasan / Keterangan */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Keterangan / Alasan Lengkap:
              </label>
              <textarea
                rows={3}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder={
                  kategori === 'SAKIT'
                    ? 'Contoh: Ananda demam tinggi sejak kemarin sore, sudah diperiksakan ke Puskesmas Jayapura Utara dan diminta istirahat 2 hari.'
                    : 'Contoh: Mengikuti acara keluarga di Sentani bersama orang tua.'
                }
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Upload Bukti Surat */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Lampiran Bukti (Foto Surat Dokter / Surat Izin Orang Tua):
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="lampiran-file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="lampiran-file" className="cursor-pointer block space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-800 hover:underline">
                      Pilih Foto / Dokumen dari Perangkat
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Format JPG, PNG, atau PDF (maks. 5MB)
                    </p>
                  </div>
                </label>

                {lampiranNama && (
                  <div className="mt-3 p-2 bg-emerald-100/70 border border-emerald-200 rounded-xl flex items-center justify-between text-left text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-semibold text-emerald-900 truncate">{lampiranNama}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLampiranNama('');
                        setLampiranUrl('');
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Permohonan Izin / Sakit Sekarang</span>
            </button>
          </form>
        </div>

        {/* History / Daftar Pengajuan (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Riwayat Pengajuan Saya</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                {mySubmissions.length} Data
              </span>
            </div>

            {mySubmissions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Belum ada riwayat pengajuan izin/sakit.</p>
                <p className="text-[11px] text-slate-400">
                  Gunakan formulir di samping jika Anda berhalangan hadir.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                {mySubmissions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        item.kategori === 'SAKIT'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {item.kategori === 'SAKIT' ? '🏥 SAKIT' : '📝 IZIN'}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'DISETUJUI'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'DITOLAK'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {item.status === 'DISETUJUI' ? '🟢 DISETUJUI' :
                         item.status === 'DITOLAK' ? '🔴 DITOLAK' : '🟡 MENUNGGU'}
                      </span>
                    </div>

                    <div className="text-slate-800 font-medium">
                      {item.alasan}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {item.tanggalMulai === item.tanggalSelesai
                          ? item.tanggalMulai
                          : `${item.tanggalMulai} s.d. ${item.tanggalSelesai}`}
                      </span>
                    </div>

                    {/* Lampiran preview button */}
                    {item.lampiranUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewModalImg(item.lampiranUrl || null)}
                        className="text-[11px] text-teal-700 font-semibold hover:underline flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Lihat Lampiran ({item.lampiranNama})</span>
                      </button>
                    ) : item.lampiranNama ? (
                      <span className="text-[11px] text-slate-500 italic block">
                        Lampiran: {item.lampiranNama}
                      </span>
                    ) : null}

                    {/* Teacher's note if available */}
                    {item.catatanGuru && (
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                        <span className="font-bold text-slate-900 block">Catatan Guru Piket/BK:</span>
                        <p>{item.catatanGuru}</p>
                        {item.petugas && (
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            Oleh: {item.petugas}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Ketentuan Presensi SMP Nurul Huda Jayapura:</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Setelah pengajuan disetujui Guru Piket atau BK, sistem absensi secara otomatis mencatatkan kehadiran Anda sebagai status <strong>SAKIT</strong> atau <strong>IZIN</strong> di log presensi resmi sekolah tanpa dihitung Alpa.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Preview Lampiran Gambar */}
      {previewModalImg && (
        <div 
          onClick={() => setPreviewModalImg(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-4 rounded-2xl max-w-lg w-full text-center space-y-3"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h5 className="font-bold text-xs text-slate-800">Lampiran Dokumen Pengajuan</h5>
              <button 
                onClick={() => setPreviewModalImg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <img 
              src={previewModalImg} 
              alt="Lampiran" 
              className="max-h-[60vh] mx-auto object-contain rounded-lg border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
