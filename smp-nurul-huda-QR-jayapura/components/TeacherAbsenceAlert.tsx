'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  FileEdit,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  Bell,
  BellOff,
  Printer
} from 'lucide-react';
import { Siswa, StatusPresensi, SchoolProfile } from '@/types/attendance';
import { 
  ConsecutiveAbsentAlert, 
  generateFollowUpWaMessage, 
  generateWaChatUrl 
} from '@/lib/absence-detection';
import { SuratPanggilanModal } from './SuratPanggilanModal';

interface TeacherAbsenceAlertProps {
  alerts: ConsecutiveAbsentAlert[];
  teacherName?: string;
  schoolProfile?: SchoolProfile;
  onManualMark?: (nisn: string, status: StatusPresensi, tipe: 'DATANG' | 'PULANG', catatan: string) => void;
  onNavigateToRekap?: (nisn?: string) => void;
  isEnabled?: boolean;
  onToggleEnabled?: () => void;
}

export const TeacherAbsenceAlert: React.FC<TeacherAbsenceAlertProps> = ({
  alerts,
  teacherName = 'Dra. Sri Wahyuni, M.Pd.',
  schoolProfile,
  onManualMark,
  onNavigateToRekap,
  isEnabled = true,
  onToggleEnabled
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [copiedNisn, setCopiedNisn] = useState<string | null>(null);
  const [selectedSuratAlert, setSelectedSuratAlert] = useState<ConsecutiveAbsentAlert | null>(null);
  
  // Quick resolution modal state
  const [activeResolveSiswa, setActiveResolveSiswa] = useState<Siswa | null>(null);
  const [resolveStatus, setResolveStatus] = useState<StatusPresensi>('SAKIT');
  const [resolveCatatan, setResolveCatatan] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // If feature is toggled OFF by user
  if (!isEnabled) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <BellOff className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">
                Fitur Notifikasi & Peringatan Siswa (3 Hari Alpa):
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                NONAKTIF (OFF)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Peringatan dini otomatis ketidakhadiran siswa berturut-turut sedang dinonaktifkan sementara.
            </p>
          </div>
        </div>

        {onToggleEnabled && (
          <button
            type="button"
            onClick={onToggleEnabled}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95 shrink-0"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Aktifkan Fitur Peringatan (ON)</span>
          </button>
        )}
      </div>
    );
  }

  if (alerts.length === 0 || isDismissed) {
    return null;
  }

  const handleCopyMessage = (alert: ConsecutiveAbsentAlert) => {
    const msg = generateFollowUpWaMessage(alert, teacherName, schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura');
    navigator.clipboard.writeText(msg);
    setCopiedNisn(alert.siswa.nisn);
    setToastMessage(`Pesan WhatsApp untuk wali murid ${alert.siswa.nama} berhasil disalin.`);
    setTimeout(() => {
      setCopiedNisn(null);
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenWa = (alert: ConsecutiveAbsentAlert) => {
    const msg = generateFollowUpWaMessage(alert, teacherName, schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura');
    const url = generateWaChatUrl(alert.siswa.noHpOrtu, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolveSiswa || !onManualMark) return;

    onManualMark(
      activeResolveSiswa.nisn,
      resolveStatus,
      'DATANG',
      resolveCatatan || `Tindak lanjut guru: Wali murid terkonfirmasi (${resolveStatus})`
    );

    setToastMessage(`Keterangan ${resolveStatus} untuk ananda ${activeResolveSiswa.nama} berhasil disimpan ke basis data presensi.`);
    setActiveResolveSiswa(null);
    setResolveCatatan('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Alert Card with Warm Gradient Border & Motion Transition */}
      <motion.div 
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-white p-4 sm:p-5 shadow-sm overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-sm flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Alert Guru: 3 Hari Berturut-turut Tidak Hadir</span>
                </span>
                <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                  {alerts.length} Siswa Terdeteksi
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                Peringatan Dini Presensi Guru: Tindak Lanjut Siswa Tanpa Keterangan
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Ditemukan siswa yang tidak melakukan absensi selama 3 hari sekolah berturut-turut. Segera hubungi wali murid untuk konfirmasi alasan ketidakhadiran.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {onToggleEnabled && (
              <button
                type="button"
                onClick={onToggleEnabled}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                title="Klik untuk menonaktifkan fitur peringatan siswa (OFF)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Fitur: <strong className="text-emerald-900">ON</strong></span>
                <span className="text-[10px] text-emerald-700 font-normal hidden sm:inline">(Matikan)</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
            >
              <span>{isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-rose-100 rounded-lg transition"
              title="Tutup banner peringatan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Content Panel with Framer Motion */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {alerts.map((item) => (
                  <div 
                    key={item.siswa.nisn}
                    className="bg-white rounded-xl border border-rose-200/90 p-4 shadow-sm hover:shadow transition-shadow flex flex-col justify-between space-y-3"
                  >
                    {/* Student Info Top */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                            {item.siswa.nama.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">
                              {item.siswa.nama}
                            </h4>
                            <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center space-x-2">
                              <span className="font-semibold text-slate-700">{item.siswa.kelas}</span>
                              <span>•</span>
                              <span>NISN: {item.siswa.nisn}</span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                          {item.consecutiveDays} Hari Alpa
                        </span>
                      </div>

                      {/* Parent details */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500">Wali Murid:</span>
                          <span className="font-bold">{item.siswa.namaOrtu}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700 font-mono text-[11px]">
                          <span className="text-slate-500 font-sans">No. WhatsApp:</span>
                          <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{item.siswa.noHpOrtu}</span>
                          </span>
                        </div>
                      </div>

                      {/* Missed Dates */}
                      <div className="mt-2.5">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Tanggal Tidak Hadir Berturut-turut:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.missedDates.map((d) => (
                            <span 
                              key={d.date}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-medium flex items-center space-x-1"
                            >
                              <Calendar className="w-2.5 h-2.5 text-rose-500" />
                              <span>{d.dayLabel}, {d.formattedDate}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleOpenWa(item)}
                        className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition"
                        title="Kirim pesan peringatan resmi langsung ke WhatsApp Wali Murid"
                      >
                        <Send className="w-3 h-3" />
                        <span>Chat WA Ortu</span>
                      </button>

                      <button
                        onClick={() => handleCopyMessage(item)}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition active:scale-95"
                        title="Salin draf pesan WhatsApp ke clipboard"
                      >
                        {copiedNisn === item.siswa.nisn ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Salin Draf</span>
                          </>
                        )}
                      </button>

                      {onManualMark && (
                        <button
                          onClick={() => {
                            setActiveResolveSiswa(item.siswa);
                            setResolveStatus('SAKIT');
                            setResolveCatatan('');
                          }}
                          className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95"
                          title="Tandai keterangan siswa (Sakit / Izin) bila sudah konfirmasi"
                        >
                          <FileEdit className="w-3 h-3 text-amber-600" />
                          <span>Catat Keterangan</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedSuratAlert(item)}
                        className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition active:scale-95 shadow-sm"
                        title="Cetak Surat Panggilan Orang Tua Resmi (Format BK/TU)"
                      >
                        <Printer className="w-3 h-3 text-rose-600" />
                        <span>Cetak Surat BK</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer info & CTA */}
              <div className="bg-white/80 rounded-xl p-3 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>
                    Protokol Sekolah: Siswa yang tidak hadir 3 hari tanpa surat dokter/keterangan resmi wajib dilaporkan ke Guru BK & Wali Kelas.
                  </span>
                </div>
                {onNavigateToRekap && (
                  <button
                    onClick={() => onNavigateToRekap()}
                    className="text-rose-700 hover:text-rose-900 font-bold underline flex items-center space-x-1 shrink-0 self-start sm:self-auto"
                  >
                    <span>Buka Log Rekap Presensi Lengkap</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MODAL: CATAT KETERANGAN KHUSUS TINDAK LANJUT */}
      <AnimatePresence>
        {activeResolveSiswa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-slate-900">
                  <FileEdit className="w-5 h-5 text-sky-600" />
                  <h4 className="font-bold text-base">Tindak Lanjut Presensi Siswa</h4>
                </div>
                <button 
                  onClick={() => setActiveResolveSiswa(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveResolve} className="mt-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{activeResolveSiswa.nama}</div>
                  <div className="text-slate-500 font-mono">NISN: {activeResolveSiswa.nisn} • {activeResolveSiswa.kelas}</div>
                  <div className="text-slate-600 pt-1">Wali Murid: <strong>{activeResolveSiswa.namaOrtu}</strong> ({activeResolveSiswa.noHpOrtu})</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ubah Status Presensi Hari Ini:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setResolveStatus('SAKIT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        resolveStatus === 'SAKIT'
                          ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-sm ring-1 ring-purple-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>🏥 Sakit (Ada Surat)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolveStatus('IZIN')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        resolveStatus === 'IZIN'
                          ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>📝 Izin Resmi</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Guru / Keterangan Konfirmasi:
                  </label>
                  <textarea
                    rows={3}
                    value={resolveCatatan}
                    onChange={(e) => setResolveCatatan(e.target.value)}
                    placeholder="Contoh: Sudah ditelepon wali murid, ananda sedang dirawat karena tifus selama 3 hari."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveResolveSiswa(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                  >
                    Simpan Tindak Lanjut
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SURAT PANGGILAN ORANG TUA RESMI BK */}
      <AnimatePresence>
        {selectedSuratAlert && (
          <SuratPanggilanModal
            alert={selectedSuratAlert}
            schoolProfile={schoolProfile}
            onClose={() => setSelectedSuratAlert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
