'use client';

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Role, 
  User, 
  Siswa, 
  SesiQR, 
  PresensiRecord, 
  WhatsAppConfig, 
  StatusPresensi, 
  SchoolProfile, 
  GuruMapel, 
  PengajuanIzin, 
  PengumumanSekolah,
  JurnalKbmRecord,
  GasLiveSyncConfig,
  VoiceAnnouncementConfig,
  ActivityLog,
  ActivityLogCategory
} from '@/types/attendance';
import { 
  INITIAL_USERS, 
  INITIAL_SISWA, 
  INITIAL_SESI, 
  INITIAL_PRESENSI, 
  INITIAL_WA_CONFIG,
  INITIAL_SCHOOL_PROFILE,
  INITIAL_GURU_MAPEL,
  INITIAL_PENGAJUAN_IZIN,
  INITIAL_PENGUMUMAN,
  INITIAL_JURNAL_KBM,
  INITIAL_ACTIVITY_LOGS
} from '@/lib/initial-data';
import { DEFAULT_GAS_CONFIG } from '@/lib/gas-sync';
import { DEFAULT_VOICE_CONFIG } from '@/lib/voice-speech';
import { auth, testFirestoreConnection } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  syncUserProfile,
  seedInitialFirestoreData,
  subscribeStudents,
  addStudentToFirestore,
  updateStudentInFirestore,
  deleteStudentFromFirestore,
  subscribeAttendance,
  addAttendanceRecordToFirestore,
  subscribeSessions,
  createSessionInFirestore,
  toggleSessionActiveInFirestore,
  subscribeLeaveRequests,
  addLeaveRequestToFirestore,
  updateLeaveRequestStatusInFirestore,
  subscribeAnnouncements,
  addAnnouncementToFirestore,
  subscribeTeachingJournals,
  addTeachingJournalToFirestore,
  subscribeSchoolProfile,
  updateSchoolProfileInFirestore,
  subscribeAllUsers
} from '@/lib/firestore-service';
import { Header } from '@/components/Header';
import { LoginPage } from '@/components/LoginPage';
import { SiswaPortalSection } from '@/components/SiswaPortalSection';
import { ScanQRSection } from '@/components/ScanQRSection';
import { GeneratorSesiSection } from '@/components/GeneratorSesiSection';
import { DashboardLaporanSection } from '@/components/DashboardLaporanSection';
import { WhatsAppSection } from '@/components/WhatsAppSection';
import { SheetsDatabaseViewer } from '@/components/SheetsDatabaseViewer';
import { DataSiswaSection } from '@/components/DataSiswaSection';
import { JurnalKbmSection } from '@/components/JurnalKbmSection';
import { GasLiveSyncModal } from '@/components/GasLiveSyncModal';
import { VoiceGreetingModal } from '@/components/VoiceGreetingModal';
import { PanduanLengkapSection } from '@/components/PanduanLengkapSection';
import { TeacherAbsenceAlert } from '@/components/TeacherAbsenceAlert';
import { SchoolSettingsModal } from '@/components/SchoolSettingsModal';
import { MassAttendanceModal } from '@/components/MassAttendanceModal';
import { PengumumanModal } from '@/components/PengumumanModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { detectConsecutiveAbsences } from '@/lib/absence-detection';
import { createPresensiIndexKey, 
  buildPresensiIndex, 
  checkDuplicateFromIndex,
  addRecordToIndex 
} from '@/lib/presensi-indexer';
import { useIsMounted } from '@/lib/utils';
import { 
  QrCode, 
  BarChart3, 
  Send, 
  Database, 
  Radio, 
  GraduationCap,
  Sparkles,
  Users,
  School,
  Settings,
  BookOpen,
  Volume2,
  FileSpreadsheet
} from 'lucide-react';

interface DeviceViewportWrapperProps {
  deviceMode?: 'desktop' | 'mobile';
  schoolProfile?: SchoolProfile;
  onSwitchToDesktop?: () => void;
  onOpenInstallPWA?: () => void;
  currentUser: User;
  currentSimTab: 'scan' | 'sesi' | 'siswa' | 'laporan' | 'wa' | 'sheets' | 'portal' | 'jurnal';
  onSelectSimTab: (tab: 'scan' | 'sesi' | 'siswa' | 'laporan' | 'wa' | 'sheets' | 'portal' | 'jurnal') => void;
  siswaActiveTab: 'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman';
  onSelectSiswaTab: (tab: 'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman') => void;
  pendingIzinCount: number;
  unreadPengumumanCount: number;
  onOpenPanduan?: () => void;
  children: React.ReactNode;
}

// Declared outside of render function to comply with React static component rules
const DeviceViewportWrapper: React.FC<DeviceViewportWrapperProps> = ({
  currentUser,
  currentSimTab,
  onSelectSimTab,
  siswaActiveTab,
  onSelectSiswaTab,
  pendingIzinCount,
  unreadPengumumanCount,
  onOpenPanduan,
  children
}) => {
  return (
    <>
      {children}
      {/* Mobile Bottom Navigation for actual smartphones */}
      <div className="md:hidden">
        <MobileBottomNav
          role={currentUser.role}
          activeSimTab={currentSimTab}
          onSelectSimTab={onSelectSimTab}
          activeSiswaTab={siswaActiveTab}
          onSelectSiswaTab={onSelectSiswaTab}
          pendingIzinCount={pendingIzinCount}
          unreadPengumumanCount={unreadPengumumanCount}
          onOpenPanduan={onOpenPanduan}
        />
      </div>
    </>
  );
};

function subscribeDeviceMode(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('device-mode-change', callback);
  window.addEventListener('resize', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('device-mode-change', callback);
    window.removeEventListener('resize', callback);
  };
}

function getDeviceModeSnapshot(): 'desktop' | 'mobile' {
  try {
    const saved = localStorage.getItem('presensi_device_mode') as 'desktop' | 'mobile' | null;
    if (saved === 'desktop' || saved === 'mobile') return saved;
  } catch {}
  if (typeof window !== 'undefined' && window.innerWidth < 768) return 'mobile';
  return 'desktop';
}

function getDeviceModeServerSnapshot(): 'desktop' | 'mobile' {
  return 'desktop';
}

function subscribeStoredAuth(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('auth-state-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-state-change', callback);
  };
}

function getStoredAuthSnapshot(): string {
  try {
    return localStorage.getItem('presensi_current_user') || '';
  } catch {
    return '';
  }
}

function getStoredAuthServerSnapshot(): string {
  return '';
}

export default function AttendanceApp() {
  const storedAuthJson = useSyncExternalStore(
    subscribeStoredAuth,
    getStoredAuthSnapshot,
    getStoredAuthServerSnapshot
  );

  const storedUser = useMemo(() => {
    if (!storedAuthJson) return null;
    try {
      const parsed = JSON.parse(storedAuthJson);
      if (parsed && parsed.id && parsed.role) return parsed as User;
    } catch {}
    return null;
  }, [storedAuthJson]);

  // Authentication State
  const [activeUserOverride, setActiveUserOverride] = useState<User | null>(null);
  const currentUser: User = activeUserOverride || storedUser || INITIAL_USERS[0];
  const isAuthenticated = Boolean(activeUserOverride || storedUser);

  // Main Navigation Modes
  const [activeMainTab, setActiveMainTab] = useState<'simulator' | 'panduan'>('simulator');
  // Simulator Sub-tabs
  const [activeSimTab, setActiveSimTab] = useState<'scan' | 'sesi' | 'siswa' | 'laporan' | 'wa' | 'sheets' | 'portal' | 'jurnal'>('scan');

  // Application State
  const [usersList, setUsersList] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('presensi_users_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_USERS;
  });
  const [siswaList, setSiswaList] = useState<Siswa[]>(INITIAL_SISWA);
  const [sesiList, setSesiList] = useState<SesiQR[]>(INITIAL_SESI);
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>(INITIAL_PRESENSI);
  // O(1) Fast Index Map for Anti-Duplication lookups across thousands of records
  const [presensiIndex, setPresensiIndex] = useState<Map<string, PresensiRecord>>(() => 
    buildPresensiIndex(INITIAL_PRESENSI)
  );
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(INITIAL_WA_CONFIG);
  const [isAbsenceAlertEnabled, setIsAbsenceAlertEnabled] = useState<boolean>(true);
  const [isPresensiMandiriEnabled, setIsPresensiMandiriEnabled] = useState<boolean>(false);
  const [pengajuanIzinList, setPengajuanIzinList] = useState<PengajuanIzin[]>(INITIAL_PENGAJUAN_IZIN);

  // Presensi Jam Pelajaran & Jurnal KBM State
  const [jurnalList, setJurnalList] = useState<JurnalKbmRecord[]>(INITIAL_JURNAL_KBM);

  // Audit Trail & Activity Log State (Real-Time)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // Live Google Apps Script Web App Connection State
  const [gasSyncConfig, setGasSyncConfig] = useState<GasLiveSyncConfig>(DEFAULT_GAS_CONFIG);
  const [showGasSyncModal, setShowGasSyncModal] = useState<boolean>(false);

  // Suara Text-to-Speech (TTS) Voice Sapaan State
  const [voiceConfig, setVoiceConfig] = useState<VoiceAnnouncementConfig>(DEFAULT_VOICE_CONFIG);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  // SSR hydration safe device mode: starts as 'desktop' on both server & client initial pass, then adapts immediately on mount
  const isMounted = useIsMounted();

  const [overrideDeviceMode, setOverrideDeviceMode] = useState<'desktop' | 'mobile' | null>(null);
  const detectedDeviceMode = useSyncExternalStore(
    subscribeDeviceMode,
    getDeviceModeSnapshot,
    getDeviceModeServerSnapshot
  );
  const deviceMode = isMounted ? (overrideDeviceMode ?? detectedDeviceMode) : 'desktop';

  const [showPwaInstallModal, setShowPwaInstallModal] = useState<boolean>(false);
  // Inner Siswa Active Tab for bottom nav synchronization
  const [siswaActiveTab, setSiswaActiveTab] = useState<'kartu' | 'laporan' | 'mandiri' | 'izin' | 'pengumuman'>('kartu');
  // School Announcements State
  const [pengumumanList, setPengumumanList] = useState<PengumumanSekolah[]>(INITIAL_PENGUMUMAN);
  const [showPengumumanModal, setShowPengumumanModal] = useState<boolean>(false);

  const handleChangeDeviceMode = (mode: 'desktop' | 'mobile') => {
    setOverrideDeviceMode(mode);
    try {
      localStorage.setItem('presensi_device_mode', mode);
      window.dispatchEvent(new Event('device-mode-change'));
    } catch {}
  };

  const handleAddPengumuman = (item: PengumumanSekolah) => {
    setPengumumanList(prev => [item, ...prev]);
    addAnnouncementToFirestore(item).catch(console.error);
  };

  const handleDeletePengumuman = (id: string) => {
    setPengumumanList(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveJurnal = (record: JurnalKbmRecord) => {
    setJurnalList(prev => [record, ...prev]);
    addTeachingJournalToFirestore(record).catch(console.error);
  };

  const handleDeleteJurnal = (id: string) => {
    setJurnalList(prev => prev.filter(j => j.id !== id));
  };

  // School Profile & Guru Mapel State
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(INITIAL_SCHOOL_PROFILE);
  const [guruMapelList, setGuruMapelList] = useState<GuruMapel[]>(INITIAL_GURU_MAPEL);
  const [showSchoolSettingsModal, setShowSchoolSettingsModal] = useState<boolean>(false);
  const [schoolSettingsInitialTab, setSchoolSettingsInitialTab] = useState<'sekolah' | 'logo' | 'guru' | 'admin' | 'piket'>('sekolah');
  const [showMassAttendanceModal, setShowMassAttendanceModal] = useState<boolean>(false);

  // Helper to record activity log in real-time
  const logActivity = useCallback((action: string, category: ActivityLogCategory, details: string, targetId?: string) => {
    const now = new Date();
    const tz = schoolProfile.zonaWaktu === 'WIB' 
      ? 'Asia/Jakarta' 
      : schoolProfile.zonaWaktu === 'WITA' 
        ? 'Asia/Makassar' 
        : 'Asia/Jayapura';
    const label = schoolProfile.zonaWaktu || 'WIT';
    const timestampStr = now.toLocaleDateString('id-ID', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('id-ID', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' ' + label;

    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timestampStr,
      actor: currentUser.nama || 'Administrator',
      action,
      category,
      details,
      targetId
    };

    setActivityLogs(prev => [newLog, ...prev]);
  }, [schoolProfile.zonaWaktu, currentUser.nama]);

  // Derived admin user from usersList
  const adminUser = useMemo(() => {
    return usersList.find(u => u.role === 'ADMIN') || usersList[0];
  }, [usersList]);

  // Handler to update Admin username and password
  const handleUpdateAdminCredentials = (data: { username: string; password?: string; nama?: string }): { success: boolean; message: string } => {
    const cleanUser = data.username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Username admin tidak boleh kosong.' };
    }

    // Check if username taken by another user
    const usernameTaken = usersList.some(
      u => u.role !== 'ADMIN' && (u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser))
    );
    if (usernameTaken) {
      return { success: false, message: `Username "${data.username}" sudah digunakan oleh akun lain.` };
    }

    let updatedAdmin: User | null = null;
    const updatedUsers = usersList.map(u => {
      if (u.role === 'ADMIN') {
        const mod: User = {
          ...u,
          username: data.username.trim(),
          nama: data.nama?.trim() || u.nama,
          password: data.password ? data.password.trim() : u.password
        };
        updatedAdmin = mod;
        return mod;
      }
      return u;
    });

    setUsersList(updatedUsers);

    try {
      localStorage.setItem('presensi_users_list', JSON.stringify(updatedUsers));
      if (updatedAdmin && currentUser.role === 'ADMIN') {
        setActiveUserOverride(updatedAdmin);
        localStorage.setItem('presensi_current_user', JSON.stringify(updatedAdmin));
        window.dispatchEvent(new Event('auth-state-change'));
      }
    } catch (e) {
      console.error(e);
    }

    logActivity(
      'PERBARUI_KREDENSIAL_ADMIN',
      'PENGATURAN',
      `Kredensial Administrator diperbarui: Username baru "${data.username.trim()}"${data.password ? ' dan kata sandi baru telah diatur' : ''}.`
    );

    return { success: true, message: 'Username dan kata sandi admin berhasil diperbarui!' };
  };

  // Derived guru piket user from usersList
  const guruPiketUser = useMemo(() => {
    return usersList.find(u => u.username === 'guru_piket' || u.role === 'GURU') || usersList.find(u => u.role !== 'ADMIN') || usersList[1];
  }, [usersList]);

  // Handler to update Guru Piket username and password
  const handleUpdateGuruPiketCredentials = (data: { username: string; password?: string; nama?: string }): { success: boolean; message: string } => {
    const cleanUser = data.username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Username guru piket tidak boleh kosong.' };
    }

    // Check if username taken by another user
    const usernameTaken = usersList.some(
      u => u.id !== guruPiketUser?.id && (u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser))
    );
    if (usernameTaken) {
      return { success: false, message: `Username "${data.username}" sudah digunakan oleh akun lain.` };
    }

    let updatedPiket: User | null = null;
    const targetId = guruPiketUser?.id || 'USR-002';
    const updatedUsers = usersList.map(u => {
      if (u.id === targetId || u.username === 'guru_piket' || (u.role === 'GURU' && !updatedPiket)) {
        const mod: User = {
          ...u,
          username: data.username.trim(),
          nama: data.nama?.trim() || u.nama,
          password: data.password ? data.password.trim() : u.password
        };
        updatedPiket = mod;
        return mod;
      }
      return u;
    });

    setUsersList(updatedUsers);

    try {
      localStorage.setItem('presensi_users_list', JSON.stringify(updatedUsers));
      if (updatedPiket && currentUser.id === updatedPiket.id) {
        setActiveUserOverride(updatedPiket);
        localStorage.setItem('presensi_current_user', JSON.stringify(updatedPiket));
        window.dispatchEvent(new Event('auth-state-change'));
      }
    } catch (e) {
      console.error(e);
    }

    logActivity(
      'PERBARUI_KREDENSIAL_GURU_PIKET',
      'PENGATURAN',
      `Kredensial Guru Piket diperbarui: Username baru "${data.username.trim()}"${data.password ? ' dan kata sandi baru telah diatur' : ''}.`
    );

    return { success: true, message: 'Username dan kata sandi guru piket berhasil diperbarui!' };
  };

  // Derived guru piket users list from usersList
  const guruPiketList = useMemo(() => {
    return usersList.filter(u => u.role === 'GURU' || u.username === 'guru_piket');
  }, [usersList]);

  // Handler for Admin to add a new Guru Piket
  const handleAddGuruPiket = useCallback((data: { username: string; password?: string; nama: string; noHp?: string }): { success: boolean; message: string } => {
    const cleanUser = data.username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Username guru piket tidak boleh kosong.' };
    }
    if (cleanUser.length < 3) {
      return { success: false, message: 'Username guru piket minimal harus 3 karakter.' };
    }
    if (usersList.some(u => u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser))) {
      return { success: false, message: `Username "${cleanUser}" sudah digunakan oleh akun lain.` };
    }

    const uniqueSuffix = Date.now().toString().slice(-6);
    const newPiketUser: User = {
      id: `USR-PIKET-${uniqueSuffix}`,
      username: cleanUser,
      password: data.password ? data.password.trim() : 'piket123',
      nama: data.nama.trim(),
      role: 'GURU',
      kelas: 'SEMUA',
      noHp: data.noHp ? data.noHp.trim() : '',
      status: 'AKTIF'
    };

    const updatedUsers = [...usersList, newPiketUser];
    setUsersList(updatedUsers);

    try {
      localStorage.setItem('presensi_users_list', JSON.stringify(updatedUsers));
    } catch (e) {
      console.error(e);
    }

    logActivity(
      'TAMBAH_GURU_PIKET',
      'PENGATURAN',
      `Akun Guru Piket baru ditambahkan: "${data.nama.trim()}" (${cleanUser}). Akun dapat langsung digunakan untuk login.`
    );

  }, [usersList, logActivity]);

  // Handler to update an existing Guru Piket
  const handleUpdateGuruPiket = useCallback((
    userId: string,
    data: { username: string; password?: string; nama?: string; noHp?: string; status?: 'AKTIF' | 'NONAKTIF' }
  ): { success: boolean; message: string } => {
    const cleanUser = data.username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Username guru piket tidak boleh kosong.' };
    }

    // Check if username taken by another user
    if (usersList.some(u => u.id !== userId && (u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)))) {
      return { success: false, message: `Username "${cleanUser}" sudah digunakan oleh akun lain.` };
    }

    let updatedPiket: User | null = null;
    const updatedUsers = usersList.map(u => {
      if (u.id === userId) {
        const mod: User = {
          ...u,
          username: cleanUser,
          nama: data.nama?.trim() || u.nama,
          password: data.password?.trim() ? data.password.trim() : u.password,
          noHp: data.noHp !== undefined ? data.noHp.trim() : u.noHp,
          status: data.status || u.status || 'AKTIF'
        };
        updatedPiket = mod;
        return mod;
      }
      return u;
    });

    setUsersList(updatedUsers);

    try {
      localStorage.setItem('presensi_users_list', JSON.stringify(updatedUsers));
      if (updatedPiket && currentUser.id === (updatedPiket as User).id) {
        setActiveUserOverride(updatedPiket);
        localStorage.setItem('presensi_current_user', JSON.stringify(updatedPiket));
        window.dispatchEvent(new Event('auth-state-change'));
      }
    } catch (e) {
      console.error(e);
    }

    logActivity(
      'PERBARUI_GURU_PIKET',
      'PENGATURAN',
      `Data akun Guru Piket "${data.nama || cleanUser}" berhasil diperbarui.`
    );

    return { success: true, message: 'Data akun guru piket berhasil diperbarui!' };
  }, [usersList, currentUser.id, logActivity]);

  // Handler to delete a Guru Piket
  const handleDeleteGuruPiket = useCallback((userId: string): { success: boolean; message: string } => {
    const target = usersList.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Akun guru piket tidak ditemukan.' };
    }
    if (currentUser.id === userId) {
      return { success: false, message: 'Anda tidak dapat menghapus akun guru piket yang sedang Anda gunakan.' };
    }
    const piketCount = usersList.filter(u => u.role === 'GURU' || u.username === 'guru_piket').length;
    if (piketCount <= 1) {
      return { success: false, message: 'Minimal harus ada 1 akun Guru Piket aktif di sistem sekolah.' };
    }

    const updatedUsers = usersList.filter(u => u.id !== userId);
    setUsersList(updatedUsers);

    try {
      localStorage.setItem('presensi_users_list', JSON.stringify(updatedUsers));
    } catch (e) {
      console.error(e);
    }

    logActivity(
      'HAPUS_GURU_PIKET',
      'PENGATURAN',
      `Akun Guru Piket "${target.nama}" (${target.username}) telah dihapus oleh Admin.`
    );

    return { success: true, message: `Akun Guru Piket "${target.nama}" berhasil dihapus.` };
  }, [usersList, currentUser.id, logActivity]);

  const handleSaveSchoolProfile = (updated: SchoolProfile) => {
    setSchoolProfile(updated);
    updateSchoolProfileInFirestore(updated).catch(console.error);
    logActivity(
      'PERBARUI_PROFIL_SEKOLAH',
      'KONFIGURASI',
      `Identitas sekolah diperbarui: ${updated.namaSekolah} (${updated.kota}, ${updated.provinsi}) - TP: ${updated.tahunPelajaran} (${updated.semester}).`
    );
  };

  const handleUpdateWaConfig = (newConfig: WhatsAppConfig) => {
    setWaConfig(newConfig);
    logActivity(
      'PERBARUI_KONFIGURASI_WA',
      'KONFIGURASI',
      `Konfigurasi WhatsApp Gateway (${newConfig.provider}) diperbarui. Pengiriman otomatis: ${newConfig.enabled ? 'AKTIF' : 'NONAKTIF'}. Nomor ID: ${newConfig.phoneNumberId || '-'}. Template: ${newConfig.templateName || 'Default'}.`
    );
  };

  // Toggle absence notification alert on/off
  const handleToggleAbsenceAlert = () => {
    setIsAbsenceAlertEnabled(prev => !prev);
  };

  // Consecutive absences detection (3+ school days without attendance)
  const consecutiveAlerts = useMemo(() => {
    return detectConsecutiveAbsences(siswaList, presensiList, 3);
  }, [siswaList, presensiList]);

  // Pending Izin & Pengumuman counts for mobile navigation badges
  const pendingIzinCount = useMemo(() => {
    if (currentUser.role === 'SISWA') {
      return pengajuanIzinList.filter(p => (p.nisn === currentUser.nisn || p.nisn === currentUser.username) && p.status === 'MENUNGGU').length;
    }
    return pengajuanIzinList.filter(p => p.status === 'MENUNGGU').length;
  }, [pengajuanIzinList, currentUser]);

  const unreadPengumumanCount = pengumumanList.length;

  // Active Session (default first active session)
  const activeSesi = sesiList.find(s => s.aktif) || sesiList[0];

  // Cloud Firestore & Firebase Auth Real-Time Synchronization Lifecycle
  useEffect(() => {
    testFirestoreConnection();

    // 1. Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await syncUserProfile({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL
          });
          const mappedRole: Role = (profile.role === 'admin' || (profile.role as string) === 'ADMIN') ? 'ADMIN' : (profile.role === 'siswa' || (profile.role as string) === 'SISWA') ? 'SISWA' : 'GURU';
          const newUser: User = {
            id: profile.id,
            username: profile.username,
            nama: profile.nama || profile.username || 'Pengguna',
            email: fbUser.email || undefined,
            role: mappedRole,
            noHp: profile.noHp || '6281234567890',
            status: 'AKTIF'
          };
          setActiveUserOverride(newUser);
          try {
            localStorage.setItem('presensi_current_user', JSON.stringify(newUser));
            window.dispatchEvent(new Event('auth-state-change'));
          } catch {}
        } catch (e) {
          console.error('Failed to sync user profile:', e);
        }
      }
    });

    // 2. Seed initial school collections if empty
    seedInitialFirestoreData();

    // 3. Real-time Firestore Listeners
    const unsubStudents = subscribeStudents((students) => {
      if (students && students.length > 0) {
        setSiswaList(students);
      }
    });

    const unsubAttendance = subscribeAttendance((records) => {
      if (records && records.length > 0) {
        setPresensiList(records);
        setPresensiIndex(buildPresensiIndex(records));
      }
    });

    const unsubSessions = subscribeSessions((sessions) => {
      if (sessions && sessions.length > 0) {
        setSesiList(sessions);
      }
    });

    const unsubLeave = subscribeLeaveRequests((requests) => {
      if (requests && requests.length > 0) {
        setPengajuanIzinList(requests);
      }
    });

    const unsubAnnouncements = subscribeAnnouncements((anns) => {
      if (anns && anns.length > 0) {
        setPengumumanList(anns);
      }
    });

    const unsubJournals = subscribeTeachingJournals((journals) => {
      if (journals && journals.length > 0) {
        setJurnalList(journals);
      }
    });

    const unsubProfile = subscribeSchoolProfile((profile) => {
      if (profile) {
        setSchoolProfile(prev => ({
          ...prev,
          ...profile,
          logoUrl: prev.logoUrl || profile.logoUrl
        }));
      }
    });

    const unsubUsers = subscribeAllUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        setUsersList(prev => {
          const userMap = new Map<string, User>();
          // Always preserve INITIAL_USERS
          INITIAL_USERS.forEach(u => userMap.set(u.id, u));
          // Overlay previous state (which includes local credentials changes)
          prev.forEach(u => userMap.set(u.id, u));
          // Overlay firestore users
          firestoreUsers.forEach(fu => {
            const existing = userMap.get(fu.id);
            userMap.set(fu.id, {
              ...fu,
              password: fu.password || existing?.password || (fu.role === 'ADMIN' ? 'admin123' : 'piket123')
            });
          });
          return Array.from(userMap.values());
        });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubStudents();
      unsubAttendance();
      unsubSessions();
      unsubLeave();
      unsubAnnouncements();
      unsubJournals();
      unsubProfile();
      unsubUsers();
    };
  }, []);

  // Derived state enforcing access boundaries for SISWA role (Siswa only accesses portal)
  const currentMainTab = currentUser.role === 'SISWA' ? 'simulator' : activeMainTab;
  const currentSimTab = currentUser.role === 'SISWA' ? 'portal' : activeSimTab;

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setActiveUserOverride(user);
    try {
      localStorage.setItem('presensi_current_user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-state-change'));
    } catch {}

    // Ensure Scan Mandiri Siswa is OFF (disabled) by default on admin & guru login
    if (user.role === 'ADMIN' || user.role === 'GURU') {
      setIsPresensiMandiriEnabled(false);
      setSesiList(currentList =>
        currentList.map(s => ({ ...s, allowSelfScan: false }))
      );
    }

    if (user.role === 'SISWA') {
      setActiveSimTab('portal');
    } else if (user.role === 'GURU') {
      setActiveSimTab('sesi');
    } else {
      setActiveSimTab('scan');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    setActiveUserOverride(null);
    try {
      localStorage.removeItem('presensi_current_user');
      window.dispatchEvent(new Event('auth-state-change'));
    } catch {}
    try {
      await signOut(auth);
    } catch {}
  };

  // Role Switcher Handler
  const handleSwitchRole = (role: Role) => {
    const foundUser = usersList.find(u => u.role === role);
    if (foundUser) {
      setActiveUserOverride(foundUser);
      try {
        localStorage.setItem('presensi_current_user', JSON.stringify(foundUser));
        window.dispatchEvent(new Event('auth-state-change'));
      } catch {}
      // Auto-navigate to appropriate sub-tab
      if (role === 'SISWA') {
        setActiveSimTab('portal');
      } else if (role === 'GURU') {
        setActiveSimTab('sesi');
      } else {
        setActiveSimTab('scan');
      }
    }
  };

  // Record Attendance with strict O(1) Anti-Duplication check (LockService fast indexing)
  const handleRecordPresensi = (newRecord: PresensiRecord): { success: boolean; duplicate?: boolean; message: string } => {
    // 1. O(1) Fast Anti-Duplication check using state index
    const duplicate = checkDuplicateFromIndex(presensiIndex, newRecord.tanggal, newRecord.nisn, newRecord.tipe);

    if (duplicate) {
      return {
        success: false,
        duplicate: true,
        message: `DUPLIKAT: Siswa a.n. ${newRecord.namaSiswa} SUDAH tercatat presensi ${newRecord.tipe} hari ini pada pukul ${duplicate.waktu} (Status: ${duplicate.status}). Transaksi dibatalkan oleh server.`
      };
    }

    // 2. O(1) Append new record to index and state list
    setPresensiIndex(prevIndex => addRecordToIndex(prevIndex, newRecord));
    setPresensiList(prev => [newRecord, ...prev]);

    // 3. Persist to Cloud Firestore in real time
    const enrichedRecord: PresensiRecord = {
      ...newRecord,
      nama: newRecord.nama || newRecord.namaSiswa || 'Siswa',
      namaSiswa: newRecord.namaSiswa || newRecord.nama || 'Siswa',
      jam: newRecord.jam || newRecord.waktu || '07:00',
      waktu: newRecord.waktu || newRecord.jam || '07:00',
      sesiId: newRecord.sesiId || newRecord.tipe || 'MASUK',
      keterangan: newRecord.keterangan || newRecord.catatan || '',
      verifiedBy: newRecord.verifiedBy || newRecord.petugas || 'Petugas Piket'
    };

    addAttendanceRecordToFirestore(enrichedRecord).catch((err) => {
      console.error('Gagal menyimpan presensi ke Cloud Firestore:', err);
    });

    return {
      success: true,
      message: `Presensi ${newRecord.tipe} a.n. ${newRecord.namaSiswa} berhasil dicatat!`
    };
  };

  // Toggle Presensi Mandiri Siswa (Admin & Guru Only)
  const handleTogglePresensiMandiri = () => {
    setIsPresensiMandiriEnabled(prev => {
      const nextVal = !prev;
      setSesiList(currentList =>
        currentList.map(s => s.id === activeSesi.id ? { ...s, allowSelfScan: nextVal } : s)
      );
      return nextVal;
    });
  };

  // Update or Create Session
  const handleUpdateSesi = (newSesi: SesiQR) => {
    setSesiList(prev => [newSesi, ...prev.map(s => ({ ...s, aktif: false }))]);
    if (newSesi.allowSelfScan !== undefined) {
      setIsPresensiMandiriEnabled(newSesi.allowSelfScan);
    }
    const enrichedSesi: SesiQR = {
      ...newSesi,
      namaSesi: newSesi.namaSesi || newSesi.judul || 'Sesi Presensi',
      isActive: typeof newSesi.isActive === 'boolean' ? newSesi.isActive : newSesi.aktif,
      createdById: newSesi.createdById || newSesi.createdBy || 'system'
    };
    createSessionInFirestore(enrichedSesi).catch(console.error);
    logActivity(
      'BUAT_SESI_PRESENSI',
      'PRESENSI',
      `Sesi presensi baru diaktifkan: "${newSesi.judul}" (${newSesi.tipe}, Batas: ${newSesi.batasTerlambat || '-'}).`,
      newSesi.id
    );
  };

  // Manual Mark Attendance (e.g. Izin / Sakit / Alpa)
  const handleManualMark = (nisn: string, status: StatusPresensi, tipe: 'DATANG' | 'PULANG', catatan: string) => {
    const student = siswaList.find(s => s.nisn === nisn);
    if (!student) return;

    const now = new Date();
    const newRecord: PresensiRecord = {
      id: `PRES-MANUAL-${Date.now()}-${nisn.slice(-4)}`,
      tanggal: now.toISOString().split('T')[0],
      waktu: now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      nisn: student.nisn,
      namaSiswa: student.nama,
      kelas: student.kelas,
      tipe: tipe,
      status: status,
      metode: 'MANUAL',
      waStatus: waConfig.enabled ? 'TERKIRIM' : 'NONAKTIF',
      waResponse: waConfig.enabled ? `Meta Cloud API 200 OK (wamid.HBgL${Date.now().toString(36)})` : undefined,
      catatan: catatan || `Dicatat manual oleh ${currentUser.nama}`,
      petugas: currentUser.nama
    };

    handleRecordPresensi(newRecord);
    logActivity(
      'PRESENSI_MANUAL',
      'PRESENSI',
      `Presensi manual dicatat: ${student.nama} (${student.kelas}) status [${status}] untuk sesi ${tipe}. Catatan: ${catatan || 'Oleh petugas'}.`,
      student.nisn
    );
  };

  // Batch Record Attendance for Entire Class / All Students (without QR)
  const handleBatchRecordPresensi = (newRecords: PresensiRecord[], replaceExisting: boolean = false) => {
    if (newRecords.length === 0) return;

    setPresensiList(prev => {
      let filtered = prev;
      if (replaceExisting) {
        const newKeys = new Set(newRecords.map(r => `${r.tanggal}_${r.nisn}_${r.tipe}`));
        filtered = prev.filter(r => !newKeys.has(`${r.tanggal}_${r.nisn}_${r.tipe}`));
      }
      return [...newRecords, ...filtered];
    });

    // Update state index
    setPresensiIndex(prevIndex => {
      const nextIndex = new Map(prevIndex);
      newRecords.forEach(r => {
        const key = createPresensiIndexKey(r.tanggal, r.nisn, r.tipe);
        nextIndex.set(key, r);
      });
      return nextIndex;
    });

    logActivity(
      'PRESENSI_MASSAL',
      'PRESENSI',
      `Presensi massal dicatat untuk ${newRecords.length} siswa oleh ${currentUser.nama}. Sesi: ${newRecords[0]?.tipe}, Status: ${newRecords[0]?.status}.`
    );
  };

  // Pengajuan Izin/Sakit Handlers
  const handleAddPengajuanIzin = (pengajuan: PengajuanIzin) => {
    setPengajuanIzinList(prev => [pengajuan, ...prev]);
    addLeaveRequestToFirestore(pengajuan).catch(console.error);
  };

  const handleApprovePengajuanIzin = (id: string, catatanGuru?: string) => {
    const target = pengajuanIzinList.find(p => p.id === id);
    if (!target) return;

    const timeZone = schoolProfile.zonaWaktu || 'WIT';
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];

    updateLeaveRequestStatusInFirestore(
      id,
      'DISETUJUI',
      currentUser.nama,
      catatanGuru || 'Disetujui. Surat keterangan sah & tercatat di sistem presensi.'
    ).catch(console.error);

    setPengajuanIzinList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'DISETUJUI',
          catatanGuru: catatanGuru || 'Disetujui. Surat keterangan sah & tercatat di sistem presensi.',
          petugas: currentUser.nama,
          disetujuiPada: `${todayStr} ${nowTimeStr} ${timeZone}`
        };
      }
      return item;
    }));

    // Record attendance automatically so the student has an official record
    const student = siswaList.find(s => s.nisn === target.nisn);
    if (student) {
      const statusToRecord: StatusPresensi = target.kategori === 'SAKIT' ? 'SAKIT' : 'IZIN';
      const autoRecord: PresensiRecord = {
        id: `PRES-IZIN-${Date.now()}-${student.nisn.slice(-4)}`,
        tanggal: target.tanggalMulai,
        waktu: '07:00:00',
        nisn: student.nisn,
        namaSiswa: student.nama,
        kelas: student.kelas,
        tipe: 'DATANG',
        status: statusToRecord,
        metode: 'MANUAL',
        waStatus: waConfig.enabled ? 'TERKIRIM' : 'NONAKTIF',
        waResponse: `Meta Cloud API 200 OK - Disetujui (${target.kategori})`,
        catatan: `[PENGAJUAN RESMI ONLINE] ${target.alasan}`,
        petugas: currentUser.nama
      };
      setPresensiIndex(prev => addRecordToIndex(prev, autoRecord));
      setPresensiList(prev => [autoRecord, ...prev]);
    }

    logActivity(
      'SETUJUI_PERIZINAN',
      'PERIZINAN',
      `Surat permohonan ${target.kategori} disetujui untuk ${target.namaSiswa} (${target.kelas}) tanggal ${target.tanggalMulai}. Alasan: "${target.alasan}".`,
      target.nisn
    );
  };

  const handleRejectPengajuanIzin = (id: string, catatanGuru: string) => {
    const target = pengajuanIzinList.find(p => p.id === id);
    const timeZone = schoolProfile.zonaWaktu || 'WIT';
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];

    updateLeaveRequestStatusInFirestore(
      id,
      'DITOLAK',
      currentUser.nama,
      catatanGuru || 'Mohon maaf, pengajuan izin/sakit belum memenuhi syarat.'
    ).catch(console.error);

    setPengajuanIzinList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'DITOLAK',
          catatanGuru: catatanGuru || 'Mohon maaf, pengajuan izin/sakit belum memenuhi syarat.',
          petugas: currentUser.nama,
          disetujuiPada: `${todayStr} ${nowTimeStr} ${timeZone}`
        };
      }
      return item;
    }));

    logActivity(
      'TOLAK_PERIZINAN',
      'PERIZINAN',
      `Permohonan izin/sakit ${target ? `siswa a.n. ${target.namaSiswa} (${target.kelas})` : `ID ${id}`} ditolak. Catatan: "${catatanGuru || 'Belum memenuhi syarat'}".`,
      target?.nisn
    );
  };

  // Reset database to initial seed
  const handleResetDatabase = () => {
    if (window.confirm('Reset semua data tabel ke seed awal setupDatabase()?')) {
      setUsersList(INITIAL_USERS);
      setSiswaList(INITIAL_SISWA);
      setSesiList(INITIAL_SESI);
      setPresensiList(INITIAL_PRESENSI);
      setPresensiIndex(buildPresensiIndex(INITIAL_PRESENSI));
      setWaConfig(INITIAL_WA_CONFIG);
      logActivity(
        'RESET_DATABASE',
        'SISTEM',
        'RESET DATABASE: Seluruh tabel data (Siswa, Sesi QR, Riwayat Presensi, dan Konfigurasi WA) dikembalikan ke seed awal sistem setupDatabase().'
      );
    }
  };

  // Student Master Data Management Handlers
  const handleAddSiswa = (newSiswa: Siswa) => {
    setSiswaList(prev => [...prev, newSiswa]);
    addStudentToFirestore(newSiswa).catch(console.error);
    const studentUser: User = {
      id: `USR-SISWA-${newSiswa.nisn}`,
      username: newSiswa.nisn,
      nama: newSiswa.nama,
      role: 'SISWA',
      nisn: newSiswa.nisn,
      kelas: newSiswa.kelas,
      noHp: newSiswa.noHpOrtu || '62800000000',
      status: 'AKTIF'
    };
    setUsersList(prev => [...prev.filter(u => u.nisn !== newSiswa.nisn), studentUser]);
    logActivity(
      'TAMBAH_DATA_SISWA',
      'DATA_SISWA',
      `Data siswa baru ditambahkan: a.n. ${newSiswa.nama} (NISN: ${newSiswa.nisn}, Kelas: ${newSiswa.kelas}, Wali: ${newSiswa.namaOrtu || '-'}, Kontak: ${newSiswa.noHpOrtu}).`,
      newSiswa.nisn
    );
  };

  const handleUpdateSiswa = (updatedSiswa: Siswa) => {
    setSiswaList(prev => prev.map(s => s.nisn === updatedSiswa.nisn ? updatedSiswa : s));
    updateStudentInFirestore(updatedSiswa.nisn, updatedSiswa).catch(console.error);
    setUsersList(prev => prev.map(u => {
      if (u.nisn === updatedSiswa.nisn) {
        return {
          ...u,
          nama: updatedSiswa.nama,
          kelas: updatedSiswa.kelas,
          noHp: updatedSiswa.noHpOrtu || u.noHp
        };
      }
      return u;
    }));
    logActivity(
      'PERBARUI_DATA_SISWA',
      'DATA_SISWA',
      `Data siswa diperbarui: a.n. ${updatedSiswa.nama} (NISN: ${updatedSiswa.nisn}, Kelas: ${updatedSiswa.kelas}, Wali: ${updatedSiswa.namaOrtu || '-'}).`,
      updatedSiswa.nisn
    );
  };

  const handleDeleteSiswa = (nisn: string) => {
    setSiswaList(prev => prev.filter(s => s.nisn !== nisn));
    setUsersList(prev => prev.filter(u => u.nisn !== nisn));
    deleteStudentFromFirestore(nisn).catch(console.error);
    logActivity(
      'HAPUS_DATA_SISWA',
      'DATA_SISWA',
      `Data siswa dihapus dari sistem: a.n. ${student?.nama || nisn} (NISN: ${nisn}, Kelas: ${student?.kelas || '-'}).`,
      nisn
    );
  };

  const handleBulkImportSiswa = (importedStudents: Siswa[], mode: 'update' | 'skip'): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    setSiswaList(prev => {
      const existingMap = new Map(prev.map(s => [s.nisn, s]));
      importedStudents.forEach(item => {
        if (existingMap.has(item.nisn)) {
          if (mode === 'update') {
            existingMap.set(item.nisn, item);
            updated++;
          }
        } else {
          existingMap.set(item.nisn, item);
          added++;
        }
      });
      return Array.from(existingMap.values());
    });

    // Also sync accounts into usersList
    setUsersList(prevUsers => {
      const existingUserMap = new Map(prevUsers.map(u => [u.nisn || u.username, u]));
      importedStudents.forEach(item => {
        const key = item.nisn;
        if (!existingUserMap.has(key)) {
          existingUserMap.set(key, {
            id: `USR-SISWA-${item.nisn}`,
            username: item.nisn,
            nama: item.nama,
            role: 'SISWA',
            nisn: item.nisn,
            kelas: item.kelas,
            noHp: item.noHpOrtu || '62800000000',
            status: 'AKTIF'
          });
        } else if (mode === 'update') {
          const old = existingUserMap.get(key)!;
          existingUserMap.set(key, {
            ...old,
            nama: item.nama,
            kelas: item.kelas,
            noHp: item.noHpOrtu || old.noHp
          });
        }
      });
      return Array.from(existingUserMap.values());
    });

    logActivity(
      'IMPORT_MASSAL_SISWA',
      'DATA_SISWA',
      `Import massal data siswa (${importedStudents.length} baris): ${added} siswa baru ditambahkan, ${updated} siswa diperbarui.`
    );

    return { added, updated };
  };

  // Guru Mapel handlers
  const handleAddGuruMapel = (newGuru: GuruMapel) => {
    setGuruMapelList(prev => [...prev, newGuru]);
  };

  const handleUpdateGuruMapel = (updatedGuru: GuruMapel) => {
    setGuruMapelList(prev => prev.map(g => g.id === updatedGuru.id ? updatedGuru : g));
  };

  const handleDeleteGuruMapel = (id: string) => {
    setGuruMapelList(prev => prev.filter(g => g.id !== id));
  };

  // IF NOT AUTHENTICATED: SHOW DEDICATED LOGIN PAGE (ADMIN, GURU, SISWA)
  if (!isAuthenticated) {
    return (
      <LoginPage
        usersList={usersList}
        siswaList={siswaList}
        schoolProfile={schoolProfile}
        onLoginSuccess={handleLoginSuccess}
        deviceMode={deviceMode}
        onChangeDeviceMode={handleChangeDeviceMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Application Header with Logout & User Profile */}
      <Header
        currentUser={currentUser}
        schoolProfile={schoolProfile}
        onOpenSchoolSettings={() => {
          setSchoolSettingsInitialTab('sekolah');
          setShowSchoolSettingsModal(true);
        }}
        onOpenChangePassword={() => {
          setSchoolSettingsInitialTab('admin');
          setShowSchoolSettingsModal(true);
        }}
        onSwitchUser={handleSwitchRole}
        onLogout={handleLogout}
        activeMainTab={currentMainTab}
        setActiveMainTab={setActiveMainTab}
        absenceAlertCount={consecutiveAlerts.length}
        isAbsenceAlertEnabled={isAbsenceAlertEnabled}
        onToggleAbsenceAlert={handleToggleAbsenceAlert}
        isPresensiMandiriEnabled={isPresensiMandiriEnabled}
        onTogglePresensiMandiri={handleTogglePresensiMandiri}
        deviceMode={deviceMode}
        onChangeDeviceMode={handleChangeDeviceMode}
        showInstallModal={showPwaInstallModal}
        setShowInstallModal={setShowPwaInstallModal}
        voiceConfig={voiceConfig}
        onOpenVoiceModal={() => setShowVoiceModal(true)}
        gasConfig={gasSyncConfig}
        onOpenGasSyncModal={() => setShowGasSyncModal(true)}
        onOpenAbsenceAlert={() => {
          setActiveMainTab('simulator');
          setActiveSimTab('laporan');
        }}
      />

      {/* Main Page Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Global Teacher Absence Alert for 3-Day Consecutive Absences */}
        {(currentUser.role === 'GURU' || currentUser.role === 'ADMIN') && consecutiveAlerts.length > 0 && (
          <TeacherAbsenceAlert
            alerts={consecutiveAlerts}
            teacherName={currentUser.nama}
            onManualMark={handleManualMark}
            isEnabled={isAbsenceAlertEnabled}
            onToggleEnabled={handleToggleAbsenceAlert}
            onNavigateToRekap={() => {
              setActiveMainTab('simulator');
              setActiveSimTab('laporan');
            }}
          />
        )}

        {/* Animated Main Tab Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMainTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* MODE 1: SIMULASI APLIKASI LANGSUNG */}
            {currentMainTab === 'simulator' && (
              <DeviceViewportWrapper
                deviceMode={deviceMode}
                schoolProfile={schoolProfile}
                onSwitchToDesktop={() => handleChangeDeviceMode('desktop')}
                onOpenInstallPWA={() => setShowPwaInstallModal(true)}
                currentUser={currentUser}
                currentSimTab={currentSimTab}
                onSelectSimTab={setActiveSimTab}
                siswaActiveTab={siswaActiveTab}
                onSelectSiswaTab={setSiswaActiveTab}
                pendingIzinCount={pendingIzinCount}
                unreadPengumumanCount={unreadPengumumanCount}
                onOpenPanduan={currentUser.role !== 'SISWA' ? () => setActiveMainTab('panduan') : undefined}
              >
                <div className="space-y-4">
                {/* Sub-tab Navigation (Desktop: Framer Motion Glider | Mobile: Sleek Feature Header) */}
                {deviceMode !== 'mobile' ? (
                  <div className="flex items-center space-x-1.5 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 backdrop-blur-xs shadow-xs overflow-x-auto text-xs sm:text-sm font-semibold select-none">
                    {/* Siswa Portal Tab (Featured for Siswa or available for Admin) */}
                    {(currentUser.role === 'SISWA' || currentUser.role === 'ADMIN') && (
                      <button
                        onClick={() => setActiveSimTab('portal')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          activeSimTab === 'portal'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {activeSimTab === 'portal' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-emerald-700 dark:bg-emerald-600 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <GraduationCap className="w-4 h-4 text-emerald-300" />
                        <span>{currentUser.role === 'SISWA' ? 'Portal Siswa' : 'Portal Siswa'}</span>
                        {pendingIzinCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </button>
                    )}

                    {/* Scan Presensi (Admin & Guru only - Siswa uses student card or self-scan if enabled) */}
                    {currentUser.role !== 'SISWA' && (
                      <button
                        onClick={() => setActiveSimTab('scan')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          currentSimTab === 'scan'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {currentSimTab === 'scan' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <QrCode className="w-4 h-4 text-sky-400" />
                        <span>Scan Presensi</span>
                      </button>
                    )}

                    {/* Generator Sesi QR (Admin & Guru) */}
                    {currentUser.role !== 'SISWA' && (
                      <button
                        onClick={() => setActiveSimTab('sesi')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          activeSimTab === 'sesi'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {activeSimTab === 'sesi' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Radio className="w-4 h-4 text-emerald-400" />
                        <span>Sesi & Proyektor</span>
                      </button>
                    )}

                    {/* Kelola Data Siswa & Template Upload (Admin & Guru) */}
                    {currentUser.role !== 'SISWA' && (
                      <button
                        onClick={() => setActiveSimTab('siswa')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          activeSimTab === 'siswa'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {activeSimTab === 'siswa' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Data Siswa & Guru</span>
                      </button>
                    )}

                    {/* Dashboard & Laporan Rekap (Admin & Guru only) */}
                    {currentUser.role !== 'SISWA' && (
                      <button
                        onClick={() => setActiveSimTab('laporan')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          activeSimTab === 'laporan'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {activeSimTab === 'laporan' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <span>Dashboard & Laporan</span>
                        {consecutiveAlerts.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </button>
                    )}

                    {/* 7. Presensi Jam Pelajaran & Jurnal KBM Guru (Admin & Guru) */}
                    {(currentUser.role === 'GURU' || currentUser.role === 'ADMIN') && (
                      <button
                        onClick={() => setActiveSimTab('jurnal')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          activeSimTab === 'jurnal'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {activeSimTab === 'jurnal' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-teal-800 dark:bg-teal-700 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <BookOpen className="w-4 h-4 text-teal-400" />
                        <span>Jurnal KBM & Mapel</span>
                      </button>
                    )}

                    {/* Integrasi WhatsApp Resmi (Admin only) */}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => setActiveSimTab('wa')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          activeSimTab === 'wa'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {activeSimTab === 'wa' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Send className="w-4 h-4 text-emerald-500" />
                        <span>WhatsApp Gateway</span>
                      </button>
                    )}

                    {/* Database Sheets Live (Admin only) */}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => setActiveSimTab('sheets')}
                        className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl transition shrink-0 z-10 ${
                          activeSimTab === 'sheets'
                            ? 'text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {activeSimTab === 'sheets' && (
                          <motion.span
                            layoutId="activeSimTabGlider"
                            className="absolute inset-0 bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-xl shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Database className="w-4 h-4 text-purple-400" />
                        <span>Database Sheets</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Compact Header Banner on Mobile Mode (Prevents Redundant Double Tabs) */
                  <div className="flex items-center justify-between px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                        {currentSimTab === 'portal' && <GraduationCap className="w-4 h-4 text-emerald-400" />}
                        {currentSimTab === 'scan' && <QrCode className="w-4 h-4 text-sky-400" />}
                        {currentSimTab === 'sesi' && <Radio className="w-4 h-4 text-amber-400" />}
                        {currentSimTab === 'siswa' && <Users className="w-4 h-4 text-emerald-400" />}
                        {currentSimTab === 'laporan' && <BarChart3 className="w-4 h-4 text-sky-400" />}
                        {currentSimTab === 'jurnal' && <BookOpen className="w-4 h-4 text-teal-400" />}
                        {currentSimTab === 'wa' && <Send className="w-4 h-4 text-emerald-400" />}
                        {currentSimTab === 'sheets' && <Database className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                          {currentSimTab === 'portal' ? 'Portal Siswa' :
                           currentSimTab === 'scan' ? 'Scan Presensi' :
                           currentSimTab === 'sesi' ? 'Sesi QR' :
                           currentSimTab === 'siswa' ? 'Data Siswa & Guru' :
                           currentSimTab === 'laporan' ? 'Dashboard & Laporan' :
                           currentSimTab === 'jurnal' ? 'Jurnal KBM' :
                           currentSimTab === 'wa' ? 'WhatsApp Gateway' : 'Database Sheets'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                          SMP Nurul Huda Jayapura
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      {currentUser.role}
                    </span>
                  </div>
                )}

                {/* Sub-tab Content Panels with Smooth Animation */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSimTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    {currentSimTab === 'portal' && (
                      <SiswaPortalSection
                        currentUser={currentUser}
                        siswaList={siswaList}
                        presensiList={presensiList}
                        presensiIndex={presensiIndex}
                        activeSesi={activeSesi}
                        waConfig={waConfig}
                        schoolProfile={schoolProfile}
                        onRecordPresensi={handleRecordPresensi}
                        isPresensiMandiriEnabled={isPresensiMandiriEnabled}
                        onTogglePresensiMandiri={handleTogglePresensiMandiri}
                        pengajuanIzinList={pengajuanIzinList}
                        onAddPengajuanIzin={handleAddPengajuanIzin}
                        pengumumanList={pengumumanList}
                        onOpenCreatePengumuman={() => setShowPengumumanModal(true)}
                        onDeletePengumuman={handleDeletePengumuman}
                        siswaActiveTab={siswaActiveTab}
                        onChangeSiswaActiveTab={setSiswaActiveTab}
                      />
                    )}

                    {currentSimTab === 'scan' && (
                      <ScanQRSection
                        currentUser={currentUser}
                        activeSesi={activeSesi}
                        siswaList={siswaList}
                        presensiList={presensiList}
                        presensiIndex={presensiIndex}
                        waConfig={waConfig}
                        onRecordPresensi={handleRecordPresensi}
                        isPresensiMandiriEnabled={isPresensiMandiriEnabled}
                        onTogglePresensiMandiri={handleTogglePresensiMandiri}
                        voiceConfig={voiceConfig}
                        onUpdateVoiceConfig={setVoiceConfig}
                        gasConfig={gasSyncConfig}
                        onUpdateGasConfig={setGasSyncConfig}
                        schoolProfile={schoolProfile}
                        onOpenMassAttendanceModal={() => setShowMassAttendanceModal(true)}
                      />
                    )}

                    {currentSimTab === 'jurnal' && (
                      <JurnalKbmSection
                        currentUser={currentUser}
                        siswaList={siswaList}
                        guruMapelList={guruMapelList}
                        schoolProfile={schoolProfile}
                        jurnalList={jurnalList}
                        onSaveJurnal={handleSaveJurnal}
                        onDeleteJurnal={handleDeleteJurnal}
                      />
                    )}

                    {currentSimTab === 'sesi' && (
                      <GeneratorSesiSection
                        activeSesi={activeSesi}
                        siswaList={siswaList}
                        onUpdateSesi={handleUpdateSesi}
                        isPresensiMandiriEnabled={isPresensiMandiriEnabled}
                        onTogglePresensiMandiri={handleTogglePresensiMandiri}
                      />
                    )}

                    {currentSimTab === 'siswa' && (
                      <DataSiswaSection
                        siswaList={siswaList}
                        onAddSiswa={handleAddSiswa}
                        onUpdateSiswa={handleUpdateSiswa}
                        onDeleteSiswa={handleDeleteSiswa}
                        onBulkImportSiswa={handleBulkImportSiswa}
                        currentUser={currentUser}
                        schoolProfile={schoolProfile}
                        guruMapelList={guruMapelList}
                        onAddGuruMapel={handleAddGuruMapel}
                        onUpdateGuruMapel={handleUpdateGuruMapel}
                        onDeleteGuruMapel={handleDeleteGuruMapel}
                        onOpenSchoolSettings={() => setShowSchoolSettingsModal(true)}
                      />
                    )}

                    {currentSimTab === 'laporan' && (
                      <DashboardLaporanSection
                        presensiList={presensiList}
                        presensiIndex={presensiIndex}
                        siswaList={siswaList}
                        activityLogs={activityLogs}
                        onClearActivityLogs={() => setActivityLogs([])}
                        currentUser={currentUser}
                        onManualMark={handleManualMark}
                        onNavigateToSheets={() => setActiveSimTab('sheets')}
                        isAbsenceAlertEnabled={isAbsenceAlertEnabled}
                        onToggleAbsenceAlert={handleToggleAbsenceAlert}
                        schoolProfile={schoolProfile}
                        pengajuanIzinList={pengajuanIzinList}
                        onApprovePengajuanIzin={handleApprovePengajuanIzin}
                        onRejectPengajuanIzin={handleRejectPengajuanIzin}
                        guruMapelList={guruMapelList}
                        onNavigateToJurnal={() => setActiveSimTab('jurnal')}
                        onOpenMassAttendanceModal={() => setShowMassAttendanceModal(true)}
                      />
                    )}

                    {currentSimTab === 'wa' && (
                      <WhatsAppSection
                        config={waConfig}
                        siswaList={siswaList}
                        onUpdateConfig={handleUpdateWaConfig}
                        schoolProfile={schoolProfile}
                      />
                    )}

                    {currentSimTab === 'sheets' && (
                      <SheetsDatabaseViewer
                        usersList={usersList}
                        siswaList={siswaList}
                        sesiList={sesiList}
                        presensiList={presensiList}
                        waConfig={waConfig}
                        onResetDatabase={handleResetDatabase}
                        onNavigateToDataSiswa={() => setActiveSimTab('siswa')}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </DeviceViewportWrapper>
          )}

          {/* MODE 2: BUKU PANDUAN LENGKAP APLIKASI (Hanya Admin & Guru) */}
          {currentUser.role !== 'SISWA' && currentMainTab === 'panduan' && (
            <PanduanLengkapSection
              currentUserRole={currentUser.role}
              schoolProfile={schoolProfile}
              onNavigateToTab={(tab) => {
                setActiveMainTab('simulator');
                setActiveSimTab(tab);
              }}
              onOpenVoiceModal={() => setShowVoiceModal(true)}
              onOpenGasModal={() => setShowGasSyncModal(true)}
              onOpenSchoolSettings={() => setShowSchoolSettingsModal(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>

    {/* School Settings Modal (Logo, School Name, Guru Mapel, Tahun Pelajaran, Kepala Sekolah, Admin Credentials) */}
    <SchoolSettingsModal
      isOpen={showSchoolSettingsModal}
      onClose={() => setShowSchoolSettingsModal(false)}
      schoolProfile={schoolProfile}
      onUpdateSchoolProfile={handleSaveSchoolProfile}
      guruMapelList={guruMapelList}
      onAddGuruMapel={handleAddGuruMapel}
      onUpdateGuruMapel={handleUpdateGuruMapel}
      onDeleteGuruMapel={handleDeleteGuruMapel}
      adminUser={adminUser}
      onUpdateAdminCredentials={handleUpdateAdminCredentials}
      guruPiketUser={guruPiketUser}
      onUpdateGuruPiketCredentials={handleUpdateGuruPiketCredentials}
      guruPiketList={guruPiketList}
      onAddGuruPiket={handleAddGuruPiket}
      onUpdateGuruPiket={handleUpdateGuruPiket}
      onDeleteGuruPiket={handleDeleteGuruPiket}
      initialTab={schoolSettingsInitialTab}
    />

    {/* Pengumuman Sekolah Modal (Admin & Guru posting) */}
    <PengumumanModal
      isOpen={showPengumumanModal}
      onClose={() => setShowPengumumanModal(false)}
      onAddPengumuman={handleAddPengumuman}
      authorName={currentUser.nama}
      availableClasses={['SEMUA', ...Array.from(new Set(siswaList.map(s => s.kelas)))]}
    />

    {/* Live Google Apps Script Web App Connection Modal */}
    <GasLiveSyncModal
      isOpen={showGasSyncModal}
      onClose={() => setShowGasSyncModal(false)}
      config={gasSyncConfig}
      onUpdateConfig={setGasSyncConfig}
      presensiList={presensiList}
    />

    {/* Suara Audio Text-to-Speech (TTS) Voice Sapaan Modal */}
    <VoiceGreetingModal
      isOpen={showVoiceModal}
      onClose={() => setShowVoiceModal(false)}
      config={voiceConfig}
      onSaveConfig={setVoiceConfig}
      schoolName={schoolProfile.namaSekolah}
    />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">PRESENSI QR CODE SMP NURUL HUDA JAYAPURA</span>
          <span className="text-slate-400 dark:text-slate-500">Google Apps Script & Google Sheets • Meta Cloud API Resmi • LockService Anti-Duplikasi</span>
        </div>
      </footer>
    </div>
  );
}
