'use client';

import React from 'react';
import { SchoolProfile } from '@/types/attendance';
import { 
  School, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Award
} from 'lucide-react';

interface SchoolLogoProps {
  profile: SchoolProfile;
  className?: string;
  iconClassName?: string;
  showTitleFallback?: boolean;
}

/**
 * Lambang / Logo Resmi Sekolah SMP Nurul Huda Jayapura
 * Ditampilkan tanpa background box/kotak latar, beresolusi tinggi,
 * transparan, dan berukuran lebih besar & proporsional.
 */
export const SchoolEmblemSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Lambang Resmi SMP Nurul Huda Jayapura"
    >
      <defs>
        {/* Gradients for rich emblem depth */}
        <linearGradient id="emblemEmeraldGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="emblemGoldGrad" x1="30" y1="20" x2="90" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="emblemShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#047857" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Decorative Outer Laurel Wreath / Wings of Education */}
      <g filter="url(#emblemShadow)" opacity="0.95">
        {/* Left Laurel Leaves */}
        <path 
          d="M 28 85 C 16 68 18 42 32 26 C 30 34 32 44 38 52 C 34 44 36 34 42 28 C 42 36 46 44 52 48 C 46 42 46 32 50 25" 
          stroke="url(#emblemEmeraldGrad)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Right Laurel Leaves */}
        <path 
          d="M 92 85 C 104 68 102 42 88 26 C 90 34 88 44 82 52 C 86 44 84 34 78 28 C 78 36 74 44 68 48 C 74 42 74 32 70 25" 
          stroke="url(#emblemEmeraldGrad)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </g>

      {/* Central Academic Shield Contour (Transparent Background - Lines only) */}
      <path 
        d="M 60 14 C 74 14 88 18 90 32 C 90 62 76 86 60 102 C 44 86 30 62 30 32 C 32 18 46 14 60 14 Z" 
        stroke="url(#emblemEmeraldGrad)" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M 60 20 C 71 20 82 23 84 34 C 84 59 72 79 60 92 C 48 79 36 59 36 34 C 38 23 49 20 60 20 Z" 
        stroke="url(#emblemGoldGrad)" 
        strokeWidth="1.6" 
        strokeDasharray="2 3"
        strokeLinecap="round"
      />

      {/* Star of Excellence / Bintang Pendidikan Islam di Puncak */}
      <polygon 
        points="60,24 62.5,30 69,30 63.8,33.8 65.8,40 60,36.2 54.2,40 56.2,33.8 51,30 57.5,30" 
        fill="url(#emblemGoldGrad)" 
      />

      {/* School Dome / Kubah Ilmu Pengetahuan & Akhlak */}
      <path 
        d="M 52 46 C 52 40 60 36 60 36 C 60 36 68 40 68 46 L 68 48 L 52 48 Z" 
        fill="url(#emblemEmeraldGrad)" 
      />

      {/* Open Book of Knowledge / Kitab Suci & Sumber Ilmu (Di Tengah) */}
      <g transform="translate(0, 4)">
        {/* Left Book Page */}
        <path 
          d="M 60 58 C 53 54 44 54 38 56 L 38 74 C 44 72 53 72 60 76 Z" 
          fill="url(#emblemEmeraldGrad)" 
          stroke="#047857"
          strokeWidth="1.2"
          opacity="0.9"
        />
        {/* Right Book Page */}
        <path 
          d="M 60 58 C 67 54 76 54 82 56 L 82 74 C 76 72 67 72 60 76 Z" 
          fill="url(#emblemEmeraldGrad)" 
          stroke="#047857"
          strokeWidth="1.2"
          opacity="0.9"
        />
        {/* Page detail lines */}
        <path d="M 42 62 C 47 60 53 60 57 62" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        <path d="M 42 66 C 47 64 53 64 57 66" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        <path d="M 63 62 C 67 60 73 60 78 62" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        <path d="M 63 66 C 67 64 73 64 78 66" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        
        {/* Book Spine */}
        <line x1="60" y1="58" x2="60" y2="76" stroke="url(#emblemGoldGrad)" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Base Ribbon / Pita Motto Jayapura */}
      <path 
        d="M 34 88 Q 60 96 86 88 L 82 96 Q 60 102 38 96 Z" 
        fill="url(#emblemGoldGrad)" 
      />
      <circle cx="60" cy="94" r="2" fill="#047857" />
    </svg>
  );
};

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  profile,
  className = 'w-14 h-14 flex items-center justify-center bg-transparent shrink-0',
  iconClassName = 'w-12 h-12 text-emerald-600 dark:text-emerald-400'
}) => {
  // Jika URL gambar kustom diatur (PNG, JPG, SVG eksternal), tampilkan bersih tanpa background
  if (profile.logoUrl && profile.logoUrl.trim().length > 0) {
    return (
      <div className={`flex items-center justify-center bg-transparent shrink-0 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.logoUrl}
          alt={`Logo ${profile.namaSekolah}`}
          className="w-full h-full object-contain filter drop-shadow-sm select-none"
          onError={(e) => {
            // Fallback ke lambang SVG jika gambar gagal dimuat
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Preset lambang vektor tanpa background
  const preset = profile.logoPreset || 'school';

  return (
    <div className={`flex items-center justify-center bg-transparent shrink-0 ${className}`}>
      {preset === 'school' && (
        <SchoolEmblemSVG className={iconClassName} />
      )}
      {preset === 'graduation' && (
        <GraduationCap className={`${iconClassName} drop-shadow-sm`} />
      )}
      {preset === 'book' && (
        <BookOpen className={`${iconClassName} drop-shadow-sm`} />
      )}
      {preset === 'shield' && (
        <ShieldCheck className={`${iconClassName} drop-shadow-sm`} />
      )}
      {preset === 'award' && (
        <Award className={`${iconClassName} drop-shadow-sm`} />
      )}
      {!['graduation', 'book', 'shield', 'award', 'school'].includes(preset) && (
        <School className={`${iconClassName} drop-shadow-sm`} />
      )}
    </div>
  );
};
