export interface ModularPrompt {
  id: string;
  nomor: number;
  judul: string;
  deskripsi: string;
  kategori: string;
  promptText: string;
}

export const MODULAR_PROMPTS: ModularPrompt[] = [
  {
    id: 'prompt-1-database',
    nomor: 1,
    judul: 'Struktur Database dan setupDatabase()',
    kategori: 'Database & Inisialisasi',
    deskripsi: 'Prompt untuk membangun skema tabel Google Sheets lengkap dengan header, tipe data, indeks, dan inisialisasi otomatis.',
    promptText: `Bertindaklah sebagai Senior Google Apps Script Developer. Buat skrip setupDatabase() lengkap di Google Apps Script yang terhubung dengan Google Sheets sebagai database relasional sederhana untuk aplikasi absensi online siswa.

Kebutuhan Struktur Sheet:
1. Sheet "USERS":
   - Kolom: ID_USER, USERNAME, PASSWORD_HASH, NAMA, ROLE (ADMIN, GURU, SISWA), KELAS, NO_HP, STATUS (AKTIF, NONAKTIF), CREATED_AT
2. Sheet "SISWA":
   - Kolom: NISN, NAMA, KELAS, JENIS_KELAMIN (L, P), NO_HP_ORTU, NAMA_ORTU, ALAMAT, QR_TOKEN, STATUS (AKTIF, NONAKTIF)
3. Sheet "SESI_QR":
   - Kolom: ID_SESI, KODE_SESI, JUDUL, TIPE (DATANG, PULANG), KELAS (SEMUA / Spesifik), TANGGAL, JAM_MULAI, JAM_SELESAI, BATAS_TERLAMBAT, TOKEN_AKTIF, STATUS_AKTIF, CREATED_BY
4. Sheet "PRESENSI":
   - Kolom: ID_PRESENSI, TANGGAL, WAKTU, NISN, NAMA_SISWA, KELAS, TIPE (DATANG, PULANG), STATUS (HADIR, TERLAMBAT, IZIN, SAKIT, ALPA), METODE (QR_SCAN, MANUAL), STATUS_WA (TERKIRIM, GAGAL, PENDING, NONAKTIF), WA_RESPONSE, ID_SESI, PETUGAS
5. Sheet "PENGATURAN":
   - Kolom: KUNCI, NILAI, DESKRIPSI (Menyimpan Nama Sekolah, Provider WA, Meta Phone ID, Access Token, Template, Jam Toleransi)

Ketentuan Teknis setupDatabase():
- Buat fungsi idempotent (jika sheet sudah ada, jangan error; format ulang header jika kosong).
- Bekukan baris pertama (setFrozenRows(1)).
- Berikan styling background header warna gelap (#1e293b), teks putih tebal, rata tengah.
- Atur lebar masing-masing kolom sesuai proporsi isi data.
- Masukkan data seed awal (1 user Admin default, 1 Guru piket, 3 Siswa dummy, dan kunci konfigurasi PENGATURAN).
- Hapus "Sheet1" default jika ada.
- Kembalikan objek JSON status { success: true, message: "..." }.`
  },
  {
    id: 'prompt-2-auth',
    nomor: 2,
    judul: 'Login dan Hak Akses (Role-Based Access Control)',
    kategori: 'Autentikasi & Keamanan',
    deskripsi: 'Prompt untuk sistem login aman, enkripsi sederhana, token sesi, dan hak akses Admin / Guru / Siswa.',
    promptText: `Buatkan modul autentikasi dan otorisasi Role-Based Access Control (RBAC) di Google Apps Script dan JavaScript client untuk aplikasi absensi sekolah.

Kebutuhan Fitur:
1. Fungsi Server Auth_login(username, password):
   - Mencari username pada sheet "USERS" (case-insensitive).
   - Validasi status user (hanya status "AKTIF" yang boleh login).
   - Buat session token aman menggunakan Utilities.base64Encode berisikan userId, role, timestamp, dan masa kedaluwarsa (12 jam).
   - Kembalikan data profil (id, nama, role, kelas, noHp) tanpa mengembalikan password.
2. Fungsi Otorisasi Server Auth_authorize(token, allowedRoles):
   - Dekode token dan periksa apakah sudah expired.
   - Periksa apakah role user termasuk dalam allowedRoles (contoh: ['ADMIN', 'GURU']).
   - Tolak eksekusi jika tidak berhak.
3. Hak Akses Tiap Role:
   - ADMIN: Akses penuh (Pengaturan sekolah, setup database, manajemen akun user, konfigurasi WhatsApp, monitoring seluruh kelas).
   - GURU: Membuat sesi QR masuk/pulang, mengontrol proyektor QR, memvalidasi presensi manual/sakit/izin, melihat laporan kelas.
   - SISWA: Scan QR sesi untuk presensi mandiri, melihat riwayat absensi pribadi, dan melihat kartu QR digital siswa.
4. Client-side Handler:
   - Simpan session token di localStorage / sessionStorage.
   - Redirect otomatis ke dashboard sesuai role setelah login berhasil.
   - Logout bersih dengan menghapus session storage.`
  },
  {
    id: 'prompt-3-sesi-qr',
    nomor: 3,
    judul: 'Pembuatan Sesi QR & Dynamic QR Token',
    kategori: 'Sesi & QR Generator',
    deskripsi: 'Prompt untuk membuat sesi absensi datang/pulang dengan QR dinamis per 30 detik untuk mencegah kecurangan titip absen.',
    promptText: `Rancang modul pembuatan sesi presensi dan generator QR Code dinamis berbasis waktu (Time-based One-Time Token) di Google Apps Script dan HTML.

Kebutuhan Spesifikasi:
1. Fungsi Server QR_buatSesi(payload):
   - Parameter: tipe ('DATANG' | 'PULANG'), kelas ('SEMUA' atau nama kelas spesifik), tanggal, jamMulai, jamSelesai, batasTerlambat, createdBy.
   - Validasi: Otomatis nonaktifkan sesi aktif sebelumnya untuk kelas dan tipe yang sama pada tanggal tersebut.
   - Simpan baris baru ke sheet "SESI_QR" dengan status "AKTIF".
   - Buat ID unik format SESI-YYYYMMDD-HHmmss.
2. Mekanisme Dynamic QR Token (Anti-Screenshot / Anti-Titip Absen):
   - Fungsi QR_generateDynamicToken(sesiId): menghitung token berbasis window waktu 30 detik menggunakan hashing SHA-256 (Utilities.computeDigest).
   - Kembalikan token dinamis dan sisa detik sebelum kedaluwarsa.
3. Tampilan Proyektor / Layar Kelas (Client-side):
   - Guru membuka halaman proyektor QR.
   - Tampilkan judul sesi, jam mulai, batas keterlambatan, dan countdown bar 30 detik.
   - Menggunakan library qrcode.js untuk me-render canvas QR code resolusi tinggi.
   - Setiap 30 detik, script client meminta token baru via google.script.run dan memperbarui canvas QR secara mulus tanpa refresh halaman penuh.`
  },
  {
    id: 'prompt-4-scan-validasi',
    nomor: 4,
    judul: 'Scan QR dan Validasi Absensi',
    kategori: 'Pemindaian & Validasi',
    deskripsi: 'Prompt untuk pemindai QR berbasis kamera HP/laptop, input NISN cadangan, serta validasi toleransi keterlambatan.',
    promptText: `Buatkan antarmuka pemindai QR Code responsif (HP dan komputer) serta fungsi validasi absensi di Google Apps Script dan HTML5.

Kebutuhan:
1. Pemindai Kamera Client-Side (HP & Komputer):
   - Menggunakan library html5-qrcode atau jsQR.
   - Mendukung pemilihan kamera belakang (environment) di HP dan webcam di laptop.
   - Area bidik kotak pemindai (scanner box) dengan indikator laser scan.
   - Opsi upload file gambar/foto QR jika kamera bermasalah.
   - Form input manual NISN sebagai fallback jika kartu QR rusak.
2. Logika Validasi di Server:
   - Periksa apakah token QR yang di-scan cocok dengan sesi yang sedang aktif.
   - Periksa apakah siswa dengan NISN tersebut terdaftar dan berstatus "AKTIF" di sheet "SISWA".
   - Periksa apakah sesi tersebut sesuai dengan kelas siswa.
   - Bandingkan waktu scan dengan 'BATAS_TERLAMBAT':
     * Jika waktu scan <= batasTerlambat -> Status = "HADIR"
     * Jika waktu scan > batasTerlambat -> Status = "TERLAMBAT"
   - Hitung selisih menit keterlambatan untuk catatan.
3. Respon Audio & Visual Real-time:
   - Suara beep sukses/gagal via Web Audio API.
   - Tampilkan banner hasil dengan nama siswa, kelas, waktu, status (Hadir/Terlambat), dan status pengiriman WA.
   - Reset scanner otomatis setelah 3 detik untuk melayani antrian siswa berikutnya.`
  },
  {
    id: 'prompt-5-anti-duplikasi',
    nomor: 5,
    judul: 'Penyimpanan Anti-Duplikasi (LockService & Constraint)',
    kategori: 'Integritas Data',
    deskripsi: 'Prompt untuk mekanisme anti-duplikasi mutlak menggunakan LockService Google Apps Script guna mencegah race condition.',
    promptText: `Tuliskan implementasi mekanisme Anti-Duplikasi dan Penanganan Konkurensi (Race Condition) di Google Apps Script untuk pencatatan presensi siswa.

Latar Masalah:
Ketika puluhan siswa melakukan scan QR bersamaan di gerbang sekolah, beberapa request dapat dieksekusi paralel oleh server Google Apps Script, menyebabkan satu siswa tercatat presensi 2 kali atau baris sheet saling tertimpa.

Solusi Teknis Wajib:
1. LockService Atomic Lock:
   - Gunakan LockService.getScriptLock().
   - Pasang lock.waitLock(10000) (tunggu hingga 10 detik).
   - Selalu sertakan blok try...finally dengan lock.releaseLock() agar tidak terjadi deadlock jika ada exception.
2. Pengecekan Duplikasi Ketat:
   - Cari di sheet "PRESENSI" berdasarkan kombinasi: TANGGAL + NISN + TIPE (DATANG/PULANG).
   - Jika ditemukan catatan dengan kombinasi tersebut:
     * Batalkan pencatatan.
     * Kembalikan JSON { success: false, duplicate: true, message: "Siswa sudah absen pada [jam]..." }.
3. Operasi Batch & Atomic Flush:
   - Gunakan SpreadsheetApp.flush() segera setelah appendRow() agar data langsung ter-commit di Google Sheets sebelum proses pengiriman notifikasi WhatsApp dimulai.
   - Berikan penanganan jika antrian lock timeout dengan pesan "Server sibuk, silakan coba dalam 2 detik".`
  },
  {
    id: 'prompt-6-whatsapp-resmi',
    nomor: 6,
    judul: 'Notifikasi WhatsApp melalui Provider Resmi (Meta Cloud API)',
    kategori: 'Integrasi WhatsApp',
    deskripsi: 'Prompt untuk integrasi resmi Meta WhatsApp Business Cloud API tanpa mengarang endpoint, lengkap dengan template dan logging.',
    promptText: `Buatkan fungsi integrasi notifikasi WhatsApp resmi menggunakan Meta WhatsApp Business Cloud API (Official Graph API) di Google Apps Script. Jangan mengarang endpoint API!

Spesifikasi Endpoint Resmi Meta:
- URL: https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
- Method: POST
- Header:
  * Authorization: Bearer {META_ACCESS_TOKEN}
  * Content-Type: application/json

Kebutuhan Fungsi WA_kirimNotifikasiResmi(siswa, tipe, waktu, status):
1. Normalisasi Nomor HP:
   - Mengubah nomor awalan "08..." atau "+62..." menjadi format internasional murni "628...".
2. Payload Template Resmi (Meta Approved Template):
   Nama template: "notifikasi_absensi_siswa", Bahasa: "id"
   Parameter body:
   1: {{nama_siswa}}
   2: {{kelas}}
   3: {{tipe_presensi}} (DATANG / PULANG)
   4: {{waktu_presensi}} (contoh: "06:45:10 WIB")
   5: {{status_kehadiran}} ("Tepat Waktu" / "Terlambat")
3. Fallback Payload Pesan Teks:
   - Jika template belum diapprove, sediakan opsi payload teks standar ramah wali murid.
4. Error Handling & Logging:
   - Gunakan muteHttpExceptions: true pada UrlFetchApp.fetch().
   - Simpan status "TERKIRIM" atau "GAGAL" serta Response ID (wamid...) ke kolom STATUS_WA dan WA_RESPONSE di sheet "PRESENSI".
   - Jangan biarkan kegagalan koneksi WhatsApp membatalkan pencatatan absensi siswa.`
  },
  {
    id: 'prompt-7-dashboard-laporan',
    nomor: 7,
    judul: 'Dashboard dan Laporan Presensi',
    kategori: 'Pelaporan & Analitik',
    deskripsi: 'Prompt untuk rekapitulasi harian/bulanan, perhitungan persentase kehadiran, filter kelas/tanggal, dan export data.',
    promptText: `Rancang sistem Dashboard Analitik dan Rekapitulasi Presensi di Google Apps Script dan antarmuka web HTML/JavaScript.

Kebutuhan:
1. Fungsi Backend Report_getRekapHarian(tanggal, kelas):
   - Ambil seluruh siswa aktif di kelas yang dipilih.
   - Ambil log presensi pada tanggal target.
   - Hitung ringkasan KPI:
     * Total Siswa Terdaftar
     * Jumlah Hadir Tepat Waktu (Datang)
     * Jumlah Terlambat
     * Jumlah Pulang Tercatat
     * Jumlah Belum Hadir / Alpa
   - Susun array data siswa lengkap dengan jam datang, status datang, jam pulang, dan status WA.
2. Tampilan Frontend Dashboard:
   - Kartu metrik ringkasan (Total, Hadir, Terlambat, Belum Hadir) dengan warna berbeda.
   - Filter tanggal (date picker) dan dropdown kelas.
   - Tabel interaktif dengan badge status berwarna (Hijau: Hadir, Kuning: Terlambat, Merah: Belum Absen).
3. Fitur Ekspor Data:
   - Tombol "Ekspor ke CSV / Excel" langsung di browser.
   - Tombol "Buka Spreadsheet" untuk melihat data mentah di Google Sheets.
   - Mode Cetak Laporan (Print Friendly Layout) untuk arsip tata usaha.`
  },
  {
    id: 'prompt-8-testing-deployment',
    nomor: 8,
    judul: 'Pengujian dan Deployment Google Apps Script',
    kategori: 'Deployment & Quality Assurance',
    deskripsi: 'Prompt panduan lengkap cara deploy Web App di Google Apps Script, izin akses, trigger otomatis, dan skenario pengujian.',
    promptText: `Buatkan panduan komprehensif Step-by-Step Pengujian dan Deployment Google Apps Script sebagai Web App yang dapat diakses dari HP dan Komputer.

Kebutuhan Panduan:
1. Langkah Inisialisasi:
   - Cara membuat Google Spreadsheet baru dan menautkan Apps Script (Extensions > Apps Script).
   - Cara menyalin semua file script (.gs) dan file HTML (.html).
   - Menjalankan fungsi setupDatabase() untuk inisialisasi sheet dan memberi otorisasi OAuth Google.
2. Konfigurasi Deployment Web App:
   - Deploy > New deployment > Select type: Web app.
   - Description: "Aplikasi Absensi Siswa v1.0".
   - Execute as: "Me" (agar script memiliki akses menulis ke Spreadsheet dan memanggil UrlFetchApp).
   - Who has access: "Anyone" (agar siswa dan guru dapat membuka web app di HP/komputer masing-masing tanpa harus login akun Google sekolah).
   - Cara mendapatkan URL Web App (https://script.google.com/macros/s/.../exec).
3. Skenario Pengujian Sistem (UAT Checklist):
   - Test 1: Setup database dan verifikasi 5 sheet terbentuk dengan header yang rapi.
   - Test 2: Login Admin, Guru, dan Siswa.
   - Test 3: Guru membuat Sesi Datang dengan batas waktu tertentu.
   - Test 4: Siswa melakukan scan QR tepat waktu (verifikasi status "HADIR").
   - Test 5: Uji Anti-Duplikasi (scan ulang siswa yang sama, pastikan muncul notifikasi ditolak).
   - Test 6: Siswa scan setelah batas waktu (verifikasi status "TERLAMBAT").
   - Test 7: Uji pengiriman pesan WhatsApp ke nomor wali murid.
   - Test 8: Akses multi-device (buka di HP Android/iOS dan laptop bersamaan).`
  },
  {
    id: 'prompt-9-daily-summary-wa',
    nomor: 9,
    judul: 'Pengiriman Ringkasan Absensi Harian Otomatis ke WhatsApp di Akhir Sesi Sekolah',
    kategori: 'Otomatisasi & Broadcast WA',
    deskripsi: 'Prompt untuk agregasi otomatis kehadiran per siswa (datang & pulang) dan broadcast WhatsApp Meta Cloud API terjadwal di akhir sesi sekolah.',
    promptText: `Bertindaklah sebagai Senior Google Apps Script & WhatsApp API Engineer. Buat modul pengiriman Ringkasan Presensi Harian Siswa Secara Otomatis ke Nomor WhatsApp Orang Tua / Siswa di Akhir Sesi Sekolah menggunakan Google Apps Script dan Meta WhatsApp Business Cloud API resmi.

Kebutuhan Spesifikasi Teknis:
1. Agregasi Data Kehadiran Harian Siswa:
   - Ambil seluruh siswa aktif dari sheet "SISWA".
   - Cocokkan dengan catatan presensi hari ini pada sheet "PRESENSI" untuk sesi DATANG dan PULANG.
   - Ekstrak waktu dan status kehadiran:
     * Jam Masuk & Status (Hadir Tepat Waktu / Terlambat / Tidak Hadir)
     * Jam Pulang & Status (Selesai Sesi / Belum Absen Pulang)
     * Status Akhir: "HADIR LENGKAP", "TERLAMBAT", "BELUM PRESENSI PULANG", "IZIN", "SAKIT", atau "TIDAK HADIR / ALPA"

2. Format Pesan WhatsApp Resmi (Meta Cloud API):
   - Endpoint: POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
   - Header: Authorization: Bearer {META_ACCESS_TOKEN}
   - Gunakan template terdaftar "ringkasan_absensi_harian" dengan parameter:
     {{1}}: Nama Orang Tua / Wali Murid
     {{2}}: Nama Siswa
     {{3}}: Kelas
     {{4}}: Tanggal Hari Ini (format: DD MMMM YYYY)
     {{5}}: Ringkasan Sesi Masuk (contoh: "06:45 WIB - Hadir Tepat Waktu")
     {{6}}: Ringkasan Sesi Pulang (contoh: "15:30 WIB - Selesai Sesi")
     {{7}}: Status Akhir ("HADIR LENGKAP / TERTIB")
   - Sediakan fallback pesan teks terstruktur dengan format Markdown WhatsApp resmi (*bold*, _italic_, bullet list).

3. Otomatisasi Terjadwal (Time-Driven Trigger Google Apps Script):
   - Buat fungsi WA_setupAutoSummaryTrigger(jam, menit) yang otomatis memasang ScriptApp.newTrigger("WA_triggerDailySummary").timeBased().atHour(16).everyDays(1).create().
   - Pasang validasi akhir pekan (Sabtu & Minggu libur otomatis dilewati).
   - Berikan jeda waktu (rate-limiting) Utilities.sleep(300) antar pengiriman pesan ke siswa agar tidak melanggar kuota broadcast Meta.

4. Pencatatan Log Transmisi (Audit Trail):
   - Buat sheet "RINGKASAN_HARIAN" untuk mencatat history pengiriman:
     ID_RINGKASAN, TANGGAL, NISN, NAMA_SISWA, KELAS, MASUK_WAKTU, MASUK_STATUS, PULANG_WAKTU, PULANG_STATUS, STATUS_AKHIR, NO_HP_ORTU, STATUS_WA, WA_MESSAGE_ID, WAKTU_KIRIM.
   - Sediakan tombol manual "Broadcast Ringkasan Sekarang" di Dashboard Admin/Guru untuk keperluan pengujian atau pengiriman darurat sebelum jam trigger otomatis.`
  },
  {
    id: 'prompt-10-master-full-app',
    nomor: 10,
    judul: 'Master Prompt: Membangun Seluruh Aplikasi Presensi QR Code Lengkap (All-in-One)',
    kategori: 'Master Specification / Mega-Prompt',
    deskripsi: 'Prompt utama terlengkap untuk menginstruksikan AI membangun seluruh sistem presensi siswa digital end-to-end.',
    promptText: `Bertindaklah sebagai Senior Full-Stack Software Architect & Lead Web Engineer. Bangun sebuah aplikasi web presensi siswa digital berbasis QR Code lengkap, interaktif, responsif, dan siap produksi untuk institusi sekolah (studi kasus: SMP Nurul Huda Jayapura, Papua - Zona Waktu WIT).

Aplikasi ini menggabungkan frontend Next.js App Router yang modern dengan backend cloud gratis Google Apps Script dan Google Sheets sebagai database real-time tanpa biaya server.

---

### SPESIFIKASI DAN KEBUTUHAN SISTEM LENGKAP:

#### 1. IDENTITAS & ARSITEKTUR APLIKASI
- **Nama Aplikasi:** Sistem Presensi Digital Siswa QR Code SMP Nurul Huda Jayapura
- **Zona Waktu Default:** WIT (Asia/Jayapura, UTC+9) dengan opsi sinkronisasi WIB/WITA.
- **Jam Operasional Sekolah:** Jam Masuk: 07:00 WIT, Batas Toleransi Terlambat: 07:15 WIT, Jam Pulang: 13:30 WIT.
- **PWA (Progressive Web App):** Dilengkapi manifest.json, service worker, kemampuan instalasi di Android/iOS/PC, dan dukungan cache offline.
- **Sistem Tema:** Dukungan Dark Mode dan Light Mode yang mulus (smooth transition) dan tersimpan di penyimpanan lokal.
- **Dual Device Viewport:** Simulator perangkat ponsel Android (dengan notch, status bar, navigasi bawah) serta mode layar penuh Desktop PC.

#### 2. ROLE-BASED ACCESS CONTROL (RBAC) 3 PERAN
1. **ADMINISTRATOR (Operator Sekolah):**
   - Mengelola profil institusi: nama sekolah, NPSN, tahun pelajaran, jam operasional, dan upload logo sekolah.
   - Manajemen database siswa (tambah, edit, hapus, cari, filter kelas 7A-9B).
   - Import massal data siswa via file Excel / CSV berformat baku.
   - Cetak Kartu Pelajar QR massal (Batch Print ID Card CR-80) dengan filter kelas.
   - Manajemen akun guru pengampu mata pelajaran.
   - Pengaturan integrasi Google Sheets (Live Sync) dan WhatsApp API.
   - Reset database ke kondisi awal semester.
2. **GURU PIKET GERBANG & GURU MATA PELAJARAN:**
   - **Piket Gerbang:** Pemindai QR via webcam/kamera HP atau Barcode Scanner USB fisik 2D. Deteksi cepat < 0.2 detik, suara sapaan ramah Text-to-Speech (TTS), deteksi otomatis status HADIR (< 07:15 WIT) vs TERLAMBAT (> 07:15 WIT), fallback input manual bagi siswa yang lupa kartu.
   - **Guru Mapel (Presensi Kelas & Jurnal KBM):** Mengisi absensi rombel kelas per jam pelajaran (Jam 1 s.d. Jam 10), tombol cepat "Hadir Semua (H)", status H/S/I/A/D, input materi pokok pembelajaran, catatan perkembangan dan hambatan siswa.
   - **Persetujuan Izin Online:** Memverifikasi pengajuan surat izin/sakit yang dikirim siswa beserta foto bukti surat dokter.
   - **Peringatan Dini:** Deteksi otomatis siswa alpa 3 hari berturut-turut, cetak Surat Panggilan Orang Tua resmi bertanda tangan Kepala Sekolah.
3. **SISWA & ORANG TUA / WALI:**
   - Login mandiri menggunakan NISN dan PIN default.
   - Kartu Pelajar Digital Resmi dengan foto, NISN, dan QR Code pribadi yang bisa diunduh ke galeri.
   - Presensi Mandiri berbasis Geofencing GPS (hanya bisa scan jika berada dalam radius 150 meter dari gerbang sekolah).
   - Pengajuan Surat Izin/Sakit Online dengan unggah foto surat dokter.
   - Papan Pengumuman Sekolah terpadu dan grafik riwayat kehadiran bulanan pribadi.

#### 3. INTEGRASI GOOGLE SHEETS & GOOGLE APPS SCRIPT (LIVE SYNC)
- Database spreadsheet otomatis terdiri dari 5 sheet utama:
  1. \`LOG_PRESENSI\`: ID_LOG, TANGGAL, WAKTU, NISN, NAMA, KELAS, TIPE (MASUK/PULANG), STATUS, METODE, STATUS_WA.
  2. \`DATA_SISWA\`: NISN, NAMA, KELAS, JK, NAMA_WALI, NO_WA_WALI, STATUS.
  3. \`REKAP_HARIAN\`: TANGGAL, TOTAL_SISWA, HADIR, TERLAMBAT, IZIN, SAKIT, ALPA, PERSENTASE.
  4. \`JURNAL_KBM\`: ID_JURNAL, TANGGAL, KELAS, JAM_KE, MAPEL, GURU, MATERI, CATATAN, REKAP_HADIR.
  5. \`CONFIG_SEKOLAH\`: KUNCI, NILAI, KETERANGAN.
- Backend Google Apps Script Web App (\`doPost\`, \`doGet\`) dengan mekanisme **LockService atomik** (\`LockService.getScriptLock()\`) untuk mencegah double attendance (race condition) saat puluhan siswa scan bersamaan di gerbang.

#### 4. INTEGRASI WHATSAPP OFFICIAL & AUDIO TTS
- **WhatsApp Gateway:** Meta Cloud API (Official Graph API) atau gateway multi-device lokal. Mengirim pesan otomatis kedatangan siswa, notifikasi terlambat, dan broadcast massal siswa alpa pada jam 08:00 WIT.
- **Audio Text-to-Speech (TTS):** Menggunakan Web Speech API bahasa Indonesia dengan nada chime pembuka dan sapaan nama siswa secara dinamis: "Selamat pagi Ahmad Faiz, kehadiran masuk Anda tercatat pukul 06:45 WIT. Semangat belajar!"

#### 5. BUKU PANDUAN LENGKAP & PETUNJUK PENGGUNAAN
- Buku manual interaktif 13 bab mencakup seluruh alur operasional, spesifikasi hardware, cara deploy Google Sheets, template WhatsApp, format Excel import, FAQ pemecahan masalah, dan checklist kesiapan harian.`
  }
];
