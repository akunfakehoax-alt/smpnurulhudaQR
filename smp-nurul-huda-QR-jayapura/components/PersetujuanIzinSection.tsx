'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { 
  HeartPulse, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  UserCheck, 
  Eye, 
  MessageSquare,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { PengajuanIzin, SchoolProfile } from '@/types/attendance';

interface PersetujuanIzinSectionProps {
  pengajuanList: PengajuanIzin[];
  onApprove: (id: string, catatanGuru?: string) => void;
  onReject: (id: string, catatanGuru: string) => void;
  schoolProfile?: SchoolProfile;
  teacherName?: string;
  availableClasses?: string[];
  initialKelas?: string;
}

export const PersetujuanIzinSection: React.FC<PersetujuanIzinSectionProps> = ({
  pengajuanList,
  onApprove,
  onReject,
  schoolProfile,
  teacherName = 'Dra. Sri Wahyuni (Guru Piket & BK)',
  availableClasses = [],
  initialKelas = 'SEMUA'
}) => {
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'>('MENUNGGU');
  const [userSelectedKelas, setUserSelectedKelas] = useState<string | null>(null);
  const [prevInitialKelas, setPrevInitialKelas] = useState<string>(initialKelas);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (initialKelas !== prevInitialKelas) {
    setPrevInitialKelas(initialKelas);
    setUserSelectedKelas(null);
  }

  const filterKelas = userSelectedKelas ?? initialKelas;
  const setFilterKelas = (k: string) => setUserSelectedKelas(k);
  
  // Modal for review action
  const [activeItem, setActiveItem] = useState<PengajuanIzin | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [catatanInput, setCatatanInput] = useState<string>('');
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const pendingCount = pengajuanList.filter(p => p.status === 'MENUNGGU').length;

  const filteredList = pengajuanList.filter(item => {
    if (filterStatus !== 'SEMUA' && item.status !== filterStatus) return false;
    if (filterKelas !== 'SEMUA' && item.kelas !== filterKelas) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNama = item.namaSiswa.toLowerCase().includes(q);
      const matchNisn = item.nisn.includes(q);
      const matchAlasan = item.alasan.toLowerCase().includes(q);
      if (!matchNama && !matchNisn && !matchAlasan) return false;
    }
    return true;
  });

  const handleOpenAction = (item: PengajuanIzin, type: 'APPROVE' | 'REJECT') => {
    setActiveItem(item);
    setActionType(type);
    setCatatanInput(
      type === 'APPROVE' 
        ? 'Disetujui. Surat keterangan sah & tercatat di sistem presensi.' 
        : 'Mohon maaf, pengajuan belum dapat disetujui karena surat keterangan dokter belum lengkap.'
    );
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !actionType) return;

    if (actionType === 'APPROVE') {
      onApprove(activeItem.id, catatanInput);
    } else {
      onReject(activeItem.id, catatanInput);
    }

    setActiveItem(null);
    setActionType(null);
    setCatatanInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30">
              Verifikasi & Validasi Kehadiran
            </span>
            <span className="text-xs text-teal-200">
              SMP Nurul Huda Jayapura
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight mt-1">Persetujuan Pengajuan Izin & Sakit Siswa</h3>
          <p className="text-xs text-teal-100 max-w-2xl mt-1 leading-relaxed">
            Tinjau permohonan ketidakhadiran yang diajukan oleh siswa atau orang tua. Permohonan yang disetujui otomatis masuk ke Log Presensi Resmi sebagai status Sakit atau Izin.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center">
            <span className="text-[11px] text-teal-200 block">Menunggu Konfirmasi</span>
            <span className="text-2xl font-black text-amber-300 font-mono">{pendingCount}</span>
            <span className="text-[10px] text-teal-200 block">Siswa</span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          {(['MENUNGGU', 'SEMUA', 'DISETUJUI', 'DITOLAK'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{st === 'SEMUA' ? 'Semua Status' : st === 'MENUNGGU' ? '⏳ Menunggu Verifikasi' : st === 'DISETUJUI' ? '🟢 Disetujui' : '🔴 Ditolak'}</span>
              {st === 'MENUNGGU' && pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter Kelas */}
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-xs text-slate-800"
          >
            <option value="SEMUA">Semua Kelas</option>
            {(availableClasses.length > 0 ? availableClasses : ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B']).map(k => (
              <option key={k} value={k}>Kelas {k}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / NISN / alasan..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-48 lg:w-60"
            />
          </div>
        </div>
      </div>

      {/* List Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <h5 className="font-bold text-slate-700 text-sm">Tidak ada permohonan dalam kriteria ini.</h5>
            <p className="text-xs text-slate-500">Semua permohonan izin/sakit sudah ditindaklanjuti atau belum ada yang diajukan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => (
              <div 
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                {/* Left: Info Siswa & Pengajuan */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center space-x-1 ${
                      item.kategori === 'SAKIT'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}>
                      {item.kategori === 'SAKIT' ? <HeartPulse className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      <span>{item.kategori === 'SAKIT' ? 'SURAT SAKIT' : 'SURAT IZIN'}</span>
                    </span>

                    <span className="font-bold text-sm text-slate-900">{item.namaSiswa}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                      {item.kelas}
                    </span>
                    <span className="text-slate-400 font-mono">NISN: {item.nisn}</span>

                    <span className={`ml-auto lg:ml-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'DISETUJUI'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.status === 'DITOLAK'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    }`}>
                      {item.status === 'DISETUJUI' ? '🟢 DISETUJUI' :
                       item.status === 'DITOLAK' ? '🔴 DITOLAK' : '🟡 MENUNGGU PERSETUJUAN'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Alasan: </strong>
                    {item.alasan}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Rentang: <strong>{item.tanggalMulai === item.tanggalSelesai ? item.tanggalMulai : `${item.tanggalMulai} s.d. ${item.tanggalSelesai}`}</strong></span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Diajukan: {item.diajukanPada}</span>
                    </div>

                    {item.lampiranUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImg(item.lampiranUrl || null)}
                        className="text-teal-700 font-bold hover:underline flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti Foto/Surat</span>
                      </button>
                    ) : item.lampiranNama ? (
                      <span className="italic text-slate-400">Lampiran: {item.lampiranNama}</span>
                    ) : null}
                  </div>

                  {item.catatanGuru && (
                    <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-[11px] text-teal-900">
                      <strong className="block text-teal-950">Catatan Konfirmasi Guru:</strong>
                      <p>{item.catatanGuru}</p>
                      {item.petugas && (
                        <span className="text-[10px] text-teal-700 block mt-0.5">Petugas: {item.petugas} ({item.disetujuiPada || ''})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                  {item.status === 'MENUNGGU' ? (
                    <>
                      <button
                        onClick={() => handleOpenAction(item, 'APPROVE')}
                        className="flex-1 lg:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui Permohonan</span>
                      </button>

                      <button
                        onClick={() => handleOpenAction(item, 'REJECT')}
                        className="flex-1 lg:flex-none px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenAction(item, item.status === 'DISETUJUI' ? 'REJECT' : 'APPROVE')}
                      className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 font-medium transition"
                    >
                      Ubah Status
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {activeItem && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900">
                {actionType === 'APPROVE' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <h4 className="font-bold text-base">
                  {actionType === 'APPROVE' ? 'Setujui Pengajuan Izin/Sakit' : 'Tolak Pengajuan Izin/Sakit'}
                </h4>
              </div>
              <button 
                onClick={() => { setActiveItem(null); setActionType(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm">{activeItem.namaSiswa}</div>
                <div className="text-slate-500 font-mono">NISN: {activeItem.nisn} • {activeItem.kelas}</div>
                <div className="text-slate-700">Kategori: <strong>{activeItem.kategori}</strong> ({activeItem.tanggalMulai})</div>
                <div className="text-slate-600 italic mt-1">&quot;{activeItem.alasan}&quot;</div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Catatan Guru Piket / BK:
                </label>
                <textarea
                  rows={3}
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-800 text-[11px] leading-relaxed">
                {actionType === 'APPROVE' ? (
                  <span>
                    ✓ Menyetujui pengajuan ini akan secara otomatis menambahkan data kehadiran berstatus <strong>{activeItem.kategori}</strong> pada rekap presensi siswa untuk tanggal {activeItem.tanggalMulai}.
                  </span>
                ) : (
                  <span>
                    ✕ Pengajuan akan ditandai Ditolak dan siswa akan diberitahu alasannya. Siswa akan dihitung Alpa jika tidak hadir tanpa keterangan pengganti.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setActiveItem(null); setActionType(null); }}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold shadow-sm ${
                    actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionType === 'APPROVE' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <div 
          onClick={() => setPreviewImg(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-4 rounded-2xl max-w-lg w-full text-center space-y-3"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h5 className="font-bold text-xs text-slate-800">Lampiran Bukti Dokumen</h5>
              <button 
                onClick={() => setPreviewImg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <img 
              src={previewImg} 
              alt="Lampiran Dokumen" 
              className="max-h-[60vh] mx-auto object-contain rounded-lg border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
