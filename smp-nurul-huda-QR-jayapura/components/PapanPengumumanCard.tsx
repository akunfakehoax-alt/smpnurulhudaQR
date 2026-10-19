'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Pin, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  Filter, 
  PlusCircle, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Megaphone,
  X,
  ExternalLink,
  BookOpen,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { PengumumanSekolah, User as UserType } from '@/types/attendance';

interface PapanPengumumanCardProps {
  pengumumanList: PengumumanSekolah[];
  currentUser?: UserType;
  targetKelas?: string;
  onOpenCreateModal?: () => void;
  onDeletePengumuman?: (id: string) => void;
}

export const PapanPengumumanCard: React.FC<PapanPengumumanCardProps> = ({
  pengumumanList,
  currentUser,
  targetKelas = 'SEMUA',
  onOpenCreateModal,
  onDeletePengumuman
}) => {
  const [selectedKategori, setSelectedKategori] = useState<string>('SEMUA');
  const [activePengumuman, setActivePengumuman] = useState<PengumumanSekolah | null>(null);

  // Filter announcements by target class and category
  const filteredList = pengumumanList.filter(item => {
    const matchKelas = item.targetKelas === 'SEMUA' || item.targetKelas === targetKelas;
    const matchKategori = selectedKategori === 'SEMUA' || item.kategori === selectedKategori;
    return matchKelas && matchKategori;
  });

  // Sort pinned first, then newest date
  const sortedList = [...filteredList].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return `${b.tanggal} ${b.waktu}`.localeCompare(`${a.tanggal} ${a.waktu}`);
  });

  const getKategoriBadge = (kategori: PengumumanSekolah['kategori']) => {
    switch (kategori) {
      case 'PENTING':
        return { bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle };
      case 'KEDISIPLINAN':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: ShieldAlert };
      case 'AKADEMIK':
        return { bg: 'bg-sky-100 text-sky-800 border-sky-200', icon: BookOpen };
      case 'KEGIATAN':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Compass };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: Bell };
    }
  };

  const isAdminOrGuru = currentUser?.role === 'ADMIN' || currentUser?.role === 'GURU';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-base sm:text-lg tracking-tight">
                Papan Pengumuman Sekolah
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
                <span>Live Update</span>
              </span>
            </div>
            <p className="text-xs text-sky-200/90">
              Informasi resmi dari Kepala Sekolah, Kesiswaan, dan Wali Kelas SMP Nurul Huda Jayapura
            </p>
          </div>
        </div>

        {/* Action Button for Admin / Guru */}
        {isAdminOrGuru && onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Posting Pengumuman</span>
          </button>
        )}
      </div>

      {/* Categories Filter Strip */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex items-center space-x-1.5 overflow-x-auto text-xs no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        {['SEMUA', 'PENTING', 'KEDISIPLINAN', 'AKADEMIK', 'KEGIATAN', 'UMUM'].map(kat => (
          <button
            key={kat}
            type="button"
            onClick={() => setSelectedKategori(kat)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition shrink-0 cursor-pointer ${
              selectedKategori === kat
                ? 'bg-sky-800 text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
        {sortedList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Belum ada pengumuman pada kategori ini</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Pengumuman baru akan otomatis muncul secara real-time</p>
          </div>
        ) : (
          sortedList.map(item => {
            const badge = getKategoriBadge(item.kategori);
            const Icon = badge.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActivePengumuman(item)}
                className={`p-4 hover:bg-slate-50/80 transition cursor-pointer group flex items-start gap-3.5 ${
                  item.isPinned ? 'bg-amber-50/30' : ''
                }`}
              >
                {/* Pin or Category Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  item.isPinned ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {item.isPinned ? <Pin className="w-4 h-4 fill-amber-700" /> : <Icon className="w-4 h-4" />}
                </div>

                {/* Content preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 mb-1">
                    {item.isPinned && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider flex items-center space-x-1">
                        <Pin className="w-2.5 h-2.5 fill-slate-950" />
                        <span>DISEMATKAN</span>
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                      {item.kategori}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono ml-auto">
                      {item.tanggal} • {item.waktu} WIT
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-800 transition line-clamp-1">
                    {item.judul}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {item.isi}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{item.penulis}</span>
                    </span>

                    <span className="text-sky-700 font-semibold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition">
                      <span>Baca Selengkapnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail Pengumuman */}
      <AnimatePresence>
        {activePengumuman && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-6"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                      {activePengumuman.kategori}
                    </span>
                    {activePengumuman.isPinned && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 flex items-center space-x-1">
                        <Pin className="w-2.5 h-2.5 fill-slate-950" />
                        <span>DISEMATKAN</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {activePengumuman.judul}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePengumuman(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Meta bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pengirim:</span>
                  <strong className="text-slate-800">{activePengumuman.penulis}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Publikasi:</span>
                  <span className="font-mono text-slate-700">{activePengumuman.tanggal} pukul {activePengumuman.waktu} WIT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Siswa:</span>
                  <span className="font-bold text-sky-800">
                    {activePengumuman.targetKelas === 'SEMUA' ? 'Seluruh Siswa (Kelas VII, VIII, IX)' : `Kelas ${activePengumuman.targetKelas}`}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-2 whitespace-pre-line max-h-64 overflow-y-auto">
                {activePengumuman.isi}
              </div>

              {/* Lampiran if any */}
              {activePengumuman.lampiranNama && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>Lampiran: <strong>{activePengumuman.lampiranNama}</strong></span>
                  </div>
                  <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded">
                    Resmi Sekolah
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {isAdminOrGuru && onDeletePengumuman ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Hapus pengumuman ini?')) {
                        onDeletePengumuman(activePengumuman.id);
                        setActivePengumuman(null);
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                  >
                    Hapus Pengumuman
                  </button>
                ) : <span />}

                <button
                  type="button"
                  onClick={() => setActivePengumuman(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
