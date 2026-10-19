import { User, Siswa, SesiQR, PresensiRecord, WhatsAppConfig, SchoolProfile, GuruMapel, PengajuanIzin, JurnalKbmRecord, PengumumanSekolah, ActivityLog } from '@/types/attendance';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: 'admin123',
    nama: 'Budi Santoso, S.Kom (Administrator)',
    role: 'ADMIN',
    noHp: '6281234567890',
    status: 'AKTIF'
  },
  {
    id: 'USR-002',
    username: 'guru_piket',
    password: 'piket123',
    nama: 'Dra. Sri Wahyuni (Guru Piket & BK)',
    role: 'GURU',
    kelas: 'SEMUA',
    noHp: '6281398765432',
    status: 'AKTIF'
  },
  {
    id: 'USR-003',
    username: 'siswa01',
    password: 'siswa123',
    nama: 'Muhammad Rizky Pratama',
    role: 'SISWA',
    nisn: '0061234501',
    kelas: 'VII-A',
    noHp: '6285711223344',
    status: 'AKTIF'
  },
  {
    id: 'USR-004',
    username: 'siswa02',
    password: 'siswa123',
    nama: 'Siti Nurhaliza',
    role: 'SISWA',
    nisn: '0061234502',
    kelas: 'VII-A',
    noHp: '6285899887766',
    status: 'AKTIF'
  },
  {
    id: 'USR-005',
    username: 'siswa03',
    password: 'siswa123',
    nama: 'Fajar Kurniawan',
    role: 'SISWA',
    nisn: '0061234503',
    kelas: 'VII-B',
    noHp: '628156677889',
    status: 'AKTIF'
  }
];

export const INITIAL_SISWA: Siswa[] = [
  {
    nisn: '0061234501',
    nama: 'Muhammad Rizky Pratama',
    kelas: 'VII-A',
    jenisKelamin: 'L',
    noHpOrtu: '628129871122',
    namaOrtu: 'Bpk. Hendra Pratama',
    alamat: 'Jl. Percetakan Negara No. 12, Kel. Gurabesi, Distrik Jayapura Utara',
    qrBadgeToken: 'SISWA-0061234501-HASH99',
    fotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'
  },
  {
    nisn: '0061234502',
    nama: 'Siti Nurhaliza',
    kelas: 'VII-A',
    jenisKelamin: 'P',
    noHpOrtu: '628137788990',
    namaOrtu: 'Ibu Fatimah Zahra',
    alamat: 'Jl. Dr. Sam Ratulangi No. 45, Dok II, Distrik Jayapura Utara',
    qrBadgeToken: 'SISWA-0061234502-HASH88',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    nisn: '0061234503',
    nama: 'Fajar Kurniawan',
    kelas: 'VII-B',
    jenisKelamin: 'L',
    noHpOrtu: '628156677889',
    namaOrtu: 'Bpk. Agus Kurniawan',
    alamat: 'Jl. Kelapa Dua No. 8, Kel. Entrop, Distrik Jayapura Selatan',
    qrBadgeToken: 'SISWA-0061234503-HASH77',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    nisn: '0061234504',
    nama: 'Anisa Rahmawati',
    kelas: 'VIII-A',
    jenisKelamin: 'P',
    noHpOrtu: '628180123456',
    namaOrtu: 'Bpk. Bambang Rahmadi',
    alamat: 'Jl. Raya Abepura - Kotaraja No. 21, Distrik Abepura',
    qrBadgeToken: 'SISWA-0061234504-HASH66',
    fotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
  },
  {
    nisn: '0061234505',
    nama: 'Dimas Arya Putra',
    kelas: 'VIII-B',
    jenisKelamin: 'L',
    noHpOrtu: '628521234987',
    namaOrtu: 'Ibu Ratna Dewi',
    alamat: 'Jl. Pasir Dua No. 3, Kel. Tanjung Ria, Distrik Jayapura Utara',
    qrBadgeToken: 'SISWA-0061234505-HASH55'
  },
  {
    nisn: '0061234506',
    nama: 'Zahra Putri Ramadhani',
    kelas: 'IX-A',
    jenisKelamin: 'P',
    noHpOrtu: '628776655443',
    namaOrtu: 'Bpk. Ilham Ramadhani',
    alamat: 'Perumnas III Waena Blok C No. 19, Distrik Heram, Kota Jayapura',
    qrBadgeToken: 'SISWA-0061234506-HASH44'
  },
  {
    nisn: '0061234507',
    nama: 'Wahyu Hidayatulloh',
    kelas: 'IX-B',
    jenisKelamin: 'L',
    noHpOrtu: '6282199881100',
    namaOrtu: 'Bpk. Subagio Hidayat',
    alamat: 'Kompleks Yapis No. 18, Dok V Atas, Distrik Jayapura Utara',
    qrBadgeToken: 'SISWA-0061234507-HASH33'
  },
  {
    nisn: '0061234508',
    nama: 'Farhan Maulana',
    kelas: 'VIII-A',
    jenisKelamin: 'L',
    noHpOrtu: '6281355443322',
    namaOrtu: 'Bpk. Ridwan Maulana',
    alamat: 'Jl. Soa Siu No. 07, Dok II, Kel. Gurabesi, Distrik Jayapura Utara',
    qrBadgeToken: 'SISWA-0061234508-HASH22'
  }
];

export const INITIAL_SESI: SesiQR[] = [
  {
    id: 'SESI-001',
    kodeSesi: 'SESI-DATANG-PAGI',
    judul: 'Presensi Masuk Pagi',
    tipe: 'DATANG',
    kelas: 'SEMUA',
    tanggal: new Date().toISOString().split('T')[0],
    jamMulai: '06:30',
    jamSelesai: '07:30',
    batasTerlambat: '07:00',
    tokenQR: 'QR-ATT-DATANG-' + new Date().toISOString().split('T')[0] + '-SECKEY821',
    aktif: true,
    allowSelfScan: false,
    refreshIntervalDetik: 30,
    createdAt: new Date().toISOString(),
    createdBy: 'Dra. Sri Wahyuni'
  },
  {
    id: 'SESI-002',
    kodeSesi: 'SESI-PULANG-SORE',
    judul: 'Presensi Pulang Sekolah',
    tipe: 'PULANG',
    kelas: 'SEMUA',
    tanggal: new Date().toISOString().split('T')[0],
    jamMulai: '15:00',
    jamSelesai: '16:30',
    batasTerlambat: '16:30',
    tokenQR: 'QR-ATT-PULANG-' + new Date().toISOString().split('T')[0] + '-SECKEY911',
    aktif: false,
    allowSelfScan: false,
    refreshIntervalDetik: 30,
    createdAt: new Date().toISOString(),
    createdBy: 'Dra. Sri Wahyuni'
  }
];

function getPastDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = getPastDateStr(1);
const twoDaysAgoStr = getPastDateStr(2);

export const INITIAL_PRESENSI: PresensiRecord[] = [
  // Today's records
  {
    id: 'PRES-001',
    tanggal: todayStr,
    waktu: '06:42:15',
    nisn: '0061234501',
    namaSiswa: 'Muhammad Rizky Pratama',
    kelas: 'VII-A',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK - ID: wamid.HBgLMjA=',
    catatan: 'Hadir tepat waktu sebelum batas 07:00 WIT',
    petugas: 'Sistem QR Otomatis'
  },
  {
    id: 'PRES-002',
    tanggal: todayStr,
    waktu: '06:55:08',
    nisn: '0061234502',
    namaSiswa: 'Siti Nurhaliza',
    kelas: 'VII-A',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK - ID: wamid.HBgLMjB=',
    catatan: 'Hadir tepat waktu',
    petugas: 'Sistem QR Otomatis'
  },
  {
    id: 'PRES-003',
    tanggal: todayStr,
    waktu: '07:08:44',
    nisn: '0061234503',
    namaSiswa: 'Fajar Kurniawan',
    kelas: 'VII-B',
    tipe: 'DATANG',
    status: 'TERLAMBAT',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK - ID: wamid.HBgLMjC=',
    catatan: 'Terlambat 8 menit dari batas 07:00 WIT',
    petugas: 'Sistem QR Otomatis'
  },
  // Yesterday's records (Hadir)
  {
    id: 'PRES-004',
    tanggal: yesterdayStr,
    waktu: '06:45:10',
    nisn: '0061234501',
    namaSiswa: 'Muhammad Rizky Pratama',
    kelas: 'VII-A',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK',
    catatan: 'Hadir tepat waktu',
    petugas: 'Sistem QR Otomatis'
  },
  {
    id: 'PRES-005',
    tanggal: yesterdayStr,
    waktu: '06:50:22',
    nisn: '0061234502',
    namaSiswa: 'Siti Nurhaliza',
    kelas: 'VII-A',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK',
    catatan: 'Hadir tepat waktu',
    petugas: 'Sistem QR Otomatis'
  },
  {
    id: 'PRES-006',
    tanggal: yesterdayStr,
    waktu: '06:58:14',
    nisn: '0061234503',
    namaSiswa: 'Fajar Kurniawan',
    kelas: 'VII-B',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK',
    catatan: 'Hadir tepat waktu',
    petugas: 'Sistem QR Otomatis'
  },
  // 2 Days Ago records (Hadir)
  {
    id: 'PRES-007',
    tanggal: twoDaysAgoStr,
    waktu: '06:38:00',
    nisn: '0061234501',
    namaSiswa: 'Muhammad Rizky Pratama',
    kelas: 'VII-A',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK',
    catatan: 'Hadir tepat waktu',
    petugas: 'Sistem QR Otomatis'
  },
  {
    id: 'PRES-008',
    tanggal: twoDaysAgoStr,
    waktu: '06:48:19',
    nisn: '0061234502',
    namaSiswa: 'Siti Nurhaliza',
    kelas: 'VII-A',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK',
    catatan: 'Hadir tepat waktu',
    petugas: 'Sistem QR Otomatis'
  },
  {
    id: 'PRES-009',
    tanggal: twoDaysAgoStr,
    waktu: '06:56:40',
    nisn: '0061234503',
    namaSiswa: 'Fajar Kurniawan',
    kelas: 'VII-B',
    tipe: 'DATANG',
    status: 'HADIR',
    metode: 'QR_SCAN',
    waStatus: 'TERKIRIM',
    waResponse: 'Meta Graph API 200 OK',
    catatan: 'Hadir tepat waktu',
    petugas: 'Sistem QR Otomatis'
  }
];

export const INITIAL_PENGAJUAN_IZIN: PengajuanIzin[] = [
  {
    id: 'IZIN-2026-001',
    nisn: '0061234502',
    namaSiswa: 'Siti Nurhaliza',
    kelas: 'VII-A',
    kategori: 'SAKIT',
    tanggalMulai: todayStr,
    tanggalSelesai: todayStr,
    alasan: 'Demam tinggi dan flu, istirahat di rumah sesuai anjuran dokter Puskesmas Jayapura Utara.',
    lampiranUrl: '',
    lampiranNama: 'Surat_Keterangan_Dokter.jpg',
    status: 'MENUNGGU',
    diajukanPada: `${todayStr} 06:15 WIT`
  },
  {
    id: 'IZIN-2026-002',
    nisn: '0061234501',
    namaSiswa: 'Muhammad Rizky Pratama',
    kelas: 'VII-A',
    kategori: 'IZIN',
    tanggalMulai: yesterdayStr,
    tanggalSelesai: yesterdayStr,
    alasan: 'Menghadiri acara duka keluarga di Sentani, Kabupaten Jayapura.',
    lampiranUrl: '',
    lampiranNama: 'Surat_Izin_Orang_Tua.pdf',
    status: 'DISETUJUI',
    catatanGuru: 'Disetujui. Tugas harian dapat disusulkan kepada wali kelas/guru piket.',
    diajukanPada: `${yesterdayStr} 06:30 WIT`,
    disetujuiPada: `${yesterdayStr} 07:10 WIT`,
    petugas: 'Dra. Sri Wahyuni (Guru Piket & BK)'
  }
];

export const INITIAL_WA_CONFIG: WhatsAppConfig = {
  provider: 'META_CLOUD_API',
  phoneNumberId: '109283746519283',
  accessToken: 'EAAG...EAAB_VALID_OFFICIAL_META_TOKEN',
  wabaId: '382910492817264',
  templateName: 'notifikasi_absensi_siswa',
  enabled: true,
  autoSendDatang: true,
  autoSendPulang: true,
  autoSendDailySummary: true,
  dailySummarySendTime: '16:00',
  dailySummaryTarget: 'ORTU',
  dailySummaryTemplateName: 'ringkasan_absensi_harian',
  dailySummaryIncludeAbsent: true
};

export const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: 'SMP NURUL HUDA JAYAPURA',
  npsn: '60302819',
  alamat: 'Jl. Percetakan Negara No. 45, Gurabesi, Distrik Jayapura Utara',
  kota: 'Kota Jayapura',
  provinsi: 'Papua',
  tahunPelajaran: '2026/2027',
  semester: 'Ganjil',
  namaKepalaSekolah: 'Drs. H. Ahmad Fauzi, M.Pd.',
  nipKepalaSekolah: '19720512 199803 1 004',
  logoPreset: 'school',
  zonaWaktu: 'WIT'
};

export const INITIAL_GURU_MAPEL: GuruMapel[] = [
  {
    id: 'GURU-001',
    nip: '19780315 200501 2 006',
    nama: 'Dra. Sri Wahyuni, M.Pd.',
    mapel: 'Bahasa Indonesia',
    kelasAjar: 'VII A, VII B, VIII A',
    noHp: '6281398765432',
    status: 'AKTIF'
  },
  {
    id: 'GURU-002',
    nip: '19850912 201001 1 012',
    nama: 'Budi Santoso, S.Kom.',
    mapel: 'Informatika & TIK',
    kelasAjar: 'VII, VIII, IX',
    noHp: '6281234567890',
    status: 'AKTIF'
  },
  {
    id: 'GURU-003',
    nip: '19820421 200801 1 009',
    nama: 'Hendra Wijaya, S.Pd.',
    mapel: 'Matematika',
    kelasAjar: 'VIII A, VIII B, IX A',
    noHp: '6281299887766',
    status: 'AKTIF'
  },
  {
    id: 'GURU-004',
    nip: '19890110 201402 2 003',
    nama: 'Siti Fatimah, S.Pd., M.Si.',
    mapel: 'Ilmu Pengetahuan Alam (IPA)',
    kelasAjar: 'VII A, IX A, IX B',
    noHp: '6285244112233',
    status: 'AKTIF'
  },
  {
    id: 'GURU-005',
    nip: '19800705 200604 1 008',
    nama: 'Ustadz Abdul Halim, S.Pd.I.',
    mapel: 'Pendidikan Agama Islam (PAI)',
    kelasAjar: 'Semua Kelas',
    noHp: '6282199881122',
    status: 'AKTIF'
  },
  {
    id: 'GURU-006',
    nip: '19920814 201903 2 011',
    nama: 'Maria Magdalena, S.Pd.',
    mapel: 'Bahasa Inggris',
    kelasAjar: 'VII A, VII B, VIII B',
    noHp: '6281344556677',
    status: 'AKTIF'
  }
];

export const INITIAL_PENGUMUMAN: PengumumanSekolah[] = [
  {
    id: 'PENG-001',
    judul: 'Pelaksanaan Penilaian Tengah Semester (PTS) Ganjil TP 2026/2027',
    isi: 'Diberitahukan kepada seluruh siswa kelas VII, VIII, dan IX SMP Nurul Huda Jayapura bahwa Penilaian Tengah Semester (PTS) Ganjil akan dimulai pekan depan. Siswa wajib hadir sebelum pukul 06:45 WIT, mengenakan seragam beridentitas, dan membawa kartu pelajar.',
    kategori: 'PENTING',
    targetKelas: 'SEMUA',
    isPinned: true,
    penulis: 'Drs. H. Ahmad Fauzi, M.Pd. (Kepala Sekolah)',
    tanggal: '2026-09-27',
    waktu: '07:00',
    lampiranNama: 'Jadwal_PTS_Ganjil_2026.pdf',
    badge: 'SEGERA'
  },
  {
    id: 'PENG-002',
    judul: 'Kewajiban Presensi Mandiri di Area Gerbang & Validasi Titik GPS',
    isi: 'Siswa yang melakukan presensi mandiri diwajibkan mengaktifkan izin GPS. Presensi dinyatakan VALID jika berada dalam radius 150 meter dari gerbang sekolah.',
    kategori: 'KEDISIPLINAN',
    targetKelas: 'SEMUA',
    isPinned: true,
    penulis: 'Budi Santoso, S.Kom. (Tim IT & Kesiswaan)',
    tanggal: '2026-09-27',
    waktu: '06:30',
    badge: 'WAJIB GPS'
  }
];

export const INITIAL_JURNAL_KBM: JurnalKbmRecord[] = [
  {
    id: 'JRN-20260927-01',
    tanggal: '2026-09-27',
    kelas: 'VII-A',
    mapel: 'Matematika',
    guruNama: 'Bambang Irawan, M.Pd.',
    jamKe: 'Jam 1 - 2 (07:15 - 08:35 WIT)',
    materiAjar: 'Aljabar Dasar: Operasi Penjumlahan dan Pengurangan Bentuk Aljabar',
    tujuanPembelajaran: 'Siswa mampu menyederhanakan bentuk suku sejenis dan menerapkan sifat komutatif serta distributif.',
    catatanKejadian: 'KBM berjalan tertib dan antusias. 2 siswa aktif bertanya di papan tulis. Semua hadir lengkap.',
    absensiSiswa: [
      { nisn: '0061234501', nama: 'Muhammad Rizky Pratama', kelas: 'VII-A', status: 'HADIR' },
      { nisn: '0061234502', nama: 'Siti Nurhaliza', kelas: 'VII-A', status: 'HADIR' },
      { nisn: '0061234503', nama: 'Ahmad Fauzan', kelas: 'VII-A', status: 'HADIR' },
      { nisn: '0061234504', nama: 'Dewi Lestari', kelas: 'VII-A', status: 'HADIR' },
      { nisn: '0061234505', nama: 'Budi Santoso Jr', kelas: 'VII-A', status: 'HADIR' }
    ],
    dibuatPada: '2026-09-27 08:40 WIT'
  },
  {
    id: 'JRN-20260927-02',
    tanggal: '2026-09-27',
    kelas: 'VII-B',
    mapel: 'Ilmu Pengetahuan Alam (IPA)',
    guruNama: 'Siti Rahmawati, S.Pd.',
    jamKe: 'Jam 3 - 4 (08:45 - 10:05 WIT)',
    materiAjar: 'Klasifikasi Makhluk Hidup: Pengenalan Mikroskop dan Pengamatan Sel Gabus',
    tujuanPembelajaran: 'Siswa dapat menggunakan mikroskop cahaya monokuler dengan pembesaran objektif 10x dan 40x secara aman.',
    catatanKejadian: 'Praktikum di Laboratorium IPA lancar. 1 siswa izin ke UKS karena pusing.',
    absensiSiswa: [
      { nisn: '0061234506', nama: 'Rina Anggraini', kelas: 'VII-B', status: 'HADIR' },
      { nisn: '0061234507', nama: 'Doni Saputra', kelas: 'VII-B', status: 'HADIR' },
      { nisn: '0061234508', nama: 'Putri Ayu', kelas: 'VII-B', status: 'IZIN', catatan: 'Istirahat di ruang UKS pukul 09:15' },
      { nisn: '0061234509', nama: 'Eko Prasetyo', kelas: 'VII-B', status: 'HADIR' },
      { nisn: '0061234510', nama: 'Nurul Hidayah', kelas: 'VII-B', status: 'HADIR' }
    ],
    dibuatPada: '2026-09-27 10:10 WIT'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-09-22 06:45:10 WIT',
    actor: 'Budi Santoso, S.Kom (Administrator)',
    action: 'INISIALISASI_SISTEM',
    category: 'SISTEM',
    details: 'Inisialisasi sistem presensi digital SMP Nurul Huda Jayapura TP 2026/2027 berhasil disiapkan.',
  },
  {
    id: 'LOG-002',
    timestamp: '2026-09-22 06:50:35 WIT',
    actor: 'Budi Santoso, S.Kom (Administrator)',
    action: 'KONFIGURASI_WA_GATEWAY',
    category: 'KONFIGURASI',
    details: 'Konfigurasi WhatsApp Cloud API Gateway diaktifkan dengan template pesan kehadiran resmi sekolah.',
  },
  {
    id: 'LOG-003',
    timestamp: '2026-09-22 07:05:12 WIT',
    actor: 'Budi Santoso, S.Kom (Administrator)',
    action: 'SINKRONISASI_SISWA',
    category: 'DATA_SISWA',
    details: 'Sinkronisasi 20 data siswa kelas VII-A, VII-B, VIII-A, dan IX-A berhasil dimuat ke database.',
  },
  {
    id: 'LOG-004',
    timestamp: '2026-09-22 07:12:00 WIT',
    actor: 'Dra. Sri Wahyuni (Guru Piket & BK)',
    action: 'BUKA_SESI_PRESENSI',
    category: 'PRESENSI',
    details: 'Sesi QR Presensi Pagi (DATANG) dibuka untuk seluruh jenjang dengan batas terlambat 07:15 WIT.',
  }
];



