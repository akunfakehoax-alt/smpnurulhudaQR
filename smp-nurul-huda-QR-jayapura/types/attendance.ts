export type Role = 'ADMIN' | 'GURU' | 'SISWA';

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  nama: string;
  role: Role;
  kelas?: string;
  nisn?: string;
  noHp: string;
  status: 'AKTIF' | 'NONAKTIF';
}

export interface Siswa {
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  noHpOrtu: string;
  namaOrtu: string;
  alamat?: string;
  qrBadgeToken?: string;
  fotoUrl?: string;
}

export type TipeSesi = 'DATANG' | 'PULANG';

export interface SesiQR {
  id: string;
  kodeSesi: string;
  judul: string;
  namaSesi?: string;
  tipe: TipeSesi;
  kelas: string; // "SEMUA" or specific class
  tanggal: string; // YYYY-MM-DD
  jamMulai: string; // HH:mm
  jamSelesai: string; // HH:mm
  batasTerlambat: string; // HH:mm
  tokenQR: string;
  aktif: boolean;
  isActive?: boolean;
  allowSelfScan?: boolean; // Izin presensi mandiri oleh siswa (Scanner Siswa) jika diaktifkan guru/admin
  refreshIntervalDetik: number; // e.g. 30s dynamic or 0 for static
  createdAt: string;
  createdBy: string;
  createdById?: string;
}

export type StatusPresensi = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';

export interface PresensiRecord {
  id: string;
  tanggal: string;
  waktu: string;
  jam?: string;
  nisn: string;
  namaSiswa: string;
  nama?: string;
  kelas: string;
  tipe: TipeSesi;
  sesiId?: string;
  status: StatusPresensi;
  metode: 'QR_SCAN' | 'MANUAL';
  waStatus: 'TERKIRIM' | 'GAGAL' | 'PENDING' | 'NONAKTIF';
  waResponse?: string;
  catatan?: string;
  keterangan?: string;
  petugas?: string;
  verifiedBy?: string;
  koordinatGPS?: string;
  jarakSekolahMeter?: number;
  statusLokasi?: 'DI_AREA_SEKOLAH' | 'DI_LUAR_SEKOLAH' | 'TANPA_GPS';
}

export interface GuruMapel {
  id: string;
  nip: string;
  nama: string;
  mapel: string;
  kelasAjar: string;
  noHp: string;
  status: 'AKTIF' | 'NONAKTIF';
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kota: string;
  provinsi: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  logoUrl?: string;
  logoPreset?: 'school' | 'graduation' | 'book' | 'shield' | 'award';
  zonaWaktu: 'WIT' | 'WIB' | 'WITA';
  latitude?: number;
  longitude?: number;
  radiusValidasiMeter?: number;
  wajibGPS?: boolean;
}

export interface PengumumanSekolah {
  id: string;
  judul: string;
  isi: string;
  kategori: 'PENTING' | 'AKADEMIK' | 'KEGIATAN' | 'KEDISIPLINAN' | 'UMUM';
  targetKelas: string; // 'SEMUA' or specific class
  isPinned: boolean;
  penulis: string; // e.g. "Kepala Sekolah", "Tim Kesiswaan", "Admin"
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm
  lampiranNama?: string;
  badge?: string;
}

export type TableDensity = 'normal' | 'compact' | 'card';

export interface WhatsAppConfig {
  provider: 'META_CLOUD_API' | 'FONNTE' | 'WABA_QONTAK';
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
  templateName: string;
  enabled: boolean;
  autoSendDatang: boolean;
  autoSendPulang: boolean;
  // Fitur Ringkasan Harian Otomatis Akhir Sesi
  autoSendDailySummary: boolean;
  dailySummarySendTime: string; // e.g. "16:00"
  dailySummaryTarget: 'ORTU' | 'SISWA' | 'KEDUANYA';
  dailySummaryTemplateName: string;
  dailySummaryIncludeAbsent: boolean;
}

export interface DailySummaryItem {
  nisn: string;
  nama: string;
  kelas: string;
  namaOrtu: string;
  noHpOrtu: string;
  jamMasuk: string;
  statusMasuk: StatusPresensi | 'BELUM_ABSEN';
  jamPulang: string;
  statusPulang: StatusPresensi | 'BELUM_ABSEN';
  statusRingkasan: 'HADIR_LENGKAP' | 'TERLAMBAT' | 'BELUM_PULANG' | 'IZIN' | 'SAKIT' | 'ALPA' | 'TIDAK_HADIR' | string;
  catatan?: string;
  waSummaryStatus: 'TERKIRIM' | 'PENDING' | 'GAGAL' | 'BELUM_DIKIRIM';
  waSummaryResponse?: string;
  waSummarySentAt?: string;
  datangWaktu: string;
  datangStatus: string;
  pulangWaktu: string;
  pulangStatus: string;
  statusAkhir: string;
  statusWA: string;
  waktuKirimWA?: string;
}

export interface PengajuanIzin {
  id: string;
  nisn: string;
  namaSiswa: string;
  nama?: string;
  kelas: string;
  kategori: 'SAKIT' | 'IZIN';
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  lampiranUrl?: string;
  lampiranNama?: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  catatanGuru?: string;
  diajukanPada: string;
  disetujuiPada?: string;
  petugas?: string;
}

export interface AbsensiMapelSiswa {
  nisn: string;
  nama: string;
  kelas: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPEN';
  catatan?: string;
}

export interface JurnalKbmRecord {
  id: string;
  tanggal: string;
  kelas: string;
  mapel: string;
  guruNama: string;
  jamKe: string; // e.g. "Jam 1-2 (07:15 - 08:35)"
  materiAjar: string;
  tujuanPembelajaran?: string;
  catatanKejadian?: string;
  absensiSiswa: AbsensiMapelSiswa[];
  dibuatPada: string;
}

export interface GasLiveSyncConfig {
  webAppUrl: string;
  secretToken: string;
  autoSyncOnScan: boolean;
  lastSyncTime: string | null;
  lastSyncStatus: 'IDLE' | 'SUCCESS' | 'ERROR' | 'SYNCING';
  lastErrorMessage: string | null;
  syncCount: number;
}

export interface VoiceAnnouncementConfig {
  enabled: boolean;
  rate: number; // 0.8 - 1.2
  pitch: number; // 0.8 - 1.2
  volume: number; // 0 - 1
  welcomeTemplate: string;
  pulangTemplate: string;
  terlambatTemplate: string;
  duplikatTemplate: string;
}

export type HariSekolah = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface JadwalPelajaranItem {
  id: string;
  hari: HariSekolah;
  jamKe: string; // e.g. "Jam 1-2 (07:15 - 08:35)"
  jamMulai: string; // e.g. "07:15"
  jamSelesai: string; // e.g. "08:35"
  guruId: string;
  guruNama: string;
  nip?: string;
  mapel: string;
  kelas: string; // e.g. "VII-A"
  ruangan: string; // e.g. "Ruang VII-A", "Lab Komputer", "Lab IPA", "Lapangan"
  warna?: string;
  statusKbm?: 'SELESAI' | 'BERLANGSUNG' | 'AKAN_DATANG';
}

export type ActivityLogCategory = 'SISTEM' | 'DATA_SISWA' | 'KONFIGURASI' | 'PRESENSI' | 'PERIZINAN';

export interface ActivityLog {
  id: string;
  timestamp: string; // e.g. "06/10/2026, 08:15:22 WIT"
  actor: string; // e.g. "Budi Santoso, S.Kom (Administrator)"
  action: string; // e.g. "PERBARUI_WA_CONFIG", "TAMBAH_SISWA", "RESET_DATABASE"
  category: ActivityLogCategory;
  details: string; // description of the action
  targetId?: string; // ID or NISN of target entity
  meta?: Record<string, string | number | boolean | undefined>;
}


