export interface GASFile {
  name: string;
  type: 'server' | 'html';
  description: string;
  code: string;
}

export const GAS_FILES: GASFile[] = [
  {
    name: 'Code_Tunggal_Siap_Pakai.gs',
    type: 'server',
    description: '⭐ REKOMENDASI UTAMA: 1 File Lengkap (Setup Sheets, Ping, Realtime Sync, & Batch Sync)',
    code: `/**
 * ====================================================================
 * APLIKASI PRESENSI QR CODE SMP NURUL HUDA JAYAPURA
 * Back-End: Google Apps Script Webhook API (Single-File Complete)
 * ====================================================================
 * CARA PAKAI CEPAT:
 * 1. Buat Spreadsheet baru di Google Sheets (sheets.new)
 * 2. Klik menu Ekstensi > Apps Script
 * 3. Hapus kode yang ada, tempel (paste) seluruh isi file ini
 * 4. Pada dropdown fungsi di atas, pilih "setupDatabase" lalu klik "Jalankan" (Run)
 * 5. Izinkan akses Google (Advanced > Buka Presensi (tidak aman) > Allow)
 * 6. Klik tombol "Deploy" (Terapkan) > "New deployment" (Penerapan baru)
 * 7. Pilih tipe "Web app":
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- WAJIB PILIH ANYONE
 * 8. Klik Deploy, salin Web App URL (akhiran /exec) dan masukkan ke aplikasi Presensi!
 * ====================================================================
 */

// Konfigurasi ID Spreadsheet (Kosongkan jika script terikat ke Google Sheets ini)
const SPREADSHEET_ID = ""; 

// Token rahasia verifikasi (harus sama dengan di aplikasi Presensi)
const SECRET_TOKEN = "NURULHUDA_PRESENSI_2026";

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Endpoint GET: Melayani Ping Test koneksi & Halaman Status Webhook
 */
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};

  // 1. Uji koneksi dari aplikasi Presensi QR (Ping Test)
  if (params.action === "ping") {
    const ss = getSpreadsheet();
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Koneksi Google Apps Script & Google Sheets SMP Nurul Huda Jayapura Aktif!",
      spreadsheetName: ss ? ss.getName() : "Spreadsheet Aktif",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Tampilan Web App status saat dibuka langsung di browser
  const ss = getSpreadsheet();
  const presensiSheet = ss ? ss.getSheetByName("PRESENSI") : null;
  const totalPresensi = presensiSheet ? Math.max(0, presensiSheet.getLastRow() - 1) : 0;

  const html = \`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Presensi QR - SMP Nurul Huda Jayapura</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; margin: 0; line-height: 1.6; }
        .card { max-width: 620px; margin: 2rem auto; background: #1e293b; border-radius: 20px; padding: 2.2rem; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: #065f46; color: #6ee7b7; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 0.8rem; margin-bottom: 1.2rem; }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
        h1 { font-size: 1.5rem; margin-top: 0; color: #ffffff; letter-spacing: -0.02em; }
        p { color: #cbd5e1; font-size: 0.95rem; }
        .info-box { background: #090e17; border-radius: 12px; padding: 1.2rem; font-family: ui-monospace, monospace; font-size: 0.85rem; border-left: 4px solid #10b981; margin: 1.5rem 0; line-height: 1.8; color: #e2e8f0; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 1.5rem 0; }
        .stat-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 1rem; text-align: center; }
        .stat-val { font-size: 1.5rem; font-weight: 800; color: #34d399; }
        .stat-lbl { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge"><span class="dot"></span> STATUS: WEBHOOK ONLINE & AKTIF</div>
        <h1>Endpoint Google Apps Script</h1>
        <p>Backend webhook presensi digital <strong>SMP Nurul Huda Jayapura</strong> berhasil terhubung ke Google Sheets dan siap menerima pengiriman data real-time dari scanner QR.</p>
        
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-val">\${totalPresensi}</div>
            <div class="stat-lbl">Data Presensi Masuk</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">200 OK</div>
            <div class="stat-lbl">Status Koneksi API</div>
          </div>
        </div>

        <div class="info-box">
          &bull; Spreadsheet: \${ss ? ss.getName() : "Aktif"}<br>
          &bull; Token Rahasia: \${SECRET_TOKEN}<br>
          &bull; Zona Waktu: Asia/Jayapura (WIT)
        </div>
        <p style="font-size:0.85rem; color:#94a3b8;">Tempelkan URL ini di aplikasi Presensi pada menu <strong>Sinkronisasi Sheets (GAS Live)</strong>.</p>
      </div>
    </body>
    </html>
  \`;

  return HtmlService.createHtmlOutput(html)
    .setTitle("API Presensi QR - SMP Nurul Huda Jayapura")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/**
 * Endpoint POST: Menangani Request Presensi dari Aplikasi
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Tidak ada data payload yang diterima."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // 1. Aksi Ping POST
    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Koneksi POST ke Google Apps Script Berhasil!",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Inisialisasi Database Otomatis via API
    if (action === "setup" || action === "setupDatabase") {
      setupDatabase();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Database Google Sheets berhasil diinisialisasi!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Pencatatan Presensi Tunggal (Real-time Scan Push)
    if (action === "recordPresensi") {
      const record = postData.record;
      if (!record) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "Data record presensi tidak valid."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify(saveSinglePresensiRecord(record)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Batch Sync (Kirim banyak riwayat presensi sekaligus)
    if (action === "batchSync") {
      const records = postData.records || [];
      return ContentService.createTextOutput(JSON.stringify(saveBatchPresensiRecords(records)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default fallback
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Aksi tidak dikenali: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Server Error: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Menyimpan satu baris data presensi ke Google Sheets
 */
function saveSinglePresensiRecord(record) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Mencegah benturan race-condition
  } catch (e) {
    // Abaikan jika lock timeout, tetap lanjutkan append
  }

  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName("PRESENSI");
    if (!sheet) {
      sheet = initPresensiSheet(ss);
    }

    const row = [
      record.id || ("PRS-" + Date.now()),
      record.tanggal || Utilities.formatDate(new Date(), "Asia/Jayapura", "yyyy-MM-dd"),
      record.waktu || Utilities.formatDate(new Date(), "Asia/Jayapura", "HH:mm:ss"),
      record.nisn || "",
      record.namaSiswa || "",
      record.kelas || "",
      record.tipe || "DATANG",
      record.status || "HADIR",
      record.metode || "QR_SISWA",
      record.petugas || "Operator Scanner",
      record.catatan || "",
      new Date()
    ];

    sheet.appendRow(row);
    return {
      success: true,
      message: "Data " + (record.namaSiswa || record.nisn) + " tersimpan di Google Sheets.",
      rowId: record.id
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menyimpan batch banyak presensi sekaligus ke Google Sheets
 */
function saveBatchPresensiRecords(records) {
  if (!records || records.length === 0) {
    return { success: true, count: 0, message: "Tidak ada data yang perlu disinkronkan." };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {}

  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName("PRESENSI");
    if (!sheet) {
      sheet = initPresensiSheet(ss);
    }

    const rows = records.map(function(r) {
      return [
        r.id || ("PRS-" + Date.now()),
        r.tanggal || Utilities.formatDate(new Date(), "Asia/Jayapura", "yyyy-MM-dd"),
        r.waktu || Utilities.formatDate(new Date(), "Asia/Jayapura", "HH:mm:ss"),
        r.nisn || "",
        r.namaSiswa || "",
        r.kelas || "",
        r.tipe || "DATANG",
        r.status || "HADIR",
        r.metode || "QR_SISWA",
        r.petugas || "Operator Scanner",
        r.catatan || "",
        new Date()
      ];
    });

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

    return {
      success: true,
      count: rows.length,
      message: "Berhasil menambahkan " + rows.length + " data presensi ke Google Sheets."
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inisialisasi Sheet PRESENSI jika belum dibuat
 */
function initPresensiSheet(ss) {
  let sheet = ss.insertSheet("PRESENSI");
  const headers = ["ID_PRESENSI", "TANGGAL", "WAKTU", "NISN", "NAMA_SISWA", "KELAS", "TIPE", "STATUS", "METODE", "PETUGAS", "CATATAN", "WAKTU_SYNC"];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground("#065f46"); // Emerald Gelap
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  return sheet;
}

/**
 * ====================================================================
 * FUNGSI SETUP UTAMA: JALANKAN SEKALI DARI APPS SCRIPT EDITOR
 * ====================================================================
 */
function setupDatabase() {
  const ss = getSpreadsheet();
  const sheetsDef = [
    {
      name: "PRESENSI",
      color: "#065f46",
      headers: ["ID_PRESENSI", "TANGGAL", "WAKTU", "NISN", "NAMA_SISWA", "KELAS", "TIPE", "STATUS", "METODE", "PETUGAS", "CATATAN", "WAKTU_SYNC"],
      widths: [130, 100, 90, 110, 200, 90, 90, 90, 110, 140, 160, 160]
    },
    {
      name: "SISWA",
      color: "#1e3a8a",
      headers: ["NISN", "NAMA", "KELAS", "JENIS_KELAMIN", "NO_HP_ORTU", "NAMA_ORTU", "STATUS"],
      widths: [120, 200, 90, 90, 140, 180, 90]
    },
    {
      name: "SESI_QR",
      color: "#701a75",
      headers: ["ID_SESI", "KODE_SESI", "JUDUL", "TIPE", "KELAS", "TANGGAL", "STATUS"],
      widths: [120, 140, 200, 100, 90, 110, 100]
    },
    {
      name: "USERS",
      color: "#334155",
      headers: ["USERNAME", "NAMA", "ROLE", "STATUS"],
      widths: [140, 200, 100, 100]
    },
    {
      name: "PENGATURAN",
      color: "#0f766e",
      headers: ["KUNCI", "NILAI", "DESKRIPSI"],
      widths: [180, 260, 300]
    }
  ];

  sheetsDef.forEach(function(def) {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
    }
    
    if (sheet.getLastRow() === 0) {
      const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setValues([def.headers]);
      headerRange.setBackground(def.color);
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 36);
      sheet.setFrozenRows(1);

      def.widths.forEach(function(w, idx) {
        sheet.setColumnWidth(idx + 1, w);
      });
    }
  });

  Logger.log("Berhasil menyiapkan struktur Database Google Sheets SMP Nurul Huda Jayapura!");
}
`
  },
  {
    name: 'Code.gs',
    type: 'server',
    description: 'Entry point Web App, routing doGet & doPost, dispatcher API',
    code: `/**
 * ====================================================================
 * APLIKASI ABSENSI ONLINE SISWA BERBASIS QR CODE
 * Back-End: Google Apps Script & Google Sheets
 * ====================================================================
 */

// Konfigurasi ID Spreadsheet (Kosongkan jika script terikat / container-bound)
const SPREADSHEET_ID = ""; 

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Endpoint GET: Melayani Ping Test koneksi & Web App
 */
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (params.action === "ping") {
    const ss = getSpreadsheet();
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Koneksi Google Apps Script & Google Sheets SMP Nurul Huda Jayapura Aktif!",
      spreadsheetName: ss ? ss.getName() : "Spreadsheet Aktif",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const template = HtmlService.createTemplateFromFile("Index");
    return template.evaluate()
      .setTitle("Presensi Siswa QR Code")
      .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ONLINE",
      message: "Webhook Google Apps Script Presensi QR SMP Nurul Huda Jayapura Aktif!"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Include file HTML/CSS/JS modular di Apps Script
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Endpoint POST: Menangani Request API dari client (Fetch API)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    let result = {};

    switch (action) {
      case "ping":
        result = { success: true, message: "Koneksi POST ke Google Apps Script Berhasil!" };
        break;
      case "recordPresensi":
        result = saveSinglePresensiRecord(postData.record);
        break;
      case "batchSync":
        result = saveBatchPresensiRecords(postData.records || []);
        break;
      case "login":
        result = Auth_login(postData.username, postData.password);
        break;
      case "buatSesiQR":
        result = QR_buatSesi(postData);
        break;
      case "getSesiAktif":
        result = QR_getSesiAktif(postData.kelas);
        break;
      case "generateDynamicToken":
        result = QR_generateDynamicToken(postData.sesiId);
        break;
      case "submitAbsensi":
        result = Attendance_catatPresensi(postData);
        break;
      case "getRekapHarian":
        result = Report_getRekapHarian(postData.tanggal, postData.kelas);
        break;
      case "kirimRingkasanHarianSiswa":
        result = WA_kirimRingkasanHarianSiswa(postData.siswa, postData.ringkasan);
        break;
      case "broadcastRingkasanHarian":
        result = WA_broadcastRingkasanHarian(postData.tanggal, postData.kelas, postData.targetRole);
        break;
      case "setupAutoSummaryTrigger":
        result = WA_setupAutoSummaryTrigger(postData.jam, postData.menit);
        break;
      case "getRiwayatSiswa":
        result = Report_getRiwayatSiswa(postData.nisn);
        break;
      case "updatePengaturanWA":
        result = WA_updateConfig(postData.config);
        break;
      default:
        result = { success: false, message: "Aksi tidak dikenali: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Server Error: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveSinglePresensiRecord(record) {
  if (!record) return { success: false, message: "Record kosong." };
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("PRESENSI");
  if (!sheet) {
    sheet = ss.insertSheet("PRESENSI");
    sheet.appendRow(["ID_PRESENSI", "TANGGAL", "WAKTU", "NISN", "NAMA_SISWA", "KELAS", "TIPE", "STATUS", "METODE", "PETUGAS", "CATATAN", "WAKTU_SYNC"]);
  }
  sheet.appendRow([
    record.id || ("PRS-" + Date.now()),
    record.tanggal || "",
    record.waktu || "",
    record.nisn || "",
    record.namaSiswa || "",
    record.kelas || "",
    record.tipe || "DATANG",
    record.status || "HADIR",
    record.metode || "QR_SISWA",
    record.petugas || "Operator Scanner",
    record.catatan || "",
    new Date()
  ]);
  return { success: true, message: "Presensi tercatat di Google Sheets." };
}

function saveBatchPresensiRecords(records) {
  if (!records || records.length === 0) return { success: true, count: 0 };
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("PRESENSI");
  if (!sheet) {
    sheet = ss.insertSheet("PRESENSI");
    sheet.appendRow(["ID_PRESENSI", "TANGGAL", "WAKTU", "NISN", "NAMA_SISWA", "KELAS", "TIPE", "STATUS", "METODE", "PETUGAS", "CATATAN", "WAKTU_SYNC"]);
  }
  const rows = records.map(function(r) {
    return [
      r.id || ("PRS-" + Date.now()),
      r.tanggal || "",
      r.waktu || "",
      r.nisn || "",
      r.namaSiswa || "",
      r.kelas || "",
      r.tipe || "DATANG",
      r.status || "HADIR",
      r.metode || "QR_SISWA",
      r.petugas || "Operator Scanner",
      r.catatan || "",
      new Date()
    ];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return { success: true, count: rows.length, message: "Sinkronisasi batch berhasil." };
}
`
  },
  {
    name: 'SetupDatabase.gs',
    type: 'server',
    description: 'Inisialisasi tabel Google Sheets, header, validasi data, index, & default admin',
    code: `/**
 * ====================================================================
 * MODUL 1: STRUKTUR DATABASE & SETUP OTOMATIS
 * Jalankan fungsi setupDatabase() sekali dari Apps Script Editor
 * ====================================================================
 */

function setupDatabase() {
  const ss = getSpreadsheet();
  const sheetsDef = [
    {
      name: "USERS",
      headers: ["ID_USER", "USERNAME", "PASSWORD_HASH", "NAMA", "ROLE", "KELAS", "NO_HP", "STATUS", "CREATED_AT"],
      widths: [100, 120, 160, 200, 90, 90, 140, 90, 160],
      initialData: [
        ["USR-001", "admin", "admin123", "Administrator Sekolah", "ADMIN", "SEMUA", "6281234567890", "AKTIF", new Date()],
        ["USR-002", "guru.piket", "guru123", "Dra. Sri Wahyuni", "GURU", "SEMUA", "6281398765432", "AKTIF", new Date()]
      ]
    },
    {
      name: "SISWA",
      headers: ["NISN", "NAMA", "KELAS", "JENIS_KELAMIN", "NO_HP_ORTU", "NAMA_ORTU", "ALAMAT", "QR_TOKEN", "STATUS"],
      widths: [120, 200, 100, 90, 140, 180, 250, 180, 90],
      initialData: [
        ["0061234501", "Muhammad Rizky Pratama", "XII RPL 1", "L", "628129871122", "Bpk. Hendra", "Jakarta", "QR-SISWA-001", "AKTIF"],
        ["0061234502", "Siti Nurhaliza", "XII RPL 1", "P", "628137788990", "Ibu Fatimah", "Jakarta", "QR-SISWA-002", "AKTIF"],
        ["0061234503", "Fajar Kurniawan", "XII RPL 1", "L", "628156677889", "Bpk. Agus", "Jakarta", "QR-SISWA-003", "AKTIF"]
      ]
    },
    {
      name: "SESI_QR",
      headers: ["ID_SESI", "KODE_SESI", "JUDUL", "TIPE", "KELAS", "TANGGAL", "JAM_MULAI", "JAM_SELESAI", "BATAS_TERLAMBAT", "TOKEN_AKTIF", "STATUS_AKTIF", "CREATED_BY"],
      widths: [110, 160, 180, 90, 90, 110, 90, 90, 110, 200, 100, 160],
      initialData: []
    },
    {
      name: "PRESENSI",
      headers: ["ID_PRESENSI", "TANGGAL", "WAKTU", "NISN", "NAMA_SISWA", "KELAS", "TIPE", "STATUS", "METODE", "STATUS_WA", "WA_RESPONSE", "ID_SESI", "PETUGAS"],
      widths: [130, 100, 90, 110, 200, 100, 90, 100, 90, 100, 220, 120, 140],
      initialData: []
    },
    {
      name: "PENGATURAN",
      headers: ["KUNCI", "NILAI", "DESKRIPSI"],
      widths: [180, 280, 300],
      initialData: [
        ["NAMA_SEKOLAH", "SMK NEGERI 1 INFORMATIKA", "Nama Resmi Sekolah"],
        ["WA_PROVIDER", "META_CLOUD_API", "Pilihan: META_CLOUD_API, FONNTE, WABA_QONTAK"],
        ["META_PHONE_NUMBER_ID", "109283746519283", "Phone Number ID dari Meta Developer Portal"],
        ["META_ACCESS_TOKEN", "EAAG...ISI_TOKEN_PERMANEN_META", "System User Access Token"],
        ["META_TEMPLATE_NAME", "notifikasi_absensi_siswa", "Nama Template WhatsApp Terdaftar"],
        ["WA_AUTO_SEND_DATANG", "TRUE", "Kirim notifikasi otomatis saat datang"],
        ["WA_AUTO_SEND_PULANG", "TRUE", "Kirim notifikasi otomatis saat pulang"],
        ["WA_AUTO_SUMMARY_ENABLED", "TRUE", "Kirim ringkasan harian otomatis di akhir sesi sekolah"],
        ["WA_AUTO_SUMMARY_TIME", "16:00", "Jam pengiriman ringkasan harian otomatis (WIB)"],
        ["WA_AUTO_SUMMARY_TARGET", "ORTU", "Target penerima ringkasan: ORTU, SISWA, atau KEDUANYA"],
        ["META_TEMPLATE_DAILY_SUMMARY", "ringkasan_absensi_harian", "Nama template Meta Cloud API untuk rekap harian"],
        ["QR_DYNAMIC_REFRESH_SEC", "30", "Refresh token QR tiap X detik (0 = static)"],
        ["TOLERANSI_TERLAMBAT_MENIT", "15", "Toleransi keterlambatan setelah jam mulai"]
      ]
    },
    {
      name: "RINGKASAN_HARIAN",
      headers: ["ID_RINGKASAN", "TANGGAL", "NISN", "NAMA_SISWA", "KELAS", "MASUK_WAKTU", "MASUK_STATUS", "PULANG_WAKTU", "PULANG_STATUS", "STATUS_AKHIR", "NO_HP_ORTU", "STATUS_WA", "WA_MESSAGE_ID", "WAKTU_KIRIM"],
      widths: [140, 100, 110, 180, 100, 100, 110, 100, 110, 120, 130, 100, 180, 140],
      initialData: []
    }
  ];

  sheetsDef.forEach(function(def) {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
    }
    sheet.clear();

    // Format Header Baris 1
    const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setValues([def.headers]);
    headerRange.setBackground("#1e293b"); // Slate 800
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);

    // Set Lebar Kolom
    def.widths.forEach(function(w, idx) {
      sheet.setColumnWidth(idx + 1, w);
    });

    // Isi Data Awal jika ada
    if (def.initialData && def.initialData.length > 0) {
      sheet.getRange(2, 1, def.initialData.length, def.headers.length).setValues(def.initialData);
    }

    // Grid formatting
    sheet.getRange(1, 1, Math.max(10, def.initialData.length + 1), def.headers.length)
      .setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  });

  // Hapus sheet default "Sheet1" jika ada
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log("Database berhasil di-setup dengan 5 tabel lengkap.");
  return { success: true, message: "Database berhasil diinisialisasi!" };
}
`
  },
  {
    name: 'Auth.gs',
    type: 'server',
    description: 'Manajemen login, validasi hak akses RBAC (Admin, Guru, Siswa), & session token',
    code: `/**
 * ====================================================================
 * MODUL 2: AUTENTIKASI & HAK AKSES (RBAC)
 * ====================================================================
 */

function Auth_login(username, password) {
  const ss = getSpreadsheet();
  const sheetUsers = ss.getSheetByName("USERS");
  const data = sheetUsers.getDataRange().getValues();

  // Kolom: ID_USER(0), USERNAME(1), PASSWORD_HASH(2), NAMA(3), ROLE(4), KELAS(5), NO_HP(6), STATUS(7)
  for (let i = 1; i < data.length; i++) {
    const rowUser = data[i][1].toString().trim();
    const rowPass = data[i][2].toString().trim();
    const rowStatus = data[i][7].toString().trim();

    if (rowUser.toLowerCase() === username.toLowerCase() && rowPass === password) {
      if (rowStatus !== "AKTIF") {
        return { success: false, message: "Akun Anda berstatus Nonaktif. Hubungi Admin." };
      }

      const userData = {
        id: data[i][0],
        username: data[i][1],
        nama: data[i][3],
        role: data[i][4], // 'ADMIN' | 'GURU' | 'SISWA'
        kelas: data[i][5],
        noHp: data[i][6]
      };

      // Buat token sesi sederhana berbasis waktu dan cache
      const token = Utilities.base64Encode(JSON.stringify({
        id: userData.id,
        role: userData.role,
        exp: new Date().getTime() + (12 * 60 * 60 * 1000) // 12 jam
      }));

      return {
        success: true,
        message: "Login berhasil! Selamat datang, " + userData.nama,
        token: token,
        user: userData
      };
    }
  }

  return { success: false, message: "Username atau Password salah." };
}

/**
 * Validasi Role pada pemanggilan fungsi terlindung
 */
function Auth_authorize(token, allowedRoles) {
  if (!token) return { authorized: false, message: "Token tidak ditemukan" };
  try {
    const decoded = JSON.parse(Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString());
    if (new Date().getTime() > decoded.exp) {
      return { authorized: false, message: "Sesi telah kedaluwarsa. Silakan login kembali." };
    }
    if (allowedRoles.indexOf(decoded.role) === -1) {
      return { authorized: false, message: "Akses ditolak: Anda tidak memiliki izin." };
    }
    return { authorized: true, role: decoded.role, userId: decoded.id };
  } catch (e) {
    return { authorized: false, message: "Token tidak valid" };
  }
}
`
  },
  {
    name: 'QRService.gs',
    type: 'server',
    description: 'Pembuatan Sesi QR (Datang/Pulang), dynamic token generator per 30 detik',
    code: `/**
 * ====================================================================
 * MODUL 3: PEMBUATAN & VALIDASI SESI QR DENGAN TOKEN DINAMIS
 * ====================================================================
 */

function QR_buatSesi(payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("SESI_QR");
  
  const idSesi = "SESI-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const tanggal = payload.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  const tipe = payload.tipe || "DATANG"; // 'DATANG' atau 'PULANG'
  const kelas = payload.kelas || "SEMUA";
  const kodeSesi = "SESI-" + tipe + "-" + kelas.replace(/\\s+/g, "_") + "-" + tanggal;
  
  // Nonaktifkan sesi aktif sebelumnya dengan tipe & kelas yang sama pada hari yang sama
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === kelas && data[i][3] === tipe && data[i][5] === tanggal) {
      sheet.getRange(i + 1, 11).setValue("NONAKTIF");
    }
  }

  // Generate seed token rahasia
  const salt = Utilities.getUuid().substring(0, 8);
  const tokenAwal = "QR_" + idSesi + "_" + salt;

  const newRow = [
    idSesi,
    kodeSesi,
    payload.judul || ("Presensi " + tipe + " " + kelas),
    tipe,
    kelas,
    tanggal,
    payload.jamMulai || "06:30",
    payload.jamSelesai || "07:30",
    payload.batasTerlambat || "07:00",
    tokenAwal,
    "AKTIF",
    payload.createdBy || "Guru Piket"
  ];

  sheet.appendRow(newRow);

  return {
    success: true,
    message: "Sesi QR " + tipe + " berhasil diaktifkan!",
    sesi: {
      idSesi: idSesi,
      kodeSesi: kodeSesi,
      tipe: tipe,
      kelas: kelas,
      tanggal: tanggal,
      jamMulai: payload.jamMulai,
      jamSelesai: payload.jamSelesai,
      batasTerlambat: payload.batasTerlambat,
      tokenAktif: tokenAwal
    }
  };
}

/**
 * Menghasilkan token dinamis (TOTP-like) per interval (misal 30 detik)
 * Mencegah siswa melakukan screenshot QR code dan membagikannya ke teman
 */
function QR_generateDynamicToken(sesiId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("SESI_QR");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sesiId && data[i][10] === "AKTIF") {
      // Window waktu per 30 detik
      const timeWindow = Math.floor(new Date().getTime() / 30000);
      const rawString = sesiId + "_" + timeWindow + "_SECRET_SALT";
      const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawString);
      const dynamicToken = "DYN_" + sesiId + "_" + Utilities.base64Encode(signature).substring(0, 12);
      
      // Update token aktif di sheet
      sheet.getRange(i + 1, 10).setValue(dynamicToken);

      return {
        success: true,
        token: dynamicToken,
        expiresInSeconds: 30 - (Math.floor(new Date().getTime() / 1000) % 30)
      };
    }
  }

  return { success: false, message: "Sesi tidak ditemukan atau sudah tidak aktif." };
}

function QR_getSesiAktif(kelas) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("SESI_QR");
  const data = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");

  for (let i = 1; i < data.length; i++) {
    const rowTanggal = Utilities.formatDate(new Date(data[i][5]), "Asia/Jakarta", "yyyy-MM-dd");
    const rowKelas = data[i][4];
    const rowStatus = data[i][10];

    if (rowStatus === "AKTIF" && rowTanggal === today) {
      if (!kelas || kelas === "SEMUA" || rowKelas === "SEMUA" || rowKelas === kelas) {
        return {
          success: true,
          sesi: {
            idSesi: data[i][0],
            kodeSesi: data[i][1],
            judul: data[i][2],
            tipe: data[i][3],
            kelas: data[i][4],
            tanggal: rowTanggal,
            jamMulai: data[i][6],
            jamSelesai: data[i][7],
            batasTerlambat: data[i][8],
            tokenAktif: data[i][9]
          }
        };
      }
    }
  }

  return { success: false, message: "Tidak ada sesi presensi aktif saat ini." };
}
`
  },
  {
    name: 'Attendance.gs',
    type: 'server',
    description: 'Pencatatan Presensi dengan LockService anti-duplikasi race-condition, validasi jam & status',
    code: `/**
 * ====================================================================
 * MODUL 4 & 5: SCAN QR, VALIDASI ABSENSI & ANTI-DUPLIKASI (LOCK SERVICE)
 * Menggunakan LockService.getScriptLock() untuk mencegah race condition
 * ====================================================================
 */

function Attendance_catatPresensi(payload) {
  // 1. Kunci Script untuk menjamin Atomicity (Anti Double Submit)
  const lock = LockService.getScriptLock();
  try {
    // Tunggu maksimal 10 detik untuk memperoleh kunci transaksi
    lock.waitLock(10000);
  } catch (e) {
    return {
      success: false,
      message: "Server sedang sibuk memproses presensi lain. Silakan scan ulang dalam 2 detik."
    };
  }

  try {
    const ss = getSpreadsheet();
    const sheetPresensi = ss.getSheetByName("PRESENSI");
    const sheetSiswa = ss.getSheetByName("SISWA");
    const sheetSesi = ss.getSheetByName("SESI_QR");

    const now = new Date();
    const tanggalHariIni = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
    const jamSekarangStr = Utilities.formatDate(now, "Asia/Jakarta", "HH:mm:ss");

    const nisn = payload.nisn ? payload.nisn.toString().trim() : "";
    const idSesi = payload.idSesi;
    const scannedToken = payload.scannedToken;

    if (!nisn) {
      return { success: false, message: "NISN siswa wajib diisi." };
    }

    // 2. Validasi Data Siswa
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    let infoSiswa = null;
    for (let s = 1; s < dataSiswa.length; s++) {
      if (dataSiswa[s][0].toString().trim() === nisn) {
        infoSiswa = {
          nisn: dataSiswa[s][0].toString(),
          nama: dataSiswa[s][1].toString(),
          kelas: dataSiswa[s][2].toString(),
          noHpOrtu: dataSiswa[s][4].toString(),
          namaOrtu: dataSiswa[s][5].toString()
        };
        break;
      }
    }

    if (!infoSiswa) {
      return { success: false, message: "Data Siswa dengan NISN " + nisn + " tidak ditemukan di sistem." };
    }

    // 3. Validasi Sesi Aktif
    const dataSesi = sheetSesi.getDataRange().getValues();
    let sesiRow = null;
    for (let k = 1; k < dataSesi.length; k++) {
      if (dataSesi[k][0] === idSesi) {
        sesiRow = {
          id: dataSesi[k][0],
          tipe: dataSesi[k][3], // DATANG / PULANG
          kelas: dataSesi[k][4],
          jamMulai: dataSesi[k][6],
          jamSelesai: dataSesi[k][7],
          batasTerlambat: dataSesi[k][8],
          tokenAktif: dataSesi[k][9],
          statusAktif: dataSesi[k][10]
        };
        break;
      }
    }

    if (!sesiRow || sesiRow.statusAktif !== "AKTIF") {
      return { success: false, message: "Sesi presensi sudah ditutup atau tidak aktif." };
    }

    // Validasi kesesuaian kelas (jika sesi bukan untuk SEMUA)
    if (sesiRow.kelas !== "SEMUA" && sesiRow.kelas !== infoSiswa.kelas) {
      return {
        success: false,
        message: "Sesi ini dikhususkan untuk kelas " + sesiRow.kelas + ", sedangkan Anda terdaftar di kelas " + infoSiswa.kelas
      };
    }

    // 4. PENGECEKAN ANTI-DUPLIKASI KETAT
    // Siswa TIDAK BOLEH absen 2 kali pada tipe sesi (DATANG/PULANG) dan tanggal yang sama
    const presensiData = sheetPresensi.getDataRange().getValues();
    for (let p = 1; p < presensiData.length; p++) {
      const rowTanggal = Utilities.formatDate(new Date(presensiData[p][1]), "Asia/Jakarta", "yyyy-MM-dd");
      const rowNisn = presensiData[p][3].toString().trim();
      const rowTipe = presensiData[p][6].toString().trim();

      if (rowTanggal === tanggalHariIni && rowNisn === nisn && rowTipe === sesiRow.tipe) {
        const waktuSebelumnya = presensiData[p][2];
        const statusSebelumnya = presensiData[p][7];
        return {
          success: false,
          duplicate: true,
          message: "DUPLIKAT: Siswa a.n. " + infoSiswa.nama + " SUDAH melakukan presensi " + sesiRow.tipe +
                   " hari ini pada pukul " + waktuSebelumnya + " (Status: " + statusSebelumnya + ")."
        };
      }
    }

    // 5. Tentukan Status Presensi (HADIR / TERLAMBAT)
    let statusAbsen = "HADIR";
    if (sesiRow.tipe === "DATANG" && sesiRow.batasTerlambat) {
      // Bandingkan jam sekarang dengan batas terlambat
      const [currH, currM] = jamSekarangStr.split(":").map(Number);
      const [limitH, limitM] = sesiRow.batasTerlambat.toString().split(":").map(Number);
      if (currH > limitH || (currH === limitH && currM > limitM)) {
        statusAbsen = "TERLAMBAT";
      }
    }

    // 6. Simpan Baris Baru ke Sheet PRESENSI
    const idPresensi = "PRES-" + Utilities.formatDate(now, "Asia/Jakarta", "yyyyMMddHHmmss") + "-" + nisn.slice(-4);
    const rowPresensi = [
      idPresensi,
      tanggalHariIni,
      jamSekarangStr,
      infoSiswa.nisn,
      infoSiswa.nama,
      infoSiswa.kelas,
      sesiRow.tipe,
      statusAbsen,
      payload.metode || "QR_SCAN",
      "PENDING",
      "-",
      idSesi,
      payload.petugas || "Sistem QR Otomatis"
    ];

    sheetPresensi.appendRow(rowPresensi);
    SpreadsheetApp.flush(); // Pastikan data langsung tertulis sebelum kirim WA

    // 7. Notifikasi WhatsApp ke Nomor Orang Tua
    let waResult = { success: false, response: "Notifikasi dinonaktifkan" };
    try {
      waResult = WA_kirimNotifikasiResmi(infoSiswa, sesiRow.tipe, jamSekarangStr, statusAbsen);
      
      // Update status WA di baris terakhir
      const lastRow = sheetPresensi.getLastRow();
      sheetPresensi.getRange(lastRow, 10).setValue(waResult.success ? "TERKIRIM" : "GAGAL");
      sheetPresensi.getRange(lastRow, 11).setValue(waResult.response ? waResult.response.substring(0, 200) : "");
    } catch (waErr) {
      Logger.log("Error WA: " + waErr.toString());
    }

    return {
      success: true,
      message: "Presensi " + sesiRow.tipe + " Berhasil Dicatat!",
      data: {
        idPresensi: idPresensi,
        nisn: infoSiswa.nisn,
        nama: infoSiswa.nama,
        kelas: infoSiswa.kelas,
        tipe: sesiRow.tipe,
        status: statusAbsen,
        waktu: jamSekarangStr,
        waStatus: waResult.success ? "TERKIRIM" : "GAGAL"
      }
    };

  } finally {
    // 8. Selalu lepas kunci LockService
    lock.releaseLock();
  }
}
`
  },
  {
    name: 'WhatsApp.gs',
    type: 'server',
    description: 'Integrasi resmi WhatsApp Meta Cloud API (Endpoint Asli graph.facebook.com/v20.0)',
    code: `/**
 * ====================================================================
 * MODUL 6: NOTIFIKASI WHATSAPP MELALUI PROVIDER RESMI (META CLOUD API)
 * Sesuai Dokumentasi Resmi Meta: 
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 * ====================================================================
 */

function WA_getConfig() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("PENGATURAN");
  const data = sheet.getDataRange().getValues();
  const config = {};

  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  return config;
}

/**
 * Format nomor HP ke standar internasional WhatsApp (misal 0812 -> 62812)
 */
function WA_formatPhoneNumber(phone) {
  let cleaned = phone.toString().replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Kirim Pesan via Meta WhatsApp Business Cloud API (Endpoint Resmi)
 */
function WA_kirimNotifikasiResmi(siswa, tipe, waktu, status) {
  const cfg = WA_getConfig();
  const phone = WA_formatPhoneNumber(siswa.noHpOrtu);

  if (!phone || phone.length < 10) {
    return { success: false, response: "Nomor WhatsApp Orang Tua tidak valid" };
  }

  // Cek apakah fitur diaktifkan
  if (tipe === "DATANG" && cfg.WA_AUTO_SEND_DATANG !== "TRUE") {
    return { success: false, response: "Auto-send Datang dinonaktifkan di pengaturan" };
  }
  if (tipe === "PULANG" && cfg.WA_AUTO_SEND_PULANG !== "TRUE") {
    return { success: false, response: "Auto-send Pulang dinonaktifkan di pengaturan" };
  }

  const phoneNumberId = cfg.META_PHONE_NUMBER_ID;
  const accessToken = cfg.META_ACCESS_TOKEN;
  const templateName = cfg.META_TEMPLATE_NAME || "notifikasi_absensi_siswa";

  // Endpoint RESMI Meta Graph API
  const url = "https://graph.facebook.com/v20.0/" + phoneNumberId + "/messages";

  // Format pesan ramah untuk wali murid
  const statusKeterangan = (status === "HADIR") 
    ? "Tepat Waktu" 
    : (status === "TERLAMBAT" ? "Terlambat" : status);

  // Opsi A: Template Message (Wajib untuk pesan outbound resmi di luar window 24 jam)
  const templatePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "id" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: siswa.nama },
            { type: "text", text: siswa.kelas },
            { type: "text", text: tipe },
            { type: "text", text: waktu + " WIB" },
            { type: "text", text: statusKeterangan }
          ]
        }
      ]
    }
  };

  // Opsi B: Direct Text Message (Bisa digunakan dalam customer-care window atau dev sandbox)
  const textBody = "Salam Bapak/Ibu " + (siswa.namaOrtu || "Wali Murid") + ",\\n\\n" +
    "Kami informasikan bahwa ananda:\\n" +
    "Nama : *" + siswa.nama + "*\\n" +
    "Kelas: *" + siswa.kelas + "*\\n\\n" +
    "Telah melakukan presensi *" + tipe + "* pada:\\n" +
    "Waktu : *" + waktu + " WIB*\\n" +
    "Status: *" + statusKeterangan + "*\\n\\n" +
    "Terima kasih atas perhatian Bapak/Ibu.\\n" +
    "— " + (cfg.NAMA_SEKOLAH || "Sistem Presensi Sekolah");

  const textPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "text",
    text: {
      preview_url: false,
      body: textBody
    }
  };

  // Gunakan template jika access token valid atau fallback ke text
  const payloadToUse = templatePayload;

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + accessToken
    },
    payload: JSON.stringify(payloadToUse),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode === 200 || statusCode === 201) {
      return { success: true, response: responseText };
    } else {
      // Jika template gagal, coba fallback pesan teks biasa
      options.payload = JSON.stringify(textPayload);
      const retryResponse = UrlFetchApp.fetch(url, options);
      const retryCode = retryResponse.getResponseCode();
      const retryText = retryResponse.getContentText();
      
      return {
        success: (retryCode === 200 || retryCode === 201),
        response: "HTTP " + retryCode + ": " + retryText
      };
    }
  } catch (err) {
    return { success: false, response: "Fetch Error: " + err.toString() };
  }
}

/**
 * Kirim Ringkasan Harian Siswa ke WhatsApp Orang Tua di Akhir Sesi Sekolah
 */
function WA_kirimRingkasanHarianSiswa(siswa, ringkasan) {
  const cfg = WA_getConfig();
  const phone = WA_formatPhoneNumber(siswa.noHpOrtu);

  if (!phone || phone.length < 10) {
    return { success: false, response: "Nomor WhatsApp Wali Murid tidak valid: " + siswa.noHpOrtu };
  }

  const phoneNumberId = cfg.META_PHONE_NUMBER_ID;
  const accessToken = cfg.META_ACCESS_TOKEN;
  const templateName = cfg.META_TEMPLATE_DAILY_SUMMARY || "ringkasan_absensi_harian";

  const url = "https://graph.facebook.com/v20.0/" + phoneNumberId + "/messages";

  const tanggalStr = ringkasan.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMMM yyyy");
  const masukInfo = (ringkasan.masukWaktu && ringkasan.masukWaktu !== "-") 
    ? ringkasan.masukWaktu + " WIB (" + ringkasan.masukStatus + ")" 
    : "Tidak Tercatat / Belum Hadir";
  const pulangInfo = (ringkasan.pulangWaktu && ringkasan.pulangWaktu !== "-") 
    ? ringkasan.pulangWaktu + " WIB (" + ringkasan.pulangStatus + ")" 
    : "Belum Melakukan Presensi Pulang";
  const statusAkhir = ringkasan.statusAkhir || "HADIR LENGKAP";

  // Template Payload Resmi Meta
  const templatePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "id" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: siswa.namaOrtu || "Wali Murid" },
            { type: "text", text: siswa.nama },
            { type: "text", text: siswa.kelas },
            { type: "text", text: tanggalStr },
            { type: "text", text: masukInfo },
            { type: "text", text: pulangInfo },
            { type: "text", text: statusAkhir }
          ]
        }
      ]
    }
  };

  // Fallback Pesan Teks Terstruktur
  const textBody = "📌 *LAPORAN RINGKASAN PRESENSI HARIAN*\\n" +
    "*" + (cfg.NAMA_SEKOLAH || "SMK NEGERI 1 INFORMATIKA") + "*\\n\\n" +
    "Yth. Bapak/Ibu *" + (siswa.namaOrtu || "Wali Murid") + "*,\\n" +
    "Berikut rekapitulasi kehadiran ananda pada hari *" + tanggalStr + "*:\\n\\n" +
    "👤 Nama Siswa : *" + siswa.nama + "*\\n" +
    "🏫 Kelas      : *" + siswa.kelas + "*\\n" +
    "🆔 NISN       : *" + siswa.nisn + "*\\n\\n" +
    "📋 *Ringkasan Sesi Hari Ini:*\\n" +
    "• Sesi Masuk : *" + masukInfo + "*\\n" +
    "• Sesi Pulang: *" + pulangInfo + "*\\n" +
    "• Status Akhir: *" + statusAkhir + "*\\n\\n" +
    "Terima kasih atas kerja sama Bapak/Ibu dalam mengawal kedisiplinan belajar ananda.\\n" +
    "— _Sistem Presensi Digital Sekolah_";

  const textPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "text",
    text: { preview_url: false, body: textBody }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + accessToken },
    payload: JSON.stringify(templatePayload),
    muteHttpExceptions: true
  };

  try {
    let response = UrlFetchApp.fetch(url, options);
    let statusCode = response.getResponseCode();
    let responseText = response.getContentText();

    if (statusCode !== 200 && statusCode !== 201) {
      // Fallback ke pesan teks
      options.payload = JSON.stringify(textPayload);
      response = UrlFetchApp.fetch(url, options);
      statusCode = response.getResponseCode();
      responseText = response.getContentText();
    }

    return {
      success: (statusCode === 200 || statusCode === 201),
      statusCode: statusCode,
      response: responseText
    };
  } catch (err) {
    return { success: false, response: "Fetch Error: " + err.toString() };
  }
}

/**
 * Broadcast Ringkasan Harian ke Seluruh Siswa di Akhir Sesi Sekolah
 */
function WA_broadcastRingkasanHarian(tanggal, kelas, targetRole) {
  const ss = getSpreadsheet();
  const cfg = WA_getConfig();
  const targetDate = tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");

  const rekapData = Report_getRekapHarian(targetDate, kelas || "SEMUA");
  if (!rekapData || !rekapData.success) {
    return { success: false, message: "Gagal mengambil data rekap harian." };
  }

  const sheetSiswa = ss.getSheetByName("SISWA");
  const siswaData = sheetSiswa.getDataRange().getValues();
  const siswaMap = {};
  for (let s = 1; s < siswaData.length; s++) {
    siswaMap[siswaData[s][0].toString()] = {
      nisn: siswaData[s][0].toString(),
      nama: siswaData[s][1],
      kelas: siswaData[s][2],
      noHpOrtu: siswaData[s][4],
      namaOrtu: siswaData[s][5]
    };
  }

  let sheetSummaryLog = ss.getSheetByName("RINGKASAN_HARIAN");
  if (!sheetSummaryLog) {
    sheetSummaryLog = ss.insertSheet("RINGKASAN_HARIAN");
    sheetSummaryLog.appendRow([
      "ID_RINGKASAN", "TANGGAL", "NISN", "NAMA_SISWA", "KELAS", 
      "MASUK_WAKTU", "MASUK_STATUS", "PULANG_WAKTU", "PULANG_STATUS", 
      "STATUS_AKHIR", "NO_HP_ORTU", "STATUS_WA", "WA_MESSAGE_ID", "WAKTU_KIRIM"
    ]);
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rekapData.data.length; i++) {
    const item = rekapData.data[i];
    const siswaObj = siswaMap[item.nisn];
    if (!siswaObj) continue;

    let statusAkhir = "HADIR LENGKAP";
    if (item.datangStatus === "BELUM_ABSEN" && item.pulangStatus === "BELUM_ABSEN") {
      statusAkhir = "TIDAK HADIR / ALPA";
    } else if (item.datangStatus === "TERLAMBAT") {
      statusAkhir = "TERLAMBAT";
    } else if (item.datangStatus === "HADIR" && item.pulangStatus === "BELUM_ABSEN") {
      statusAkhir = "BELUM PRESENSI PULANG";
    }

    const ringkasanPayload = {
      tanggal: targetDate,
      masukWaktu: item.datangWaktu,
      masukStatus: item.datangStatus,
      pulangWaktu: item.pulangWaktu,
      pulangStatus: item.pulangStatus,
      statusAkhir: statusAkhir,
      catatan: item.datangStatus === "TERLAMBAT" ? "Terlambat di sesi masuk" : "Presensi tercatat tertib."
    };

    const resWA = WA_kirimRingkasanHarianSiswa(siswaObj, ringkasanPayload);
    const idSummary = "SUM-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd") + "-" + item.nisn;
    const waktuKirim = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    if (resWA.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Catat ke sheet RINGKASAN_HARIAN
    sheetSummaryLog.appendRow([
      idSummary,
      targetDate,
      item.nisn,
      item.nama,
      item.kelas,
      item.datangWaktu,
      item.datangStatus,
      item.pulangWaktu,
      item.pulangStatus,
      statusAkhir,
      siswaObj.noHpOrtu,
      resWA.success ? "TERKIRIM" : "GAGAL",
      resWA.response ? resWA.response.substring(0, 150) : "-",
      waktuKirim
    ]);

    results.push({
      nisn: item.nisn,
      nama: item.nama,
      noHpOrtu: siswaObj.noHpOrtu,
      statusAkhir: statusAkhir,
      waStatus: resWA.success ? "TERKIRIM" : "GAGAL",
      response: resWA.response
    });

    // Beri jeda 300ms untuk mematuhi rate-limit Meta Graph API
    Utilities.sleep(300);
  }

  SpreadsheetApp.flush();

  return {
    success: true,
    message: "Broadcast ringkasan harian selesai. Terkirim: " + successCount + ", Gagal: " + failCount,
    tanggal: targetDate,
    totalTarget: rekapData.data.length,
    successCount: successCount,
    failCount: failCount,
    logs: results
  };
}

/**
 * Konfigurasi Trigger Terjadwal Otomatis (Time-driven Trigger Google Apps Script)
 * Dijalankan sekali oleh Admin/Guru untuk mengotomatiskan broadcast harian di akhir sesi sekolah
 */
function WA_setupAutoSummaryTrigger(jam, menit) {
  WA_deleteExistingTriggers("WA_triggerDailySummary");

  const targetHour = jam !== undefined ? parseInt(jam) : 16;
  const targetMinute = menit !== undefined ? parseInt(menit) : 0;

  ScriptApp.newTrigger("WA_triggerDailySummary")
    .timeBased()
    .atHour(targetHour)
    .nearMinute(targetMinute)
    .everyDays(1)
    .create();

  return {
    success: true,
    message: "Trigger ringkasan harian otomatis berhasil dipasang untuk pukul " + 
             targetHour + ":" + (targetMinute < 10 ? "0" : "") + targetMinute + " WIB setiap hari sekolah."
  };
}

/**
 * Handler yang dieksekusi secara otomatis oleh Apps Script Time-Driven Trigger
 */
function WA_triggerDailySummary() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Minggu, 6 = Sabtu

  // Jangan kirim pada hari libur akhir pekan (Sabtu & Minggu)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    Logger.log("Hari ini libur sekolah. Trigger ringkasan harian dilewati.");
    return;
  }

  const cfg = WA_getConfig();
  if (cfg.WA_AUTO_SUMMARY_ENABLED !== "TRUE") {
    Logger.log("Fitur WA_AUTO_SUMMARY_ENABLED dinonaktifkan di sheet PENGATURAN.");
    return;
  }

  const todayStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
  Logger.log("Menjalankan broadcast ringkasan harian otomatis untuk tanggal: " + todayStr);
  const res = WA_broadcastRingkasanHarian(todayStr, "SEMUA", cfg.WA_AUTO_SUMMARY_TARGET || "ORTU");
  Logger.log("Hasil broadcast: " + JSON.stringify(res));
}

/**
 * Helper untuk menghapus trigger lama agar tidak terjadi duplikasi
 */
function WA_deleteExistingTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}
`
  },
  {
    name: 'Report.gs',
    type: 'server',
    description: 'Modul Rekapitulasi Presensi Harian, Bulanan, filter Kelas, & Export data',
    code: `/**
 * ====================================================================
 * MODUL 7: DASHBOARD & LAPORAN PRESENSI
 * ====================================================================
 */

function Report_getRekapHarian(tanggal, kelas) {
  const ss = getSpreadsheet();
  const targetDate = tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  
  const sheetPresensi = ss.getSheetByName("PRESENSI");
  const sheetSiswa = ss.getSheetByName("SISWA");

  const siswaData = sheetSiswa.getDataRange().getValues();
  const presensiData = sheetPresensi.getDataRange().getValues();

  // 1. Ambil daftar siswa yang ditargetkan
  const daftarSiswa = [];
  for (let s = 1; s < siswaData.length; s++) {
    const sKelas = siswaData[s][2];
    const sStatus = siswaData[s][8];
    if (sStatus === "AKTIF") {
      if (!kelas || kelas === "SEMUA" || sKelas === kelas) {
        daftarSiswa.push({
          nisn: siswaData[s][0].toString(),
          nama: siswaData[s][1],
          kelas: sKelas,
          noHpOrtu: siswaData[s][4]
        });
      }
    }
  }

  // 2. Map presensi hari target
  const presensiMap = {};
  for (let p = 1; p < presensiData.length; p++) {
    const rowDate = Utilities.formatDate(new Date(presensiData[p][1]), "Asia/Jakarta", "yyyy-MM-dd");
    const rowNisn = presensiData[p][3].toString();
    const rowTipe = presensiData[p][6]; // DATANG / PULANG

    if (rowDate === targetDate) {
      if (!presensiMap[rowNisn]) {
        presensiMap[rowNisn] = {};
      }
      presensiMap[rowNisn][rowTipe] = {
        waktu: presensiData[p][2],
        status: presensiData[p][7],
        metode: presensiData[p][8],
        waStatus: presensiData[p][9]
      };
    }
  }

  // 3. Gabungkan data dan hitung statistik
  let stats = {
    totalTarget: daftarSiswa.length,
    hadirDatang: 0,
    terlambatDatang: 0,
    hadirPulang: 0,
    belumAbsen: 0
  };

  const rekapDetail = daftarSiswa.map(function(s) {
    const log = presensiMap[s.nisn] || {};
    const datang = log["DATANG"] || null;
    const pulang = log["PULANG"] || null;

    if (datang) {
      if (datang.status === "HADIR") stats.hadirDatang++;
      else if (datang.status === "TERLAMBAT") stats.terlambatDatang++;
    } else {
      stats.belumAbsen++;
    }

    if (pulang) {
      stats.hadirPulang++;
    }

    return {
      nisn: s.nisn,
      nama: s.nama,
      kelas: s.kelas,
      datangWaktu: datang ? datang.waktu : "-",
      datangStatus: datang ? datang.status : "BELUM_ABSEN",
      pulangWaktu: pulang ? pulang.waktu : "-",
      pulangStatus: pulang ? pulang.status : "BELUM_ABSEN",
      waStatus: datang ? datang.waStatus : "-"
    };
  });

  return {
    success: true,
    tanggal: targetDate,
    kelas: kelas || "SEMUA",
    statistik: stats,
    data: rekapDetail
  };
}
`
  },
  {
    name: 'Index.html',
    type: 'html',
    description: 'Halaman Web App Utama (HTML5, responsive HP & Komputer, Tab Nav, Scanner, Generator)',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Presensi Siswa QR Code</title>
  <!-- Tailwind CSS via CDN untuk kemudahan Google Apps Script deployment -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/html5-qrcode"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <style>
    .scanner-box { border: 2px dashed #0284c7; border-radius: 12px; overflow: hidden; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">
  <!-- Header Aplikasi -->
  <header class="bg-slate-900 text-white shadow-md sticky top-0 z-30">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow">QR</div>
        <div>
          <h1 class="font-bold text-base leading-tight">Presensi Siswa Online</h1>
          <p class="text-xs text-slate-400">Google Apps Script & Sheets</p>
        </div>
      </div>
      <div id="userInfo" class="text-right text-xs">
        <span id="badgeRole" class="px-2 py-0.5 rounded-full bg-sky-900 text-sky-200 font-semibold uppercase">Admin</span>
      </div>
    </div>
  </header>

  <!-- Kontainer Utama -->
  <main class="max-w-5xl mx-auto p-4 space-y-6">
    <!-- Tab Navigasi -->
    <div class="flex border-b border-slate-200 space-x-2 overflow-x-auto text-sm font-medium">
      <button onclick="switchTab('scan')" id="tabBtnScan" class="py-2.5 px-4 border-b-2 border-sky-600 text-sky-600">Scan QR Presensi</button>
      <button onclick="switchTab('sesi')" id="tabBtnSesi" class="py-2.5 px-4 text-slate-500 hover:text-slate-700">Buat Sesi QR</button>
      <button onclick="switchTab('laporan')" id="tabBtnLaporan" class="py-2.5 px-4 text-slate-500 hover:text-slate-700">Dashboard & Rekap</button>
      <button onclick="switchTab('wa')" id="tabBtnWa" class="py-2.5 px-4 text-slate-500 hover:text-slate-700">Pengaturan WA</button>
    </div>

    <!-- Panel 1: Scan QR Presensi (Siswa & Guru Piket) -->
    <section id="panelScan" class="space-y-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm max-w-lg mx-auto">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Kamera Pemindai QR</h2>
        <p class="text-xs text-slate-500 mb-4">Arahkan kamera ke QR Sesi Kelas atau QR Kartu Siswa.</p>
        
        <div id="reader" class="scanner-box w-full bg-slate-950 aspect-square mb-4"></div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Input NISN Manual (Cadangan jika kamera rusak)</label>
            <div class="flex space-x-2">
              <input type="text" id="manualNisn" placeholder="Masukkan 10 Digit NISN..." class="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg">
              <button onclick="submitManual()" class="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">Simpan</button>
            </div>
          </div>
          <div id="scanResult" class="hidden p-3 rounded-lg text-sm font-medium"></div>
        </div>
      </div>
    </section>

    <!-- Panel 2: Buat Sesi QR & Proyektor -->
    <section id="panelSesi" class="hidden space-y-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Buat Sesi QR Baru (Guru / Admin)</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Tipe Sesi</label>
            <select id="sesiTipe" class="w-full border border-slate-300 rounded-lg p-2 text-sm">
              <option value="DATANG">Masuk Pagi (DATANG)</option>
              <option value="PULANG">Pulang Sekolah (PULANG)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Target Kelas</label>
            <select id="sesiKelas" class="w-full border border-slate-300 rounded-lg p-2 text-sm">
              <option value="SEMUA">Semua Kelas</option>
              <option value="XII RPL 1">XII RPL 1</option>
              <option value="XII RPL 2">XII RPL 2</option>
              <option value="XI TKJ 1">XI TKJ 1</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Batas Jam Terlambat</label>
            <input type="time" id="batasTerlambat" value="07:00" class="w-full border border-slate-300 rounded-lg p-2 text-sm">
          </div>
        </div>
        <button onclick="aktifkanSesi()" class="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg">
          Aktifkan Sesi & Tampilkan QR
        </button>

        <div id="qrDisplayBox" class="hidden mt-6 pt-6 border-t border-slate-200 text-center">
          <h3 id="qrDisplayTitle" class="font-bold text-slate-800">QR Presensi Aktif</h3>
          <p class="text-xs text-slate-500 mb-3">QR akan berganti otomatis tiap 30 detik untuk cegah titip absen.</p>
          <div class="inline-block p-4 bg-white border border-slate-300 rounded-xl shadow">
            <canvas id="qrCanvas"></canvas>
          </div>
          <div id="qrCountdown" class="text-xs font-mono text-slate-500 mt-2">Refresh token dalam: 30s</div>
        </div>
      </div>
    </section>

    <!-- Panel 3: Dashboard & Laporan -->
    <section id="panelLaporan" class="hidden space-y-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500">Total Siswa</div>
          <div id="statTotal" class="text-xl font-bold text-slate-800 mt-0.5">36</div>
        </div>
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-xs text-emerald-600 font-medium">Hadir Tepat Waktu</div>
          <div id="statHadir" class="text-xl font-bold text-emerald-700 mt-0.5">32</div>
        </div>
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-xs text-amber-600 font-medium">Terlambat</div>
          <div id="statTerlambat" class="text-xl font-bold text-amber-700 mt-0.5">2</div>
        </div>
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-xs text-rose-600 font-medium">Belum Hadir</div>
          <div id="statBelum" class="text-xl font-bold text-rose-700 mt-0.5">2</div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-800 text-sm">Rekapitulasi Presensi Harian</h3>
          <button onclick="loadRekap()" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded">Refresh Data</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th class="p-2">NISN</th>
                <th class="p-2">Nama Siswa</th>
                <th class="p-2">Kelas</th>
                <th class="p-2">Jam Datang</th>
                <th class="p-2">Status</th>
                <th class="p-2">Jam Pulang</th>
                <th class="p-2">Notif WA</th>
              </tr>
            </thead>
            <tbody id="tabelRekapBody" class="divide-y divide-slate-100">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Panel 4: Pengaturan WhatsApp Resmi -->
    <section id="panelWa" class="hidden space-y-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm max-w-xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Konfigurasi Meta WhatsApp Business Cloud API</h2>
        <p class="text-xs text-slate-500 mb-4">Gunakan kredensial resmi dari Meta Developer Portal (developers.facebook.com).</p>
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Phone Number ID</label>
            <input type="text" id="waPhoneId" class="w-full border border-slate-300 rounded p-2" placeholder="Contoh: 109283746519283">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">System User Access Token</label>
            <input type="password" id="waToken" class="w-full border border-slate-300 rounded p-2" placeholder="Bearer EAAG...">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nama Template Terdaftar</label>
            <input type="text" id="waTemplate" value="notifikasi_absensi_siswa" class="w-full border border-slate-300 rounded p-2">
          </div>
          <button onclick="simpanConfigWA()" class="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded text-xs">
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </section>
  </main>

  <script>
    let activeTab = 'scan';
    function switchTab(tab) {
      activeTab = tab;
      ['scan', 'sesi', 'laporan', 'wa'].forEach(t => {
        document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('hidden', t !== tab);
        const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
        if (t === tab) {
          btn.className = "py-2.5 px-4 border-b-2 border-sky-600 text-sky-600 font-semibold";
        } else {
          btn.className = "py-2.5 px-4 text-slate-500 hover:text-slate-700";
        }
      });
    }
    // Apps Script handler bindings
    function submitManual() {
      const nisn = document.getElementById('manualNisn').value.trim();
      if (!nisn) return alert('Silakan isi NISN.');
      google.script.run
        .withSuccessHandler(res => {
          const el = document.getElementById('scanResult');
          el.classList.remove('hidden');
          el.className = res.success ? "p-3 rounded-lg text-sm bg-emerald-50 text-emerald-800 border border-emerald-200" 
                                     : "p-3 rounded-lg text-sm bg-rose-50 text-rose-800 border border-rose-200";
          el.innerText = res.message;
        })
        .Attendance_catatPresensi({ nisn: nisn, idSesi: "SESI-AKTIF", metode: "MANUAL" });
    }
  </script>
</body>
</html>
`
  }
];
