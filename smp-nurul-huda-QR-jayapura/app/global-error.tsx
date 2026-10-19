'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error caught:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 font-sans min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Presensi QR SMP Nurul Huda</h2>
          <p className="text-sm text-slate-600 mb-6">
            Aplikasi sedang memuat ulang modul komponen. Silakan tekan tombol di bawah ini.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-lg cursor-pointer"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      </body>
    </html>
  );
}
