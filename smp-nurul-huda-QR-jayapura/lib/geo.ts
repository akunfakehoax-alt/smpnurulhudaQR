/**
 * Utility Geolocation & Geofencing Presensi Siswa
 * Menghitung jarak presensi siswa dari koordinat gerbang sekolah SMP Nurul Huda Jayapura
 */

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeofenceValidation {
  isValid: boolean;
  distanceMeters: number;
  radiusMeters: number;
  status: 'DI_AREA_SEKOLAH' | 'DI_LUAR_SEKOLAH' | 'TANPA_GPS';
  message: string;
}

/**
 * Formula Haversine untuk menghitung jarak akurat dalam satuan meter
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Validasi geofence keberadaan siswa terhadap koordinat sekolah
 */
export function validateStudentGeofence(
  studentLat: number,
  studentLon: number,
  schoolLat: number = -2.533719,
  schoolLon: number = 140.718135,
  radiusMeters: number = 150
): GeofenceValidation {
  const distance = calculateDistanceMeters(studentLat, studentLon, schoolLat, schoolLon);
  const isValid = distance <= radiusMeters;

  if (isValid) {
    return {
      isValid: true,
      distanceMeters: distance,
      radiusMeters,
      status: 'DI_AREA_SEKOLAH',
      message: `Lokasi VALID: Anda berada ${distance} meter dari gerbang sekolah (Batas radius: ${radiusMeters}m). Presensi disetujui!`
    };
  }

  return {
    isValid: false,
    distanceMeters: distance,
    radiusMeters,
    status: 'DI_LUAR_SEKOLAH',
    message: `Lokasi DITOLAK: Anda terdeteksi berjarak ${distance} meter (${(distance / 1000).toFixed(1)} km) di luar radius sekolah (Maksimal: ${radiusMeters}m). Harap lakukan presensi saat tiba di area sekolah.`
  };
}

/**
 * Format koordinat desimal ke format terbaca
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'LU' : 'LS';
  const lonDir = lon >= 0 ? 'BT' : 'BB';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`;
}
