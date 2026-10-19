'use client';

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Printer, 
  Download, 
  Save, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Trash2, 
  GraduationCap,
  Award,
  Layers
} from 'lucide-react';
import { 
  Siswa, 
  GuruMapel, 
  SchoolProfile, 
  User, 
  JurnalKbmRecord, 
  AbsensiMapelSiswa,
  JadwalPelajaranItem
} from '@/types/attendance';
import { JadwalPelajaranSection } from './JadwalPelajaranSection';

interface JurnalKbmSectionProps {
  currentUser: User;
  siswaList: Siswa[];
  guruMapelList: GuruMapel[];
  schoolProfile: SchoolProfile;
  jurnalList: JurnalKbmRecord[];
  onSaveJurnal: (record: JurnalKbmRecord) => void;
  onDeleteJurnal: (id: string) => void;
}

const JAM_PELAJARAN_OPTIONS = [
  'Jam 1-2 (07:15 - 08:35)',
  'Jam 3-4 (08:35 - 09:55)',
  'Jam 5-6 (10:15 - 11:35)',
  'Jam 7-8 (11:35 - 12:55)',
  'Jam 9-10 (13:20 - 14:40)'
];

const MAPEL_OPTIONS = [
  'Matematika',
  'IPA (Ilmu Pengetahuan Alam)',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Agama Islam & Budi Pekerti',
  'Pendidikan Pancasila (PPKn)',
  'IPS (Ilmu Pengetahuan Sosial)',
  'Informatika',
  'PJOK (Pendidikan Jasmani)',
  'Seni & Budaya',
  'Prakarya'
];

export const JurnalKbmSection: React.FC<JurnalKbmSectionProps> = ({
  currentUser,
  siswaList,
  guruMapelList,
  schoolProfile,
  jurnalList,
  onSaveJurnal,
  onDeleteJurnal
}) => {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'form' | 'riwayat'>('jadwal');

  // Form State
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Available Classes
  const availableClasses = useMemo(() => {
    return Array.from(new Set(siswaList.map(s => s.kelas))).filter(Boolean).sort();
  }, [siswaList]);

  const [selectedKelas, setSelectedKelas] = useState<string>(availableClasses[0] || '7A');
  const [selectedMapel, setSelectedMapel] = useState<string>('Matematika');
  const [selectedJamKe, setSelectedJamKe] = useState<string>(JAM_PELAJARAN_OPTIONS[0]);
  
  // Default Guru name if user is GURU
  const [guruNama, setGuruNama] = useState<string>(() => {
    if (currentUser.role === 'GURU') return currentUser.nama;
    return guruMapelList[0]?.nama || 'Drs. H. Muhammad Ilyas, M.Pd';
  });

  const handleSelectScheduleForJurnal = (schedule: JadwalPelajaranItem) => {
    setSelectedKelas(schedule.kelas);
    setSelectedMapel(schedule.mapel);
    setSelectedJamKe(schedule.jamKe);
    setGuruNama(schedule.guruNama);
    setActiveTab('form');
  };

  const [materiAjar, setMateriAjar] = useState<string>('');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState<string>('');
  const [catatanKejadian, setCatatanKejadian] = useState<string>('');

  // Attendance state for each student in the selected class
  const classStudents = useMemo(() => {
    return siswaList.filter(s => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  const [absensiMap, setAbsensiMap] = useState<Record<string, { status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPEN'; catatan: string }>>({});

  // Initialize or reset student attendance map when class changes
  const currentClassAttendance = useMemo(() => {
    return classStudents.map(s => {
      const existing = absensiMap[s.nisn];
      return {
        nisn: s.nisn,
        nama: s.nama,
        kelas: s.kelas,
        status: existing?.status || 'HADIR',
        catatan: existing?.catatan || ''
      };
    });
  }, [classStudents, absensiMap]);

  // Statistics for current form
  const stats = useMemo(() => {
    const total = currentClassAttendance.length;
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let dispen = 0;

    currentClassAttendance.forEach(a => {
      if (a.status === 'HADIR') hadir++;
      else if (a.status === 'SAKIT') sakit++;
      else if (a.status === 'IZIN') izin++;
      else if (a.status === 'ALPA') alpa++;
      else if (a.status === 'DISPEN') dispen++;
    });

    const percent = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { total, hadir, sakit, izin, alpa, dispen, percent };
  }, [currentClassAttendance]);

  // Bulk set all to HADIR
  const handleSetAllHadir = () => {
    const updated: Record<string, { status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPEN'; catatan: string }> = {};
    classStudents.forEach(s => {
      updated[s.nisn] = { status: 'HADIR', catatan: absensiMap[s.nisn]?.catatan || '' };
    });
    setAbsensiMap(updated);
  };

  const handleUpdateStudentStatus = (nisn: string, status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPEN') => {
    setAbsensiMap(prev => ({
      ...prev,
      [nisn]: {
        status,
        catatan: prev[nisn]?.catatan || ''
      }
    }));
  };

  const handleUpdateStudentCatatan = (nisn: string, catatan: string) => {
    setAbsensiMap(prev => ({
      ...prev,
      [nisn]: {
        status: prev[nisn]?.status || 'HADIR',
        catatan
      }
    }));
  };

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSubmitJurnal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiAjar.trim()) {
      alert('Materi pokok pembelajaran wajib diisi!');
      return;
    }

    const newRecord: JurnalKbmRecord = {
      id: `JRNL-${Date.now()}`,
      tanggal: selectedTanggal,
      kelas: selectedKelas,
      mapel: selectedMapel,
      guruNama: guruNama,
      jamKe: selectedJamKe,
      materiAjar: materiAjar.trim(),
      tujuanPembelajaran: tujuanPembelajaran.trim(),
      catatanKejadian: catatanKejadian.trim(),
      absensiSiswa: currentClassAttendance,
      dibuatPada: new Date().toISOString()
    };

    onSaveJurnal(newRecord);
    setSaveSuccessMsg(`Jurnal KBM untuk kelas ${selectedKelas} mata pelajaran ${selectedMapel} berhasil disimpan!`);
    
    // Reset form fields
    setMateriAjar('');
    setTujuanPembelajaran('');
    setCatatanKejadian('');

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Filter state for Riwayat tab
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [searchRiwayat, setSearchRiwayat] = useState<string>('');

  const filteredJurnalList = useMemo(() => {
    return jurnalList.filter(j => {
      const matchKelas = filterKelas === 'SEMUA' || j.kelas === filterKelas;
      const matchSearch = !searchRiwayat || 
        j.materiAjar.toLowerCase().includes(searchRiwayat.toLowerCase()) ||
        j.mapel.toLowerCase().includes(searchRiwayat.toLowerCase()) ||
        j.guruNama.toLowerCase().includes(searchRiwayat.toLowerCase());
      return matchKelas && matchSearch;
    });
  }, [jurnalList, filterKelas, searchRiwayat]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md border border-teal-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Presensi Jam Pelajaran & Jurnal KBM Guru</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Pencatatan kehadiran siswa per jam tatap muka pelajaran, topik materi pokok, tujuan pembelajaran, dan dokumentasi keterlaksanaan KBM kelas.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'jadwal' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Mingguan</span>
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'form' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Isi Jurnal Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'riwayat' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Riwayat Jurnal</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-teal-300 font-mono">
              {jurnalList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSaveSuccessMsg(null)}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB 0: JADWAL PELAJARAN MINGGUAN GURU & ROMBEL */}
      {activeTab === 'jadwal' && (
        <div className="animate-in fade-in duration-200">
          <JadwalPelajaranSection
            guruMapelList={guruMapelList}
            availableClasses={availableClasses}
            schoolProfile={schoolProfile}
            currentUser={currentUser}
            onSelectScheduleForJurnal={handleSelectScheduleForJurnal}
          />
        </div>
      )}

      {/* TAB 1: FORMULIR INPUT JURNAL & PRESENSI JAM PELAJARAN */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmitJurnal} className="space-y-6">
          
          {/* Metadata Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              1. Informasi Sesi Pembelajaran & Guru Pengampu
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              
              {/* Tanggal */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tanggal KBM</label>
                <input
                  type="date"
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                  required
                />
              </div>

              {/* Kelas */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kelas / Rombel</label>
                <select
                  value={selectedKelas}
                  onChange={(e) => {
                    setSelectedKelas(e.target.value);
                    setAbsensiMap({}); // Reset map for new class
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-bold bg-white"
                >
                  {availableClasses.map(k => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </select>
              </div>

              {/* Jam Pelajaran Ke */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Jam Pelajaran</label>
                <select
                  value={selectedJamKe}
                  onChange={(e) => setSelectedJamKe(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium bg-white"
                >
                  {JAM_PELAJARAN_OPTIONS.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mata Pelajaran</label>
                <select
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-bold bg-white"
                >
                  {MAPEL_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Guru Pengampu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Guru Pengampu</label>
                <input
                  type="text"
                  value={guruNama}
                  onChange={(e) => setGuruNama(e.target.value)}
                  placeholder="Nama Lengkap & Gelar Guru"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Materi Pokok / Pembahasan</label>
                <input
                  type="text"
                  value={materiAjar}
                  onChange={(e) => setMateriAjar(e.target.value)}
                  placeholder="Contoh: Bab 3 - Persamaan Linier Dua Variabel (SPLDV)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                  required
                />
              </div>
            </div>

            {/* Capaian Pembelajaran & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tujuan / Capaian Pembelajaran</label>
                <input
                  type="text"
                  value={tujuanPembelajaran}
                  onChange={(e) => setTujuanPembelajaran(e.target.value)}
                  placeholder="Peserta didik dapat menyelesaikan model matematika SPLDV..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Kelas / Hambatan / Kejadian</label>
                <input
                  type="text"
                  value={catatanKejadian}
                  onChange={(e) => setCatatanKejadian(e.target.value)}
                  placeholder="Kegiatan diskusi kelompok berjalan tertib, 1 siswa izin ke UKS..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

          </div>

          {/* Student Attendance Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Header with Stats & Quick Actions */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-700" />
                  2. Presensi Siswa Kelas {selectedKelas} ({stats.total} Siswa)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik status per siswa atau klik tombol &quot;Tandai Semua Hadir&quot; untuk mempercepat absensi.
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                  {stats.hadir} Hadir ({stats.percent}%)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold">
                  {stats.sakit} Sakit
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-semibold">
                  {stats.izin} Izin
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-semibold">
                  {stats.alpa} Alpa
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">
                  {stats.dispen} Dispen
                </span>

                <button
                  type="button"
                  onClick={handleSetAllHadir}
                  className="px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hadir Semua (H)</span>
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 w-28">NISN</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3 w-56 text-center">Status Kehadiran Jam Ini</th>
                    <th className="py-2.5 px-3">Catatan Khusus (Opsional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentClassAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Tidak ada siswa terdaftar di kelas {selectedKelas}.
                      </td>
                    </tr>
                  ) : (
                    currentClassAttendance.map((siswa, idx) => (
                      <tr key={siswa.nisn} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {siswa.nisn}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {siswa.nama}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentStatus(siswa.nisn, 'HADIR')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                                siswa.status === 'HADIR'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              H
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentStatus(siswa.nisn, 'SAKIT')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                                siswa.status === 'SAKIT'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              S
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentStatus(siswa.nisn, 'IZIN')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                                siswa.status === 'IZIN'
                                  ? 'bg-sky-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentStatus(siswa.nisn, 'ALPA')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                                siswa.status === 'ALPA'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentStatus(siswa.nisn, 'DISPEN')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                                siswa.status === 'DISPEN'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              D
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={siswa.catatan}
                            onChange={(e) => handleUpdateStudentCatatan(siswa.nisn, e.target.value)}
                            className="w-full text-xs px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Action Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Data presensi jam ini akan otomatis tersimpan dalam histori jurnal guru dan terhubung ke spreadsheet.
              </div>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition transform active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Jurnal KBM & Absensi</span>
              </button>
            </div>

          </div>

        </form>
      )}

      {/* TAB 2: RIWAYAT JURNAL KBM GURU */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="font-semibold text-slate-600">Filter Kelas:</span>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                <option value="SEMUA">Semua Kelas</option>
                {availableClasses.map(k => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchRiwayat}
                onChange={(e) => setSearchRiwayat(e.target.value)}
                placeholder="Cari materi / mapel / guru..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Journal Records Cards */}
          {filteredJurnalList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">Belum Ada Catatan Jurnal KBM</div>
              <p className="text-xs text-slate-400">
                Silakan gunakan tab &quot;Isi Jurnal Baru&quot; untuk mengisi kegiatan belajar mengajar dan absensi per jam.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJurnalList.map((journal) => {
                const totalSiswa = journal.absensiSiswa?.length || 0;
                const hadirCount = journal.absensiSiswa?.filter(s => s.status === 'HADIR').length || 0;
                const percent = totalSiswa > 0 ? Math.round((hadirCount / totalSiswa) * 100) : 0;

                return (
                  <div
                    key={journal.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-xs">
                            Kelas {journal.kelas}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {journal.mapel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {journal.guruNama} • {journal.jamKe}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan jurnal ini?`)) {
                            onDeleteJurnal(journal.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                        title="Hapus Jurnal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 border-t border-b border-slate-100 py-2.5">
                      <div>
                        <span className="font-semibold text-slate-900">Materi: </span>
                        <span>{journal.materiAjar}</span>
                      </div>
                      {journal.tujuanPembelajaran && (
                        <div className="text-slate-500 text-[11px]">
                          <span className="font-medium">Tujuan: </span>
                          <span>{journal.tujuanPembelajaran}</span>
                        </div>
                      )}
                      {journal.catatanKejadian && (
                        <div className="text-slate-500 text-[11px] italic">
                          <span>Catatan: </span>
                          <span>{journal.catatanKejadian}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer with Attendance percentage */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-700">
                          Kehadiran: {hadirCount}/{totalSiswa} ({percent}%)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {journal.tanggal}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
