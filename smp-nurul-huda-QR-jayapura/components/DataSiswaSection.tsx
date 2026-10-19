/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { Siswa, User, TableDensity, SchoolProfile, GuruMapel } from '@/types/attendance';
import { SchoolLogo } from '@/components/SchoolLogo';
import { KartuPelajarDigital } from '@/components/KartuPelajarDigital';
import { BatchPrintCardsModal } from '@/components/BatchPrintCardsModal';
import { 
  Users, 
  UserPlus, 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  QrCode, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Printer, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck,
  Check,
  Info,
  LayoutGrid,
  List,
  School,
  GraduationCap,
  Settings,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

interface DataSiswaSectionProps {
  siswaList: Siswa[];
  onAddSiswa: (newSiswa: Siswa) => void;
  onUpdateSiswa: (updatedSiswa: Siswa) => void;
  onDeleteSiswa: (nisn: string) => void;
  onBulkImportSiswa: (newList: Siswa[], mode: 'update' | 'skip') => { added: number; updated: number };
  currentUser: User;
  schoolProfile?: SchoolProfile;
  guruMapelList?: GuruMapel[];
  onAddGuruMapel?: (guru: GuruMapel) => void;
  onUpdateGuruMapel?: (guru: GuruMapel) => void;
  onDeleteGuruMapel?: (id: string) => void;
  onOpenSchoolSettings?: () => void;
}

interface ParsedImportRow {
  rowNumber: number;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  namaOrtu: string;
  noHpOrtu: string;
  alamat: string;
  status: 'VALID' | 'DUPLIKAT' | 'INVALID';
  pesanError?: string;
}

export const DataSiswaSection: React.FC<DataSiswaSectionProps> = ({
  siswaList,
  onAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  onBulkImportSiswa,
  currentUser,
  schoolProfile,
  guruMapelList = [],
  onAddGuruMapel,
  onUpdateGuruMapel,
  onDeleteGuruMapel,
  onOpenSchoolSettings
}) => {
  // Density mode: 'normal' | 'compact' | 'card'
  const [density, setDensity] = useState<TableDensity>('compact');
  // Sub-tabs: 'siswa' | 'guru'
  const [subTab, setSubTab] = useState<'siswa' | 'guru'>('siswa');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('SEMUA');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Siswa | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Siswa | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');

  // Form State for Manual Add / Edit
  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    kelas: '',
    jenisKelamin: 'L' as 'L' | 'P',
    namaOrtu: '',
    noHpOrtu: '',
    alamat: '',
    fotoUrl: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Guru Mapel State & Handlers
  const [guruSearch, setGuruSearch] = useState('');
  const [showGuruModal, setShowGuruModal] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruMapel | null>(null);
  const [guruForm, setGuruForm] = useState({
    nama: '',
    nip: '',
    mapel: '',
    noHp: '',
    kelasAjar: ''
  });

  const filteredGuru = useMemo(() => {
    return guruMapelList.filter(g => 
      g.nama.toLowerCase().includes(guruSearch.toLowerCase()) ||
      g.mapel.toLowerCase().includes(guruSearch.toLowerCase()) ||
      g.nip.toLowerCase().includes(guruSearch.toLowerCase())
    );
  }, [guruMapelList, guruSearch]);

  const handleOpenAddGuru = () => {
    setEditingGuru(null);
    setGuruForm({ nama: '', nip: '', mapel: '', noHp: '', kelasAjar: 'Semua Kelas' });
    setShowGuruModal(true);
  };

  const handleOpenEditGuru = (guru: GuruMapel) => {
    setEditingGuru(guru);
    setGuruForm({
      nama: guru.nama,
      nip: guru.nip || '',
      mapel: guru.mapel,
      noHp: guru.noHp || '',
      kelasAjar: typeof guru.kelasAjar === 'string' ? guru.kelasAjar : (Array.isArray(guru.kelasAjar) ? (guru.kelasAjar as string[]).join(', ') : '')
    });
    setShowGuruModal(true);
  };

  const handleSaveGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guruForm.nama.trim() || !guruForm.mapel.trim()) return;

    const kelasStr = guruForm.kelasAjar.trim() || 'Semua Kelas';

    if (editingGuru) {
      if (onUpdateGuruMapel) {
        onUpdateGuruMapel({
          ...editingGuru,
          nama: guruForm.nama.trim(),
          nip: guruForm.nip.trim() || '-',
          mapel: guruForm.mapel.trim(),
          noHp: guruForm.noHp.trim(),
          kelasAjar: kelasStr
        });
      }
    } else {
      if (onAddGuruMapel) {
        onAddGuruMapel({
          id: `GURU-${Date.now()}`,
          nama: guruForm.nama.trim(),
          nip: guruForm.nip.trim() || '-',
          mapel: guruForm.mapel.trim(),
          noHp: guruForm.noHp.trim(),
          kelasAjar: kelasStr,
          status: 'AKTIF'
        });
      }
    }
    setShowGuruModal(false);
  };

  const handleDeleteGuru = (id: string, nama: string) => {
    if (window.confirm(`Hapus guru mata pelajaran "${nama}"?`)) {
      onDeleteGuruMapel?.(id);
    }
  };

  // Bulk Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [importDuplicateMode, setImportDuplicateMode] = useState<'update' | 'skip'>('update');
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // Distinct classes list for filter
  const distinctKelasList = useMemo(() => {
    const set = new Set<string>();
    siswaList.forEach(s => {
      if (s.kelas) set.add(s.kelas);
    });
    return Array.from(set).sort();
  }, [siswaList]);

  // Filtered students
  const filteredSiswa = useMemo(() => {
    return siswaList.filter(s => {
      const matchKelas = filterKelas === 'SEMUA' || s.kelas === filterKelas;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        s.nisn.toLowerCase().includes(q) ||
        s.nama.toLowerCase().includes(q) ||
        s.namaOrtu.toLowerCase().includes(q) ||
        s.noHpOrtu.includes(q);
      return matchKelas && matchSearch;
    });
  }, [siswaList, filterKelas, searchQuery]);

  // KPIs
  const totalLaki = useMemo(() => siswaList.filter(s => s.jenisKelamin === 'L').length, [siswaList]);
  const totalPerempuan = useMemo(() => siswaList.filter(s => s.jenisKelamin === 'P').length, [siswaList]);
  const totalWithWa = useMemo(() => siswaList.filter(s => s.noHpOrtu && s.noHpOrtu.length >= 10).length, [siswaList]);

  // Normalization helper for WhatsApp Number
  const normalizePhoneNumber = (raw: string): string => {
    let clean = String(raw || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62') && clean.length > 0) {
      clean = '62' + clean;
    }
    return clean;
  };

  // =========================================================================
  // 1. HANDLER: TAMBAH SISWA MANUAL
  // =========================================================================
  const handleOpenAddModal = () => {
    setFormData({
      nisn: '',
      nama: '',
      kelas: distinctKelasList[0] || 'XII RPL 1',
      jenisKelamin: 'L',
      namaOrtu: '',
      noHpOrtu: '',
      alamat: '',
      fotoUrl: ''
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNisn = formData.nisn.trim();
    const cleanNama = formData.nama.trim();
    const cleanKelas = formData.kelas.trim();

    if (!cleanNisn) {
      setFormError('Nomor NISN wajib diisi.');
      return;
    }
    if (!cleanNama) {
      setFormError('Nama lengkap siswa wajib diisi.');
      return;
    }
    if (!cleanKelas) {
      setFormError('Kelas siswa wajib dipilih atau diisi.');
      return;
    }

    // Check duplicate NISN
    const exists = siswaList.some(s => s.nisn === cleanNisn);
    if (exists) {
      setFormError(`NISN "${cleanNisn}" sudah terdaftar dalam sistem. Gunakan NISN yang berbeda.`);
      return;
    }

    const cleanWa = normalizePhoneNumber(formData.noHpOrtu);
    const newStudent: Siswa = {
      nisn: cleanNisn,
      nama: cleanNama,
      kelas: cleanKelas,
      jenisKelamin: formData.jenisKelamin,
      namaOrtu: formData.namaOrtu.trim() || `Wali dari ${cleanNama}`,
      noHpOrtu: cleanWa,
      alamat: formData.alamat.trim() || undefined,
      fotoUrl: formData.fotoUrl.trim() || undefined,
      qrBadgeToken: `SISWA-${cleanNisn}-HASH${Math.floor(10 + Math.random() * 89)}`
    };

    onAddSiswa(newStudent);
    setShowAddModal(false);
  };

  // =========================================================================
  // 2. HANDLER: EDIT SISWA
  // =========================================================================
  const handleOpenEditModal = (student: Siswa) => {
    setSelectedStudentForEdit(student);
    setFormData({
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      jenisKelamin: student.jenisKelamin,
      namaOrtu: student.namaOrtu,
      noHpOrtu: student.noHpOrtu,
      alamat: student.alamat || '',
      fotoUrl: student.fotoUrl || ''
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEdit) return;

    const cleanNama = formData.nama.trim();
    const cleanKelas = formData.kelas.trim();

    if (!cleanNama) {
      setFormError('Nama lengkap siswa tidak boleh kosong.');
      return;
    }

    const updated: Siswa = {
      ...selectedStudentForEdit,
      nama: cleanNama,
      kelas: cleanKelas,
      jenisKelamin: formData.jenisKelamin,
      namaOrtu: formData.namaOrtu.trim() || `Wali dari ${cleanNama}`,
      noHpOrtu: normalizePhoneNumber(formData.noHpOrtu),
      alamat: formData.alamat.trim() || undefined,
      fotoUrl: formData.fotoUrl.trim() || undefined
    };

    onUpdateSiswa(updated);
    setShowEditModal(false);
    setSelectedStudentForEdit(null);
  };

  // =========================================================================
  // 3. HANDLER: PREVIEW QR BADGE
  // =========================================================================
  const handleOpenQrBadge = async (student: Siswa) => {
    setSelectedStudentForQr(student);
    const token = student.qrBadgeToken || `SISWA-${student.nisn}`;
    try {
      const url = await QRCode.toDataURL(token, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0B132B',
          light: '#ffffff'
        }
      });
      setQrModalDataUrl(url);
      setShowQrModal(true);
    } catch (err) {
      console.error('Gagal membuat QR token:', err);
    }
  };

  // =========================================================================
  // 4. HANDLER: UNDUH TEMPLATE EXCEL & CSV
  // =========================================================================
  const handleDownloadTemplateExcel = () => {
    const headers = [
      'NO',
      'NISN',
      'NAMA_SISWA',
      'KELAS',
      'JENIS_KELAMIN',
      'NAMA_WALI',
      'NO_WA_ORTU',
      'ALAMAT'
    ];

    const sampleRows = [
      [1, '0061234510', 'Bagus Ramadhan Pratama', 'XII RPL 1', 'L', 'Bpk. Ramadhan Syahputra', '081234567890', 'Jl. Merdeka No. 10'],
      [2, '0061234511', 'Citra Dewi Lestari', 'XII RPL 1', 'P', 'Ibu Lestari Widowati', '085712345678', 'Jl. Kenari No. 22'],
      [3, '0061234512', 'Doni Setiawan', 'XII RPL 2', 'L', 'Bpk. Setiawan', '087898765432', 'Jl. Sudirman No. 45']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 15 }, // NISN
      { wch: 28 }, // NAMA_SISWA
      { wch: 14 }, // KELAS
      { wch: 14 }, // JENIS_KELAMIN
      { wch: 25 }, // NAMA_WALI
      { wch: 18 }, // NO_WA_ORTU
      { wch: 32 }  // ALAMAT
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TEMPLATE_SISWA');
    XLSX.writeFile(workbook, 'TEMPLATE_IMPORT_SISWA.xlsx');
  };

  const handleDownloadTemplateCSV = () => {
    const headers = ['NO', 'NISN', 'NAMA_SISWA', 'KELAS', 'JENIS_KELAMIN', 'NAMA_WALI', 'NO_WA_ORTU', 'ALAMAT'];
    const sampleRows = [
      ['1', '0061234510', '"Bagus Ramadhan Pratama"', 'XII RPL 1', 'L', '"Bpk. Ramadhan Syahputra"', '081234567890', '"Jl. Merdeka No. 10"'],
      ['2', '0061234511', '"Citra Dewi Lestari"', 'XII RPL 1', 'P', '"Ibu Lestari Widowati"', '085712345678', '"Jl. Kenari No. 22"']
    ];

    const csvContent = '\uFEFFsep=,\r\n' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TEMPLATE_IMPORT_SISWA.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export current students to Excel
  const handleExportDataSiswaExcel = () => {
    const headers = ['NO', 'NISN', 'NAMA_SISWA', 'KELAS', 'JENIS_KELAMIN', 'NAMA_WALI', 'NO_WA_ORTU', 'ALAMAT', 'TOKEN_BADGE_QR'];
    const rows = filteredSiswa.map((s, idx) => [
      idx + 1,
      String(s.nisn),
      s.nama,
      s.kelas,
      s.jenisKelamin,
      s.namaOrtu,
      String(s.noHpOrtu),
      s.alamat || '-',
      s.qrBadgeToken || `SISWA-${s.nisn}`
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 25 },
      { wch: 18 },
      { wch: 30 },
      { wch: 26 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DATA_SISWA');
    XLSX.writeFile(workbook, `DATA_SISWA_${filterKelas}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // =========================================================================
  // 5. HANDLER: PARSE FILE IMPORT (EXCEL / CSV)
  // =========================================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setImportFileName(file.name);
    setImportStatusMessage(null);
    setIsProcessingImport(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to json array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!rawJson || rawJson.length < 2) {
          setImportStatusMessage('File kosong atau tidak memiliki baris data.');
          setParsedRows([]);
          setIsProcessingImport(false);
          return;
        }

        // Find header row index
        const headerRow: string[] = (rawJson[0] as string[]).map(h => String(h || '').trim().toUpperCase());
        
        // Match header column indexes
        const nisnIdx = headerRow.findIndex(h => h.includes('NISN') || h.includes('INDUK'));
        const namaIdx = headerRow.findIndex(h => h.includes('NAMA') && !h.includes('WALI') && !h.includes('ORTU'));
        const kelasIdx = headerRow.findIndex(h => h.includes('KELAS') || h.includes('TINGKAT'));
        const jkIdx = headerRow.findIndex(h => h.includes('KELAMIN') || h.includes('JK') || h.includes('GENDER'));
        const waliIdx = headerRow.findIndex(h => h.includes('WALI') || h.includes('ORTU') && !h.includes('NO') && !h.includes('HP'));
        const waIdx = headerRow.findIndex(h => h.includes('WA') || h.includes('HP') || h.includes('TELEPON') || h.includes('TELP'));
        const alamatIdx = headerRow.findIndex(h => h.includes('ALAMAT'));

        const existingNisnMap = new Set(siswaList.map(s => s.nisn));
        const seenInFile = new Set<string>();

        const parsed: ParsedImportRow[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          // Check if row has any non-empty cell
          const hasData = row.some((cell: any) => String(cell || '').trim().length > 0);
          if (!hasData) continue;

          let rawNisn = String(nisnIdx >= 0 ? row[nisnIdx] : row[1] || '').trim();
          // Remove leading apostrophe or spaces
          rawNisn = rawNisn.replace(/^'+/, '').trim();

          const rawNama = String(namaIdx >= 0 ? row[namaIdx] : row[2] || '').trim();
          const rawKelas = String(kelasIdx >= 0 ? row[kelasIdx] : row[3] || 'XII RPL 1').trim();
          
          let rawJk: 'L' | 'P' = 'L';
          const jkVal = String(jkIdx >= 0 ? row[jkIdx] : row[4] || '').toUpperCase().trim();
          if (jkVal.startsWith('P') || jkVal === 'WANITA' || jkVal === 'PEREMPUAN') {
            rawJk = 'P';
          }

          const rawWali = String(waliIdx >= 0 ? row[waliIdx] : row[5] || '').trim();
          const rawWa = String(waIdx >= 0 ? row[waIdx] : row[6] || '').trim();
          const rawAlamat = String(alamatIdx >= 0 ? row[alamatIdx] : row[7] || '').trim();

          // Validation
          let status: 'VALID' | 'DUPLIKAT' | 'INVALID' = 'VALID';
          let pesanError: string | undefined = undefined;

          if (!rawNisn) {
            status = 'INVALID';
            pesanError = 'NISN kosong';
          } else if (!rawNama) {
            status = 'INVALID';
            pesanError = 'Nama siswa kosong';
          } else if (seenInFile.has(rawNisn)) {
            status = 'INVALID';
            pesanError = 'NISN duplikat ganda di dalam file ini';
          } else if (existingNisnMap.has(rawNisn)) {
            status = 'DUPLIKAT';
            pesanError = 'NISN sudah ada di database';
          }

          if (rawNisn) {
            seenInFile.add(rawNisn);
          }

          parsed.push({
            rowNumber: i,
            nisn: rawNisn,
            nama: rawNama,
            kelas: rawKelas || 'XII RPL 1',
            jenisKelamin: rawJk,
            namaOrtu: rawWali || `Wali dari ${rawNama}`,
            noHpOrtu: normalizePhoneNumber(rawWa),
            alamat: rawAlamat,
            status,
            pesanError
          });
        }

        setParsedRows(parsed);
      } catch (err: any) {
        console.error('Error parsing file:', err);
        setImportStatusMessage(`Gagal membaca file: ${err?.message || 'Format tidak didukung'}`);
      } finally {
        setIsProcessingImport(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Execute bulk import
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    // Filter valid rows and duplicate rows (if mode === 'update')
    const toImport: Siswa[] = [];

    parsedRows.forEach(row => {
      if (row.status === 'VALID' || (row.status === 'DUPLIKAT' && importDuplicateMode === 'update')) {
        toImport.push({
          nisn: row.nisn,
          nama: row.nama,
          kelas: row.kelas,
          jenisKelamin: row.jenisKelamin,
          namaOrtu: row.namaOrtu,
          noHpOrtu: row.noHpOrtu,
          alamat: row.alamat || undefined,
          qrBadgeToken: `SISWA-${row.nisn}-HASH${Math.floor(10 + Math.random() * 89)}`
        });
      }
    });

    if (toImport.length === 0) {
      alert('Tidak ada baris data valid yang dapat diimpor.');
      return;
    }

    const res = onBulkImportSiswa(toImport, importDuplicateMode);
    alert(`Impor Sukses!\n- Siswa Baru Ditambahkan: ${res.added}\n- Siswa Diperbarui: ${res.updated}`);
    setShowImportModal(false);
    setParsedRows([]);
    setImportFileName('');
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          SUB-TAB NAVIGATION (DATA SISWA vs DATA GURU MAPEL vs PROFIL SEKOLAH)
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSubTab('siswa')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              subTab === 'siswa'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Siswa ({siswaList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('guru')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              subTab === 'guru'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Data Guru Mapel ({guruMapelList.length})</span>
          </button>
        </div>

        {onOpenSchoolSettings && (
          <button
            type="button"
            onClick={onOpenSchoolSettings}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center space-x-2 transition"
          >
            <School className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Identitas & Logo Sekolah</span>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {subTab === 'siswa' ? (
        <>
          {/* =========================================================================
              TOP BANNER & KPI STATS
             ========================================================================= */}
          <div className="bg-gradient-to-r from-[#0B132B] via-slate-900 to-[#1C2541] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Kelola Data Siswa & Master Presensi</h2>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Tabel Rapi Auto-Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tambah siswa manual, upload data massal template Excel/CSV secara otomatis, dan cetak QR Badge siswa.
              </p>
            </div>
          </div>

          {/* Quick Actions Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Button 0: Cetak Kartu Massal */}
            <button
              type="button"
              onClick={() => setShowBatchPrintModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-1.5 shadow-md shadow-amber-600/30 transition active:scale-95"
              title="Cetak massal kartu tanda pelajar digital ke kertas A4 siap potong"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu Massal</span>
            </button>

            {/* Button 1: Download Template */}
            <button
              onClick={handleDownloadTemplateExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center space-x-1.5 shadow-sm transition active:scale-95"
              title="Unduh template Excel resmi untuk pengisian data banyak siswa"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Unduh Template (.xlsx)</span>
            </button>

            {/* Button 2: Upload Template Siswa Banyak */}
            <button
              onClick={() => {
                setParsedRows([]);
                setImportFileName('');
                setImportStatusMessage(null);
                setShowImportModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center space-x-1.5 shadow-md shadow-sky-600/30 transition active:scale-95"
              title="Upload template Excel/CSV untuk menambahkan banyak siswa sekaligus"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Siswa Banyak</span>
            </button>

            {/* Button 3: Tambah Siswa Manual */}
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Siswa Manual</span>
            </button>
          </div>
        </div>

        {/* KPI Mini Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
            <span className="text-slate-400 text-[11px] block">Total Siswa Aktif</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">{siswaList.length} Siswa</span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
            <span className="text-slate-400 text-[11px] block">Rasio Gender (L / P)</span>
            <span className="text-xl font-bold font-mono text-sky-400 mt-0.5 block">
              {totalLaki} <span className="text-xs text-slate-400">L</span> / {totalPerempuan} <span className="text-xs text-slate-400">P</span>
            </span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
            <span className="text-slate-400 text-[11px] block">Jumlah Rombel / Kelas</span>
            <span className="text-xl font-bold font-mono text-purple-400 mt-0.5 block">{distinctKelasList.length} Kelas</span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
            <span className="text-slate-400 text-[11px] block">No. WA Ortu Terdaftar</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
              {totalWithWa} <span className="text-xs text-slate-400">({Math.round((totalWithWa / (siswaList.length || 1)) * 100)}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOOLBAR PENCARIAN & FILTER KELAS
         ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NISN, nama siswa, atau wali..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Filter Kelas */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="SEMUA">Semua Kelas ({siswaList.length})</option>
              {distinctKelasList.map(k => (
                <option key={k} value={k}>
                  Kelas {k} ({siswaList.filter(s => s.kelas === k).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side info, Density Switcher & Excel download */}
        <div className="flex flex-wrap items-center space-x-2.5 w-full md:w-auto justify-between md:justify-end gap-2">
          {/* Density Mode Selector */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setDensity('normal')}
              className={`px-2.5 py-1 rounded-lg transition ${
                density === 'normal' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Normal"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 rounded-lg transition ${
                density === 'compact' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Compact (Rapat & Ramah Mobile)"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setDensity('card')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                density === 'card' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Mobile (Sangat nyaman di layar kecil)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>

          <span className="text-slate-500 text-[11px] hidden sm:inline">
            <strong className="text-slate-900 font-mono">{filteredSiswa.length}</strong> siswa
          </span>

          <button
            onClick={handleExportDataSiswaExcel}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center space-x-1.5 transition active:scale-95"
            title="Ekspor seluruh data siswa yang difilter ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE: CARD-BASED LAYOUT vs TABLE (COMPACT / NORMAL)
         ========================================================================= */}
      {density === 'card' ? (
        /* CARD-BASED LAYOUT UNTUK MOBILE & LAYAR KECIL */
        <div className="space-y-4">
          {filteredSiswa.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada data siswa ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gunakan tombol &quot;+ Tambah Siswa Manual&quot; atau &quot;Upload Siswa Banyak&quot; di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSiswa.map((siswa, idx) => (
                <div
                  key={siswa.nisn}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 shadow-sm transition flex flex-col justify-between space-y-3"
                >
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      {siswa.fotoUrl ? (
                        <img
                          src={siswa.fotoUrl}
                          alt={siswa.nama}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            siswa.jenisKelamin === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {siswa.nama.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{siswa.nama}</h4>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">NISN: {siswa.nisn}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1 shrink-0">
                      <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {siswa.kelas}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          siswa.jenisKelamin === 'L' ? 'text-sky-700 bg-sky-50' : 'text-pink-700 bg-pink-50'
                        }`}
                      >
                        {siswa.jenisKelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </div>
                  </div>

                  {/* Detail Body Card */}
                  <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Wali Murid:</span>
                      <span className="font-semibold text-slate-800">{siswa.namaOrtu || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">WhatsApp:</span>
                      {siswa.noHpOrtu ? (
                        <a
                          href={`https://wa.me/${siswa.noHpOrtu}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-mono font-bold flex items-center space-x-1 hover:underline"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{siswa.noHpOrtu}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Belum diisi</span>
                      )}
                    </div>
                    {siswa.alamat && (
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 truncate">
                        <span className="text-slate-400">Alamat:</span> {siswa.alamat}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenQrBadge(siswa)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                      title="Lihat Kartu QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-600" />
                      <span>Lihat QR</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(siswa)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition"
                        title="Edit Data Siswa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus data siswa "${siswa.nama}" (NISN: ${siswa.nisn})?`)) {
                            onDeleteSiswa(siswa.nisn);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TABEL RAPI PERBARIS & PERKOLOM (COMPACT / NORMAL) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Header Tabel Rapi Monospace Dark Navy */}
              <thead className={`bg-[#0B132B] text-white font-mono uppercase sticky top-0 z-10 ${
                density === 'compact' ? 'text-[10px]' : 'text-[11px] tracking-wider'
              }`}>
                <tr>
                  <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3 px-3'} text-center border-r border-slate-800 w-10`}>#</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3.5'} border-r border-slate-800 w-28`}>NISN</th>
                  <th className={`${density === 'compact' ? 'py-2 px-3' : 'py-3 px-4'} border-r border-slate-800`}>NAMA LENGKAP SISWA</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3 px-3'} border-r border-slate-800 text-center w-24`}>KELAS</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3 px-3'} border-r border-slate-800 text-center w-12`}>L/P</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3.5'} border-r border-slate-800`}>NAMA WALI</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3.5'} border-r border-slate-800 w-36`}>WHATSAPP WALI</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3.5'} border-r border-slate-800`}>ALAMAT</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3 px-3.5'} border-r border-slate-800 text-center w-24`}>TOKEN BADGE</th>
                  <th className={`${density === 'compact' ? 'py-2 px-2' : 'py-3 px-3.5'} text-center w-28`}>AKSI</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 font-sans ${
                density === 'compact' ? 'text-[11px]' : 'text-xs'
              }`}>
                {filteredSiswa.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada data siswa ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Gunakan tombol &quot;+ Tambah Siswa Manual&quot; atau &quot;Upload Siswa Banyak&quot; di atas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSiswa.map((siswa, idx) => (
                    <tr key={siswa.nisn} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Kolom Nomor */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3'} text-center text-sky-600 font-mono font-bold border-r border-slate-100`}>
                        {idx + 1}
                      </td>

                      {/* 2. Kolom NISN */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3.5'} font-mono font-bold text-slate-900 border-r border-slate-100`}>
                        <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {siswa.nisn}
                        </span>
                      </td>

                      {/* 3. Kolom Nama Siswa */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'} border-r border-slate-100`}>
                        <div className="flex items-center space-x-2">
                          {siswa.fotoUrl ? (
                            <img
                              src={siswa.fotoUrl}
                              alt={siswa.nama}
                              className="w-6 h-6 rounded-full object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              siswa.jenisKelamin === 'L' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'
                            }`}>
                              {siswa.nama.charAt(0)}
                            </div>
                          )}
                          <div className="font-bold text-slate-900 leading-tight">{siswa.nama}</div>
                        </div>
                      </td>

                      {/* 4. Kolom Kelas */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3'} text-center border-r border-slate-100 font-semibold`}>
                        <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {siswa.kelas}
                        </span>
                      </td>

                      {/* 5. Kolom L/P */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3'} text-center border-r border-slate-100 font-mono font-bold`}>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          siswa.jenisKelamin === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {siswa.jenisKelamin}
                        </span>
                      </td>

                      {/* 6. Kolom Nama Wali */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3.5'} text-slate-800 font-medium border-r border-slate-100`}>
                        {siswa.namaOrtu || '-'}
                      </td>

                      {/* 7. Kolom WhatsApp Wali */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3.5'} font-mono text-slate-700 border-r border-slate-100`}>
                        {siswa.noHpOrtu ? (
                          <a
                            href={`https://wa.me/${siswa.noHpOrtu}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 hover:underline font-semibold"
                            title="Kirim pesan WhatsApp langsung"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{siswa.noHpOrtu}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Belum diisi</span>
                        )}
                      </td>

                      {/* 8. Kolom Alamat */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3.5'} text-slate-600 border-r border-slate-100 truncate max-w-xs text-[11px]`}>
                        {siswa.alamat || '-'}
                      </td>

                      {/* 9. Kolom Token Badge */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-center border-r border-slate-100`}>
                        <button
                          onClick={() => handleOpenQrBadge(siswa)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-semibold flex items-center justify-center space-x-1 mx-auto transition"
                          title="Klik untuk melihat Kartu Pelajar & QR Code Siswa"
                        >
                          <QrCode className="w-3 h-3 text-slate-600" />
                          <span>Lihat QR</span>
                        </button>
                      </td>

                      {/* 10. Kolom Aksi */}
                      <td className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-3 px-3.5'} text-center`}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(siswa)}
                            className="p-1 rounded-md border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition"
                            title="Edit Data Siswa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus data siswa "${siswa.nama}" (NISN: ${siswa.nisn})?`)) {
                                onDeleteSiswa(siswa.nisn);
                              }
                            }}
                            className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Database Siswa tersinkronisasi otomatis dengan Kartu QR Portal dan Generator Sesi Presensi</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              Total {siswaList.length} Siswa Terdaftar
            </span>
          </div>
        </div>
      )}
    </>
  ) : (
    /* =========================================================================
        SUB-TAB GURU MAPEL SECTION (PENGATURAN / GANTI NAMA GURU & MAPEL)
       ========================================================================= */
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Kelola Data Guru Mata Pelajaran</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Tahun Pelajaran {schoolProfile?.tahunPelajaran || '2026/2027'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Atur nama guru mapel, NIP, nomor WhatsApp, serta rombel kelas ajar untuk {schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura'}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddGuru}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 shadow-md shadow-emerald-600/30 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Guru Mapel</span>
          </button>
        </div>
      </div>

      {/* Guru Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={guruSearch}
            onChange={(e) => setGuruSearch(e.target.value)}
            placeholder="Cari guru, mata pelajaran, atau NIP..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 rounded-lg transition ${
                density === 'compact' || density === 'normal' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tabel
            </button>
            <button
              type="button"
              onClick={() => setDensity('card')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                density === 'card' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>

          <span className="text-slate-500 text-[11px]">
            Total <strong className="text-slate-900 font-mono">{filteredGuru.length}</strong> Guru
          </span>
        </div>
      </div>

      {/* Guru List (Card vs Table) */}
      {density === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredGuru.map((guru) => (
            <div
              key={guru.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 shadow-sm transition flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {guru.nama.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{guru.nama}</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {guru.mapel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs text-slate-600 border border-slate-100">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">NIP:</span>
                  <span className="font-mono text-slate-700 font-semibold">{guru.nip || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">WhatsApp:</span>
                  {guru.noHp ? (
                    <a
                      href={`https://wa.me/${guru.noHp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-mono font-bold flex items-center space-x-1 hover:underline"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{guru.noHp}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Belum diisi</span>
                  )}
                </div>
                <div className="pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-400">Kelas Ajar:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(guru.kelasAjar) ? guru.kelasAjar.join(', ') : (guru.kelasAjar || '-')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-1 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEditGuru(guru)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGuru(guru.id, guru.nama)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Hapus Guru"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0B132B] text-white font-mono text-[11px] tracking-wider uppercase sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800 w-12">#</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-800">NAMA LENGKAP GURU</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">MATA PELAJARAN</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-800 font-mono">NIP</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-800">WHATSAPP</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-800">ROMBEL / KELAS AJAR</th>
                  <th className="py-2.5 px-3.5 text-center w-28">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {filteredGuru.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Tidak ada guru mata pelajaran ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredGuru.map((guru, idx) => (
                    <tr key={guru.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center text-emerald-600 font-mono font-bold border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3.5 font-bold text-slate-900 border-r border-slate-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {guru.nama.charAt(0)}
                          </div>
                          <span>{guru.nama}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                          {guru.mapel}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 font-mono text-slate-600 border-r border-slate-100 text-[11px]">
                        {guru.nip || '-'}
                      </td>
                      <td className="py-2 px-3.5 font-mono text-slate-700 border-r border-slate-100">
                        {guru.noHp ? (
                          <a
                            href={`https://wa.me/${guru.noHp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-700 hover:underline font-semibold text-[11px]"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{guru.noHp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 text-slate-600 border-r border-slate-100 text-[11px]">
                        {Array.isArray(guru.kelasAjar) ? guru.kelasAjar.join(', ') : (guru.kelasAjar || '-')}
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGuru(guru)}
                            className="p-1 rounded-md border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Edit Guru"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGuru(guru.id, guru.nama)}
                            className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Hapus Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

  {/* =========================================================================
      MODAL GURU MAPEL (ADD / EDIT)
     ========================================================================= */}
  {showGuruModal && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                {editingGuru ? 'Edit Guru Mata Pelajaran' : 'Tambah Guru Mata Pelajaran'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Atur nama guru, mapel yang diampu, dan nomor kontak
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuruModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveGuru} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Nama Lengkap Guru Beserta Gelar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={guruForm.nama}
              onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
              placeholder="Contoh: Drs. Bambang Sutrisno, M.Pd"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={guruForm.mapel}
                onChange={(e) => setGuruForm({ ...guruForm, mapel: e.target.value })}
                placeholder="Contoh: Matematika"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">NIP (Opsional)</label>
              <input
                type="text"
                value={guruForm.nip}
                onChange={(e) => setGuruForm({ ...guruForm, nip: e.target.value })}
                placeholder="19800101..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">No. WhatsApp</label>
            <input
              type="text"
              value={guruForm.noHp}
              onChange={(e) => setGuruForm({ ...guruForm, noHp: e.target.value })}
              placeholder="08123456789"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Rombel / Kelas Ajar (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={guruForm.kelasAjar}
              onChange={(e) => setGuruForm({ ...guruForm, kelasAjar: e.target.value })}
              placeholder="Contoh: VII A, VII B, VIII A"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowGuruModal(false)}
              className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Guru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

      {/* =========================================================================
          MODAL 1: TAMBAH SISWA MANUAL
         ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">Tambah Siswa Baru (Manual)</h3>
                  <p className="text-xs text-slate-500">Masukkan detail siswa untuk membuat data presensi & QR Badge</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddManual} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    NISN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="Contoh: 0061234599"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenisKelamin: 'L' })}
                      className={`py-2 rounded-xl font-bold border transition ${
                        formData.jenisKelamin === 'L'
                          ? 'bg-sky-50 border-sky-500 text-sky-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Laki-laki (L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenisKelamin: 'P' })}
                      className={`py-2 rounded-xl font-bold border transition ${
                        formData.jenisKelamin === 'P'
                          ? 'bg-pink-50 border-pink-500 text-pink-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Perempuan (P)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap siswa..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kelas / Rombel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    placeholder="Contoh: XII RPL 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    WhatsApp Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={formData.noHpOrtu}
                    onChange={(e) => setFormData({ ...formData, noHpOrtu: e.target.value })}
                    placeholder="Contoh: 08123456789 atau 628..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  value={formData.namaOrtu}
                  onChange={(e) => setFormData({ ...formData, namaOrtu: e.target.value })}
                  placeholder="Contoh: Bpk. Bambang Sutrisno"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Tempat Tinggal</label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Diponegoro No. 14, Jakarta..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                />
              </div>

              {/* Foto Siswa untuk Kartu Pelajar */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Foto Siswa (Untuk Kartu Pelajar Digital)</label>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-14 h-16 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {formData.fotoUrl ? (
                      <img src={formData.fotoUrl} alt="Preview Foto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-5 h-5 mx-auto mb-0.5 opacity-60" />
                        <span className="text-[7.5px] font-bold block">No Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer flex items-center space-x-1.5 transition shadow-xs">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pilih File Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => {
                                if (typeof r.result === 'string') {
                                  setFormData({ ...formData, fotoUrl: r.result });
                                }
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {formData.fotoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fotoUrl: '' })}
                          className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.fotoUrl}
                      onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                      placeholder="Atau tempel URL gambar (https://...)"
                      className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-[11px] focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akun Login Siswa & Token QR Otomatis</span>
                </div>
                <p>
                  Sistem akan otomatis meng-generate QR Badge serta akun login siswa (Username: NISN, Password: <code className="bg-white px-1 py-0.5 rounded border border-slate-300 text-slate-900">siswa123</code>).
                </p>
              </div>

              <div className="flex justify-end items-center space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition active:scale-95 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: UPLOAD TEMPLATE TABEL SISWA BANYAK SECARA OTOMATIS
         ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    Upload Template Siswa Banyak Secara Otomatis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Impor puluhan atau ratusan siswa sekaligus menggunakan file Excel (.xlsx) atau CSV (.csv)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Download Format Guide */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-sky-950 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Belum memiliki file template tabel siswa?</span>
                </div>
                <p className="text-[11px] text-sky-800">
                  Unduh template resmi berikut, isi data siswa Anda, lalu unggah kembali ke formulir ini:
                </p>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadTemplateExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-sm transition active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Template (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplateCSV}
                  className="px-2.5 py-1.5 bg-white border border-sky-300 text-sky-800 hover:bg-sky-100 rounded-lg font-bold transition"
                >
                  <span>Template .CSV</span>
                </button>
              </div>
            </div>

            {/* Step 2: File Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition hover:bg-slate-50/80 group space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  {importFileName ? `File Terpilih: ${importFileName}` : 'Klik untuk Pilih File Excel (.xlsx) atau Drag & Drop ke Sini'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Mendukung format Microsoft Excel (.xlsx, .xls) dan Comma-Separated Values (.csv)
                </span>
              </div>
            </div>

            {importStatusMessage && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{importStatusMessage}</span>
              </div>
            )}

            {/* Step 3: Tabel Pratinjau Rapi Perbaris & Perkolom */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                  <div className="font-bold text-slate-800 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pratinjau Data Terbaca ({parsedRows.length} Baris):</span>
                  </div>

                  {/* Mode Duplikasi Option */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500">Jika NISN sudah ada:</span>
                    <select
                      value={importDuplicateMode}
                      onChange={(e) => setImportDuplicateMode(e.target.value as any)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="update">Perbarui Data (Update)</option>
                      <option value="skip">Lewati (Jangan Timpa)</option>
                    </select>
                  </div>
                </div>

                {/* Status Summary Pills */}
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Siap Impor: {parsedRows.filter(r => r.status === 'VALID').length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    NISN Sudah Ada: {parsedRows.filter(r => r.status === 'DUPLIKAT').length}
                  </span>
                  {parsedRows.some(r => r.status === 'INVALID') && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                      Data Tidak Valid: {parsedRows.filter(r => r.status === 'INVALID').length} (Dilewati)
                    </span>
                  )}
                </div>

                {/* Preview Table Container */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0B132B] text-white font-mono text-[10px] uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5 text-center border-r border-slate-800">BARIS</th>
                        <th className="py-2 px-3 border-r border-slate-800">STATUS</th>
                        <th className="py-2 px-3 border-r border-slate-800">NISN</th>
                        <th className="py-2 px-3 border-r border-slate-800">NAMA SISWA</th>
                        <th className="py-2 px-2.5 border-r border-slate-800 text-center">KELAS</th>
                        <th className="py-2 px-2 text-center border-r border-slate-800">L/P</th>
                        <th className="py-2 px-3 border-r border-slate-800">WALI MURID</th>
                        <th className="py-2 px-3 border-r border-slate-800">WHATSAPP WALI</th>
                        <th className="py-2 px-3">ALAMAT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-xs">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            row.status === 'INVALID' ? 'bg-red-50/50' : row.status === 'DUPLIKAT' ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-2 px-2.5 text-center font-mono text-slate-400 border-r border-slate-100">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100">
                            {row.status === 'VALID' && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                Valid
                              </span>
                            )}
                            {row.status === 'DUPLIKAT' && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded" title={row.pesanError}>
                                {importDuplicateMode === 'update' ? 'Update' : 'Lewati'}
                              </span>
                            )}
                            {row.status === 'INVALID' && (
                              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded" title={row.pesanError}>
                                {row.pesanError || 'Invalid'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800 border-r border-slate-100">
                            {row.nisn || '-'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-100">
                            {row.nama || '-'}
                          </td>
                          <td className="py-2 px-2.5 text-center border-r border-slate-100 font-mono text-[11px]">
                            {row.kelas}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-100 font-mono font-bold">
                            {row.jenisKelamin}
                          </td>
                          <td className="py-2 px-3 text-slate-700 border-r border-slate-100">
                            {row.namaOrtu}
                          </td>
                          <td className="py-2 px-3 font-mono text-emerald-700 border-r border-slate-100">
                            {row.noHpOrtu || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-500 truncate max-w-xs text-[11px]">
                            {row.alamat || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 text-[11px]">
                Tip: Seluruh siswa yang diimpor otomatis dibuatkan QR Badge & akun login ke sistem portal.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0 || isProcessingImport}
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition active:scale-95 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi & Simpan ke Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT SISWA
         ========================================================================= */}
      {showEditModal && selectedStudentForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">Edit Data Siswa</h3>
                  <p className="text-xs text-slate-500">Perbarui profil siswa atau nomor kontak wali murid</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NISN (Tetap)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.nisn}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-xl font-mono text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenisKelamin: 'L' })}
                      className={`py-2 rounded-xl font-bold border transition ${
                        formData.jenisKelamin === 'L'
                          ? 'bg-sky-50 border-sky-500 text-sky-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenisKelamin: 'P' })}
                      className={`py-2 rounded-xl font-bold border transition ${
                        formData.jenisKelamin === 'P'
                          ? 'bg-pink-50 border-pink-500 text-pink-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      P
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">WhatsApp Orang Tua</label>
                  <input
                    type="text"
                    value={formData.noHpOrtu}
                    onChange={(e) => setFormData({ ...formData, noHpOrtu: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  value={formData.namaOrtu}
                  onChange={(e) => setFormData({ ...formData, namaOrtu: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Tempat Tinggal</label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs focus:outline-none"
                />
              </div>

              {/* Foto Siswa untuk Kartu Pelajar */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Foto Siswa (Untuk Kartu Pelajar Digital)</label>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-14 h-16 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {formData.fotoUrl ? (
                      <img src={formData.fotoUrl} alt="Preview Foto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-5 h-5 mx-auto mb-0.5 opacity-60" />
                        <span className="text-[7.5px] font-bold block">No Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer flex items-center space-x-1.5 transition shadow-xs">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ganti / Pilih File Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => {
                                if (typeof r.result === 'string') {
                                  setFormData({ ...formData, fotoUrl: r.result });
                                }
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {formData.fotoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fotoUrl: '' })}
                          className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.fotoUrl}
                      onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                      placeholder="Atau tempel URL gambar (https://...)"
                      className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-[11px] focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-sm transition active:scale-95 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: KARTU TANDA PELAJAR DIGITAL LENGKAP DENGAN BOLAK-BALIK & CETAK
         ========================================================================= */}
      {showQrModal && selectedStudentForQr && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-white">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Kartu Tanda Pelajar Digital</h4>
                  <p className="text-[11px] text-slate-400">Pratinjau resmi & cetak langsung</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Kartu Pelajar Digital Component */}
            <div className="py-2">
              <KartuPelajarDigital
                student={selectedStudentForQr}
                schoolProfile={schoolProfile}
                onUpdatePhoto={(newPhotoUrl) => {
                  if (selectedStudentForQr) {
                    const updated = { ...selectedStudentForQr, fotoUrl: newPhotoUrl };
                    setSelectedStudentForQr(updated);
                    onUpdateSiswa(updated);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: CETAK KARTU MASSAL (BATCH PRINT A4)
         ========================================================================= */}
      <BatchPrintCardsModal
        isOpen={showBatchPrintModal}
        onClose={() => setShowBatchPrintModal(false)}
        siswaList={siswaList}
        schoolProfile={schoolProfile}
      />
    </div>
  );
};
