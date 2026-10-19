'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Printer } from 'lucide-react';
import { PanduanLengkapSection } from '@/components/PanduanLengkapSection';
import { SchoolProfile, Role } from '@/types/attendance';

interface PanduanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: Role;
  schoolProfile?: SchoolProfile;
  onNavigateToTab?: (tab: 'scan' | 'sesi' | 'siswa' | 'laporan' | 'wa' | 'sheets' | 'portal' | 'jurnal') => void;
  onOpenVoiceModal?: () => void;
  onOpenGasModal?: () => void;
  onOpenSchoolSettings?: () => void;
}

export const PanduanModal: React.FC<PanduanModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'ADMIN',
  schoolProfile,
  onNavigateToTab,
  onOpenVoiceModal,
  onOpenGasModal,
  onOpenSchoolSettings
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Buku Panduan Lengkap Aplikasi Presensi
                </h3>
                <p className="text-[11px] text-slate-400">
                  {schoolProfile?.namaSekolah || 'SMP Nurul Huda Jayapura'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                title="Cetak panduan"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Cetak</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Tutup Panduan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <PanduanLengkapSection
              currentUserRole={currentUserRole}
              schoolProfile={schoolProfile}
              onNavigateToTab={(tab) => {
                onClose();
                onNavigateToTab?.(tab);
              }}
              onOpenVoiceModal={() => {
                onClose();
                onOpenVoiceModal?.();
              }}
              onOpenGasModal={() => {
                onClose();
                onOpenGasModal?.();
              }}
              onOpenSchoolSettings={() => {
                onClose();
                onOpenSchoolSettings?.();
              }}
            />
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span>Buku Panduan Presensi QR SMP Nurul Huda Jayapura</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold transition cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
