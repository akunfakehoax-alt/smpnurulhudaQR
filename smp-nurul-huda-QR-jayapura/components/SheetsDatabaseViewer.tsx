'use client';

import React, { useState } from 'react';
import { User, Siswa, SesiQR, PresensiRecord, WhatsAppConfig } from '@/types/attendance';
import { 
  FileSpreadsheet, 
  Table, 
  Search, 
  RotateCcw, 
  Database,
  ExternalLink,
  Info
} from 'lucide-react';

interface SheetsDatabaseViewerProps {
  usersList: User[];
  siswaList: Siswa[];
  sesiList: SesiQR[];
  presensiList: PresensiRecord[];
  waConfig: WhatsAppConfig;
  onResetDatabase: () => void;
  onNavigateToDataSiswa?: () => void;
}

export const SheetsDatabaseViewer: React.FC<SheetsDatabaseViewerProps> = ({
  usersList,
  siswaList,
  sesiList,
  presensiList,
  waConfig,
  onResetDatabase,
  onNavigateToDataSiswa
}) => {
  const [activeSheet, setActiveSheet] = useState<'USERS' | 'SISWA' | 'SESI_QR' | 'PRESENSI' | 'PENGATURAN'>('PRESENSI');
  const [search, setSearch] = useState('');

  const filteredPresensi = presensiList.filter(row => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.id.toLowerCase().includes(q) ||
      row.namaSiswa.toLowerCase().includes(q) ||
      row.nisn.toLowerCase().includes(q) ||
      row.kelas.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q) ||
      row.tipe.toLowerCase().includes(q) ||
      (row.waResponse && row.waResponse.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Database Google Sheets (Live Mirror)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tampilan replika 5 sheet yang diinisialisasi otomatis oleh fungsi <code className="font-mono text-sky-700 bg-sky-50 px-1 py-0.5 rounded">setupDatabase()</code> di Google Apps Script.
          </p>
        </div>

        <button
          onClick={onResetDatabase}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 self-start sm:self-auto shadow-sm transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          <span>Reset ke Data Awal setupDatabase()</span>
        </button>
      </div>

      {/* Google Sheets Tab Bar */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex items-center space-x-1 overflow-x-auto text-xs font-semibold border border-slate-200">
        {(['PRESENSI', 'SISWA', 'SESI_QR', 'USERS', 'PENGATURAN'] as const).map((sheetName) => (
          <button
            key={sheetName}
            onClick={() => setActiveSheet(sheetName)}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 shrink-0 ${
              activeSheet === sheetName
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sheet: {sheetName}</span>
          </button>
        ))}
      </div>

      {/* Active Table Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search bar inside sheet */}
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filter baris di ${activeSheet}...`}
              className="w-full pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            {activeSheet === 'SISWA' && onNavigateToDataSiswa && (
              <button
                onClick={onNavigateToDataSiswa}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
              >
                <span>+ Kelola & Upload Template Siswa</span>
              </button>
            )}
            <span className="text-slate-400 text-[11px]">
              Diperbarui secara real-time saat scan QR berlangsung
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          {activeSheet === 'PRESENSI' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0B132B] text-white sticky top-0 font-mono text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 border-r border-slate-800">#</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">ID_PRESENSI</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">TANGGAL</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">WAKTU</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">NISN</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">NAMA_SISWA</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">KELAS</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">TIPE</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">STATUS</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">METODE</th>
                  <th className="py-3 px-3.5 border-r border-slate-800">STATUS_WA</th>
                  <th className="py-3 px-3.5">WA_RESPONSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredPresensi.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors font-mono text-[11px]">
                    <td className="py-3 px-3.5 text-sky-500 font-mono font-medium border-r border-slate-100">{idx + 1}</td>
                    <td className="py-3 px-3.5 text-slate-900 border-r border-slate-100 font-bold">{row.id}</td>
                    <td className="py-3 px-3.5 text-slate-700 border-r border-slate-100">{row.tanggal}</td>
                    <td className="py-3 px-3.5 text-slate-700 border-r border-slate-100">{row.waktu}</td>
                    <td className="py-3 px-3.5 text-slate-700 border-r border-slate-100">{row.nisn}</td>
                    <td className="py-3 px-3.5 text-slate-900 font-sans font-bold border-r border-slate-100">{row.namaSiswa}</td>
                    <td className="py-3 px-3.5 text-slate-700 border-r border-slate-100">{row.kelas}</td>
                    <td className="py-3 px-3.5 border-r border-slate-100 font-bold text-[#0284c7]">{row.tipe}</td>
                    <td className="py-3 px-3.5 border-r border-slate-100 font-sans">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'HADIR' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#b45309]'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 border-r border-slate-100">{row.metode}</td>
                    <td className="py-3 px-3.5 border-r border-slate-100 text-[#16a34a] font-bold tracking-tight">{row.waStatus}</td>
                    <td className="py-3 px-3.5 text-slate-500 font-mono truncate max-w-sm">{row.waResponse || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSheet === 'SISWA' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white sticky top-0 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5 border-r border-slate-800">#</th>
                  <th className="p-2.5 border-r border-slate-800">NISN</th>
                  <th className="p-2.5 border-r border-slate-800">NAMA</th>
                  <th className="p-2.5 border-r border-slate-800">KELAS</th>
                  <th className="p-2.5 border-r border-slate-800">JENIS_KELAMIN</th>
                  <th className="p-2.5 border-r border-slate-800">NO_HP_ORTU</th>
                  <th className="p-2.5 border-r border-slate-800">NAMA_ORTU</th>
                  <th className="p-2.5 border-r border-slate-800">ALAMAT</th>
                  <th className="p-2.5">QR_TOKEN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {siswaList.map((row, idx) => (
                  <tr key={row.nisn} className="hover:bg-slate-50 text-xs">
                    <td className="p-2 text-slate-400 font-mono border-r border-slate-100">{idx + 1}</td>
                    <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-100">{row.nisn}</td>
                    <td className="p-2 font-semibold text-slate-900 border-r border-slate-100">{row.nama}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.kelas}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.jenisKelamin}</td>
                    <td className="p-2 font-mono text-emerald-700 border-r border-slate-100">{row.noHpOrtu}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.namaOrtu}</td>
                    <td className="p-2 text-slate-600 border-r border-slate-100">{row.alamat || '-'}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-500">{row.qrBadgeToken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSheet === 'SESI_QR' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white sticky top-0 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5 border-r border-slate-800">ID_SESI</th>
                  <th className="p-2.5 border-r border-slate-800">KODE_SESI</th>
                  <th className="p-2.5 border-r border-slate-800">JUDUL</th>
                  <th className="p-2.5 border-r border-slate-800">TIPE</th>
                  <th className="p-2.5 border-r border-slate-800">KELAS</th>
                  <th className="p-2.5 border-r border-slate-800">TANGGAL</th>
                  <th className="p-2.5 border-r border-slate-800">JAM_MULAI</th>
                  <th className="p-2.5 border-r border-slate-800">BATAS_TERLAMBAT</th>
                  <th className="p-2.5 border-r border-slate-800">TOKEN_AKTIF</th>
                  <th className="p-2.5">STATUS_AKTIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {sesiList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="p-2 text-slate-900 font-bold border-r border-slate-100">{row.id}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.kodeSesi}</td>
                    <td className="p-2 font-sans font-semibold text-slate-800 border-r border-slate-100">{row.judul}</td>
                    <td className="p-2 text-sky-700 font-bold border-r border-slate-100">{row.tipe}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.kelas}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.tanggal}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.jamMulai}</td>
                    <td className="p-2 text-rose-600 font-bold border-r border-slate-100">{row.batasTerlambat}</td>
                    <td className="p-2 text-slate-500 truncate max-w-[120px] border-r border-slate-100">{row.tokenQR}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold ${
                        row.aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.aktif ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSheet === 'USERS' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white sticky top-0 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5 border-r border-slate-800">ID_USER</th>
                  <th className="p-2.5 border-r border-slate-800">USERNAME</th>
                  <th className="p-2.5 border-r border-slate-800">NAMA</th>
                  <th className="p-2.5 border-r border-slate-800">ROLE</th>
                  <th className="p-2.5 border-r border-slate-800">KELAS</th>
                  <th className="p-2.5 border-r border-slate-800">NO_HP</th>
                  <th className="p-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {usersList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 text-xs">
                    <td className="p-2 font-mono text-slate-800 border-r border-slate-100">{row.id}</td>
                    <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-100">{row.username}</td>
                    <td className="p-2 font-semibold text-slate-900 border-r border-slate-100">{row.nama}</td>
                    <td className="p-2 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.role === 'ADMIN' ? 'bg-rose-100 text-rose-800' : row.role === 'GURU' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="p-2 text-slate-700 border-r border-slate-100">{row.kelas || '-'}</td>
                    <td className="p-2 font-mono text-slate-600 border-r border-slate-100">{row.noHp}</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSheet === 'PENGATURAN' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white sticky top-0 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5 border-r border-slate-800">KUNCI</th>
                  <th className="p-2.5 border-r border-slate-800">NILAI</th>
                  <th className="p-2.5">DESKRIPSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                <tr>
                  <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-100">WA_PROVIDER</td>
                  <td className="p-2 font-mono text-emerald-700 border-r border-slate-100">{waConfig.provider}</td>
                  <td className="p-2 text-slate-600">Provider resmi pengiriman pesan WhatsApp</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-100">META_PHONE_NUMBER_ID</td>
                  <td className="p-2 font-mono text-slate-800 border-r border-slate-100">{waConfig.phoneNumberId}</td>
                  <td className="p-2 text-slate-600">ID Nomor WhatsApp Business di Meta Graph API</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-100">META_TEMPLATE_NAME</td>
                  <td className="p-2 font-mono text-slate-800 border-r border-slate-100">{waConfig.templateName}</td>
                  <td className="p-2 text-slate-600">Template WhatsApp terverifikasi bahasa Indonesia</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-100">QR_DYNAMIC_REFRESH_SEC</td>
                  <td className="p-2 font-mono text-slate-800 border-r border-slate-100">30</td>
                  <td className="p-2 text-slate-600">Interval pergantian token QR untuk anti-screenshot</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-100">TOLERANSI_TERLAMBAT_MENIT</td>
                  <td className="p-2 font-mono text-slate-800 border-r border-slate-100">15</td>
                  <td className="p-2 text-slate-600">Toleransi waktu kedatangan sebelum ditandai Terlambat</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
