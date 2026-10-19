import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Presensi QR SMP Nurul Huda Jayapura',
    short_name: 'Presensi QR',
    description: 'Aplikasi Presensi Digital QR Code, Kartu Pelajar, Geofencing GPS, dan Notifikasi WhatsApp Resmi SMP Nurul Huda Jayapura',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Scan Mandiri HP',
        short_name: 'Scan HP',
        description: 'Buka scanner presensi mandiri dengan kamera HP',
        url: '/?tab=portal&subtab=mandiri',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Kartu Pelajar',
        short_name: 'Kartu',
        description: 'Tampilkan kartu pelajar digital dengan barcode QR',
        url: '/?tab=portal&subtab=kartu',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      }
    ]
  };
}
