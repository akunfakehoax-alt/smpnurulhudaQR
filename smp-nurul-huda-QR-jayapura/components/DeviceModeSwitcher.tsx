'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Share2, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Info, 
  Apple 
} from 'lucide-react';

function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getInstalledSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getInstalledServerSnapshot(): boolean {
  return false;
}

function getPlatformSnapshot(): 'android' | 'pc' | 'ios' {
  if (typeof window === 'undefined') return 'android';
  if (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) return 'ios';
  if (window.innerWidth >= 768) return 'pc';
  return 'android';
}

function getPlatformServerSnapshot(): 'android' | 'pc' | 'ios' {
  return 'android';
}

interface DeviceModeSwitcherProps {
  deviceMode: 'desktop' | 'mobile';
  onChangeDeviceMode: (mode: 'desktop' | 'mobile') => void;
  variant?: 'dark' | 'light';
  showInstallModal?: boolean;
  setShowInstallModal?: (show: boolean) => void;
}

export const DeviceModeSwitcher: React.FC<DeviceModeSwitcherProps> = ({
  deviceMode,
  onChangeDeviceMode,
  variant = 'dark',
  showInstallModal: externalShowModal,
  setShowInstallModal: externalSetShowModal
}) => {
  const [internalShowModal, setInternalShowModal] = useState(false);
  const showModal = externalShowModal !== undefined ? externalShowModal : internalShowModal;
  const setModal = externalSetShowModal || setInternalShowModal;

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<'android' | 'pc' | 'ios' | null>(null);

  const isInstalled = useSyncExternalStore(
    subscribeStandalone,
    getInstalledSnapshot,
    getInstalledServerSnapshot
  );

  const detectedPlatform = useSyncExternalStore(
    subscribeStandalone,
    getPlatformSnapshot,
    getPlatformServerSnapshot
  );

  const activePlatformTab = selectedPlatformTab ?? detectedPlatform;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setModal(true);
    }
  };

  const isDark = variant === 'dark';

  return (
    <>
      <div className={`shrink-0 flex items-center space-x-1 p-1 rounded-xl border text-xs select-none ${
        isDark 
          ? 'bg-slate-800/90 border-slate-700 text-slate-300' 
          : 'bg-slate-100/90 border-slate-200 text-slate-700'
      }`}>
        {/* Switch Desktop PC Mode */}
        <button
          type="button"
          onClick={() => onChangeDeviceMode('desktop')}
          className={`shrink-0 px-2 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
            deviceMode === 'desktop'
              ? isDark 
                ? 'bg-sky-600 text-white shadow-sm font-bold' 
                : 'bg-white text-slate-900 shadow-xs font-bold'
              : isDark 
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' 
                : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Tampilan Layar Penuh Desktop PC / Laptop"
        >
          <Monitor className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">PC / Desktop</span>
        </button>

        {/* Switch Mobile Phone Mode */}
        <button
          type="button"
          onClick={() => onChangeDeviceMode('mobile')}
          className={`shrink-0 px-2 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
            deviceMode === 'mobile'
              ? isDark 
                ? 'bg-emerald-600 text-white shadow-sm font-bold' 
                : 'bg-white text-emerald-800 shadow-xs font-bold'
              : isDark 
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' 
                : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Tampilan Responsif Smartphone Android"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">HP Android</span>
        </button>

        {/* Install PWA Button */}
        <button
          type="button"
          onClick={handleInstallClick}
          className="shrink-0 px-2 py-1.5 rounded-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center space-x-1 shadow-xs transition active:scale-95 cursor-pointer ml-0.5"
          title="Pasang aplikasi di PC Desktop atau HP Android (PWA)"
        >
          <Download className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
          <span className="whitespace-nowrap">Pasang</span>
        </button>
      </div>

      {/* Modal Petunjuk Instalasi PWA untuk PC, Android, & iOS */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center text-white shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    Pasang Aplikasi di PC & HP Android
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aplikasi Progressive Web App (PWA) resmi SMP Nurul Huda Jayapura
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedPlatformTab('android')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  activePlatformTab === 'android'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>HP Android</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatformTab('pc')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  activePlatformTab === 'pc'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Komputer</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatformTab('ios')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  activePlatformTab === 'ios'
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Platform Details */}
            {activePlatformTab === 'android' && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                  <span className="text-sm">Panduan Pasang di Smartphone Android</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-emerald-950 font-sans leading-relaxed">
                  <li>Buka website aplikasi ini melalui browser <strong>Google Chrome</strong> di HP Android.</li>
                  <li>Ketuk tombol titik tiga (<strong>⋮</strong>) di sudut kanan atas browser Chrome.</li>
                  <li>Pilih opsi <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> atau <strong>&quot;Instal Aplikasi&quot;</strong>.</li>
                  <li>Ikon aplikasi resmi SMP Nurul Huda Jayapura akan muncul di menu & beranda HP Anda!</li>
                </ol>
                <div className="p-2.5 bg-emerald-100/70 rounded-xl text-[11px] text-emerald-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Keuntungan PWA di Android:</span>
                  </div>
                  <p className="pl-5 text-emerald-800">
                    Akses kamera scanner cepat, validasi GPS radius sekolah akurat, kartu pelajar offline, dan tanpa download file APK berat dari luar.
                  </p>
                </div>
              </div>
            )}

            {activePlatformTab === 'pc' && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 space-y-3">
                <div className="flex items-center space-x-2 text-sky-900 font-bold">
                  <Monitor className="w-5 h-5 text-sky-700" />
                  <span className="text-sm">Panduan Pasang di PC Desktop / Laptop</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-sky-950 font-sans leading-relaxed">
                  <li>Buka aplikasi di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> pada Windows/macOS.</li>
                  <li>Perhatikan ikon <strong>Install 🖥️</strong> di ujung kanan address bar (kolom URL atas).</li>
                  <li>Klik tombol <strong>&quot;Instal Presensi QR&quot;</strong>.</li>
                  <li>Aplikasi kini berjalan di jendela mandiri tanpa address bar, cepat dibuka langsung dari taskbar Windows atau dock macOS.</li>
                </ol>
                <div className="p-2.5 bg-sky-100/70 rounded-xl text-[11px] text-sky-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>Keuntungan di Desktop:</span>
                  </div>
                  <p className="pl-5 text-sky-800">
                    Layar dashboard luas, ekspor rekapitulasi Excel & PDF instan, visualisasi grafik Recharts interaktif, dan barcode scanner webcam.
                  </p>
                </div>
              </div>
            )}

            {activePlatformTab === 'ios' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <Apple className="w-5 h-5 text-slate-800" />
                  <span className="text-sm">Panduan Pasang di iOS (Safari iPhone / iPad)</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-800 font-sans leading-relaxed">
                  <li>Buka website presensi di browser <strong>Safari</strong> pada iPhone atau iPad Anda.</li>
                  <li>Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas di bagian bawah).</li>
                  <li>Gulir ke bawah dan ketuk opsi <strong>&quot;Tambahkan ke Layar Utama&quot; (Add to Home Screen)</strong>.</li>
                  <li>Ketuk <strong>&quot;Tambah&quot;</strong> di pojok kanan atas. Aplikasi siap digunakan seperti aplikasi App Store!</li>
                </ol>
              </div>
            )}

            {/* Direct Trigger Button if native prompt is supported */}
            {deferredPrompt && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl flex items-center justify-between text-xs">
                <span>Perangkat Anda mendukung instalasi instan 1-klik:</span>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Instal Sekarang
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
