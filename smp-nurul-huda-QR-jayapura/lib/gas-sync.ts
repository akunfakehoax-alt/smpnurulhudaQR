import { PresensiRecord, GasLiveSyncConfig } from '@/types/attendance';

export const DEFAULT_GAS_CONFIG: GasLiveSyncConfig = {
  webAppUrl: '',
  secretToken: 'NURULHUDA_PRESENSI_2026',
  autoSyncOnScan: true,
  lastSyncTime: null,
  lastSyncStatus: 'IDLE',
  lastErrorMessage: null,
  syncCount: 0
};

export interface GasPingResponse {
  success: boolean;
  message: string;
  latencyMs: number;
}

/**
 * Ping test to verify Google Apps Script Web App connectivity
 */
export async function testGasConnection(url: string, token?: string): Promise<GasPingResponse> {
  const startTime = Date.now();
  if (!url || !url.trim().startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'Format URL salah! Harus diawali dengan https://script.google.com/macros/s/.../exec',
      latencyMs: 0
    };
  }

  try {
    const targetUrl = new URL(url.trim());
    targetUrl.searchParams.set('action', 'ping');
    if (token) targetUrl.searchParams.set('token', token);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP Error ${response.status}: ${response.statusText}`,
        latencyMs: latency
      };
    }

    try {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Apps Script & Google Sheets Berhasil Aktif!',
        latencyMs: latency
      };
    } catch {
      return {
        success: true,
        message: 'Endpoint Google Apps Script merespons (Status OK).',
        latencyMs: latency
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Koneksi gagal. Pastikan deployment Web App di-set ke: Who has access: Anyone (Siapa Saja).',
      latencyMs: latency
    };
  }
}

/**
 * Synchronize a single attendance record to Google Sheets via GAS Web App
 */
export async function syncRecordToGas(
  record: PresensiRecord,
  config: GasLiveSyncConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.webAppUrl || !config.webAppUrl.trim().startsWith('https://script.google.com/')) {
    return {
      success: true,
      message: 'Mode Lokal: URL Web App belum diisi. Data tersimpan di memori browser.'
    };
  }

  try {
    const payload = {
      action: 'recordPresensi',
      token: config.secretToken,
      record: {
        id: record.id,
        tanggal: record.tanggal,
        waktu: record.waktu,
        nisn: record.nisn,
        namaSiswa: record.namaSiswa,
        kelas: record.kelas,
        tipe: record.tipe,
        status: record.status,
        metode: record.metode,
        petugas: record.petugas || 'Operator Sistem',
        catatan: record.catatan || ''
      }
    };

    // Google Apps Script CORS with no-cors or redirect handling
    await fetch(config.webAppUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: 'Data berhasil dikirim ke antrean Google Sheets.'
    };
  } catch (err) {
    return {
      success: false,
      message: `Gagal kirim ke GAS: ${err instanceof Error ? err.message : 'Koneksi terputus'}`
    };
  }
}

/**
 * Synchronize all local attendance records in bulk to Google Sheets
 */
export async function syncBatchRecordsToGas(
  records: PresensiRecord[],
  config: GasLiveSyncConfig
): Promise<{ success: boolean; count: number; message: string }> {
  if (!config.webAppUrl || !config.webAppUrl.trim().startsWith('https://script.google.com/')) {
    return {
      success: false,
      count: 0,
      message: 'URL Google Apps Script belum dikonfigurasi.'
    };
  }

  try {
    const payload = {
      action: 'batchSync',
      token: config.secretToken,
      records: records.map(r => ({
        id: r.id,
        tanggal: r.tanggal,
        waktu: r.waktu,
        nisn: r.nisn,
        namaSiswa: r.namaSiswa,
        kelas: r.kelas,
        tipe: r.tipe,
        status: r.status,
        metode: r.metode,
        petugas: r.petugas || 'Operator Sistem',
        catatan: r.catatan || ''
      }))
    };

    await fetch(config.webAppUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      count: records.length,
      message: `Berhasil mengirim ${records.length} data presensi ke Google Sheets.`
    };
  } catch (err) {
    return {
      success: false,
      count: 0,
      message: `Gagal sinkronisasi batch: ${err instanceof Error ? err.message : 'Koneksi terputus'}`
    };
  }
}
