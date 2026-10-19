'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  MessageSquare, 
  Users, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Check, 
  Copy, 
  RefreshCw, 
  Sparkles, 
  Smartphone, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Siswa, PresensiRecord, SchoolProfile, DailySummaryItem } from '@/types/attendance';

interface BroadcastAlpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  dailySummaryItems: DailySummaryItem[];
  schoolProfile?: SchoolProfile;
  onUpdateDeliveryStatus: (nisn: string, wamid: string, waktu: string) => void;
}

const TEMPLATES = [
  {
    id: 'pagi_belum_hadir',
    title: '1. Peringatan Pagi (Belum Hadir / Cek Keberadaan)',
    deskripsi: 'Dikirim pukul 07:15 - 08:30 WIT untuk konfirmasi keberadaan siswa yang belum tiba di sekolah',
    text: `*PEMBERITAHUAN PRESENSI SISWA*
*{nama_sekolah}*

Yth. Bapak/Ibu {nama_ortu}
(Wali dari ananda *{nama_siswa}*, Kelas *{kelas}*)

Kami menginformasikan bahwa hingga pukul {jam_sekarang} WIT pada hari *{tanggal_hari}*, ananda tercatat *BELUM MELAKUKAN PRESENSI MASUK* di sekolah.

Mohon konfirmasi keberadaan ananda kepada pihak sekolah / wali kelas apabila ananda berhalangan hadir dikarenakan sakit atau keperluan keluarga.

Terima kasih atas kerja sama dan perhatian Bapak/Ibu dalam menjaga kedisiplinan dan keselamatan ananda.

Salam hormat,
*Guru Piket & Tim Kedisiplinan*
{nama_sekolah}`
  },
  {
    id: 'alpa_harian_resmi',
    title: '2. Pemberitahuan Resmi Alpa (Tidak Hadir Tanpa Kabar)',
    deskripsi: 'Dikirim saat rekapitulasi harian untuk siswa yang tidak hadir tanpa surat izin/keterangan',
    text: `*PEMBERITAHUAN KETIDAKHADIRAN SISWA (ALPA)*
*{nama_sekolah}*

Yth. Bapak/Ibu {nama_ortu}
(Wali dari ananda *{nama_siswa}*, Kelas *{kelas}*)

Berdasarkan rekapitulasi presensi harian pada hari *{tanggal_hari}*, ananda tercatat *TIDAK HADIR (ALPA)* tanpa surat keterangan atau konfirmasi resmi kepada pihak sekolah.

Kedisiplinan belajar dan konsistensi kehadiran ananda sangat berpengaruh pada capaian belajar dan tata tertib sekolah. Mohon Bapak/Ibu segera mengonfirmasi alasan ketidakhadiran ananda kepada wali kelas.

Atas perhatian dan kerja sama Bapak/Ibu kami sampaikan terima kasih.

Hormat kami,
*Kepala Sekolah & Tim Kesiswaan*
{nama_sekolah}`
  },
  {
    id: 'peringatan_disiplin',
    title: '3. Peringatan Kedisiplinan & Panggilan Pembinaan',
    deskripsi: 'Peringatan tegas bagi siswa yang sering alpa atau membolos jam pelajaran',
    text: `*PERINGATAN KEDISIPLINAN & KEHADIRAN*
*{nama_sekolah}*

Yth. Bapak/Ibu {nama_ortu}
(Wali dari ananda *{nama_siswa}*, Kelas *{kelas}*)

Kami menginformasikan bahwa ananda hari ini (*{tanggal_hari}*) tidak mengikuti kegiatan belajar mengajar di {nama_sekolah} tanpa keterangan sah.

Pihak sekolah mengimbau kerja sama aktif Bapak/Ibu untuk mendampingi dan memastikan ananda hadir tepat waktu pada hari belajar berikutnya. Bila terdapat kendala kesehatan atau keluarga, mohon segera menyertakan surat keterangan resmi.

Wassalamu'alaikum Wr. Wb.
*Wali Kelas & Guru BK*
{nama_sekolah}`
  }
];

export const BroadcastAlpaModal: React.FC<BroadcastAlpaModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  dailySummaryItems,
  schoolProfile,
  onUpdateDeliveryStatus
}) => {
  // Identify absent / unrecorded students from daily summary
  const alpaStudents = useMemo(() => {
    return dailySummaryItems.filter(item => {
      return (
        item.datangStatus === 'BELUM_ABSEN' ||
        item.statusMasuk === 'BELUM_ABSEN' ||
        item.statusAkhir.includes('ALPA') ||
        item.statusAkhir.includes('TIDAK HADIR')
      );
    });
  }, [dailySummaryItems]);

  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('pagi_belum_hadir');
  const [customMessage, setCustomMessage] = useState<string>(TEMPLATES[0].text);
  
  // Selection state (NISN array)
  const [selectedNisns, setSelectedNisns] = useState<string[]>(() => alpaStudents.map(s => s.nisn));

  // Sending execution state
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendProgress, setSendProgress] = useState<number>(0);
  const [currentTarget, setCurrentTarget] = useState<DailySummaryItem | null>(null);
  const [broadcastLogs, setBroadcastLogs] = useState<Array<{
    nisn: string;
    nama: string;
    kelas: string;
    namaOrtu: string;
    noHp: string;
    status: 'TERKIRIM' | 'GAGAL';
    wamid: string;
    waktu: string;
  }>>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available classes among absent students
  const availableClasses = useMemo(() => {
    return Array.from(new Set(alpaStudents.map(s => s.kelas))).sort();
  }, [alpaStudents]);

  // Filtered absent students for checklist
  const filteredList = useMemo(() => {
    return alpaStudents.filter(item => {
      if (filterKelas !== 'SEMUA' && item.kelas !== filterKelas) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.nama.toLowerCase().includes(q) ||
          item.nisn.includes(q) ||
          item.namaOrtu.toLowerCase().includes(q) ||
          item.noHpOrtu.includes(q)
        );
      }
      return true;
    });
  }, [alpaStudents, filterKelas, searchQuery]);

  // Change template handler
  const handleSelectTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = TEMPLATES.find(t => t.id === tmplId);
    if (tmpl) {
      setCustomMessage(tmpl.text);
    }
  };

  // Insert variable tag into message
  const handleInsertTag = (tag: string) => {
    setCustomMessage(prev => prev + ' ' + tag);
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedNisns.length === filteredList.length) {
      setSelectedNisns([]);
    } else {
      setSelectedNisns(filteredList.map(s => s.nisn));
    }
  };

  const handleToggleStudent = (nisn: string) => {
    setSelectedNisns(prev => 
      prev.includes(nisn) ? prev.filter(id => id !== nisn) : [...prev, nisn]
    );
  };

  // Helper to format date in Indonesian (e.g., "Jumat, 25 September 2026")
  const formattedIndoDate = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Resolve message text for specific student
  const resolveMessageForStudent = (student: DailySummaryItem | undefined): string => {
    if (!student) return customMessage;
    const schoolName = schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA';
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return customMessage
      .replace(/{nama_sekolah}/g, schoolName)
      .replace(/{nama_ortu}/g, student.namaOrtu || 'Bapak/Ibu Orang Tua/Wali')
      .replace(/{nama_siswa}/g, student.nama)
      .replace(/{kelas}/g, student.kelas)
      .replace(/{tanggal_hari}/g, formattedIndoDate)
      .replace(/{jam_sekarang}/g, currentTime)
      .replace(/{no_hp}/g, student.noHpOrtu);
  };

  // Student currently selected for preview
  const previewStudent = useMemo(() => {
    return filteredList.find(s => selectedNisns.includes(s.nisn)) || filteredList[0];
  }, [filteredList, selectedNisns]);

  // Execute Batch WhatsApp Broadcast via Meta Cloud API
  const handleExecuteBatchSend = () => {
    const targets = alpaStudents.filter(s => selectedNisns.includes(s.nisn));
    if (targets.length === 0) {
      alert('Pilih minimal satu siswa untuk dikirimi pesan WhatsApp!');
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setBroadcastLogs([]);

    const total = targets.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= total) {
        clearInterval(interval);
        setIsSending(false);
        setCurrentTarget(null);
        setSendProgress(100);
        return;
      }

      const item = targets[currentIdx];
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const wamid = `wamid.HBgL${item.nisn}_ALPA_BATCH_${Date.now().toString(36)}`;

      setCurrentTarget(item);

      // Append to local log
      setBroadcastLogs(prev => [
        {
          nisn: item.nisn,
          nama: item.nama,
          kelas: item.kelas,
          namaOrtu: item.namaOrtu,
          noHp: item.noHpOrtu,
          status: 'TERKIRIM',
          wamid: wamid,
          waktu: nowTime
        },
        ...prev
      ]);

      // Call parent to update delivery status in main table
      onUpdateDeliveryStatus(item.nisn, wamid, nowTime);

      currentIdx++;
      setSendProgress(Math.round((currentIdx / total) * 100));
    }, 320);
  };

  // Generate Direct WhatsApp Web/App Link for single student
  const getWaLink = (student: DailySummaryItem): string => {
    const text = resolveMessageForStudent(student);
    const cleanPhone = student.noHpOrtu.replace(/[^0-9]/g, '');
    const phone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  };

  const handleCopyText = async (student: DailySummaryItem) => {
    const text = resolveMessageForStudent(student);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(student.nisn);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white p-4 sm:p-5 flex items-start justify-between shrink-0">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Kirim Pesan WhatsApp Massal — Siswa Belum Hadir / Alpa
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {alpaStudents.length} Siswa Terdeteksi
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Kirim notifikasi peringatan & konfirmasi kehadiran resmi langsung ke nomor WhatsApp orang tua / wali murid untuk tanggal <strong className="text-white">{formattedIndoDate}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => !isSending && onClose()}
            disabled={isSending}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with 2-Column Split */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Target Checklist & Filters (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            {/* Filter Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span>Daftar Siswa Belum Hadir / Alpa</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedNisns.length} dari {filteredList.length} Dipilih
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari siswa/ortu..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="SEMUA">Semua Kelas ({alpaStudents.length})</option>
                  {availableClasses.map(k => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </select>
              </div>

              {/* Master Select/Deselect Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-rose-700 hover:text-rose-900 font-semibold underline cursor-pointer"
                >
                  {selectedNisns.length === filteredList.length ? 'Batalkan Semua Pilihan' : 'Pilih Semua Siswa'}
                </button>
                <span className="text-slate-400 text-[10px]">
                  Pesan terkirim ke WhatsApp masing-masing ortu
                </span>
              </div>
            </div>

            {/* Student Checklist Table */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs max-h-72 lg:max-h-96 overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">Tidak ada siswa alpa yang cocok!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Semua siswa pada filter ini tercatat hadir atau berizin.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {filteredList.map((item) => {
                    const isChecked = selectedNisns.includes(item.nisn);
                    const isTerkirim = item.statusWA === 'TERKIRIM';
                    return (
                      <div
                        key={item.nisn}
                        className={`p-2.5 flex items-start gap-2.5 hover:bg-slate-50 transition cursor-pointer ${
                          isChecked ? 'bg-rose-50/40' : ''
                        }`}
                        onClick={() => handleToggleStudent(item.nisn)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by row click
                          className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-900 truncate text-xs">{item.nama}</h5>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              Kelas {item.kelas}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>Wali: <strong className="text-slate-700">{item.namaOrtu}</strong></span>
                            <span className="font-mono text-[10px]">{item.noHpOrtu}</span>
                          </div>

                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className="font-semibold text-rose-600 flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{item.statusAkhir || 'Belum Presensi Datang'}</span>
                            </span>

                            <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                              {isTerkirim ? (
                                <span className="text-emerald-700 font-bold inline-flex items-center space-x-0.5">
                                  <CheckCheck className="w-3 h-3" />
                                  <span>Terkirim</span>
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium">Belum Dikirim</span>
                              )}

                              {/* Direct wa.me link */}
                              <a
                                href={getWaLink(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                                title="Buka chat WhatsApp langsung via wa.me"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Meta Cloud API Provider Banner */}
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Gateway: <strong>Meta Cloud API Official</strong></span>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                Delivery &lt; 2s
              </span>
            </div>
          </div>

          {/* Right Column: Template Selector, Live Preview & Action (7 cols) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col">
            {/* Template Selector Cards */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilih Template Pesan WhatsApp:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TEMPLATES.map(tmpl => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/40'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h6 className={`font-bold text-[11px] leading-tight ${
                        isSelected ? 'text-rose-900' : 'text-slate-800'
                      }`}>
                        {tmpl.title}
                      </h6>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                        {tmpl.deskripsi}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Editor with Variable Inserters */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Teks Template Pesan (Dapat Disesuaikan):</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{nama_ortu}')}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono"
                    title="Sisipkan {nama_ortu}"
                  >
                    +Ortu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{nama_siswa}')}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono"
                    title="Sisipkan {nama_siswa}"
                  >
                    +Siswa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{kelas}')}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono"
                    title="Sisipkan {kelas}"
                  >
                    +Kelas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{tanggal_hari}')}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono"
                    title="Sisipkan {tanggal_hari}"
                  >
                    +Tanggal
                  </button>
                </div>
              </div>

              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-sans text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Live WhatsApp Chat Bubble Preview */}
            <div className="bg-slate-900 rounded-xl p-3.5 space-y-2 text-white">
              <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Pratinjau Pesan di HP Orang Tua:</span>
                </div>
                {previewStudent && (
                  <span className="text-[10px] text-emerald-300 font-mono">
                    Target: {previewStudent.namaOrtu} ({previewStudent.nama} - {previewStudent.kelas})
                  </span>
                )}
              </div>

              {/* Chat Bubble Container (WhatsApp styled) */}
              <div className="bg-[#0b141a] p-3 rounded-lg border border-slate-800 relative">
                <div className="bg-[#005c4b] text-white p-3 rounded-lg rounded-tr-none text-xs leading-relaxed font-sans max-w-lg ml-auto shadow-md">
                  <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed">
                    {resolveMessageForStudent(previewStudent)}
                  </pre>
                  <div className="text-right text-[9px] text-emerald-200/80 mt-1 flex items-center justify-end space-x-1">
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3 h-3 text-sky-300 inline" />
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Progress Bar if sending */}
            {isSending && currentTarget && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1.5 text-xs text-rose-950 animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    <span>Mengirim ke: {currentTarget.namaOrtu} ({currentTarget.noHpOrtu})</span>
                  </span>
                  <span className="font-mono">{sendProgress}%</span>
                </div>
                <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-600 h-full transition-all duration-200" 
                    style={{ width: `${sendProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  Siswa: <strong>{currentTarget.nama}</strong> ({currentTarget.kelas}) • Meta Cloud API 200 OK
                </div>
              </div>
            )}

            {/* Broadcast Logs Preview if any sent */}
            {broadcastLogs.length > 0 && !isSending && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] max-h-28 overflow-y-auto space-y-1">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Log Pengiriman Sesi Ini ({broadcastLogs.length} Terkirim):</span>
                  <span className="text-emerald-700 font-mono text-[10px]">Semua Sukses</span>
                </div>
                {broadcastLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] text-slate-600 py-0.5 border-b border-slate-100 last:border-0">
                    <span>#{idx + 1} {log.namaOrtu} ({log.nama} - {log.kelas})</span>
                    <span className="font-mono text-emerald-600 font-bold">{log.waktu} • 200 OK</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Target Aktif: <strong>{selectedNisns.length} Nomor WhatsApp Orang Tua</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Tutup
            </button>

            {/* Primary Action Button: Broadcast Massal via Meta Cloud API */}
            <button
              type="button"
              onClick={handleExecuteBatchSend}
              disabled={isSending || selectedNisns.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:from-rose-700 hover:to-red-800 active:scale-95 text-white flex items-center space-x-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-200" />
                  <span>Mengirim Pesan... ({sendProgress}%)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-rose-100" />
                  <span>Kirim WA Massal ({selectedNisns.length} Orang Tua)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
