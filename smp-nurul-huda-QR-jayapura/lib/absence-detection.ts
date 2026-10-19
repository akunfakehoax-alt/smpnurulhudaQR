import { Siswa, PresensiRecord } from '@/types/attendance';

export interface MissedDateInfo {
  date: string;
  dayLabel: string;
  formattedDate: string;
}

export interface ConsecutiveAbsentAlert {
  siswa: Siswa;
  consecutiveDays: number;
  missedDates: MissedDateInfo[];
  lastSeenDate: string | null;
  lastSeenStatus: string | null;
}

/**
 * Returns past school days (Monday - Saturday), excluding Sundays.
 */
export function getPastSchoolDates(count: number = 3, baseDate: Date = new Date()): string[] {
  const dates: string[] = [];
  const curr = new Date(baseDate);
  
  // Normalize time to midnight
  curr.setHours(0, 0, 0, 0);

  let iterations = 0;
  while (dates.length < count && iterations < 30) {
    iterations++;
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    if (dayOfWeek !== 0) {
      // Format YYYY-MM-DD in local time
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    curr.setDate(curr.getDate() - 1);
  }
  return dates;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getDayNameIndo(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return INDO_DAYS[d.getDay()] || '';
}

export function formatDateIndo(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${day} ${INDO_MONTHS[monthIdx] || ''} ${year}`;
}

/**
 * Detects students who have not checked in (or absent) for 3+ consecutive school days.
 */
export function detectConsecutiveAbsences(
  siswaList: Siswa[],
  presensiList: PresensiRecord[],
  thresholdDays: number = 3,
  referenceDate: Date = new Date()
): ConsecutiveAbsentAlert[] {
  const pastDates = getPastSchoolDates(thresholdDays, referenceDate);
  const alerts: ConsecutiveAbsentAlert[] = [];

  for (const siswa of siswaList) {
    // Check attendance on each of pastDates
    const missedDates: MissedDateInfo[] = [];

    for (const date of pastDates) {
      // A student is considered present if they have a 'DATANG' record with status 'HADIR' or 'TERLAMBAT'
      const record = presensiList.find(
        p => p.nisn === siswa.nisn && p.tanggal === date && p.tipe === 'DATANG'
      );

      const isPresent = record && (record.status === 'HADIR' || record.status === 'TERLAMBAT');

      if (!isPresent) {
        missedDates.push({
          date: date,
          dayLabel: getDayNameIndo(date),
          formattedDate: formatDateIndo(date)
        });
      }
    }

    // If student missed all thresholdDays consecutive days
    if (missedDates.length >= thresholdDays) {
      // Find the last recorded date for this student
      const allStudentRecords = presensiList
        .filter(p => p.nisn === siswa.nisn)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      
      const lastRecord = allStudentRecords[0];

      alerts.push({
        siswa,
        consecutiveDays: missedDates.length,
        missedDates,
        lastSeenDate: lastRecord ? lastRecord.tanggal : null,
        lastSeenStatus: lastRecord ? lastRecord.status : null
      });
    }
  }

  return alerts;
}

/**
 * Generates an official WhatsApp notification message to the student's parent/guardian.
 */
export function generateFollowUpWaMessage(
  alert: ConsecutiveAbsentAlert,
  teacherName: string = 'Dra. Sri Wahyuni, M.Pd. (Guru Piket SMP Nurul Huda Jayapura)',
  schoolName: string = 'SMP Nurul Huda Jayapura'
): string {
  const missedList = alert.missedDates
    .map(d => `• ${d.dayLabel}, ${d.formattedDate}: Tidak Tercatat Hadir (Alpa)`)
    .join('\n');

  return (
    `*PEMBERITAHUAN PRESENSI SISWA - ${schoolName.toUpperCase()}*\n\n` +
    `Yth. Bapak/Ibu *${alert.siswa.namaOrtu}*,\n` +
    `Wali Murid dari: *${alert.siswa.nama}*\n` +
    `Kelas: *${alert.siswa.kelas}* | NISN: *${alert.siswa.nisn}*\n\n` +
    `Sistem Presensi Sekolah menginformasikan bahwa ananda terdeteksi *tidak hadir selama ${alert.consecutiveDays} hari sekolah berturut-turut*:\n` +
    `${missedList}\n\n` +
    `Mohon konfirmasi mengenai keadaan ananda kepada pihak sekolah/wali kelas (apakah sakit atau ada kendala lain). Bantuan dan perhatian Bapak/Ibu sangat berharga bagi kelancaran studi ananda.\n\n` +
    `Terima kasih atas kerja samanya.\n\n` +
    `Salam hormat,\n` +
    `*${teacherName}*\n` +
    `_Layanan Otomatis Presensi QR & WhatsApp Cloud API ${schoolName}_`
  );
}

/**
 * Creates a direct wa.me link with encoded message.
 */
export function generateWaChatUrl(phone: string, message: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}
