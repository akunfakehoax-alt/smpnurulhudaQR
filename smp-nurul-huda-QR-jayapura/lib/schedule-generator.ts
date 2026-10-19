import { GuruMapel, HariSekolah, JadwalPelajaranItem } from '@/types/attendance';

export const DAFTAR_HARI: HariSekolah[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export interface SlotWaktuKbm {
  jamKe: string;
  jamMulai: string;
  jamSelesai: string;
  label: string;
}

export const SLOT_WAKTU_STANDAR: SlotWaktuKbm[] = [
  { jamKe: 'Jam 1-2 (07:15 - 08:35)', jamMulai: '07:15', jamSelesai: '08:35', label: 'Jam 1-2' },
  { jamKe: 'Jam 3-4 (08:35 - 09:55)', jamMulai: '08:35', jamSelesai: '09:55', label: 'Jam 3-4' },
  { jamKe: 'Jam 5-6 (10:15 - 11:35)', jamMulai: '10:15', jamSelesai: '11:35', label: 'Jam 5-6' },
  { jamKe: 'Jam 7-8 (11:35 - 12:55)', jamMulai: '11:35', jamSelesai: '12:55', label: 'Jam 7-8' },
  { jamKe: 'Jam 9-10 (13:20 - 14:40)', jamMulai: '13:20', jamSelesai: '14:40', label: 'Jam 9-10' }
];

export const SLOT_WAKTU_JUMAT: SlotWaktuKbm[] = [
  { jamKe: 'Jam 1-2 (07:15 - 08:35)', jamMulai: '07:15', jamSelesai: '08:35', label: 'Jam 1-2' },
  { jamKe: 'Jam 3-4 (08:35 - 09:55)', jamMulai: '08:35', jamSelesai: '09:55', label: 'Jam 3-4' },
  { jamKe: 'Jam 5-6 (10:15 - 11:15)', jamMulai: '10:15', jamSelesai: '11:15', label: 'Jam 5-6 (Jumat)' }
];

// Helper to normalize class names e.g. "VII A" -> "VII-A"
export function normalizeClassName(rawClass: string): string {
  const trimmed = rawClass.trim();
  if (trimmed.includes('-')) return trimmed;
  // If format is like "VII A", convert to "VII-A"
  return trimmed.replace(/\s+/g, '-');
}

// Map subject to theme color and styling badges
export function getMapelColor(mapel: string): { bg: string; text: string; border: string; accent: string } {
  const m = mapel.toLowerCase();
  if (m.includes('indonesia')) {
    return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', accent: 'bg-emerald-500' };
  }
  if (m.includes('inggris')) {
    return { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', accent: 'bg-indigo-500' };
  }
  if (m.includes('matematika')) {
    return { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', accent: 'bg-blue-500' };
  }
  if (m.includes('ipa') || m.includes('alam')) {
    return { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', accent: 'bg-teal-500' };
  }
  if (m.includes('informatika') || m.includes('tik')) {
    return { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', accent: 'bg-cyan-500' };
  }
  if (m.includes('agama') || m.includes('pai')) {
    return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', accent: 'bg-emerald-600' };
  }
  if (m.includes('ppkn') || m.includes('pancasila')) {
    return { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', accent: 'bg-rose-500' };
  }
  if (m.includes('ips') || m.includes('sosial')) {
    return { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', accent: 'bg-amber-500' };
  }
  if (m.includes('olahraga') || m.includes('penjas') || m.includes('pjok')) {
    return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', accent: 'bg-orange-500' };
  }
  if (m.includes('seni') || m.includes('prakarya')) {
    return { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', accent: 'bg-purple-500' };
  }
  return { bg: 'bg-slate-50 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', accent: 'bg-slate-500' };
}

// Determine appropriate school room based on subject & class
export function getRoomForSubject(mapel: string, kelas: string): string {
  const m = mapel.toLowerCase();
  if (m.includes('informatika') || m.includes('tik')) return 'Lab Komputer & IT';
  if (m.includes('ipa') || m.includes('alam')) return 'Lab IPA Terpadu';
  if (m.includes('olahraga') || m.includes('penjas') || m.includes('pjok')) return 'Lapangan Olahraga';
  if (m.includes('agama') || m.includes('pai')) return `Ruang ${kelas} / Musholla`;
  if (m.includes('seni') || m.includes('prakarya')) return `Ruang Prakarya / ${kelas}`;
  return `Ruang Kelas ${kelas}`;
}

// Convert day index (0 = Minggu, 1 = Senin, ...) to HariSekolah
export function getHariSekolahFromDate(date: Date = new Date()): HariSekolah {
  const dayIdx = date.getDay();
  switch (dayIdx) {
    case 1: return 'Senin';
    case 2: return 'Selasa';
    case 3: return 'Rabu';
    case 4: return 'Kamis';
    case 5: return 'Jumat';
    case 6: return 'Sabtu';
    default: return 'Senin'; // Sunday defaults to Senin for preview
  }
}

// Check if lesson is currently happening right now
export function checkLessonStatus(
  hari: HariSekolah, 
  jamMulai: string, 
  jamSelesai: string,
  zonaWaktu: string = 'WIT'
): 'SELESAI' | 'BERLANGSUNG' | 'AKAN_DATANG' {
  const tz = zonaWaktu === 'WIB' 
    ? 'Asia/Jakarta' 
    : zonaWaktu === 'WITA' 
      ? 'Asia/Makassar' 
      : 'Asia/Jayapura';

  const now = new Date();
  const currentHari = getHariSekolahFromDate(now);
  
  if (hari !== currentHari) {
    return 'AKAN_DATANG';
  }

  // Get current HH:MM in school timezone
  const nowTimeString = now.toLocaleTimeString('id-ID', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace('.', ':');

  const [nowH, nowM] = nowTimeString.split(':').map(Number);
  const nowMinutes = (nowH || 0) * 60 + (nowM || 0);

  const [startH, startM] = jamMulai.split(':').map(Number);
  const startMinutes = (startH || 0) * 60 + (startM || 0);

  const [endH, endM] = jamSelesai.split(':').map(Number);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
    return 'BERLANGSUNG';
  }
  if (nowMinutes >= endMinutes) {
    return 'SELESAI';
  }
  return 'AKAN_DATANG';
}

/**
 * Otomatis menghasilkan jadwal pelajaran mingguan yang seimbang, realistis,
 * dan bebas bentrok (conflict-free) berdasarkan GuruMapelList aktif.
 */
export function generateWeeklySchedule(
  guruMapelList: GuruMapel[],
  allAvailableClasses: string[] = ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'],
  zonaWaktu: string = 'WIT'
): JadwalPelajaranItem[] {
  const activeTeachers = guruMapelList.filter(g => g.status === 'AKTIF');
  if (activeTeachers.length === 0) return [];

  const defaultClasses = allAvailableClasses.length > 0 
    ? allAvailableClasses 
    : ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'];

  // Matrix to avoid double-booking teacher or classroom
  // Key: `${hari}-${jamKe}` -> Set of occupied teacherIds & Set of occupied classNames
  const occupiedTeachers = new Map<string, Set<string>>();
  const occupiedClasses = new Map<string, Set<string>>();

  const isSlotFree = (hari: HariSekolah, jamKe: string, teacherId: string, kelas: string): boolean => {
    const slotKey = `${hari}__${jamKe}`;
    const teachersInSlot = occupiedTeachers.get(slotKey);
    if (teachersInSlot && teachersInSlot.has(teacherId)) return false;

    const classesInSlot = occupiedClasses.get(slotKey);
    if (classesInSlot && classesInSlot.has(kelas)) return false;

    return true;
  };

  const occupySlot = (hari: HariSekolah, jamKe: string, teacherId: string, kelas: string) => {
    const slotKey = `${hari}__${jamKe}`;
    if (!occupiedTeachers.has(slotKey)) occupiedTeachers.set(slotKey, new Set());
    occupiedTeachers.get(slotKey)!.add(teacherId);

    if (!occupiedClasses.has(slotKey)) occupiedClasses.set(slotKey, new Set());
    occupiedClasses.get(slotKey)!.add(kelas);
  };

  const schedule: JadwalPelajaranItem[] = [];

  // Parse teaching assignments for each teacher
  interface TeachingDuty {
    guru: GuruMapel;
    targetClass: string;
  }

  const duties: TeachingDuty[] = [];

  activeTeachers.forEach(guru => {
    let classesTaught: string[] = [];
    const rawKelas = (guru.kelasAjar || '').trim();

    if (!rawKelas || rawKelas.toLowerCase().includes('semua') || rawKelas.toLowerCase() === 'semua kelas') {
      classesTaught = [...defaultClasses];
    } else {
      // Split by comma or semicolon
      const splitItems = rawKelas.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
      splitItems.forEach(item => {
        // Expand shorthand like "VII" to "VII-A" and "VII-B"
        if (/^(VII|VIII|IX|7|8|9)$/i.test(item)) {
          const matched = defaultClasses.filter(c => c.toUpperCase().startsWith(item.toUpperCase()));
          classesTaught.push(...(matched.length > 0 ? matched : [item]));
        } else {
          classesTaught.push(normalizeClassName(item));
        }
      });
    }

    // Deduplicate
    classesTaught = Array.from(new Set(classesTaught));

    // For standard SMP curriculum, each major subject is taught 2-3 sessions per week per class
    classesTaught.forEach(cls => {
      // Add primary session
      duties.push({ guru, targetClass: cls });
      // Add secondary session for core subjects (Bahasa, MTK, IPA, PAI)
      const m = guru.mapel.toLowerCase();
      if (m.includes('indonesia') || m.includes('matematika') || m.includes('ipa') || m.includes('inggris')) {
        duties.push({ guru, targetClass: cls });
      }
    });
  });

  // Distribute duties deterministically across days and time slots
  let dutyIndex = 0;
  for (const duty of duties) {
    const { guru, targetClass } = duty;
    let scheduled = false;

    // Distribute across days
    for (let dayOffset = 0; dayOffset < DAFTAR_HARI.length; dayOffset++) {
      const dayIdx = (dutyIndex + dayOffset) % DAFTAR_HARI.length;
      const hari = DAFTAR_HARI[dayIdx];
      const slots = hari === 'Jumat' ? SLOT_WAKTU_JUMAT : SLOT_WAKTU_STANDAR;

      for (let slotOffset = 0; slotOffset < slots.length; slotOffset++) {
        // Offset slot based on duty index to disperse morning/afternoon sessions
        const slotIdx = (dutyIndex * 2 + slotOffset) % slots.length;
        const slot = slots[slotIdx];

        if (isSlotFree(hari, slot.jamKe, guru.id, targetClass)) {
          occupySlot(hari, slot.jamKe, guru.id, targetClass);
          
          const statusKbm = checkLessonStatus(hari, slot.jamMulai, slot.jamSelesai, zonaWaktu);

          schedule.push({
            id: `JDWL-${hari.toUpperCase()}-${slot.label.replace(/\s+/g, '')}-${targetClass.replace(/\s+/g, '')}-${guru.id}`,
            hari,
            jamKe: slot.jamKe,
            jamMulai: slot.jamMulai,
            jamSelesai: slot.jamSelesai,
            guruId: guru.id,
            guruNama: guru.nama,
            nip: guru.nip,
            mapel: guru.mapel,
            kelas: targetClass,
            ruangan: getRoomForSubject(guru.mapel, targetClass),
            statusKbm
          });

          scheduled = true;
          break;
        }
      }
      if (scheduled) break;
    }

    dutyIndex++;
  }

  // Sort schedule by Hari (Senin -> Sabtu), then JamMulai
  const dayOrder: Record<HariSekolah, number> = {
    'Senin': 1,
    'Selasa': 2,
    'Rabu': 3,
    'Kamis': 4,
    'Jumat': 5,
    'Sabtu': 6
  };

  return schedule.sort((a, b) => {
    if (dayOrder[a.hari] !== dayOrder[b.hari]) {
      return dayOrder[a.hari] - dayOrder[b.hari];
    }
    return a.jamMulai.localeCompare(b.jamMulai);
  });
}
