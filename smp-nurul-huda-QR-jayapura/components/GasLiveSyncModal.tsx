'use client';

import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Wifi, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  Radio, 
  FileSpreadsheet,
  Zap,
  ArrowRight
} from 'lucide-react';
import { GasLiveSyncConfig, PresensiRecord } from '@/types/attendance';
import { testGasConnection, syncBatchRecordsToGas } from '@/lib/gas-sync';
import { GAS_FILES } from '@/lib/gas-code';

interface GasLiveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasLiveSyncConfig;
  onUpdateConfig: (newConfig: GasLiveSyncConfig) => void;
  presensiList: PresensiRecord[];
}

export const GasLiveSyncModal: React.FC<GasLiveSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  presensiList
}) => {
  const [urlInput, setUrlInput] = useState<string>(config.webAppUrl);
  const [tokenInput, setTokenInput] = useState<string>(config.secretToken);
  const [autoSync, setAutoSync] = useState<boolean>(config.autoSyncOnScan);
  
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  
  const [isSyncingBatch, setIsSyncingBatch] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showDeploymentGuide, setShowDeploymentGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testGasConnection(urlInput, tokenInput);
      setTestResult(result);
      if (result.success) {
        onUpdateConfig({
          ...config,
          webAppUrl: urlInput,
          secretToken: tokenInput,
          autoSyncOnScan: autoSync,
          lastSyncStatus: 'SUCCESS',
          lastSyncTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleBatchSync = async () => {
    if (!urlInput) {
      alert('Masukkan URL Web App Google Apps Script terlebih dahulu!');
      return;
    }
    setIsSyncingBatch(true);
    setBatchResult(null);
    try {
      const updatedConf: GasLiveSyncConfig = {
        ...config,
        webAppUrl: urlInput,
        secretToken: tokenInput,
        autoSyncOnScan: autoSync
      };
      const res = await syncBatchRecordsToGas(presensiList, updatedConf);
      setBatchResult(res);
      if (res.success) {
        onUpdateConfig({
          ...updatedConf,
          lastSyncStatus: 'SUCCESS',
          lastSyncTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          syncCount: (config.syncCount || 0) + res.count
        });
      }
    } finally {
      setIsSyncingBatch(false);
    }
  };

  const handleSaveConfig = () => {
    onUpdateConfig({
      ...config,
      webAppUrl: urlInput.trim(),
      secretToken: tokenInput.trim(),
      autoSyncOnScan: autoSync
    });
    onClose();
  };

  const handleCopyGasCode = () => {
    // Copy the primary single-file complete script
    const primaryCode = GAS_FILES[0]?.code || '';
    navigator.clipboard.writeText(primaryCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                Koneksi Google Apps Script ke Google Sheets Asli
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live Webhook
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Sinkronisasi data presensi QR secara instan ke Spreadsheet Google Drive sekolah
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-slate-800">

          {/* Current Status Pill */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                config.lastSyncStatus === 'SUCCESS' ? 'bg-emerald-500 animate-pulse' :
                config.lastSyncStatus === 'ERROR' ? 'bg-rose-500' : 'bg-slate-300'
              }`} />
              <div>
                <span className="font-bold text-slate-800">Status Koneksi: </span>
                <span className={
                  config.lastSyncStatus === 'SUCCESS' ? 'text-emerald-700 font-bold' :
                  config.lastSyncStatus === 'ERROR' ? 'text-rose-600 font-bold' : 'text-slate-500'
                }>
                  {config.lastSyncStatus === 'SUCCESS' ? 'Terhubung ke Google Sheets' :
                   config.lastSyncStatus === 'ERROR' ? 'Gagal Terhubung' : 'Belum Terhubung'}
                </span>
              </div>
            </div>
            {config.lastSyncTime && (
              <div className="text-[11px] text-slate-500 font-mono">
                Terakhir: {config.lastSyncTime}
              </div>
            )}
          </div>

          {/* Web App URL Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                URL Web App Google Apps Script
              </label>
              <button
                type="button"
                onClick={() => setShowDeploymentGuide(!showDeploymentGuide)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1"
              >
                <span>{showDeploymentGuide ? 'Tutup Panduan' : 'Cara Dapatkan URL Web App?'}</span>
              </button>
            </div>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <p className="text-[11px] text-slate-500">
              Dihasilkan setelah Anda menekan tombol <strong>Deploy &gt; New deployment &gt; Web app</strong> di Google Sheets.
            </p>
          </div>

          {/* Secret Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              Token Rahasia (Secret Verification Token)
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="NURULHUDA_PRESENSI_2026"
              className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <p className="text-[11px] text-slate-500">
              Harus cocok dengan konstanta <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">SECRET_TOKEN</code> di file Apps Script Anda.
            </p>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-900 block">Kirim Otomatis Setiap Siswa Scan QR (Real-time Push)</span>
              <p className="text-[11px] text-slate-500">
                Setiap kali kamera scanner mendeteksi kartu siswa, baris baru langsung dibuat di Google Sheets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoSync(!autoSync)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                autoSync ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition duration-200 ${
                autoSync ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Action Buttons: Test Connection & Batch Sync */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              disabled={isTesting || !urlInput}
              onClick={handleTestConnection}
              className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Ping ke GAS'}</span>
            </button>

            <button
              type="button"
              disabled={isSyncingBatch || !urlInput}
              onClick={handleBatchSync}
              className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSyncingBatch ? 'Sedang Mengirim...' : `Kirim Semua (${presensiList.length}) Data Lokal`}</span>
            </button>
          </div>

          {/* Test Result Alert */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 animate-in fade-in ${
              testResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</span>
                  {testResult.latencyMs > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/60">
                      {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Batch Result Alert */}
          {batchResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 animate-in fade-in ${
              batchResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {batchResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-[11px]">
                <span className="font-bold">{batchResult.success ? 'Sinkronisasi Berhasil: ' : 'Gagal: '}</span>
                <span>{batchResult.message}</span>
              </div>
            </div>
          )}

          {/* Interactive Step-by-Step Deployment Guide */}
          {showDeploymentGuide && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-4 animate-in fade-in duration-200 text-xs border border-slate-700 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Panduan 5 Langkah Menghubungkan Google Sheets & GAS</span>
                </span>
                <div className="flex items-center space-x-2">
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                    <span>Buka sheets.new</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyGasCode}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm transition"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin Skrip Siap Pakai'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-slate-300 text-xs leading-relaxed">
                <div className="flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-white block font-semibold">Buat Spreadsheet Baru di Google Sheets</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Buka spreadsheet baru di Google Drive (atau ketik <code className="text-emerald-300 font-mono">sheets.new</code> di tab baru browser). Beri nama spreadsheet misalnya: <strong>Database Presensi SMP Nurul Huda Jayapura</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-white block font-semibold">Buka Apps Script & Tempelkan Kode</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Di Google Sheets, klik menu <strong>Ekstensi (Extensions) &gt; Apps Script</strong>. Hapus isi berkas <code className="text-sky-300 font-mono">Code.gs</code> bawaan, lalu <strong>Paste</strong> seluruh kode yang disalin (tombol hijau di atas). Simpan berkas (ikon Disket).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-white block font-semibold">Jalankan Fungsi &quot;setupDatabase&quot; (Otorisasi Akun Google)</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pada bar atas Apps Script, pilih fungsi <code className="text-amber-300 font-mono font-bold">setupDatabase</code> di dropdown, lalu klik <strong>Jalankan (Run)</strong>.
                    </p>
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
                      <strong>Cara Melewati Layar Otorisasi Google:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-0.5 pl-1">
                        <li>Klik <strong>Tinjau Izin (Review permissions)</strong> &amp; pilih akun Google Anda.</li>
                        <li>Jika muncul peringatan <em>&quot;Google belum memverifikasi aplikasi ini&quot;</em>, klik tulisan kecil <strong>Lanjutan (Advanced)</strong> di kiri bawah.</li>
                        <li>Klik <strong>Buka Presensi QR (tidak aman)</strong> lalu klik <strong>Izinkan (Allow)</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                  <div>
                    <strong className="text-white block font-semibold">Deploy Sebagai Web App (Penerapan Baru)</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol biru <strong>Deploy &gt; New deployment (Penerapan baru)</strong>:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-[11px] text-slate-300">
                      <li>Pilih jenis: <strong>Web app</strong> (ikon roda gigi).</li>
                      <li><strong>Execute as:</strong> <em>Me (email Anda)</em></li>
                      <li><strong className="text-emerald-400">Who has access:</strong> <span className="underline decoration-emerald-400 font-bold text-white">Anyone (Siapa saja)</span> &mdash; <em>Wajib Anyone agar scanner HP / tablet dapat mengirimkan data tanpa login ulang!</em></li>
                    </ul>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Klik <strong>Deploy</strong>, lalu salin <strong>Web App URL</strong> yang berakhiran <code className="text-purple-300 font-mono font-bold">/exec</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</span>
                  <div>
                    <strong className="text-white block font-semibold">Tempelkan URL &amp; Klik Uji Koneksi</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tempelkan URL Web App pada input di atas, lalu klik tombol <strong>Uji Koneksi Ping ke GAS</strong>. Indikator hijau menandakan integrasi telah aktif 100%!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyGasCode}
            className="flex items-center space-x-1 text-xs text-emerald-800 hover:text-emerald-950 font-semibold"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Kode GAS Tersalin!' : 'Salin Source Code GAS'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
