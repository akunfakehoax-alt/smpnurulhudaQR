import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="text-center max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-6xl font-black text-emerald-600 mb-4">404</h1>
        <h2 className="text-xl font-bold mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
