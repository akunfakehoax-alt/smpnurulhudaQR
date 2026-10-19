'use client';

import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  X, 
  Check, 
  Sparkles, 
  Sliders, 
  MessageSquare, 
  Music,
  Radio
} from 'lucide-react';
import { VoiceAnnouncementConfig } from '@/types/attendance';
import { DEFAULT_VOICE_CONFIG, speakAttendanceGreeting, playChimeSound } from '@/lib/voice-speech';

interface VoiceGreetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VoiceAnnouncementConfig;
  onSaveConfig: (newConfig: VoiceAnnouncementConfig) => void;
  schoolName?: string;
}

export const VoiceGreetingModal: React.FC<VoiceGreetingModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  schoolName = 'SMP Nurul Huda Jayapura'
}) => {
  const [formData, setFormData] = useState<VoiceAnnouncementConfig>(config);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testType, setTestType] = useState<'MASUK' | 'TERLAMBAT' | 'PULANG' | 'DUPLIKAT'>('MASUK');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestVoice = (type: 'MASUK' | 'TERLAMBAT' | 'PULANG' | 'DUPLIKAT') => {
    setIsPlayingTest(true);
    setTestType(type);

    speakAttendanceGreeting(
      {
        nama: 'Ahmad Faiz',
        tipe: type === 'PULANG' ? 'PULANG' : 'MASUK',
        waktu: type === 'TERLAMBAT' ? '07:25' : type === 'PULANG' ? '14:00' : '06:45',
        isTerlambat: type === 'TERLAMBAT',
        isDuplikat: type === 'DUPLIKAT',
        sekolah: schoolName
      },
      formData
    );

    setTimeout(() => {
      setIsPlayingTest(false);
    }, 3000);
  };

  const handleApplyPreset = (preset: 'ramah' | 'singkat' | 'formal') => {
    if (preset === 'ramah') {
      setFormData(prev => ({
        ...prev,
        rate: 1.0,
        pitch: 1.05,
        welcomeTemplate: 'Selamat pagi, {nama}! Presensi masuk berhasil dicatat pada {waktu}. Selamat belajar di {sekolah}!',
        pulangTemplate: 'Terima kasih, {nama}! Presensi pulang tercatat pukul {waktu}. Hati-hati di jalan dan salam untuk keluarga di rumah!',
        terlambatTemplate: 'Perhatian {nama}, presensi tercatat pukul {waktu}, status terlambat. Tetap semangat dan silakan melapor ke guru piket.',
        duplikatTemplate: 'Pemberitahuan, {nama} sudah melakukan presensi hari ini.'
      }));
    } else if (preset === 'singkat') {
      setFormData(prev => ({
        ...prev,
        rate: 1.1,
        pitch: 1.0,
        welcomeTemplate: '{nama}, masuk tercatat {waktu}. Selamat belajar.',
        pulangTemplate: '{nama}, pulang tercatat {waktu}. Hati-hati di jalan.',
        terlambatTemplate: '{nama}, tercatat terlambat pukul {waktu}.',
        duplikatTemplate: '{nama}, sudah presensi sebelumnya.'
      }));
    } else if (preset === 'formal') {
      setFormData(prev => ({
        ...prev,
        rate: 0.95,
        pitch: 0.95,
        welcomeTemplate: 'Presensi kehadiran berhasil. Selamat pagi Saudara {nama}, tercatat masuk {waktu} di {sekolah}.',
        pulangTemplate: 'Presensi kepulangan berhasil. Terima kasih Saudara {nama}, waktu pulang {waktu}.',
        terlambatTemplate: 'Perhatian kepada Saudara {nama}, kehadiran tercatat melewati batas waktu pada {waktu}.',
        duplikatTemplate: 'Data presensi Saudara {nama} sudah terdaftar pada tanggal hari ini.'
      }));
    }
  };

  const handleSave = () => {
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setFormData(DEFAULT_VOICE_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                Suara Audio Text-to-Speech (TTS)
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Web Audio + Speech API
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Sapaan otomatis ramah bahasa Indonesia saat siswa berhasil melakukan scan QR
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-slate-800">
          
          {/* Main Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-900">Aktifkan Suara Sapaan Suara saat Scan</span>
                {formData.enabled ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">AKTIF</span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">NONAKTIF</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Mengeluarkan nada melodi digital (chime) & membaca sapaan nama siswa secara otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                formData.enabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition duration-200 ${
                formData.enabled ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pilihan Gaya Bahasa & Intonasi
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('ramah')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition"
              >
                <div className="text-xs font-bold text-slate-900">Ramah & Hangat</div>
                <div className="text-[10px] text-slate-500">Cocok untuk sambutan pagi sekolah</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('singkat')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition"
              >
                <div className="text-xs font-bold text-slate-900">Cepat & Ringkas</div>
                <div className="text-[10px] text-slate-500">Untuk antrean presensi siswa yang ramai</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('formal')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition"
              >
                <div className="text-xs font-bold text-slate-900">Resmi / Formal</div>
                <div className="text-[10px] text-slate-500">Standar kedisiplinan dan tata tertib</div>
              </button>
            </div>
          </div>

          {/* Audio Controls Sliders */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              Pengaturan Pitch, Kecepatan, & Volume
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Speed / Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">Kecepatan Bicara</span>
                  <span className="text-emerald-700 font-mono">{formData.rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={formData.rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.8x Lambat</span>
                  <span>1.3x Cepat</span>
                </div>
              </div>

              {/* Pitch */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">Tinggi Nada (Pitch)</span>
                  <span className="text-emerald-700 font-mono">{formData.pitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={formData.pitch}
                  onChange={(e) => setFormData(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Berat</span>
                  <span>Tinggi</span>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">Volume Audio</span>
                  <span className="text-emerald-700 font-mono">{Math.round(formData.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={formData.volume}
                  onChange={(e) => setFormData(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Pelan</span>
                  <span>100% Keras</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Sound Live Trigger Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-emerald-600" />
                Uji Coba Suara Langsung (Live Audio Test)
              </span>
              {isPlayingTest && (
                <span className="text-[11px] font-mono text-emerald-600 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Memutar Suara...
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTestVoice('MASUK')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-medium text-xs transition"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-600" />
                <span>Test Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => handleTestVoice('TERLAMBAT')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 font-medium text-xs transition"
              >
                <Play className="w-3.5 h-3.5 fill-amber-600" />
                <span>Test Terlambat</span>
              </button>
              <button
                type="button"
                onClick={() => handleTestVoice('PULANG')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100 font-medium text-xs transition"
              >
                <Play className="w-3.5 h-3.5 fill-blue-600" />
                <span>Test Pulang</span>
              </button>
              <button
                type="button"
                onClick={() => playChimeSound('success')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 font-medium text-xs transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Chime Saja</span>
              </button>
            </div>
          </div>

          {/* Template Messages Customization */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Kustomisasi Kalimat Sapaan
              </span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                Gunakan variabel: {'{nama}'}, {'{waktu}'}, {'{sekolah}'}
              </span>
            </h4>

            {/* Template Masuk */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Sapaan Masuk (Tepat Waktu)
              </label>
              <input
                type="text"
                value={formData.welcomeTemplate}
                onChange={(e) => setFormData(prev => ({ ...prev, welcomeTemplate: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Template Terlambat */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pemberitahuan Masuk Terlambat
              </label>
              <input
                type="text"
                value={formData.terlambatTemplate}
                onChange={(e) => setFormData(prev => ({ ...prev, terlambatTemplate: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Template Pulang */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Sapaan Presensi Pulang
              </label>
              <input
                type="text"
                value={formData.pulangTemplate}
                onChange={(e) => setFormData(prev => ({ ...prev, pulangTemplate: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Template Duplikat */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Peringatan Scan Ganda (Sudah Absen)
              </label>
              <input
                type="text"
                value={formData.duplikatTemplate}
                onChange={(e) => setFormData(prev => ({ ...prev, duplikatTemplate: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium py-2 px-3 rounded-lg hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-700/20 transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Pengaturan</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
