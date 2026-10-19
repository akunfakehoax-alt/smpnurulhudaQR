'use client';

import React, { useState } from 'react';
import { GAS_FILES, GASFile } from '@/lib/gas-code';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const GasCodeViewer: React.FC = () => {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const currentFile = GAS_FILES[activeFileIndex];

  const handleCopyFile = (file: GASFile) => {
    navigator.clipboard.writeText(file.code);
    setCopiedFile(file.name);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleCopyAll = () => {
    const combined = GAS_FILES.map(f => `// ==================== FILE: ${f.name} ====================\n${f.code}`).join('\n\n');
    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadFile = (file: GASFile) => {
    const element = document.createElement('a');
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(blob);
    element.download = file.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileCode2 className="w-5 h-5 text-amber-500" />
            <span>Source Code Google Apps Script (Production Ready)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kumpulan file skrip lengkap, terhubung, dan siap diuji langsung di Google Sheets &gt; Ekstensi &gt; Apps Script.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyAll}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 flex items-center space-x-1.5 shadow-sm transition"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Semua Skrip Tersalin!' : 'Salin Semua File Script'}</span>
          </button>
        </div>
      </div>

      {/* 3-Step Setup Quick Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 border border-slate-700 text-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Panduan Deploy 3 Langkah ke Google Sheets & Apps Script:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-1">
            <span className="text-amber-400 font-bold">1. Buka Spreadsheet Baru</span>
            <p className="text-[11px] text-slate-400">
              Buat Google Sheets di Google Drive. Klik menu <strong>Ekstensi &gt; Apps Script</strong> untuk membuka editor.
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-1">
            <span className="text-amber-400 font-bold">2. Paste File & Jalankan Setup</span>
            <p className="text-[11px] text-slate-400">
              Buat file .gs dan .html sesuai tab di bawah. Pilih fungsi <code className="text-sky-300 font-mono">setupDatabase()</code> lalu klik <strong>Jalankan (Run)</strong> untuk inisialisasi 5 sheet.
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-1">
            <span className="text-amber-400 font-bold">3. Deploy sebagai Web App</span>
            <p className="text-[11px] text-slate-400">
              Klik <strong>Deploy &gt; New deployment</strong>. Pilih tipe <strong>Web app</strong>, Execute as: <em>Me</em>, Who has access: <em>Anyone</em>. Salin URL Web App untuk siswa & guru!
            </p>
          </div>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-semibold">
        {GAS_FILES.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => setActiveFileIndex(idx)}
            className={`px-3 py-2 rounded-xl transition flex items-center space-x-2 shrink-0 ${
              activeFileIndex === idx
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCode2 className={`w-3.5 h-3.5 ${file.type === 'html' ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>{file.name}</span>
          </button>
        ))}
      </div>

      {/* Active Code Viewer */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Editor Toolbar */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="font-mono text-xs font-semibold text-slate-300 ml-2">
              {currentFile.name}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              — {currentFile.description}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadFile(currentFile)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Download file ini"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCopyFile(currentFile)}
              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              {copiedFile === currentFile.name ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin File</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code pre block */}
        <div className="p-4 overflow-x-auto max-h-[540px]">
          <pre className="font-mono text-xs text-slate-200 leading-relaxed">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
