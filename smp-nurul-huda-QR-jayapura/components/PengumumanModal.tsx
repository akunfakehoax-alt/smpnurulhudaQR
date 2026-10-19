'use client';

import React, { useState } from 'react';
import { 
  Megaphone, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Pin, 
  Filter, 
  Send, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { PengumumanSekolah } from '@/types/attendance';

interface PengumumanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPengumuman: (item: PengumumanSekolah) => void;
  authorName?: string;
  availableClasses?: string[];
}

export const PengumumanModal: React.FC<PengumumanModalProps> = ({
  isOpen,
  onClose,
  onAddPengumuman,
  authorName = 'Admin / Kepala Sekolah',
  availableClasses = ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B']
}) => {
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [kategori, setKategori] = useState<PengumumanSekolah['kategori']>('PENTING');
  const [targetKelas, setTargetKelas] = useState('SEMUA');
  const [isPinned, setIsPinned] = useState(false);
  const [penulis, setPenulis] = useState(authorName);
  const [badge, setBadge] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !isi.trim()) {
      alert('Judul dan isi pengumuman wajib diisi!');
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newPengumuman: PengumumanSekolah = {
      id: `PENG-${Date.now().toString(36).toUpperCase()}`,
      judul: judul.trim(),
      isi: isi.trim(),
      kategori,
      targetKelas,
      isPinned,
      penulis: penulis.trim() || 'Admin Sekolah',
      tanggal: todayStr,
      waktu: timeStr,
      badge: badge.trim() || undefined
    };

    onAddPengumuman(newPengumuman);
    onClose();

    // Reset form
    setJudul('');
    setIsi('');
    setKategori('PENTING');
    setTargetKelas('SEMUA');
    setIsPinned(false);
    setBadge('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Buat Pengumuman Sekolah Baru
              </h3>
              <p className="text-xs text-slate-500">
                Akan muncul secara real-time di Papan Pengumuman portal setiap siswa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Judul Pengumuman <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Ketentuan Penilaian Tengah Semester (PTS) Ganjil..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
              >
                <option value="PENTING">PENTING (Darurat)</option>
                <option value="KEDISIPLINAN">KEDISIPLINAN</option>
                <option value="AKADEMIK">AKADEMIK</option>
                <option value="KEGIATAN">KEGIATAN</option>
                <option value="UMUM">UMUM</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Kelas</label>
              <select
                value={targetKelas}
                onChange={(e) => setTargetKelas(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
              >
                <option value="SEMUA">Semua Siswa</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Isi Pengumuman <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder="Tuliskan pesan lengkap atau informasi yang ingin disampaikan kepada siswa dan orang tua..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Penulis / Instansi</label>
              <input
                type="text"
                value={penulis}
                onChange={(e) => setPenulis(e.target.value)}
                placeholder="Contoh: Kepala Sekolah / Tim BK"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Label Khusus (Opsional)</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Contoh: WAJIB, SEGERA, RESMI"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pin className="w-4 h-4 text-amber-700" />
              <div>
                <span className="font-bold text-amber-950 block">Sematkan di Paling Atas (Pin)</span>
                <span className="text-[11px] text-amber-800">Akan selalu tampil di urutan pertama papan pengumuman siswa</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-700 hover:bg-sky-800 active:scale-95 text-white font-bold rounded-xl flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publikasikan Pengumuman</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
