'use client';

import React, { useState, useRef } from 'react';
import { SchoolProfile, GuruMapel, TableDensity, User } from '@/types/attendance';
import { SchoolLogo } from '@/components/SchoolLogo';
import { 
  School, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Award, 
  Upload, 
  X, 
  Check, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Search, 
  Clock, 
  Save, 
  UserPlus,
  Calendar,
  Sparkles,
  LayoutGrid,
  List,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  User as UserIcon,
  AlertCircle,
  Copy,
  Users
} from 'lucide-react';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolProfile: SchoolProfile;
  onUpdateSchoolProfile: (profile: SchoolProfile) => void;
  guruMapelList: GuruMapel[];
  onAddGuruMapel: (guru: GuruMapel) => void;
  onUpdateGuruMapel: (guru: GuruMapel) => void;
  onDeleteGuruMapel: (id: string) => void;
  adminUser?: User;
  onUpdateAdminCredentials?: (updatedAdmin: { username: string; password?: string; nama?: string }) => { success: boolean; message: string };
  guruPiketUser?: User;
  onUpdateGuruPiketCredentials?: (data: { username: string; password?: string; nama?: string }) => { success: boolean; message: string };
  guruPiketList?: User[];
  onAddGuruPiket?: (newPiket: { username: string; password?: string; nama: string; noHp?: string }) => { success: boolean; message: string };
  onUpdateGuruPiket?: (userId: string, data: { username: string; password?: string; nama?: string; noHp?: string; status?: 'AKTIF' | 'NONAKTIF' }) => { success: boolean; message: string };
  onDeleteGuruPiket?: (userId: string) => { success: boolean; message: string };
  initialTab?: 'sekolah' | 'logo' | 'guru' | 'admin' | 'piket';
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  schoolProfile,
  onUpdateSchoolProfile,
  guruMapelList,
  onAddGuruMapel,
  onUpdateGuruMapel,
  onDeleteGuruMapel,
  adminUser,
  onUpdateAdminCredentials,
  guruPiketUser,
  onUpdateGuruPiketCredentials,
  guruPiketList = [],
  onAddGuruPiket,
  onUpdateGuruPiket,
  onDeleteGuruPiket,
  initialTab = 'sekolah'
}) => {
  const [activeTab, setActiveTab] = useState<'sekolah' | 'logo' | 'guru' | 'admin' | 'piket'>(initialTab);
  
  // Local form state for school profile
  const [profileForm, setProfileForm] = useState<SchoolProfile>({ ...schoolProfile });
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Admin Credentials Form State
  const [adminUsername, setAdminUsername] = useState(adminUser?.username || 'admin');
  const [adminNama, setAdminNama] = useState(adminUser?.nama || 'Budi Santoso, S.Kom (Administrator)');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Guru Piket Management Form State
  const [piketSearch, setPiketSearch] = useState('');
  const [showAddPiketModal, setShowAddPiketModal] = useState(false);
  const [showEditPiketModal, setShowEditPiketModal] = useState(false);
  const [editingPiketUser, setEditingPiketUser] = useState<User | null>(null);
  const [piketFormError, setPiketFormError] = useState<string | null>(null);
  const [showPiketPassword, setShowPiketPassword] = useState(false);
  const [showPiketConfirmPassword, setShowPiketConfirmPassword] = useState(false);
  const [copiedPiketId, setCopiedPiketId] = useState<string | null>(null);

  const [addPiketForm, setAddPiketForm] = useState({
    nama: '',
    username: '',
    password: '',
    confirmPassword: '',
    noHp: '',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF'
  });

  const [editPiketForm, setEditPiketForm] = useState({
    id: '',
    nama: '',
    username: '',
    password: '',
    confirmPassword: '',
    noHp: '',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF'
  });

  // Adjust state during render when props change
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  const [prevAdminUser, setPrevAdminUser] = useState(adminUser);
  if (prevAdminUser !== adminUser) {
    setPrevAdminUser(adminUser);
    setAdminUsername(adminUser?.username || 'admin');
    setAdminNama(adminUser?.nama || 'Budi Santoso, S.Kom (Administrator)');
  }

  // Logo upload ref
  const fileLogoRef = useRef<HTMLInputElement>(null);

  // Guru Mapel State
  const [guruSearch, setGuruSearch] = useState('');
  const [guruDensity, setGuruDensity] = useState<TableDensity>('compact');
  const [showGuruForm, setShowGuruForm] = useState(false);
  const [editingGuruId, setEditingGuruId] = useState<string | null>(null);
  const [guruFormData, setGuruFormData] = useState<Omit<GuruMapel, 'id'>>({
    nip: '',
    nama: '',
    mapel: '',
    kelasAjar: '',
    noHp: '',
    status: 'AKTIF'
  });
  const [guruFormError, setGuruFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Save School Profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolProfile(profileForm);
    setSaveSuccessNotice('Identitas sekolah dan tahun pelajaran berhasil disimpan!');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Save Admin Credentials (Username & Password)
  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminNotice(null);

    const cleanUser = adminUsername.trim().toLowerCase();
    if (!cleanUser) {
      setAdminError('Username admin tidak boleh kosong.');
      return;
    }

    if (cleanUser.length < 3) {
      setAdminError('Username admin minimal harus 3 karakter.');
      return;
    }

    if (adminPassword.trim()) {
      if (adminPassword.length < 5) {
        setAdminError('Kata sandi baru minimal harus 5 karakter.');
        return;
      }
      if (adminPassword !== adminConfirmPassword) {
        setAdminError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
        return;
      }
    }

    if (onUpdateAdminCredentials) {
      const res = onUpdateAdminCredentials({
        username: cleanUser,
        nama: adminNama.trim() || undefined,
        password: adminPassword.trim() ? adminPassword.trim() : undefined
      });

      if (!res.success) {
        setAdminError(res.message);
        return;
      }

      setAdminNotice(res.message);
      setAdminPassword('');
      setAdminConfirmPassword('');
      setSaveSuccessNotice('Kredensial Admin (username & password) berhasil diperbarui!');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } else {
      setAdminNotice('Kredensial admin berhasil disimpan.');
      setAdminPassword('');
      setAdminConfirmPassword('');
    }
  };

  // Guru Piket Handlers
  const handleOpenAddPiket = () => {
    setAddPiketForm({
      nama: '',
      username: '',
      password: '',
      confirmPassword: '',
      noHp: '',
      status: 'AKTIF'
    });
    setPiketFormError(null);
    setShowPiketPassword(false);
    setShowPiketConfirmPassword(false);
    setShowAddPiketModal(true);
  };

  const handleSaveAddPiket = (e: React.FormEvent) => {
    e.preventDefault();
    setPiketFormError(null);

    const cleanUser = addPiketForm.username.trim().toLowerCase();
    if (!addPiketForm.nama.trim()) {
      setPiketFormError('Nama lengkap guru piket wajib diisi.');
      return;
    }
    if (!cleanUser) {
      setPiketFormError('Username guru piket wajib diisi.');
      return;
    }
    if (cleanUser.length < 3) {
      setPiketFormError('Username minimal harus 3 karakter (huruf/angka tanpa spasi).');
      return;
    }
    if (!addPiketForm.password) {
      setPiketFormError('Kata sandi login wajib diisi.');
      return;
    }
    if (addPiketForm.password.length < 5) {
      setPiketFormError('Kata sandi minimal harus 5 karakter.');
      return;
    }
    if (addPiketForm.password !== addPiketForm.confirmPassword) {
      setPiketFormError('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    if (onAddGuruPiket) {
      const res = onAddGuruPiket({
        username: cleanUser,
        nama: addPiketForm.nama.trim(),
        password: addPiketForm.password.trim(),
        noHp: addPiketForm.noHp.trim()
      });

      if (!res.success) {
        setPiketFormError(res.message);
        return;
      }

      setShowAddPiketModal(false);
      setSaveSuccessNotice(res.message);
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    }
  };

  const handleOpenEditPiket = (piket: User) => {
    setEditingPiketUser(piket);
    setEditPiketForm({
      id: piket.id,
      nama: piket.nama,
      username: piket.username,
      password: '',
      confirmPassword: '',
      noHp: piket.noHp || '',
      status: piket.status || 'AKTIF'
    });
    setPiketFormError(null);
    setShowPiketPassword(false);
    setShowPiketConfirmPassword(false);
    setShowEditPiketModal(true);
  };

  const handleSaveEditPiket = (e: React.FormEvent) => {
    e.preventDefault();
    setPiketFormError(null);

    const cleanUser = editPiketForm.username.trim().toLowerCase();
    if (!editPiketForm.nama.trim()) {
      setPiketFormError('Nama lengkap guru piket wajib diisi.');
      return;
    }
    if (!cleanUser) {
      setPiketFormError('Username guru piket wajib diisi.');
      return;
    }
    if (cleanUser.length < 3) {
      setPiketFormError('Username minimal harus 3 karakter.');
      return;
    }
    if (editPiketForm.password.trim()) {
      if (editPiketForm.password.length < 5) {
        setPiketFormError('Kata sandi baru minimal harus 5 karakter.');
        return;
      }
      if (editPiketForm.password !== editPiketForm.confirmPassword) {
        setPiketFormError('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    if (onUpdateGuruPiket) {
      const res = onUpdateGuruPiket(editPiketForm.id, {
        username: cleanUser,
        nama: editPiketForm.nama.trim(),
        password: editPiketForm.password.trim() ? editPiketForm.password.trim() : undefined,
        noHp: editPiketForm.noHp.trim(),
        status: editPiketForm.status
      });

      if (!res.success) {
        setPiketFormError(res.message);
        return;
      }

      setShowEditPiketModal(false);
      setSaveSuccessNotice(res.message);
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    }
  };

  const handleDeletePiket = (piket: User) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun Guru Piket "${piket.nama}" (${piket.username})?`)) {
      if (onDeleteGuruPiket) {
        const res = onDeleteGuruPiket(piket.id);
        if (!res.success) {
          alert(res.message);
          return;
        }
        setSaveSuccessNotice(res.message);
        setTimeout(() => setSaveSuccessNotice(null), 3500);
      }
    }
  };

  const handleTogglePiketStatus = (piket: User) => {
    if (onUpdateGuruPiket) {
      const newStatus = piket.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
      const res = onUpdateGuruPiket(piket.id, {
        username: piket.username,
        status: newStatus
      });
      if (res.success) {
        setSaveSuccessNotice(`Status akun ${piket.nama} berhasil diubah menjadi ${newStatus}.`);
        setTimeout(() => setSaveSuccessNotice(null), 3000);
      } else {
        alert(res.message);
      }
    }
  };

  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPiketId(id);
    setTimeout(() => setCopiedPiketId(null), 2000);
  };

  // Handle Logo Upload from Local Device with Automatic Canvas Compression (< 50KB)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.85);
          setProfileForm(prev => ({
            ...prev,
            logoUrl: compressedDataUrl
          }));
        } else {
          setProfileForm(prev => ({
            ...prev,
            logoUrl: dataUrl
          }));
        }
      };
      img.onerror = () => {
        setProfileForm(prev => ({
          ...prev,
          logoUrl: dataUrl
        }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Guru Form Handlers
  const handleOpenAddGuru = () => {
    setEditingGuruId(null);
    setGuruFormData({
      nip: '',
      nama: '',
      mapel: '',
      kelasAjar: 'VII, VIII, IX',
      noHp: '',
      status: 'AKTIF'
    });
    setGuruFormError(null);
    setShowGuruForm(true);
  };

  const handleOpenEditGuru = (guru: GuruMapel) => {
    setEditingGuruId(guru.id);
    setGuruFormData({
      nip: guru.nip,
      nama: guru.nama,
      mapel: guru.mapel,
      kelasAjar: guru.kelasAjar,
      noHp: guru.noHp,
      status: guru.status
    });
    setGuruFormError(null);
    setShowGuruForm(true);
  };

  const handleSaveGuruForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guruFormData.nama.trim()) {
      setGuruFormError('Nama guru wajib diisi.');
      return;
    }
    if (!guruFormData.mapel.trim()) {
      setGuruFormError('Mata pelajaran wajib diisi.');
      return;
    }

    if (editingGuruId) {
      onUpdateGuruMapel({
        id: editingGuruId,
        ...guruFormData
      });
    } else {
      onAddGuruMapel({
        id: `GURU-${Date.now().toString().slice(-6)}`,
        ...guruFormData
      });
    }

    setShowGuruForm(false);
    setEditingGuruId(null);
    setSaveSuccessNotice(editingGuruId ? 'Data guru berhasil diperbarui!' : 'Guru mapel baru berhasil ditambahkan!');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const filteredGuru = guruMapelList.filter(g => {
    const q = guruSearch.toLowerCase();
    return !q || 
      g.nama.toLowerCase().includes(q) ||
      g.mapel.toLowerCase().includes(q) ||
      g.nip.includes(q) ||
      g.kelasAjar.toLowerCase().includes(q);
  });

  const piketSourceList = guruPiketList.length > 0 ? guruPiketList : (guruPiketUser ? [guruPiketUser] : []);
  const filteredPiketList = piketSourceList.filter(p => {
    const q = piketSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.nama.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      (p.noHp && p.noHp.includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <SchoolLogo profile={profileForm} className="w-14 h-14 flex items-center justify-center shrink-0 bg-transparent" iconClassName="w-12 h-12 text-emerald-400 drop-shadow-sm" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Pengaturan Identitas Sekolah & Guru Mapel
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {profileForm.tahunPelajaran} • {profileForm.zonaWaktu}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola nama sekolah, logo, tahun ajaran, semester, serta daftar guru mata pelajaran
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessNotice && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in duration-150 shrink-0">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{saveSuccessNotice}</span>
            </div>
            <button onClick={() => setSaveSuccessNotice(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sekolah')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'sekolah'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className="w-4 h-4 text-emerald-600" />
            <span>1. Sekolah & Tahun Pelajaran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'logo'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>2. Logo Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guru')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'guru'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-sky-600" />
            <span>3. Guru Mata Pelajaran ({guruMapelList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'admin'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span>4. Kredensial Administrator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('piket')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'piket'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-sky-600" />
            <span>5. Akun Guru Piket ({guruPiketList.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          
          {/* TAB 1: IDENTITAS SEKOLAH & TAHUN PELAJARAN */}
          {activeTab === 'sekolah' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start space-x-3 text-emerald-900">
                <School className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Pengaturan Profil Sekolah Terpadu:</strong> Perubahan nama sekolah dan tahun pelajaran akan otomatis diperbarui di seluruh aplikasi: Header, Halaman Login, Kartu Tanda Pelajar QR, dan Kop Surat Laporan Presensi.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Sekolah */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Nama Resmi Sekolah: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.namaSekolah}
                    onChange={(e) => setProfileForm(p => ({ ...p, namaSekolah: e.target.value }))}
                    placeholder="Contoh: SMP NURUL HUDA JAYAPURA"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* NPSN */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Nomor Pokok Sekolah Nasional (NPSN):
                  </label>
                  <input
                    type="text"
                    value={profileForm.npsn}
                    onChange={(e) => setProfileForm(p => ({ ...p, npsn: e.target.value }))}
                    placeholder="Contoh: 60302819"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Zona Waktu */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Zona Waktu Wilayah:
                  </label>
                  <select
                    value={profileForm.zonaWaktu}
                    onChange={(e) => setProfileForm(p => ({ ...p, zonaWaktu: e.target.value as 'WIT' | 'WIB' | 'WITA' }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                  >
                    <option value="WIT">WIT - Waktu Indonesia Timur (Papua, Maluku)</option>
                    <option value="WITA">WITA - Waktu Indonesia Tengah (Bali, Sulawesi, NTT, NTB)</option>
                    <option value="WIB">WIB - Waktu Indonesia Barat (Jawa, Sumatera, Kalimantan)</option>
                  </select>
                </div>

                {/* Tahun Pelajaran */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Tahun Pelajaran: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.tahunPelajaran}
                    onChange={(e) => setProfileForm(p => ({ ...p, tahunPelajaran: e.target.value }))}
                    placeholder="Contoh: 2026/2027"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Semester */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Semester Aktif:
                  </label>
                  <select
                    value={profileForm.semester}
                    onChange={(e) => setProfileForm(p => ({ ...p, semester: e.target.value as 'Ganjil' | 'Genap' }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                {/* Kepala Sekolah */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Nama Kepala Sekolah:
                  </label>
                  <input
                    type="text"
                    value={profileForm.namaKepalaSekolah}
                    onChange={(e) => setProfileForm(p => ({ ...p, namaKepalaSekolah: e.target.value }))}
                    placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* NIP Kepala Sekolah */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    NIP Kepala Sekolah:
                  </label>
                  <input
                    type="text"
                    value={profileForm.nipKepalaSekolah}
                    onChange={(e) => setProfileForm(p => ({ ...p, nipKepalaSekolah: e.target.value }))}
                    placeholder="Contoh: 19720512 199803 1 004"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Alamat Lengkap */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Alamat Lengkap Sekolah:
                  </label>
                  <input
                    type="text"
                    value={profileForm.alamat}
                    onChange={(e) => setProfileForm(p => ({ ...p, alamat: e.target.value }))}
                    placeholder="Contoh: Jl. Percetakan Negara No. 45, Gurabesi, Distrik Jayapura Utara"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Kota & Provinsi */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Kota / Kabupaten:</label>
                  <input
                    type="text"
                    value={profileForm.kota}
                    onChange={(e) => setProfileForm(p => ({ ...p, kota: e.target.value }))}
                    placeholder="Contoh: Kota Jayapura"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Provinsi:</label>
                  <input
                    type="text"
                    value={profileForm.provinsi}
                    onChange={(e) => setProfileForm(p => ({ ...p, provinsi: e.target.value }))}
                    placeholder="Contoh: Papua"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Identitas</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PENGATURAN LOGO SEKOLAH */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start space-x-3 text-sky-900">
                <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Logo Fleksibel:</strong> Anda dapat mengunggah file gambar logo sekolah dari perangkat Anda, memasukkan tautan (URL) gambar eksternal, atau memilih lambang pendidikan preset beresolusi tajam.
                </div>
              </div>

              {/* Logo Preview Section */}
              <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-center gap-6 justify-between border border-slate-800 shadow-xl">
                <div className="flex items-center space-x-4">
                  <SchoolLogo 
                    profile={profileForm} 
                    className="w-24 h-24 flex items-center justify-center shrink-0 bg-transparent" 
                    iconClassName="w-24 h-24 text-emerald-400 drop-shadow-md" 
                  />
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                      Pratinjau Logo Aktif
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-white">
                      {profileForm.namaSekolah}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {profileForm.logoUrl ? 'Gambar Logo Kustom' : `Preset Lambang: ${profileForm.logoPreset || 'school'}`}
                    </p>
                  </div>
                </div>

                {profileForm.logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm(p => ({ ...p, logoUrl: undefined }));
                      onUpdateSchoolProfile({ ...profileForm, logoUrl: undefined });
                    }}
                    className="px-3 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold border border-rose-700/60 flex items-center space-x-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Logo Kustom</span>
                  </button>
                )}
              </div>

              {/* Upload Option 1: File Upload */}
              <div className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl text-center space-y-3 bg-slate-50/50 transition">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Unggah Logo dari Perangkat (Komputer / HP)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Format didukung: PNG, JPG, WebP, SVG (Transparan disarankan)
                  </p>
                </div>
                <input
                  ref={fileLogoRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileLogoRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 inline-flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Gambar Logo</span>
                </button>
              </div>

              {/* Upload Option 2: Image URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Atau Masukkan Tautan / URL Gambar Logo:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={profileForm.logoUrl || ''}
                    onChange={(e) => setProfileForm(p => ({ ...p, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo-sekolah.png"
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSchoolProfile(profileForm);
                      setSaveSuccessNotice('Tautan logo berhasil disimpan!');
                      setTimeout(() => setSaveSuccessNotice(null), 3000);
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
                  >
                    Terapkan URL
                  </button>
                </div>
              </div>

              {/* Option 3: Presets */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Atau Pilih Lambang Preset Standar:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: 'school', label: 'Gedung Sekolah', icon: School, color: 'bg-emerald-600' },
                    { key: 'graduation', label: 'Topi Toga', icon: GraduationCap, color: 'bg-indigo-600' },
                    { key: 'book', label: 'Buku Ilmu', icon: BookOpen, color: 'bg-sky-600' },
                    { key: 'shield', label: 'Perisai Mutu', icon: ShieldCheck, color: 'bg-teal-600' },
                    { key: 'award', label: 'Medali Prestasi', icon: Award, color: 'bg-amber-600' }
                  ].map(p => {
                    const IconComp = p.icon;
                    const isSelected = !profileForm.logoUrl && (profileForm.logoPreset === p.key || (!profileForm.logoPreset && p.key === 'school'));
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          const updated = { ...profileForm, logoUrl: undefined, logoPreset: p.key as any };
                          setProfileForm(updated);
                          onUpdateSchoolProfile(updated);
                          setSaveSuccessNotice(`Preset logo ${p.label} diterapkan!`);
                          setTimeout(() => setSaveSuccessNotice(null), 3000);
                        }}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-2 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${p.color} text-white flex items-center justify-center shadow-md`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xs">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KELOLA GURU MATA PELAJARAN */}
          {activeTab === 'guru' && (
            <div className="space-y-4">
              {/* Top Bar for Guru Mapel */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={guruSearch}
                    onChange={(e) => setGuruSearch(e.target.value)}
                    placeholder="Cari guru berdasarkan nama, mapel, atau NIP..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 justify-between sm:justify-end">
                  {/* Density switcher */}
                  <div className="inline-flex bg-slate-200 p-0.5 rounded-xl text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setGuruDensity('compact')}
                      className={`px-2.5 py-1 rounded-lg transition ${guruDensity === 'compact' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <List className="w-3.5 h-3.5 inline mr-1" />
                      Tabel Compact
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuruDensity('card')}
                      className={`px-2.5 py-1 rounded-lg transition ${guruDensity === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />
                      Kartu
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddGuru}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Guru Mapel</span>
                  </button>
                </div>
              </div>

              {/* Inline Guru Add/Edit Form */}
              {showGuruForm && (
                <form onSubmit={handleSaveGuruForm} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <h4 className="font-bold text-emerald-950 text-sm flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      <span>{editingGuruId ? 'Edit Data Guru Mata Pelajaran' : 'Tambah Guru Mata Pelajaran Baru'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowGuruForm(false)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {guruFormError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                      {guruFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Nama Lengkap & Gelar: *</label>
                      <input
                        type="text"
                        value={guruFormData.nama}
                        onChange={(e) => setGuruFormData(g => ({ ...g, nama: e.target.value }))}
                        placeholder="Contoh: Hendra Wijaya, S.Pd."
                        className="w-full p-2 border border-slate-300 rounded-xl font-semibold bg-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Mata Pelajaran (Mapel): *</label>
                      <input
                        type="text"
                        value={guruFormData.mapel}
                        onChange={(e) => setGuruFormData(g => ({ ...g, mapel: e.target.value }))}
                        placeholder="Contoh: Matematika / Informatika / PAI"
                        className="w-full p-2 border border-slate-300 rounded-xl font-semibold bg-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Nomor Induk Pegawai (NIP):</label>
                      <input
                        type="text"
                        value={guruFormData.nip}
                        onChange={(e) => setGuruFormData(g => ({ ...g, nip: e.target.value }))}
                        placeholder="Contoh: 19820421 200801 1 009"
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Kelas Yang Diampu:</label>
                      <input
                        type="text"
                        value={guruFormData.kelasAjar}
                        onChange={(e) => setGuruFormData(g => ({ ...g, kelasAjar: e.target.value }))}
                        placeholder="Contoh: VII A, VII B, VIII A"
                        className="w-full p-2 border border-slate-300 rounded-xl font-semibold bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">No. WhatsApp / HP:</label>
                      <input
                        type="text"
                        value={guruFormData.noHp}
                        onChange={(e) => setGuruFormData(g => ({ ...g, noHp: e.target.value }))}
                        placeholder="Contoh: 6281234567890"
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Status Mengajar:</label>
                      <select
                        value={guruFormData.status}
                        onChange={(e) => setGuruFormData(g => ({ ...g, status: e.target.value as 'AKTIF' | 'NONAKTIF' }))}
                        className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                      >
                        <option value="AKTIF">AKTIF</option>
                        <option value="NONAKTIF">NONAKTIF / CUTI</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGuruForm(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl hover:bg-slate-100 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Guru</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Guru List Display (Card or Compact Table) */}
              {guruDensity === 'card' ? (
                /* Card-based layout for small screens / mobile */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredGuru.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400">
                      Tidak ada data guru mata pelajaran ditemukan.
                    </div>
                  ) : (
                    filteredGuru.map((guru) => (
                      <div
                        key={guru.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs space-y-2.5 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              {guru.mapel}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1">{guru.nama}</h4>
                            <p className="text-[11px] font-mono text-slate-500">NIP: {guru.nip || '-'}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            guru.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {guru.status}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-slate-600">
                            <strong>Kelas Diampu:</strong> {guru.kelasAjar || '-'}
                          </div>
                          <div className="text-slate-600 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span className="font-mono">{guru.noHp || '-'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGuru(guru)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="Edit Guru"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus guru ${guru.nama}?`)) {
                                onDeleteGuruMapel(guru.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Compact Table Layout */
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#0B132B] text-white font-mono text-[11px] tracking-wider uppercase sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 text-center border-r border-slate-800 w-10">#</th>
                          <th className="py-2.5 px-3 border-r border-slate-800">NAMA GURU MAPEL</th>
                          <th className="py-2.5 px-3 border-r border-slate-800">MAPEL</th>
                          <th className="py-2.5 px-3 border-r border-slate-800">NIP</th>
                          <th className="py-2.5 px-3 border-r border-slate-800">KELAS AJAR</th>
                          <th className="py-2.5 px-3 border-r border-slate-800">NO. WHATSAPP</th>
                          <th className="py-2.5 px-2.5 text-center border-r border-slate-800 w-20">STATUS</th>
                          <th className="py-2.5 px-3 text-center w-24">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans text-xs">
                        {filteredGuru.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              Tidak ada data guru mata pelajaran ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredGuru.map((guru, idx) => (
                            <tr key={guru.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2 px-3 text-center font-mono font-bold text-sky-600 border-r border-slate-100">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-100">
                                {guru.nama}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-100 font-semibold text-sky-800">
                                <span className="bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 text-[11px]">
                                  {guru.mapel}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-100 text-[11px]">
                                {guru.nip || '-'}
                              </td>
                              <td className="py-2 px-3 text-slate-700 border-r border-slate-100 text-[11px]">
                                {guru.kelasAjar || '-'}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-100 text-[11px]">
                                {guru.noHp || '-'}
                              </td>
                              <td className="py-2 px-2.5 text-center border-r border-slate-100">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  guru.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {guru.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditGuru(guru)}
                                    className="p-1 rounded hover:bg-sky-50 text-slate-500 hover:text-sky-600"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Hapus guru ${guru.nama}?`)) {
                                        onDeleteGuruMapel(guru.id);
                                      }
                                    }}
                                    className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                    title="Hapus"
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

          {/* TAB 4: AKUN & KREDENSIAL ADMIN */}
          {activeTab === 'admin' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Header Info Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>Kelola Kredensial Administrator</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Akses Penuh
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Ganti username dan kata sandi akun administrator sekolah untuk otentikasi login sistem presensi.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right sm:border-l sm:border-rose-200/80 sm:pl-4 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Akun Admin</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Aktif Terverifikasi
                  </span>
                </div>
              </div>

              {/* Alert Feedback */}
              {adminError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{adminError}</span>
                </div>
              )}

              {adminNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{adminNotice}</span>
                </div>
              )}

              {/* Form Card */}
              <form onSubmit={handleSaveAdminCredentials} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Username Administrator: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Contoh: admin atau admin_smpnh"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Username ini digunakan untuk login di tab Staf & Guru. Gunakan huruf kecil tanpa spasi.
                    </p>
                  </div>

                  {/* Nama Lengkap Administrator */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nama Lengkap Administrator:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={adminNama}
                        onChange={(e) => setAdminNama(e.target.value)}
                        placeholder="Contoh: Budi Santoso, S.Kom (Administrator)"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Nama ini akan ditampilkan pada header aplikasi dan log riwayat aktivitas.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password Baru */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Kata Sandi (Password) Baru:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Ketik kata sandi baru (min. 5 karakter)"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Kosongkan jika Anda hanya ingin memperbarui username dan tidak ingin mengganti kata sandi.
                    </p>
                  </div>

                  {/* Konfirmasi Password Baru */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Konfirmasi Kata Sandi Baru:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showAdminConfirmPassword ? 'text' : 'password'}
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        disabled={!adminPassword}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                        disabled={!adminPassword}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                      >
                        {showAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {adminPassword && adminConfirmPassword && (
                      <div className="text-[11px] font-semibold flex items-center space-x-1">
                        {adminPassword === adminConfirmPassword ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Kata sandi cocok
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            ✕ Kata sandi belum cocok
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Tips Card */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Petunjuk Keamanan Akun Administrator:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 leading-relaxed">
                    <li>Setelah disimpan, perubahan username dan kata sandi langsung aktif pada sistem presensi.</li>
                    <li>Pastikan Anda mencatat atau mengingat username dan kata sandi baru untuk login berikutnya.</li>
                    <li>Jika Anda sedang login sebagai admin, sesi Anda akan otomatis disinkronkan tanpa perlu keluar aplikasi.</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Kredensial Admin</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 5: KELOLA AKUN GURU PIKET & STAF PRESENSI */}
          {activeTab === 'piket' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Header Info Card Guru Piket */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>Kelola Akun Guru Piket & Staf Presensi</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                        Akses Login
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tambahkan dan kelola akun Guru Piket agar dapat login ke aplikasi, membuka sesi scanner QR proyektor, serta memverifikasi presensi harian.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:border-l sm:border-sky-200/80 sm:pl-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Akun Piket</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                      {filteredPiketList.length} Petugas Terdaftar
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar: Search & Tambah Guru Piket Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={piketSearch}
                    onChange={(e) => setPiketSearch(e.target.value)}
                    placeholder="Cari guru piket (nama, username, no hp)..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  />
                  {piketSearch && (
                    <button
                      type="button"
                      onClick={() => setPiketSearch('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPiket}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center space-x-1.5 transition cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tambah Guru Piket Baru</span>
                </button>
              </div>

              {/* Table / Card List of Guru Piket */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-3.5">Petugas / Nama Lengkap</th>
                        <th className="py-3 px-3.5">Username Login</th>
                        <th className="py-3 px-3.5">No. WhatsApp / HP</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                      {filteredPiketList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <UserCheck className="w-8 h-8 text-slate-300" />
                              <p className="font-semibold text-slate-500">
                                {piketSearch ? 'Tidak ada guru piket yang cocok dengan pencarian.' : 'Belum ada akun guru piket.'}
                              </p>
                              {!piketSearch && (
                                <button
                                  type="button"
                                  onClick={handleOpenAddPiket}
                                  className="mt-1 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold rounded-lg text-xs cursor-pointer"
                                >
                                  + Tambah Guru Piket Pertama
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPiketList.map((piket, idx) => {
                          const isActive = piket.status !== 'NONAKTIF';
                          return (
                            <tr key={piket.id || idx} className="hover:bg-sky-50/40 transition">
                              <td className="py-3 px-3.5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0 border border-sky-200">
                                    {piket.nama.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{piket.nama}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                        {piket.id}
                                      </span>
                                      <span>• Operator Scanner & Piket</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-xs">
                                  <span>{piket.username}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCredentials(piket.username, piket.id)}
                                    title="Salin username"
                                    className="p-0.5 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  {copiedPiketId === piket.id && (
                                    <span className="text-[10px] text-emerald-600 font-sans font-bold">Tersalin!</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3.5 text-slate-600">
                                {piket.noHp ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {piket.noHp}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isActive
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-200 text-slate-600 border border-slate-300'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                                  {isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePiketStatus(piket)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                      isActive 
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}
                                    title={isActive ? 'Nonaktifkan akun guru piket' : 'Aktifkan akun guru piket'}
                                  >
                                    {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPiket(piket)}
                                    className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-100 rounded-lg transition cursor-pointer"
                                    title="Edit data / ganti password guru piket"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePiket(piket)}
                                    disabled={guruPiketList.length <= 1}
                                    className={`p-1.5 rounded-lg transition ${
                                      guruPiketList.length <= 1 
                                        ? 'text-slate-300 cursor-not-allowed' 
                                        : 'text-rose-500 hover:text-rose-700 hover:bg-rose-100 cursor-pointer'
                                    }`}
                                    title={guruPiketList.length <= 1 ? 'Minimal harus ada 1 guru piket' : 'Hapus akun guru piket'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>Petunjuk Akun Guru Piket:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-sky-800 space-y-0.5 leading-relaxed">
                  <li>Guru piket yang ditambahkan langsung dapat login pada tab <strong>Login Staf & Guru</strong> dengan username dan kata sandi yang telah didaftarkan.</li>
                  <li>Petugas piket memiliki hak akses untuk mengoperasikan Scanner QR, membuka sesi kehadiran, mencatat izin/sakit, dan memantau rekapan presensi.</li>
                  <li>Jika seorang guru sedang cuti atau tidak bertugas, status akun dapat diubah menjadi <strong>Nonaktif</strong> tanpa harus menghapus datanya.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">
              {profileForm.namaSekolah} • TP {profileForm.tahunPelajaran} ({profileForm.semester})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition active:scale-95 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Modal Tambah Guru Piket Baru */}
      {showAddPiketModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">Tambah Guru Piket Baru</h4>
                  <p className="text-[11px] text-sky-100">Daftarkan akun untuk login petugas presensi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPiketModal(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddPiket} className="p-5 space-y-4 text-xs">
              {piketFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{piketFormError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Nama Lengkap Petugas / Guru: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addPiketForm.nama}
                  onChange={(e) => setAddPiketForm(f => ({ ...f, nama: e.target.value }))}
                  placeholder="Contoh: Dra. Hj. Maryam (Guru Piket)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Username Login: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={addPiketForm.username}
                    onChange={(e) => setAddPiketForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                    placeholder="Contoh: guru_piket2 atau piket_pagi"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">Gunakan huruf kecil tanpa spasi (min. 3 karakter).</p>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Kata Sandi (Password): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPiketPassword ? 'text' : 'password'}
                      value={addPiketForm.password}
                      onChange={(e) => setAddPiketForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 5 karakter"
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPiketPassword(!showPiketPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPiketPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Ulangi Kata Sandi: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPiketConfirmPassword ? 'text' : 'password'}
                      value={addPiketForm.confirmPassword}
                      onChange={(e) => setAddPiketForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Konfirmasi sandi"
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPiketConfirmPassword(!showPiketConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPiketConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* No. WhatsApp / HP */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Nomor WhatsApp / HP: <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={addPiketForm.noHp}
                    onChange={(e) => setAddPiketForm(f => ({ ...f, noHp: e.target.value }))}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPiketModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Daftarkan Guru Piket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Guru Piket */}
      {showEditPiketModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">Edit Akun Guru Piket</h4>
                  <p className="text-[11px] text-sky-100">Perbarui username, profil, atau kata sandi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPiketModal(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPiket} className="p-5 space-y-4 text-xs">
              {piketFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{piketFormError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Nama Lengkap Petugas / Guru: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPiketForm.nama}
                  onChange={(e) => setEditPiketForm(f => ({ ...f, nama: e.target.value }))}
                  placeholder="Contoh: Dra. Hj. Maryam (Guru Piket)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Username Login: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={editPiketForm.username}
                    onChange={(e) => setEditPiketForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password Baru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Kata Sandi Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showPiketPassword ? 'text' : 'password'}
                      value={editPiketForm.password}
                      onChange={(e) => setEditPiketForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Kosongkan jika tetap"
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPiketPassword(!showPiketPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPiketPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Ulangi Kata Sandi Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showPiketConfirmPassword ? 'text' : 'password'}
                      value={editPiketForm.confirmPassword}
                      onChange={(e) => setEditPiketForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Konfirmasi"
                      disabled={!editPiketForm.password}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPiketConfirmPassword(!showPiketConfirmPassword)}
                      disabled={!editPiketForm.password}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                    >
                      {showPiketConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* No. WhatsApp & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Nomor WhatsApp / HP:
                  </label>
                  <input
                    type="tel"
                    value={editPiketForm.noHp}
                    onChange={(e) => setEditPiketForm(f => ({ ...f, noHp: e.target.value }))}
                    placeholder="081234567890"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Status Akun:
                  </label>
                  <select
                    value={editPiketForm.status}
                    onChange={(e) => setEditPiketForm(f => ({ ...f, status: e.target.value as 'AKTIF' | 'NONAKTIF' }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="AKTIF">🟢 AKTIF (Bisa Login)</option>
                    <option value="NONAKTIF">⚪ NONAKTIF (Blokir Login)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditPiketModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
