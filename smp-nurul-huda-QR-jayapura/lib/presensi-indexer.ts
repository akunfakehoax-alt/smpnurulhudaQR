import { PresensiRecord } from '@/types/attendance';

/**
 * Generates primary composite key for O(1) Anti-Duplication lookup:
 * Format: `${tanggal}|${nisn}|${tipe}`
 * Example: "2026-10-06|0061234501|DATANG"
 */
export function createPresensiIndexKey(tanggal: string, nisn: string, tipe: string): string {
  return `${tanggal}|${nisn.trim()}|${tipe.trim()}`;
}

/**
 * Generates secondary session key for O(1) lookups:
 * Format: `${tanggal}|${tipe}`
 * Example: "2026-10-06|DATANG"
 */
export function createSessionIndexKey(tanggal: string, tipe: string): string {
  return `${tanggal}|${tipe.trim()}`;
}

/**
 * Builds an O(1) hash map index from an array of PresensiRecords.
 * Iterates in reverse so that latest (top) records take precedence.
 * Optimized for thousands of attendance records.
 */
export function buildPresensiIndex(records: PresensiRecord[]): Map<string, PresensiRecord> {
  const index = new Map<string, PresensiRecord>();
  if (!records || records.length === 0) return index;

  // Iterate backwards so earlier (latest in array) entries win or overwrite accurately
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];
    if (record && record.tanggal && record.nisn && record.tipe) {
      const key = createPresensiIndexKey(record.tanggal, record.nisn, record.tipe);
      index.set(key, record);
    }
  }
  return index;
}

/**
 * Checks in O(1) time whether an attendance record already exists for the given
 * student, date, and attendance type (LockService anti-duplication).
 */
export function checkDuplicateFromIndex(
  index: Map<string, PresensiRecord> | undefined | null,
  tanggal: string,
  nisn: string,
  tipe: string
): PresensiRecord | undefined {
  if (!index || !(index instanceof Map)) return undefined;
  const key = createPresensiIndexKey(tanggal, nisn, tipe);
  return index.get(key);
}

/**
 * Boolean check for whether duplication exists in O(1) time.
 */
export function isDuplicatePresent(
  index: Map<string, PresensiRecord> | undefined | null,
  tanggal: string,
  nisn: string,
  tipe: string
): boolean {
  return Boolean(checkDuplicateFromIndex(index, tanggal, nisn, tipe));
}

/**
 * Clones existing index map and inserts a new record in O(1) time.
 * Returns a new Map for React state immutability.
 */
export function addRecordToIndex(
  index: Map<string, PresensiRecord>,
  record: PresensiRecord
): Map<string, PresensiRecord> {
  const nextIndex = new Map(index);
  const key = createPresensiIndexKey(record.tanggal, record.nisn, record.tipe);
  nextIndex.set(key, record);
  return nextIndex;
}

/**
 * Builds an index grouped by Student NISN for fast student portal history lookup O(1) per NISN.
 */
export function buildStudentPresensiIndex(records: PresensiRecord[]): Map<string, PresensiRecord[]> {
  const map = new Map<string, PresensiRecord[]>();
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const existing = map.get(r.nisn);
    if (existing) {
      existing.push(r);
    } else {
      map.set(r.nisn, [r]);
    }
  }
  return map;
}

/**
 * Builds an index grouped by Date for fast daily report aggregation O(1) per Date.
 */
export function buildDatePresensiIndex(records: PresensiRecord[]): Map<string, PresensiRecord[]> {
  const map = new Map<string, PresensiRecord[]>();
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const existing = map.get(r.tanggal);
    if (existing) {
      existing.push(r);
    } else {
      map.set(r.tanggal, [r]);
    }
  }
  return map;
}
