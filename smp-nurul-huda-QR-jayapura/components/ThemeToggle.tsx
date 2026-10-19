'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '@/lib/theme-context';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'compact';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'compact',
  showLabel = false
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isDark = resolvedTheme === 'dark';

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`px-3 py-1.5 rounded-xl border transition active:scale-95 flex items-center space-x-2 text-xs font-semibold shadow-sm ${
          isDark
            ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700'
            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
        } ${className}`}
        title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
        aria-label="Ubah Tema Tampilan"
      >
        <motion.div
          key={resolvedTheme}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </motion.div>
        {showLabel && (
          <span>{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
        )}
      </button>
    );
  }

  if (variant === 'dropdown') {
    const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
      { value: 'light', label: 'Terang', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
      { value: 'dark', label: 'Gelap', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
      { value: 'system', label: 'Sistem', icon: <Laptop className="w-3.5 h-3.5 text-slate-400" /> },
    ];

    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm ${
            isDark
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title="Atur Tema Tampilan (Terang / Gelap / Sistem)"
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className="hidden sm:inline">
            {theme === 'system' ? 'Tema: Otomatis' : theme === 'dark' ? 'Tema: Gelap' : 'Tema: Terang'}
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-36 py-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                Pilih Tema
              </div>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                    theme === opt.value
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  {theme === opt.value && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default: Compact icon toggle
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition active:scale-95 flex items-center justify-center shadow-sm relative group ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
      } ${className}`}
      title={isDark ? 'Mode Gelap Aktif: Klik untuk Mode Terang' : 'Mode Terang Aktif: Klik untuk Mode Gelap'}
      aria-label="Ubah Tema Gelap atau Terang"
    >
      <motion.div
        key={resolvedTheme}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-300" />
        )}
      </motion.div>
    </button>
  );
};
