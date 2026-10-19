import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ThemeProvider } from '@/lib/theme-context';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  title: 'PRESENSI QR CODE SMP NURUL HUDA JAYAPURA',
  description: 'Sistem Presensi Siswa Digital Berbasis QR Code SMP Nurul Huda Jayapura terintegrasi Google Apps Script, Google Sheets, dan Notifikasi WhatsApp Resmi.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Presensi QR'
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  },
  openGraph: {
    title: 'PRESENSI QR CODE SMP NURUL HUDA JAYAPURA',
    description: 'Sistem Presensi Siswa Digital Berbasis QR Code SMP Nurul Huda Jayapura terintegrasi Google Apps Script, Google Sheets, dan Notifikasi WhatsApp Resmi.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRESENSI QR CODE SMP NURUL HUDA JAYAPURA',
    description: 'Sistem Presensi Siswa Digital Berbasis QR Code SMP Nurul Huda Jayapura terintegrasi Google Apps Script, Google Sheets, dan Notifikasi WhatsApp Resmi.'
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('presensi_theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          {children}
          <OfflineIndicator />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Handle and recover automatically from transient Webpack chunk load timeouts
              window.addEventListener('error', function(e) {
                if (e && e.message && e.message.includes('ChunkLoadError')) {
                  console.warn('ChunkLoadError detected during reload, refreshing view...');
                  var hasReloaded = sessionStorage.getItem('chunk_retry');
                  if (!hasReloaded) {
                    sessionStorage.setItem('chunk_retry', 'true');
                    window.location.reload();
                  } else {
                    sessionStorage.removeItem('chunk_retry');
                  }
                }
              });

              // Clean up service workers in development & preview environment to avoid stale chunk cache
              if ('serviceWorker' in navigator) {
                var isPreviewOrDev = window.location.hostname.includes('run.app') ||
                                    window.location.hostname.includes('localhost') ||
                                    window.location.hostname.includes('127.0.0.1');
                if (isPreviewOrDev) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var i = 0; i < registrations.length; i++) {
                      registrations[i].unregister();
                    }
                  }).catch(function() {});
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      for (var j = 0; j < keys.length; j++) {
                        caches.delete(keys[j]);
                      }
                    }).catch(function() {});
                  }
                }
              }
            `
          }}
        />
      </body>
    </html>
  );
}

