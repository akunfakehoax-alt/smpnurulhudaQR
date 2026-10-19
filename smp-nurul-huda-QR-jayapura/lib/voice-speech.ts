'use client';

import { VoiceAnnouncementConfig } from '@/types/attendance';

export const DEFAULT_VOICE_CONFIG: VoiceAnnouncementConfig = {
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  welcomeTemplate: 'Selamat pagi {nama}! Presensi masuk berhasil dicatat pada {waktu}. Selamat belajar di {sekolah}!',
  pulangTemplate: 'Terima kasih {nama}! Presensi pulang tercatat pada {waktu}. Hati-hati di jalan dan salam untuk keluarga!',
  terlambatTemplate: 'Perhatian {nama}, presensi masuk Anda tercatat pukul {waktu}, status terlambat. Tetap semangat dan silakan lapor guru piket.',
  duplikatTemplate: 'Pemberitahuan, {nama} sudah melakukan presensi hari ini.'
};

/**
  Plays modern chime sounds using Web Audio API synthesis
 */
export function playChimeSound(type: 'success' | 'warning' | 'error' = 'success') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'success') {
      // 2-tone melodic major chime (E5 -> B5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } else if (type === 'warning') {
      // Warm alert tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(349.23, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Error buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (e) {
    console.warn('Audio chime warning:', e);
  }
}

/**
 * Speaks attendance greeting in Indonesian using Web Speech API
 */
export function speakAttendanceGreeting(
  params: {
    nama: string;
    tipe: 'MASUK' | 'PULANG';
    waktu: string;
    isTerlambat?: boolean;
    isDuplikat?: boolean;
    sekolah?: string;
  },
  config: VoiceAnnouncementConfig = DEFAULT_VOICE_CONFIG
) {
  if (typeof window === 'undefined') return;

  // Always trigger sound chime
  if (params.isDuplikat) {
    playChimeSound('error');
  } else if (params.isTerlambat) {
    playChimeSound('warning');
  } else {
    playChimeSound('success');
  }

  if (!config.enabled || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop prior speech

    let template = config.welcomeTemplate;
    if (params.isDuplikat) {
      template = config.duplikatTemplate;
    } else if (params.isTerlambat) {
      template = config.terlambatTemplate;
    } else if (params.tipe === 'PULANG') {
      template = config.pulangTemplate;
    }

    // Friendly time pronunciation (e.g., "06:45" -> "pukul 6 lewat 45 menit")
    let spokenTime = params.waktu;
    const parts = params.waktu.split(':');
    if (parts.length >= 2) {
      const jam = parseInt(parts[0], 10);
      const menit = parseInt(parts[1], 10);
      spokenTime = `pukul ${jam} lewat ${menit} menit`;
    }

    const cleanSchool = params.sekolah || 'SMP Nurul Huda Jayapura';
    const textToSpeak = template
      .replace(/\{nama\}/g, params.nama)
      .replace(/\{tipe\}/g, params.tipe === 'MASUK' ? 'masuk' : 'pulang')
      .replace(/\{waktu\}/g, spokenTime)
      .replace(/\{sekolah\}/g, cleanSchool);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = config.rate || 1.0;
    utterance.pitch = config.pitch || 1.0;
    utterance.volume = config.volume ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.startsWith('ID'));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}
