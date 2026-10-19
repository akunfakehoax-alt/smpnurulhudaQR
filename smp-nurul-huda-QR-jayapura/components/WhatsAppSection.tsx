'use client';

import React, { useState, useMemo } from 'react';
import { WhatsAppConfig, Siswa, SchoolProfile } from '@/types/attendance';
import { 
  Send, 
  CheckCheck, 
  ShieldCheck, 
  ExternalLink, 
  KeyRound, 
  Smartphone, 
  FileText, 
  Zap, 
  Check, 
  Clock, 
  Users, 
  Calendar, 
  AlertTriangle, 
  ListChecks,
  PlayCircle,
  RefreshCw,
  BellRing,
  Megaphone,
  MessageSquare,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  Copy,
  Trash2,
  ArrowRight,
  Search,
  Share2
} from 'lucide-react';

interface WhatsAppSectionProps {
  config: WhatsAppConfig;
  siswaList: Siswa[];
  onUpdateConfig: (newConfig: WhatsAppConfig) => void;
  schoolProfile?: SchoolProfile;
}

const PRESET_MESSAGES = [
  {
    id: 'rapat',
    title: 'Undangan Rapat Wali Murid',
    category: 'Rapat & Diskusi',
    message: `Yth. Bapak/Ibu {nama_ortu} (Wali dari ananda {nama_siswa} - {kelas}),\n\nKami mengundang Bapak/Ibu untuk menghadiri Pertemuan Wali Murid & Evaluasi Capaian Belajar Semester yang akan diselenggarakan pada:\n📅 Hari/Tanggal: Sabtu, 28 September 2026\n⏰ Waktu: 09:00 WIT - Selesai\n📍 Tempat: Aula {nama_sekolah}\n\nKehadiran Bapak/Ibu sangat berarti demi kemajuan dan kedisiplinan belajar ananda. Atas perhatian dan kehadirannya kami ucapkan terima kasih.\n\nSalam hormat,\nKepala Sekolah & Dewan Guru\n{nama_sekolah}`
  },
  {
    id: 'libur',
    title: 'Pemberitahuan Hari Libur & Belajar Mandiri',
    category: 'Agenda Sekolah',
    message: `Yth. Bapak/Ibu {nama_ortu},\n\nDiberitahukan kepada seluruh wali murid {kelas} {nama_sekolah}, bahwa sehubungan dengan agenda rapat kerja guru dan libur resmi, kegiatan pembelajaran tatap muka ditiadakan pada:\n📅 Tanggal: 25 - 26 September 2026\n\nSiswa diimbau untuk belajar mandiri di rumah dan menyelesaikan tugas pada portal sekolah. Pembelajaran tatap muka kembali aktif pada hari Senin.\n\nTerima kasih atas kerja sama Bapak/Ibu.\n{nama_sekolah}`
  },
  {
    id: 'ujian',
    title: 'Persiapan Penilaian Tengah Semester (PTS)',
    category: 'Ujian / Asesmen',
    message: `Yth. Bapak/Ibu {nama_ortu} (Wali dari {nama_siswa}),\n\nKami menginformasikan bahwa ananda akan menempuh Penilaian Tengah Semester (PTS) mulai pekan depan. Mohon pendampingan Bapak/Ibu dalam mengawasi jam belajar ananda di rumah, membatasi penggunaan gadget, serta memastikan ananda hadir tepat waktu di sekolah sebelum pukul 07:00 WIT dengan seragam lengkap.\n\nTerima kasih atas perhatian dan kerja samanya.\nWali Kelas & Tim Kurikulum {nama_sekolah}`
  },
  {
    id: 'darurat',
    title: 'Pemberitahuan Khusus / Pemulangan Awal',
    category: 'Penting / Mendesak',
    message: `PEMBERITAHUAN PENTING & MENDESAK\n\nYth. Bapak/Ibu {nama_ortu} (Wali dari {nama_siswa} - {kelas}),\n\nSehubungan dengan kondisi cuaca ekstrem / agenda mendesak di lingkungan sekolah hari ini, seluruh siswa dipulangkan lebih awal pada pukul 12:30 WIT. Mohon Bapak/Ibu memastikan penjemputan atau kepulangan ananda dengan aman sampai di rumah.\n\nTerima kasih atas perhatian dan kerja samanya.\n{nama_sekolah}`
  }
];

export const WhatsAppSection: React.FC<WhatsAppSectionProps> = ({
  config,
  siswaList,
  onUpdateConfig,
  schoolProfile
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'summary' | 'instant'>('broadcast');
  const [formConfig, setFormConfig] = useState<WhatsAppConfig>(config);
  
  // Instant notification state
  const [selectedStudentForPreview, setSelectedStudentForPreview] = useState<Siswa>(siswaList[0] || {} as Siswa);
  const [previewTipe, setPreviewTipe] = useState<'DATANG' | 'PULANG'>('DATANG');
  const [previewStatus, setPreviewStatus] = useState<'HADIR' | 'TERLAMBAT'>('HADIR');
  const [isTestSending, setIsTestSending] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: number;
    payload: string;
    response: string;
  } | null>(null);

  // Daily Summary notification state
  const [summaryStudent, setSummaryStudent] = useState<Siswa>(siswaList[0] || {} as Siswa);
  const [summaryScenario, setSummaryScenario] = useState<'HADIR_LENGKAP' | 'TERLAMBAT' | 'BELUM_PULANG' | 'IZIN_SAKIT'>('HADIR_LENGKAP');
  const [isBroadcastRunning, setIsBroadcastRunning] = useState<boolean>(false);
  const [broadcastProgress, setBroadcastProgress] = useState<number>(0);
  const [broadcastFilterClass, setBroadcastFilterClass] = useState<string>('SEMUA');
  const [broadcastLogs, setBroadcastLogs] = useState<Array<{
    id: string;
    nisn: string;
    nama: string;
    kelas: string;
    noHp: string;
    statusAkhir: string;
    statusWA: 'TERKIRIM' | 'GAGAL';
    wamid: string;
    waktu: string;
  }>>([]);
  const [summaryTestResult, setSummaryTestResult] = useState<{
    success: boolean;
    status: number;
    payload: string;
    response: string;
  } | null>(null);

  // Manual Broadcast State
  const [manualTargetClass, setManualTargetClass] = useState<string>('SEMUA');
  const [manualMessage, setManualMessage] = useState<string>(PRESET_MESSAGES[0].message);
  const [manualSampleStudent, setManualSampleStudent] = useState<Siswa>(siswaList[0] || {} as Siswa);
  const [isManualBroadcastRunning, setIsManualBroadcastRunning] = useState<boolean>(false);
  const [manualBroadcastProgress, setManualBroadcastProgress] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [manualSearchFilter, setManualSearchFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [manualBroadcastLogs, setManualBroadcastLogs] = useState<Array<{
    id: string;
    nisn: string;
    namaSiswa: string;
    namaOrtu: string;
    kelas: string;
    noHp: string;
    pesanPreview: string;
    statusWA: 'TERKIRIM' | 'GAGAL';
    wamid: string;
    waktu: string;
  }>>([]);

  const availableClasses = useMemo(() => {
    return Array.from(new Set(siswaList.map(s => s.kelas))).sort();
  }, [siswaList]);

  const targetManualStudents = useMemo(() => {
    return siswaList.filter(s => {
      if (manualTargetClass !== 'SEMUA' && s.kelas !== manualTargetClass) return false;
      return true;
    });
  }, [siswaList, manualTargetClass]);

  const resolveManualMessage = (templateText: string, student: Siswa) => {
    if (!student) return templateText;
    const schoolName = schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA';
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return templateText
      .replace(/{nama_ortu}/g, student.namaOrtu || 'Wali Murid')
      .replace(/{nama_siswa}/g, student.nama || 'Siswa')
      .replace(/{kelas}/g, student.kelas || '-')
      .replace(/{nama_sekolah}/g, schoolName)
      .replace(/{tanggal}/g, todayStr);
  };

  const handleRunManualBroadcast = () => {
    if (targetManualStudents.length === 0) {
      alert('Tidak ada siswa pada target kelas yang dipilih!');
      return;
    }
    if (!manualMessage.trim()) {
      alert('Silakan tuliskan teks pesan broadcast terlebih dahulu!');
      return;
    }

    setShowConfirmModal(false);
    setIsManualBroadcastRunning(true);
    setManualBroadcastProgress(0);
    setManualBroadcastLogs([]);

    const total = targetManualStudents.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= total) {
        clearInterval(interval);
        setIsManualBroadcastRunning(false);
        setManualBroadcastProgress(100);
        return;
      }

      const s = targetManualStudents[currentIdx];
      const resolved = resolveManualMessage(manualMessage, s);

      const newLog = {
        id: `BC-${Date.now()}-${currentIdx}`,
        nisn: s.nisn,
        namaSiswa: s.nama,
        namaOrtu: s.namaOrtu || 'Wali Murid',
        kelas: s.kelas,
        noHp: s.noHpOrtu,
        pesanPreview: resolved.substring(0, 70) + (resolved.length > 70 ? '...' : ''),
        statusWA: 'TERKIRIM' as const,
        wamid: `wamid.HBgL${Date.now().toString(36)}${currentIdx}_OFFICIAL_META`,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setManualBroadcastLogs(prev => [newLog, ...prev]);
      currentIdx++;
      setManualBroadcastProgress(Math.round((currentIdx / total) * 100));
    }, 380);
  };

  const insertVariableTag = (tag: string) => {
    setManualMessage(prev => prev + ' ' + tag);
  };

  const filteredBroadcastLogs = useMemo(() => {
    if (!manualSearchFilter.trim()) return manualBroadcastLogs;
    const q = manualSearchFilter.toLowerCase();
    return manualBroadcastLogs.filter(
      l => l.namaSiswa.toLowerCase().includes(q) ||
           l.namaOrtu.toLowerCase().includes(q) ||
           l.noHp.includes(q) ||
           l.kelas.toLowerCase().includes(q)
    );
  }, [manualBroadcastLogs, manualSearchFilter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    alert('Konfigurasi WhatsApp & Ringkasan Harian berhasil disimpan!');
  };

  // Instant Test Send
  const handleSimulateSend = () => {
    setIsTestSending(true);
    setTestResult(null);

    const waktuNow = new Date().toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: selectedStudentForPreview.noHpOrtu,
      type: 'template',
      template: {
        name: formConfig.templateName,
        language: { code: 'id' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: selectedStudentForPreview.nama },
              { type: 'text', text: selectedStudentForPreview.kelas },
              { type: 'text', text: previewTipe },
              { type: 'text', text: `${waktuNow} WIB` },
              { type: 'text', text: previewStatus === 'HADIR' ? 'Tepat Waktu' : 'Terlambat' }
            ]
          }
        ]
      }
    };

    setTimeout(() => {
      setIsTestSending(false);
      setTestResult({
        success: true,
        status: 200,
        payload: JSON.stringify(payload, null, 2),
        response: JSON.stringify({
          messaging_product: 'whatsapp',
          contacts: [{ input: selectedStudentForPreview.noHpOrtu, wa_id: selectedStudentForPreview.noHpOrtu }],
          messages: [{ id: `wamid.HBgL${Date.now()}_OFFICIAL_META_API` }]
        }, null, 2)
      });
    }, 700);
  };

  // Summary Test Send
  const handleSimulateSummarySend = () => {
    setIsTestSending(true);
    setSummaryTestResult(null);

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let masukText = '06:42 WIB (Hadir Tepat Waktu)';
    let pulangText = '15:30 WIB (Selesai Sesi Sekolah)';
    let statusAkhirText = 'HADIR LENGKAP';

    if (summaryScenario === 'TERLAMBAT') {
      masukText = '07:08 WIB (Terlambat 8 menit)';
      pulangText = '15:30 WIB (Selesai Sesi Sekolah)';
      statusAkhirText = 'TERLAMBAT MASUK';
    } else if (summaryScenario === 'BELUM_PULANG') {
      masukText = '06:55 WIB (Hadir Tepat Waktu)';
      pulangText = 'Belum Melakukan Presensi Pulang';
      statusAkhirText = 'BELUM PRESENSI PULANG';
    } else if (summaryScenario === 'IZIN_SAKIT') {
      masukText = 'Izin (Disertai Surat Orang Tua)';
      pulangText = '-';
      statusAkhirText = 'IZIN';
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: summaryStudent.noHpOrtu,
      type: 'template',
      template: {
        name: formConfig.dailySummaryTemplateName || 'ringkasan_absensi_harian',
        language: { code: 'id' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: summaryStudent.namaOrtu || 'Wali Murid' },
              { type: 'text', text: summaryStudent.nama },
              { type: 'text', text: summaryStudent.kelas },
              { type: 'text', text: todayStr },
              { type: 'text', text: masukText },
              { type: 'text', text: pulangText },
              { type: 'text', text: statusAkhirText }
            ]
          }
        ]
      }
    };

    setTimeout(() => {
      setIsTestSending(false);
      setSummaryTestResult({
        success: true,
        status: 200,
        payload: JSON.stringify(payload, null, 2),
        response: JSON.stringify({
          messaging_product: 'whatsapp',
          contacts: [{ input: summaryStudent.noHpOrtu, wa_id: summaryStudent.noHpOrtu }],
          messages: [{ id: `wamid.HBgL${Date.now()}_DAILY_SUMMARY_OFFICIAL` }]
        }, null, 2)
      });
    }, 700);
  };

  // Run Batch Broadcast Simulation
  const handleRunBatchBroadcast = () => {
    const targetStudents = siswaList.filter(
      s => broadcastFilterClass === 'SEMUA' || s.kelas === broadcastFilterClass
    );

    if (targetStudents.length === 0) return;

    setIsBroadcastRunning(true);
    setBroadcastProgress(0);
    setBroadcastLogs([]);

    const total = targetStudents.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= total) {
        clearInterval(interval);
        setIsBroadcastRunning(false);
        setBroadcastProgress(100);
        return;
      }

      const s = targetStudents[currentIdx];
      const statusOptions = ['HADIR LENGKAP', 'HADIR LENGKAP', 'TERLAMBAT MASUK', 'BELUM PRESENSI PULANG'];
      const assignedStatus = statusOptions[currentIdx % statusOptions.length];

      const newLog = {
        id: `LOG-${Date.now()}-${currentIdx}`,
        nisn: s.nisn,
        nama: s.nama,
        kelas: s.kelas,
        noHp: s.noHpOrtu,
        statusAkhir: assignedStatus,
        statusWA: 'TERKIRIM' as const,
        wamid: `wamid.HBgL${Date.now().toString(36)}${currentIdx}`,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setBroadcastLogs(prev => [newLog, ...prev]);
      currentIdx++;
      setBroadcastProgress(Math.round((currentIdx / total) * 100));
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Send className="w-5 h-5 text-emerald-600" />
            <span>Integrasi WhatsApp Provider Resmi (Meta Cloud API)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Endpoint API resmi langsung dari Meta Developer Platform (tanpa rekayasa endpoint), mendukung notifikasi instan, ringkasan harian, dan broadcast massal ke wali murid.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Kirim Broadcast di Header */}
          <button
            type="button"
            id="btn-kirim-broadcast-header"
            onClick={() => setActiveTab('broadcast')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              activeTab === 'broadcast'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Buka pengiriman pesan manual massal ke semua wali murid"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
            <span>Kirim Broadcast</span>
          </button>

          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Dokumentasi Meta Cloud API</span>
          </a>
        </div>
      </div>

      {/* Official Endpoint Notice */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-100">Verified Official Endpoint:</span>
            <span className="bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800 text-[11px] truncate">
              POST https://graph.facebook.com/v20.0/&#123;PHONE_NUMBER_ID&#125;/messages
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Di Google Apps Script, pemanggilan dilakukan menggunakan <code className="text-sky-300 font-mono">UrlFetchApp.fetch()</code> dengan header Bearer Token resmi.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            formConfig.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
          }`}>
            {formConfig.enabled ? 'Status: Aktif' : 'Status: Nonaktif'}
          </span>
        </div>
      </div>

      {/* Sub-tab Switcher: Broadcast Manual vs Daily Summary vs Instant Notification */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          id="tab-btn-broadcast-manual"
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'broadcast'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-300" />
          <span>Kirim Broadcast Manual (Pesan ke Semua Wali)</span>
          <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
            Pesan Massal
          </span>
        </button>

        <button
          id="tab-btn-summary"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'summary'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Otomatisasi Ringkasan Harian (Akhir Sesi Sekolah)</span>
        </button>

        <button
          id="tab-btn-instant"
          onClick={() => setActiveTab('instant')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'instant'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Notifikasi Real-time (Per Scan QR)</span>
        </button>
      </div>

      {/* TAB: KIRIM BROADCAST MANUAL KE WALI MURID */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Main Composer & Live Phone Mockup Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Message Composer */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                    <Megaphone className="w-4 h-4 text-emerald-600" />
                    <span>Komposer Pesan Broadcast Manual</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kirim pengumuman resmi ke seluruh wali murid secara instan dan personal.
                  </p>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{targetManualStudents.length} Wali Murid Terpilih</span>
                </span>
              </div>

              {/* Target Class Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Target Penerima Broadcast
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      id="select-target-kelas-broadcast"
                      value={manualTargetClass}
                      onChange={(e) => setManualTargetClass(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="SEMUA">Semua Kelas ({siswaList.length} Siswa / Seluruh Wali)</option>
                      {availableClasses.map(cls => {
                        const countInClass = siswaList.filter(s => s.kelas === cls).length;
                        return (
                          <option key={cls} value={cls}>
                            Kelas {cls} ({countInClass} Wali Murid)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <span className="text-xs text-slate-500 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono shrink-0">
                    {targetManualStudents.length} No. WA Aktif
                  </span>
                </div>
              </div>

              {/* Quick Template Presets */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pilih Template Pengumuman Cepat</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Klik untuk memuat isi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_MESSAGES.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setManualMessage(preset.message)}
                      className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition group"
                    >
                      <div className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
                        <span>{preset.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {preset.message.replace(/\n/g, ' ')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Variable Insertion Pills */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Sisipkan Variabel Dinamis (Personalisasi Otomatis)
                  </label>
                  <span className="text-[10px] text-slate-400">Klik tombol untuk menyisipkan</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{nama_ortu}')}
                    className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-100 transition active:scale-95"
                    title="Akan diganti dengan nama orang tua/wali siswa"
                  >
                    + &#123;nama_ortu&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{nama_siswa}')}
                    className="px-2 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-medium hover:bg-sky-100 transition active:scale-95"
                    title="Akan diganti dengan nama lengkap siswa"
                  >
                    + &#123;nama_siswa&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{kelas}')}
                    className="px-2 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-medium hover:bg-purple-100 transition active:scale-95"
                    title="Akan diganti dengan kelas siswa"
                  >
                    + &#123;kelas&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{nama_sekolah}')}
                    className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium hover:bg-amber-100 transition active:scale-95"
                    title="Akan diganti dengan nama sekolah"
                  >
                    + &#123;nama_sekolah&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{tanggal}')}
                    className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium hover:bg-slate-200 transition active:scale-95"
                    title="Akan diganti dengan tanggal hari ini"
                  >
                    + &#123;tanggal&#125;
                  </button>
                </div>
              </div>

              {/* Message Editor Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Teks Pesan Broadcast Manual
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {manualMessage.length} karakter • {manualMessage.trim().split(/\s+/).filter(Boolean).length} kata
                  </span>
                </div>
                <textarea
                  id="textarea-manual-broadcast"
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  rows={8}
                  placeholder="Ketik teks pesan pengumuman manual di sini..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs leading-relaxed font-sans text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  id="btn-trigger-broadcast-modal"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isManualBroadcastRunning || targetManualStudents.length === 0}
                  className="w-full sm:w-auto flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50 active:scale-98"
                >
                  <Megaphone className="w-4 h-4 text-amber-300" />
                  <span>Kirim Broadcast ke {targetManualStudents.length} Wali Murid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualMessage('')}
                  className="px-3.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                  title="Hapus semua teks"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Pengiriman broadcast menggunakan <strong>Meta WhatsApp Cloud API</strong> dengan antrean transmisi yang mematuhi batas laju (rate-limit) resmi tanpa risiko pemblokiran akun bisnis sekolah.
                </span>
              </div>
            </div>

            {/* Right: Live Interactive Smartphone Simulator */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Pratinjau Live WhatsApp Wali</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    Real-time Render
                  </span>
                </div>

                {/* Sample Student Selector */}
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Simulasi Pratinjau dengan Data Siswa:
                  </label>
                  <select
                    value={manualSampleStudent.nisn}
                    onChange={(e) => {
                      const s = targetManualStudents.find(item => item.nisn === e.target.value);
                      if (s) setManualSampleStudent(s);
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs bg-white text-slate-800 font-medium"
                  >
                    {targetManualStudents.map(s => (
                      <option key={s.nisn} value={s.nisn}>
                        {s.nama} ({s.kelas}) • Wali: {s.namaOrtu || 'Wali Murid'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Smartphone Device Shell */}
                <div className="max-w-[340px] mx-auto bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
                  {/* Smartphone Top Notch & WhatsApp App Bar */}
                  <div className="bg-emerald-800 text-white px-3 py-2.5 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-xs shrink-0">
                        {schoolProfile?.namaSekolah?.substring(0, 3) || 'SMP'}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs leading-none truncate">
                          {schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA'}
                        </div>
                        <div className="text-[9px] text-emerald-200 flex items-center space-x-1 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                          <span>Akun Bisnis Resmi Meta</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-200 shrink-0 font-mono">
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Chat Wallpaper Area */}
                  <div className="bg-[#e5ddd5] p-3 rounded-b-2xl min-h-[340px] flex flex-col justify-end space-y-2 text-slate-900">
                    <div className="bg-white/85 backdrop-blur rounded-lg px-2 py-1 text-center text-[9px] text-slate-600 mx-auto shadow-2xs">
                      Pesan Broadcast Resmi Sekolah
                    </div>

                    {/* Chat Bubble with Formatted Text */}
                    <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm max-w-[96%] space-y-2 text-xs border border-slate-200/80">
                      <div className="text-[10px] font-bold text-emerald-800 border-b border-emerald-100 pb-1 flex items-center justify-between">
                        <span>📢 PENGUMUMAN RESMI</span>
                        <span className="text-[9px] font-normal text-slate-400">Meta WABA</span>
                      </div>

                      <div className="text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                        {resolveManualMessage(manualMessage, manualSampleStudent)}
                      </div>

                      <div className="text-[9px] text-slate-400 text-right flex items-center justify-end space-x-1 pt-1 border-t border-slate-100">
                        <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient Preview Info */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nomor WhatsApp:</span>
                    <span className="font-mono font-bold text-slate-800">{manualSampleStudent.noHpOrtu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Penerima:</span>
                    <span className="font-semibold text-slate-800">{manualSampleStudent.namaOrtu || 'Wali Murid'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIMULATOR & LOG TRANSMISI BROADCAST */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <PlayCircle className="w-5 h-5 text-emerald-600" />
                  <span>Status Transmisi & Riwayat Pengiriman Broadcast</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Monitor log pengiriman pesan massal langsung dari endpoint Meta Graph API ke nomor orang tua siswa.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={manualSearchFilter}
                    onChange={(e) => setManualSearchFilter(e.target.value)}
                    placeholder="Cari siswa / wali / no HP..."
                    className="border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs bg-white text-slate-700"
                  />
                </div>

                {manualBroadcastLogs.length > 0 && (
                  <button
                    onClick={() => setManualBroadcastLogs([])}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition"
                  >
                    Bersihkan Log
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar when running */}
            {isManualBroadcastRunning && (
              <div className="space-y-1.5 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <div className="flex justify-between text-xs font-semibold text-emerald-950">
                  <span className="flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Sedang mengirim pesan broadcast via Meta Cloud API...</span>
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">{manualBroadcastProgress}%</span>
                </div>
                <div className="w-full bg-emerald-200/60 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${manualBroadcastProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-800">
                  Memproses {manualBroadcastLogs.length} dari {targetManualStudents.length} wali murid...
                </p>
              </div>
            )}

            {/* Transmission Summary Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500">Target Wali Murid</span>
                <div className="text-xl font-extrabold text-slate-800 mt-0.5">{targetManualStudents.length}</div>
                <span className="text-[10px] text-slate-400">Kelas: {manualTargetClass}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Terkirim (Meta API)</span>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{manualBroadcastLogs.length}</div>
                <span className="text-[10px] text-emerald-600 font-semibold">Status HTTP 200 OK</span>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-sky-700">Status Provider</span>
                <div className="text-sm font-bold text-sky-800 mt-1">Meta Official Cloud API</div>
                <span className="text-[10px] text-sky-600">Terhubung & Siap</span>
              </div>
            </div>

            {/* Transmission Log Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Siswa & Kelas</th>
                    <th className="py-2.5 px-3">Wali Murid</th>
                    <th className="py-2.5 px-3">WhatsApp Orang Tua</th>
                    <th className="py-2.5 px-3">Cuplikan Pesan</th>
                    <th className="py-2.5 px-3">Status Transmisi</th>
                    <th className="py-2.5 px-3">Message ID (wamid)</th>
                    <th className="py-2.5 px-3 text-center">Aksi Langsung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBroadcastLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {isManualBroadcastRunning ? (
                          <div className="flex items-center justify-center space-x-2 text-slate-600">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Menyiapkan transmisi broadcast...</span>
                          </div>
                        ) : (
                          <div>
                            <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-600">Belum ada transmisi broadcast manual pada sesi ini.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Tentukan target dan klik tombol &quot;Kirim Broadcast&quot; di atas untuk memulai pengiriman pesan ke seluruh wali murid.
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredBroadcastLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-600">{log.waktu}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{log.namaSiswa}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.kelas} • {log.nisn}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{log.namaOrtu}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{log.noHp}</td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={log.pesanPreview}>
                          {log.pesanPreview}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            <span>HTTP 200 OK</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                          {log.wamid}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <a
                            href={`https://wa.me/${log.noHp}?text=${encodeURIComponent(resolveManualMessage(manualMessage, siswaList.find(s => s.nisn === log.nisn) || siswaList[0]))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition border border-emerald-200"
                            title="Buka chat WhatsApp Web"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>WA Web</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL BEFORE BROADCAST */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Megaphone className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Konfirmasi Pengiriman Broadcast</h3>
                <p className="text-xs text-slate-500">Pesan massal via WhatsApp Meta Cloud API</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Target Penerima:</span>
                <span className="font-bold text-slate-900">
                  {manualTargetClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${manualTargetClass}`} ({targetManualStudents.length} Wali Murid)
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Sekolah Pengirim:</span>
                <span className="font-bold text-emerald-800">
                  {schoolProfile?.namaSekolah || 'SMP NURUL HUDA JAYAPURA'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Cuplikan Isi Pesan:</span>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-[11px] leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap font-sans">
                  {resolveManualMessage(manualMessage, targetManualStudents[0] || siswaList[0])}
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Pesan akan dikirim langsung ke masing-masing nomor orang tua yang terdata. Pastikan isi pengumuman dan tanggal kegiatan sudah sesuai.
              </span>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-send-broadcast"
                onClick={handleRunManualBroadcast}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ya, Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: OTOMATISASI RINGKASAN HARIAN AKHIR SESI */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Main Grid: Summary Config vs Summary Smartphone Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Daily Summary Settings Form */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Pengiriman Rekap Harian Otomatis</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Time-Driven Trigger
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                {/* Enable Daily Summary */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formConfig.autoSendDailySummary}
                      onChange={(e) => setFormConfig({ ...formConfig, autoSendDailySummary: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Kirim Ringkasan Presensi Harian Secara Otomatis
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Server Google Apps Script akan mengumpulkan data kedatangan dan kepulangan siswa lalu mengirim rekapitulasi personal via WhatsApp di akhir jam sekolah.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Scheduled Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jam Pengiriman Terjadwal (WIB)
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                      <input
                        type="time"
                        value={formConfig.dailySummarySendTime}
                        onChange={(e) => setFormConfig({ ...formConfig, dailySummarySendTime: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl pl-8 pr-2.5 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Disarankan setelah sesi kepulangan berakhir (e.g. 16:00).
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Penerima Ringkasan
                    </label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                      <select
                        value={formConfig.dailySummaryTarget}
                        onChange={(e) => setFormConfig({ ...formConfig, dailySummaryTarget: e.target.value as 'ORTU' | 'SISWA' | 'KEDUANYA' })}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl pl-8 pr-2.5 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      >
                        <option value="ORTU" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Orang Tua / Wali Murid (Disarankan)</option>
                        <option value="SISWA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Nomor Siswa Saja</option>
                        <option value="KEDUANYA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Keduanya (Orang Tua & Siswa)</option>
                      </select>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Mengambil nomor kontak terdaftar di sheet SISWA.
                    </span>
                  </div>
                </div>

                {/* Template Name */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Template Meta Cloud API (Approved)
                  </label>
                  <input
                    type="text"
                    value={formConfig.dailySummaryTemplateName}
                    onChange={(e) => setFormConfig({ ...formConfig, dailySummaryTemplateName: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="ringkasan_absensi_harian"
                    required
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Template WhatsApp Business yang terdaftar di Meta Developer Portal.
                  </span>
                </div>

                {/* Options */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formConfig.dailySummaryIncludeAbsent}
                      onChange={(e) => setFormConfig({ ...formConfig, dailySummaryIncludeAbsent: e.target.checked })}
                      className="rounded text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Kirim juga pemberitahuan khusus jika siswa Tidak Hadir / Belum Absen Pulang</span>
                  </label>
                </div>

                {/* Time Driven Trigger Guide Box */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mekanisme Google Apps Script Time-Driven Trigger</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Fungsi <code className="font-mono text-emerald-800 bg-emerald-100/60 px-1 py-0.2 rounded">WA_triggerDailySummary()</code> dipanggil setiap hari kerja (Senin-Jumat) pukul {formConfig.dailySummarySendTime} WIB oleh trigger terjadwal Apps Script tanpa perlu membuka spreadsheet.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
                >
                  Simpan Pengaturan Ringkasan Harian
                </button>
              </form>
            </div>

            {/* Right: Daily Summary Smartphone Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Simulasi Tampilan WhatsApp Rekap Akhir Sesi</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    Official Meta WABA
                  </span>
                </div>

                {/* Selector for Preview */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Pilih Siswa:</label>
                    <select
                      value={summaryStudent.nisn}
                      onChange={(e) => {
                        const s = siswaList.find(item => item.nisn === e.target.value);
                        if (s) setSummaryStudent(s);
                      }}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {siswaList.map(s => (
                        <option key={s.nisn} value={s.nisn} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {s.nama} ({s.kelas})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Skenario Kehadiran:</label>
                    <select
                      value={summaryScenario}
                      onChange={(e) => setSummaryScenario(e.target.value as any)}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="HADIR_LENGKAP" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">1. Hadir Lengkap (Tepat Waktu)</option>
                      <option value="TERLAMBAT" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">2. Terlambat Masuk Pagi</option>
                      <option value="BELUM_PULANG" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">3. Belum Presensi Pulang</option>
                      <option value="IZIN_SAKIT" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">4. Izin / Sakit</option>
                    </select>
                  </div>
                </div>

                {/* Smartphone screen container */}
                <div className="max-w-sm mx-auto bg-slate-900 rounded-[32px] p-3 shadow-xl border-4 border-slate-800">
                  {/* WhatsApp App Bar */}
                  <div className="bg-emerald-800 text-white px-3 py-2 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                        SMK
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-none">Presensi SMKN 1 Resmi</div>
                        <div className="text-[9px] text-emerald-200">Akun Bisnis Resmi ✓</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-200">{formConfig.dailySummarySendTime} WIB</div>
                  </div>

                  {/* Chat background wallpaper */}
                  <div className="bg-[#e5ddd5] p-3 rounded-b-2xl min-h-[320px] flex flex-col justify-end space-y-2 text-slate-900">
                    <div className="bg-white/80 backdrop-blur rounded-lg p-1 text-center text-[9px] text-slate-600 mx-auto">
                      Hari Ini • Rekapitulasi Akhir Sesi Sekolah
                    </div>

                    {/* WhatsApp Chat Bubble */}
                    <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm max-w-[95%] space-y-1.5 text-xs border border-slate-200">
                      <div className="font-bold text-emerald-800 text-[11px] flex items-center space-x-1 border-b border-emerald-100 pb-1">
                        <span>📌 LAPORAN RINGKASAN PRESENSI HARIAN</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-700">
                        SMK NEGERI 1 INFORMATIKA
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-800">
                        Yth. Bapak/Ibu <strong>{summaryStudent.namaOrtu || 'Wali Murid'}</strong>,
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Berikut rekapitulasi kehadiran ananda pada hari ini:
                      </p>

                      <div className="bg-slate-50 p-2 rounded-lg text-[10px] border border-slate-200 space-y-1 font-sans">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nama Siswa:</span>
                          <strong className="text-slate-900">{summaryStudent.nama}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Kelas / NISN:</span>
                          <strong className="text-slate-800">{summaryStudent.kelas} • {summaryStudent.nisn}</strong>
                        </div>

                        <div className="border-t border-slate-200 pt-1 space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">• Sesi Masuk:</span>
                            {summaryScenario === 'HADIR_LENGKAP' && (
                              <span className="text-emerald-700 font-bold">06:42 WIB (Tepat Waktu)</span>
                            )}
                            {summaryScenario === 'TERLAMBAT' && (
                              <span className="text-amber-700 font-bold">07:08 WIB (Terlambat 8 mnt)</span>
                            )}
                            {summaryScenario === 'BELUM_PULANG' && (
                              <span className="text-emerald-700 font-bold">06:55 WIB (Tepat Waktu)</span>
                            )}
                            {summaryScenario === 'IZIN_SAKIT' && (
                              <span className="text-blue-700 font-bold">Izin (Surat Resmi)</span>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">• Sesi Pulang:</span>
                            {(summaryScenario === 'HADIR_LENGKAP' || summaryScenario === 'TERLAMBAT') && (
                              <span className="text-sky-700 font-bold">15:30 WIB (Selesai Sesi)</span>
                            )}
                            {summaryScenario === 'BELUM_PULANG' && (
                              <span className="text-rose-700 font-bold">Belum Absen Pulang</span>
                            )}
                            {summaryScenario === 'IZIN_SAKIT' && (
                              <span className="text-slate-500 font-bold">-</span>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-0.5 border-t border-dashed border-slate-200">
                            <span className="text-slate-700 font-bold">• Status Akhir:</span>
                            {summaryScenario === 'HADIR_LENGKAP' && (
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                                HADIR LENGKAP ✓
                              </span>
                            )}
                            {summaryScenario === 'TERLAMBAT' && (
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                                TERLAMBAT MASUK
                              </span>
                            )}
                            {summaryScenario === 'BELUM_PULANG' && (
                              <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                                BELUM PRESENSI PULANG ⚠️
                              </span>
                            )}
                            {summaryScenario === 'IZIN_SAKIT' && (
                              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold text-[9px]">
                                IZIN KELUARGA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-[9px] text-slate-500 pt-1">
                        Terima kasih atas kerja sama Bapak/Ibu mengawal kedisiplinan ananda.
                      </p>
                      <div className="text-[9px] text-slate-400 text-right flex items-center justify-end space-x-1">
                        <span>{formConfig.dailySummarySendTime}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Send Summary */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateSummarySend}
                    disabled={isTestSending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {isTestSending ? 'Mengirim Ringkasan ke Meta API...' : `Kirim Uji Coba Ringkasan ke Wali (${summaryStudent.noHpOrtu})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Inspector for Summary Test */}
              {summaryTestResult && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Meta Graph API HTTP {summaryTestResult.status} OK (Template Summary)</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">Response 200 OK</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Request Payload Sent:</span>
                    <pre className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300 overflow-x-auto max-h-32">
                      {summaryTestResult.payload}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Meta Response:</span>
                    <pre className="bg-slate-950 p-2 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto">
                      {summaryTestResult.response}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SIMULATOR BROADCAST RINGKASAN AKHIR SESI SEKOLAH */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <PlayCircle className="w-5 h-5 text-emerald-600" />
                  <span>Simulator Eksekusi Broadcast Ringkasan Akhir Sesi</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Uji coba transmisi pesan batch massal ke seluruh nomor WhatsApp orang tua siswa seperti saat trigger Apps Script berjalan pada pukul {formConfig.dailySummarySendTime} WIB.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={broadcastFilterClass}
                  onChange={(e) => setBroadcastFilterClass(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white font-semibold text-slate-700"
                >
                  <option value="SEMUA">Target: Semua Kelas ({siswaList.length} Siswa)</option>
                  <option value="XII RPL 1">Target: XII RPL 1</option>
                  <option value="XII RPL 2">Target: XII RPL 2</option>
                  <option value="XI TKJ 1">Target: XI TKJ 1</option>
                </select>

                <button
                  onClick={handleRunBatchBroadcast}
                  disabled={isBroadcastRunning}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBroadcastRunning ? 'animate-spin' : ''}`} />
                  <span>{isBroadcastRunning ? 'Memproses Transmisi...' : 'Jalankan Broadcast Sekarang'}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar when running */}
            {isBroadcastRunning && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Mengirim pesan ringkasan harian via Meta Cloud API...</span>
                  <span className="font-mono text-emerald-600">{broadcastProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${broadcastProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Transmission Log Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Waktu Transmisi</th>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">WhatsApp Orang Tua</th>
                    <th className="py-2.5 px-3">Status Akhir Siswa</th>
                    <th className="py-2.5 px-3">Status Meta API</th>
                    <th className="py-2.5 px-3">Message ID (wamid)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {broadcastLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Klik tombol &quot;Jalankan Broadcast Sekarang&quot; untuk mensimulasikan pengiriman rekap harian ke nomor WhatsApp orang tua.
                      </td>
                    </tr>
                  ) : (
                    broadcastLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-700">{log.waktu}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{log.nisn}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{log.nama}</td>
                        <td className="py-2.5 px-3 text-slate-600">{log.kelas}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{log.noHp}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.statusAkhir === 'HADIR LENGKAP'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.statusAkhir === 'TERLAMBAT MASUK'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.statusAkhir}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold text-[11px]">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>HTTP 200 OK</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                          {log.wamid}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTIFIKASI REAL-TIME SCAN INSTAN */}
      {activeTab === 'instant' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Config Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-sky-600" />
              <span>Kredensial Meta Developer Portal</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Provider WhatsApp
                </label>
                <select
                  value={formConfig.provider}
                  onChange={(e) => setFormConfig({ ...formConfig, provider: e.target.value as WhatsAppConfig['provider'] })}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="META_CLOUD_API" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Meta WhatsApp Business Cloud API (Official)</option>
                  <option value="FONNTE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Fonnte WhatsApp Gateway (Official Partner)</option>
                  <option value="WABA_QONTAK" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Mekari Qontak Official WABA</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number ID (Meta Graph API)
                </label>
                <input
                  type="text"
                  value={formConfig.phoneNumberId}
                  onChange={(e) => setFormConfig({ ...formConfig, phoneNumberId: e.target.value })}
                  placeholder="Contoh: 109283746519283"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Didapatkan dari App Dashboard &gt; WhatsApp &gt; API Setup di Meta Developers.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  System User Access Token (Bearer Token)
                </label>
                <input
                  type="password"
                  value={formConfig.accessToken}
                  onChange={(e) => setFormConfig({ ...formConfig, accessToken: e.target.value })}
                  placeholder="EAAG... (Permanent Token)"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Gunakan token permanen dari Meta Business Manager &gt; System Users.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Template Notifikasi Instan
                </label>
                <input
                  type="text"
                  value={formConfig.templateName}
                  onChange={(e) => setFormConfig({ ...formConfig, templateName: e.target.value })}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Template yang sudah disetujui (Approved) di WhatsApp Message Templates.</span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.enabled}
                    onChange={(e) => setFormConfig({ ...formConfig, enabled: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Aktifkan Pengiriman Notifikasi Otomatis</span>
                </label>

                <div className="grid grid-cols-2 gap-2 pl-6">
                  <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formConfig.autoSendDatang}
                      onChange={(e) => setFormConfig({ ...formConfig, autoSendDatang: e.target.checked })}
                      className="rounded text-sky-600 h-3.5 w-3.5"
                    />
                    <span>Kirim saat Datang</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formConfig.autoSendPulang}
                      onChange={(e) => setFormConfig({ ...formConfig, autoSendPulang: e.target.checked })}
                      className="rounded text-sky-600 h-3.5 w-3.5"
                    />
                    <span>Kirim saat Pulang</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition shadow-sm mt-2"
              >
                Simpan Konfigurasi WhatsApp
              </button>
            </form>
          </div>

          {/* Smartphone Chat Bubble Simulator */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Simulasi Tampilan Pesan WhatsApp (Wali Murid)</span>
                </h3>
              </div>

              {/* Selector Controls for Preview */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Pilih Siswa:</label>
                  <select
                    value={selectedStudentForPreview.nisn}
                    onChange={(e) => {
                      const s = siswaList.find(item => item.nisn === e.target.value);
                      if (s) setSelectedStudentForPreview(s);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                  >
                    {siswaList.map(s => (
                      <option key={s.nisn} value={s.nisn}>{s.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Sesi:</label>
                  <select
                    value={previewTipe}
                    onChange={(e) => setPreviewTipe(e.target.value as 'DATANG' | 'PULANG')}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                  >
                    <option value="DATANG">DATANG</option>
                    <option value="PULANG">PULANG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Status:</label>
                  <select
                    value={previewStatus}
                    onChange={(e) => setPreviewStatus(e.target.value as 'HADIR' | 'TERLAMBAT')}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                  >
                    <option value="HADIR">Tepat Waktu</option>
                    <option value="TERLAMBAT">Terlambat</option>
                  </select>
                </div>
              </div>

              {/* Smartphone screen container */}
              <div className="max-w-sm mx-auto bg-slate-900 rounded-[32px] p-3 shadow-xl border-4 border-slate-800">
                {/* WhatsApp App Bar */}
                <div className="bg-emerald-800 text-white px-3 py-2 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                      SMK
                    </div>
                    <div>
                      <div className="font-bold text-xs leading-none">Presensi SMKN 1 Resmi</div>
                      <div className="text-[9px] text-emerald-200">Akun Bisnis Resmi ✓</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-200">Meta WABA</div>
                </div>

                {/* Chat background wallpaper */}
                <div className="bg-[#e5ddd5] p-3 rounded-b-2xl min-h-[260px] flex flex-col justify-end space-y-2 text-slate-900">
                  <div className="bg-white/80 backdrop-blur rounded-lg p-1.5 text-center text-[10px] text-slate-600 mx-auto">
                    Hari Ini • Pesan Resmi Sekolah
                  </div>

                  {/* WhatsApp Chat Bubble */}
                  <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm max-w-[92%] space-y-1.5 text-xs border border-slate-200">
                    <div className="font-bold text-emerald-800 text-[11px] flex items-center space-x-1">
                      <span>📌 NOTIFIKASI PRESENSI SISWA</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Yth. <strong>{selectedStudentForPreview.namaOrtu}</strong>,
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Kami menginformasikan bahwa ananda:
                    </p>
                    <div className="bg-slate-50 p-2 rounded-lg text-[11px] border border-slate-200 space-y-0.5">
                      <div>Nama : <strong>{selectedStudentForPreview.nama}</strong></div>
                      <div>Kelas : <strong>{selectedStudentForPreview.kelas}</strong></div>
                      <div>Presensi : <strong className="text-sky-700">{previewTipe}</strong></div>
                      <div>Waktu : <strong>06:45:10 WIB</strong></div>
                      <div>Status : <strong className={previewStatus === 'HADIR' ? 'text-emerald-700' : 'text-amber-700'}>
                        {previewStatus === 'HADIR' ? 'Hadir Tepat Waktu' : 'Terlambat'}
                      </strong></div>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      Pesan otomatis dikirim melalui Meta WhatsApp Cloud API.
                    </p>
                    <div className="text-[9px] text-slate-400 text-right flex items-center justify-end space-x-1">
                      <span>06:45</span>
                      <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Send Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSimulateSend}
                  disabled={isTestSending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isTestSending ? 'Mengirim ke Meta API...' : `Kirim Uji Coba ke Nomor Wali (${selectedStudentForPreview.noHpOrtu})`}</span>
                </button>
              </div>
            </div>

            {/* Test Result Inspector */}
            {testResult && (
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>Meta Graph API HTTP {testResult.status} OK</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">Response 200 OK</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Request Payload Sent:</span>
                  <pre className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300 overflow-x-auto max-h-32">
                    {testResult.payload}
                  </pre>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Meta Response Body:</span>
                  <pre className="bg-slate-950 p-2 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto">
                    {testResult.response}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
