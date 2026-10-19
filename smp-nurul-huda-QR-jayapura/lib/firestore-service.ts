import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  User,
  Siswa,
  PresensiRecord,
  SesiQR,
  PengajuanIzin,
  PengumumanSekolah,
  JurnalKbmRecord,
  SchoolProfile,
  Role
} from '@/types/attendance';
import {
  INITIAL_USERS,
  INITIAL_SISWA,
  INITIAL_SESI,
  INITIAL_PRESENSI,
  INITIAL_SCHOOL_PROFILE,
  INITIAL_PENGUMUMAN,
  INITIAL_JURNAL_KBM
} from './initial-data';

const BOOTSTRAP_ADMIN_EMAIL = 'akunfakehoax@gmail.com';

// ================= USER & AUTH SERVICES =================

export async function syncUserProfile(firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const email = firebaseUser.email || '';
  const isSuperAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const mappedRole: Role = isSuperAdmin ? 'ADMIN' : (data.role === 'admin' || data.role === 'ADMIN') ? 'ADMIN' : (data.role === 'siswa' || data.role === 'SISWA') ? 'SISWA' : 'GURU';
      const user: User = {
        id: firebaseUser.uid,
        username: email.split('@')[0] || 'user',
        nama: data.displayName || firebaseUser.displayName || 'Pengguna',
        email,
        role: mappedRole,
        nisn: data.nisn || undefined,
        kelas: data.kelas || undefined,
        noHp: data.phone || '6281234567890',
        status: 'AKTIF'
      };

      // Ensure superadmin gate in /admins/{uid}
      if (isSuperAdmin) {
        await setDoc(doc(db, 'admins', firebaseUser.uid), {
          email,
          grantedAt: new Date().toISOString()
        }, { merge: true });
      }

      return user;
    } else {
      // First time login - Create profile
      const defaultRole: Role = isSuperAdmin ? 'ADMIN' : 'GURU';
      const now = new Date().toISOString();
      const newUserData = {
        uid: firebaseUser.uid,
        email,
        displayName: firebaseUser.displayName || email.split('@')[0] || 'Pengguna',
        role: defaultRole,
        photoURL: firebaseUser.photoURL || '',
        createdAt: now,
        updatedAt: now
      };

      await setDoc(userRef, newUserData);

      if (isSuperAdmin) {
        await setDoc(doc(db, 'admins', firebaseUser.uid), {
          email,
          grantedAt: now
        });
      }

      return {
        id: firebaseUser.uid,
        username: email.split('@')[0] || 'user',
        nama: newUserData.displayName,
        email,
        role: defaultRole,
        noHp: '6281234567890',
        status: 'AKTIF'
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
  }
}

export async function updateUserRole(userId: string, newRole: Role): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    if (newRole === 'ADMIN' || (newRole as string) === 'admin') {
      await setDoc(doc(db, 'admins', userId), {
        grantedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeAllUsers(callback: (users: User[]) => void): () => void {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: User[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const rawRole = (d.role || '').toUpperCase();
        const mappedRole: Role = rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'SISWA' ? 'SISWA' : 'GURU';
        return {
          id: docSnap.id,
          username: d.username || (d.email || '').split('@')[0] || docSnap.id,
          password: d.password || undefined,
          nama: d.displayName || d.nama || 'Staf',
          email: d.email || '',
          role: mappedRole,
          nisn: d.nisn || undefined,
          kelas: d.kelas || undefined,
          noHp: d.phone || d.noHp || '6281234567890',
          status: 'AKTIF'
        };
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ================= SEEDING SERVICE =================

export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // 1. Check students
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (studentsSnap.empty) {
      for (const s of INITIAL_SISWA) {
        await setDoc(doc(db, 'students', s.nisn), {
          nisn: s.nisn,
          nama: s.nama,
          kelas: s.kelas,
          jenisKelamin: s.jenisKelamin,
          nomorHpWali: s.nomorHpWali,
          namaWali: s.namaWali,
          barcodeCode: s.barcodeCode || s.nisn,
          status: s.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 2. Check school profile
    const profileRef = doc(db, 'school_profile', 'main');
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        namaSekolah: INITIAL_SCHOOL_PROFILE.namaSekolah,
        npsn: INITIAL_SCHOOL_PROFILE.npsn,
        alamat: INITIAL_SCHOOL_PROFILE.alamat,
        telepon: INITIAL_SCHOOL_PROFILE.telepon,
        email: INITIAL_SCHOOL_PROFILE.email,
        kepalaSekolah: INITIAL_SCHOOL_PROFILE.kepalaSekolah,
        nipKepsek: INITIAL_SCHOOL_PROFILE.nipKepsek,
        latitude: INITIAL_SCHOOL_PROFILE.latitude,
        longitude: INITIAL_SCHOOL_PROFILE.longitude,
        radiusMeter: INITIAL_SCHOOL_PROFILE.radiusMeter,
        toleransiKeterlambatanMenit: INITIAL_SCHOOL_PROFILE.toleransiKeterlambatanMenit,
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Check sessions
    const sessionsSnap = await getDocs(collection(db, 'sessions'));
    if (sessionsSnap.empty) {
      for (const s of INITIAL_SESI) {
        await setDoc(doc(db, 'sessions', s.id), {
          id: String(s.id),
          kodeSesi: String(s.kodeSesi || 'SESI-01'),
          namaSesi: String((s as any).namaSesi || s.judul || 'Sesi Presensi'),
          tipe: s.tipe === 'PULANG' ? 'PULANG' : 'MASUK',
          tanggal: String(s.tanggal || new Date().toISOString().split('T')[0]),
          jamMulai: String(s.jamMulai || '06:30'),
          jamSelesai: String(s.jamSelesai || '16:00'),
          isActive: typeof (s as any).isActive === 'boolean' ? (s as any).isActive : (typeof s.aktif === 'boolean' ? s.aktif : true),
          createdAt: new Date().toISOString()
        });
      }
    }

    // 4. Check attendance
    const attendanceSnap = await getDocs(collection(db, 'attendance_records'));
    if (attendanceSnap.empty) {
      for (const a of INITIAL_PRESENSI) {
        const rawStatus = a.status || 'HADIR';
        const normStatus = rawStatus === 'ALPA' ? 'ALFA' : rawStatus;
        const normMetode = a.metode === 'MANUAL' ? 'MANUAL_OPERATOR' : 'SCAN_OPERATOR';

        await setDoc(doc(db, 'attendance_records', a.id), {
          id: String(a.id),
          nisn: String(a.nisn),
          nama: String(a.namaSiswa || (a as any).nama || 'Siswa'),
          kelas: String(a.kelas || ''),
          sesiId: String((a as any).sesiId || a.tipe || 'MASUK'),
          tanggal: String(a.tanggal || new Date().toISOString().split('T')[0]),
          jam: String(a.waktu || (a as any).jam || '07:00'),
          status: normStatus,
          metode: normMetode,
          keterangan: String(a.catatan || (a as any).keterangan || ''),
          verifiedBy: String(a.petugas || (a as any).verifiedBy || 'Petugas Piket'),
          createdAt: new Date().toISOString()
        });
      }
    }

    // 5. Check announcements
    const annSnap = await getDocs(collection(db, 'announcements'));
    if (annSnap.empty) {
      for (const ann of INITIAL_PENGUMUMAN) {
        await setDoc(doc(db, 'announcements', ann.id), {
          id: String(ann.id),
          judul: String(ann.judul || ''),
          konten: String((ann as any).konten || ann.isi || ''),
          kategori: ann.kategori || 'PENTING',
          targetAudience: (ann as any).targetAudience || (ann.targetKelas === 'SEMUA' ? 'SEMUA' : 'SISWA'),
          tanggal: String(ann.tanggal || new Date().toISOString().split('T')[0]),
          authorName: String((ann as any).authorName || ann.penulis || 'Admin'),
          priority: (ann as any).priority || 'BIASA',
          createdAt: new Date().toISOString()
        });
      }
    }

    // 6. Check teaching journals
    const jourSnap = await getDocs(collection(db, 'teaching_journals'));
    if (jourSnap.empty) {
      for (const j of INITIAL_JURNAL_KBM) {
        await setDoc(doc(db, 'teaching_journals', j.id), {
          id: String(j.id),
          guruId: auth.currentUser?.uid || 'system_guru',
          namaGuru: String((j as any).namaGuru || j.guruNama || 'Guru'),
          mataPelajaran: String((j as any).mataPelajaran || j.mapel || 'Mata Pelajaran'),
          kelas: String(j.kelas || ''),
          tanggal: String(j.tanggal || new Date().toISOString().split('T')[0]),
          jamKe: String(j.jamKe || 'Jam 1-2'),
          materiPokok: String((j as any).materiPokok || j.materiAjar || 'Materi Pembelajaran'),
          jumlahHadir: typeof (j as any).jumlahHadir === 'number' ? (j as any).jumlahHadir : (j.absensiSiswa ? j.absensiSiswa.filter(s => s.status === 'HADIR').length : 0),
          jumlahSakit: typeof (j as any).jumlahSakit === 'number' ? (j as any).jumlahSakit : (j.absensiSiswa ? j.absensiSiswa.filter(s => s.status === 'SAKIT').length : 0),
          jumlahIzin: typeof (j as any).jumlahIzin === 'number' ? (j as any).jumlahIzin : (j.absensiSiswa ? j.absensiSiswa.filter(s => s.status === 'IZIN').length : 0),
          jumlahAlfa: typeof (j as any).jumlahAlfa === 'number' ? (j as any).jumlahAlfa : (j.absensiSiswa ? j.absensiSiswa.filter(s => s.status === 'ALPA').length : 0),
          catatanKbm: String(j.catatanKejadian || (j as any).catatanKbm || ''),
          createdAt: new Date().toISOString()
        });
      }
    }

    // 7. Check users
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, 'users', u.id), {
          uid: String(u.id),
          username: String(u.username),
          password: String(u.password || '123456'),
          nama: String(u.nama),
          displayName: String(u.nama),
          email: String(u.email || `${u.username}@smpnurulhuda.sch.id`),
          role: String(u.role || 'guru').toLowerCase(),
          noHp: String(u.noHp || '6281234567890'),
          status: String(u.status || 'AKTIF'),
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.warn('Seed operation caught error (likely already seeded or rules restricted):', err);
  }
}

// ================= STUDENTS SERVICE =================

export function subscribeStudents(callback: (students: Siswa[]) => void): () => void {
  const path = 'students';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Siswa[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const noHpOrtu = d.nomorHpWali || (d as any).noHpOrtu || '';
        const namaOrtu = d.namaWali || (d as any).namaOrtu || '';
        const qrBadgeToken = d.barcodeCode || (d as any).qrBadgeToken || d.nisn;
        return {
          id: docSnap.id,
          nisn: d.nisn || docSnap.id,
          nama: d.nama || '',
          kelas: d.kelas || '',
          jenisKelamin: d.jenisKelamin || 'L',
          noHpOrtu,
          namaOrtu,
          nomorHpWali: noHpOrtu,
          namaWali: namaOrtu,
          barcodeCode: qrBadgeToken,
          qrBadgeToken,
          status: d.status || 'aktif',
          fotoUrl: d.fotoUrl || undefined
        } as Siswa;
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addStudentToFirestore(siswa: Siswa): Promise<void> {
  const path = `students/${siswa.nisn}`;
  try {
    const studentData: Record<string, unknown> = {
      nisn: siswa.nisn,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jenisKelamin: siswa.jenisKelamin,
      nomorHpWali: siswa.noHpOrtu || siswa.nomorHpWali || '',
      namaWali: siswa.namaOrtu || siswa.namaWali || '',
      barcodeCode: siswa.barcodeCode || siswa.qrBadgeToken || siswa.nisn,
      status: siswa.status || 'aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (siswa.fotoUrl) {
      studentData.fotoUrl = siswa.fotoUrl;
    }
    await setDoc(doc(db, 'students', siswa.nisn), studentData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStudentInFirestore(nisn: string, updates: Partial<Siswa>): Promise<void> {
  const path = `students/${nisn}`;
  try {
    await updateDoc(doc(db, 'students', nisn), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudentFromFirestore(nisn: string): Promise<void> {
  const path = `students/${nisn}`;
  try {
    await deleteDoc(doc(db, 'students', nisn));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ================= ATTENDANCE RECORDS SERVICE =================

export function subscribeAttendance(callback: (records: PresensiRecord[]) => void): () => void {
  const path = 'attendance_records';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PresensiRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const namaSiswa = d.nama || d.namaSiswa || 'Siswa';
        const waktu = d.jam || d.waktu || '07:00';
        const rawStatus = d.status || 'HADIR';
        const status = rawStatus === 'ALFA' ? 'ALPA' : rawStatus;
        const tipe = (d.sesiId === 'SESI-PULANG-SORE' ? 'PULANG' : (d.tipe || 'DATANG')) as TipeSesi;
        const metode = (d.metode === 'MANUAL_OPERATOR' || d.metode === 'MANUAL') ? 'MANUAL' : 'QR_SCAN';
        const catatan = d.keterangan || d.catatan || '';
        const petugas = d.verifiedBy || d.petugas || '';

        return {
          id: docSnap.id,
          nisn: d.nisn || '',
          namaSiswa,
          nama: namaSiswa,
          kelas: d.kelas || '',
          tipe,
          sesiId: d.sesiId || tipe,
          tanggal: d.tanggal || '',
          waktu,
          jam: waktu,
          status,
          metode,
          waStatus: d.waStatus || 'TERKIRIM',
          catatan,
          keterangan: catatan,
          petugas,
          verifiedBy: petugas
        } as PresensiRecord;
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addAttendanceRecordToFirestore(record: PresensiRecord): Promise<void> {
  const id = record.id || `att_${Date.now()}_${record.nisn || 'unknown'}`;
  const path = `attendance_records/${id}`;

  // Safe extraction with strict fallbacks so no field is ever `undefined`
  const nisn = String(record.nisn || '').slice(0, 20);
  const nama = String(record.namaSiswa || record.nama || 'Siswa').slice(0, 100);
  const kelas = String(record.kelas || '').slice(0, 20);
  const tanggal = String(record.tanggal || new Date().toISOString().split('T')[0]).slice(0, 20);
  const jam = String(record.waktu || record.jam || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })).slice(0, 20);

  // Normalize status for firestore schema ('HADIR' | 'TERLAMBAT' | 'SAKIT' | 'IZIN' | 'ALFA')
  let status: 'HADIR' | 'TERLAMBAT' | 'SAKIT' | 'IZIN' | 'ALFA' = 'HADIR';
  if (record.status === 'TERLAMBAT') status = 'TERLAMBAT';
  else if (record.status === 'SAKIT') status = 'SAKIT';
  else if (record.status === 'IZIN') status = 'IZIN';
  else if (record.status === 'ALPA' || (record.status as any) === 'ALFA') status = 'ALFA';
  else status = 'HADIR';

  // Normalize metode for firestore schema ('SCAN_OPERATOR' | 'SCAN_MANDIRI_HP' | 'MANUAL_OPERATOR')
  let metode: 'SCAN_OPERATOR' | 'SCAN_MANDIRI_HP' | 'MANUAL_OPERATOR' = 'SCAN_OPERATOR';
  if (record.metode === 'MANUAL' || (record as any).metode === 'MANUAL_OPERATOR') {
    metode = 'MANUAL_OPERATOR';
  } else if ((record as any).metode === 'SCAN_MANDIRI_HP') {
    metode = 'SCAN_MANDIRI_HP';
  } else {
    metode = 'SCAN_OPERATOR';
  }

  const sesiId = String(record.sesiId || record.tipe || 'MASUK').slice(0, 50);
  const keterangan = String(record.catatan || record.keterangan || '').slice(0, 200);
  const verifiedBy = String(record.petugas || record.verifiedBy || 'Petugas Piket').slice(0, 100);

  const payload = {
    id: String(id).slice(0, 128),
    nisn,
    nama,
    kelas,
    sesiId,
    tanggal,
    jam,
    status,
    metode,
    keterangan,
    verifiedBy,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'attendance_records', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAttendanceRecordInFirestore(
  id: string,
  updates: { status: PresensiRecord['status']; keterangan?: string; verifiedBy?: string }
): Promise<void> {
  const path = `attendance_records/${id}`;
  let status: 'HADIR' | 'TERLAMBAT' | 'SAKIT' | 'IZIN' | 'ALFA' = 'HADIR';
  if (updates.status === 'TERLAMBAT') status = 'TERLAMBAT';
  else if (updates.status === 'SAKIT') status = 'SAKIT';
  else if (updates.status === 'IZIN') status = 'IZIN';
  else if (updates.status === 'ALPA' || (updates.status as any) === 'ALFA') status = 'ALFA';
  else status = 'HADIR';

  try {
    await updateDoc(doc(db, 'attendance_records', id), {
      status,
      keterangan: updates.keterangan || '',
      verifiedBy: updates.verifiedBy || ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= SESSIONS SERVICE =================

export function subscribeSessions(callback: (sessions: SesiQR[]) => void): () => void {
  const path = 'sessions';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: SesiQR[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const judul = String(d.namaSesi || d.judul || 'Sesi Presensi');
        const rawTipe = String(d.tipe || 'MASUK');
        const tipe: TipeSesi = rawTipe === 'PULANG' ? 'PULANG' : 'DATANG';
        const aktif = typeof d.isActive === 'boolean' ? d.isActive : (typeof d.aktif === 'boolean' ? d.aktif : true);
        const kodeSesi = String(d.kodeSesi || `SESI-${tipe}`);
        const tanggal = String(d.tanggal || new Date().toISOString().split('T')[0]);
        const jamMulai = String(d.jamMulai || '06:30');
        const jamSelesai = String(d.jamSelesai || '16:00');
        const batasTerlambat = String(d.batasTerlambat || (tipe === 'DATANG' ? '07:00' : '16:00'));
        const tokenQR = String(d.tokenQR || `QR-ATT-${tipe}-${tanggal}-${docSnap.id.slice(-5)}`);
        const createdBy = String(d.createdById || d.createdBy || 'Guru Piket');

        return {
          id: docSnap.id,
          kodeSesi,
          judul,
          namaSesi: judul,
          tipe,
          kelas: String(d.kelas || 'SEMUA'),
          tanggal,
          jamMulai,
          jamSelesai,
          batasTerlambat,
          tokenQR,
          aktif,
          isActive: aktif,
          allowSelfScan: typeof d.allowSelfScan === 'boolean' ? d.allowSelfScan : false,
          refreshIntervalDetik: Number(d.refreshIntervalDetik || 30),
          createdAt: String(d.createdAt || new Date().toISOString()),
          createdBy,
          createdById: createdBy
        } as SesiQR;
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createSessionInFirestore(sesi: SesiQR): Promise<void> {
  const id = String(sesi.id || `SESI-${Date.now()}`).slice(0, 128);
  const path = `sessions/${id}`;
  
  // Safe extraction with strict fallbacks so no field is ever `undefined`
  const kodeSesi = String(sesi.kodeSesi || `SESI-${sesi.tipe || 'DATANG'}`).slice(0, 50);
  const namaSesi = String(sesi.namaSesi || sesi.judul || 'Sesi Presensi').slice(0, 100);
  
  // Normalize tipe for firestore schema ('MASUK' | 'PULANG' | 'EKSTRAKURIKULER' | 'UPACARA')
  let tipe: 'MASUK' | 'PULANG' | 'EKSTRAKURIKULER' | 'UPACARA' = 'MASUK';
  if (sesi.tipe === 'PULANG') tipe = 'PULANG';
  else if ((sesi.tipe as any) === 'EKSTRAKURIKULER') tipe = 'EKSTRAKURIKULER';
  else if ((sesi.tipe as any) === 'UPACARA') tipe = 'UPACARA';
  else tipe = 'MASUK'; // 'DATANG' -> 'MASUK'
  
  const tanggal = String(sesi.tanggal || new Date().toISOString().split('T')[0]).slice(0, 20);
  const jamMulai = String(sesi.jamMulai || '06:30').slice(0, 10);
  const jamSelesai = String(sesi.jamSelesai || '16:00').slice(0, 10);
  const isActive = typeof sesi.isActive === 'boolean' ? sesi.isActive : (typeof sesi.aktif === 'boolean' ? sesi.aktif : true);
  const createdById = String(auth.currentUser?.uid || sesi.createdById || sesi.createdBy || 'system').slice(0, 128);

  const payload = {
    id,
    kodeSesi,
    namaSesi,
    tipe,
    tanggal,
    jamMulai,
    jamSelesai,
    isActive,
    createdById,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'sessions', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleSessionActiveInFirestore(id: string, isActive: boolean): Promise<void> {
  const path = `sessions/${id}`;
  try {
    await updateDoc(doc(db, 'sessions', id), {
      isActive: Boolean(isActive)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= LEAVE REQUESTS SERVICE =================

export function subscribeLeaveRequests(callback: (requests: PengajuanIzin[]) => void): () => void {
  const path = 'leave_requests';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PengajuanIzin[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          nisn: d.nisn || '',
          nama: d.nama || '',
          kelas: d.kelas || '',
          kategori: d.kategori || 'IZIN',
          tanggalMulai: d.tanggalMulai || '',
          tanggalSelesai: d.tanggalSelesai || '',
          alasan: d.alasan || '',
          lampiranUrl: d.lampiranUrl || undefined,
          status: d.status || 'MENUNGGU',
          disetujuiOleh: d.disetujuiOleh || undefined,
          catatanGuru: d.catatanGuru || undefined
        };
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addLeaveRequestToFirestore(req: PengajuanIzin): Promise<void> {
  const id = String(req.id || `leave_${Date.now()}_${req.nisn || 'req'}`).slice(0, 128);
  const path = `leave_requests/${id}`;
  const nama = String(req.nama || req.namaSiswa || 'Siswa').slice(0, 100);
  const nisn = String(req.nisn || '').slice(0, 20);
  const kelas = String(req.kelas || '').slice(0, 20);
  const kategori = (req.kategori === 'SAKIT' ? 'SAKIT' : ((req.kategori as any) === 'DISPENSASI' ? 'DISPENSASI' : 'IZIN'));
  const tanggalMulai = String(req.tanggalMulai || new Date().toISOString().split('T')[0]).slice(0, 20);
  const tanggalSelesai = String(req.tanggalSelesai || req.tanggalMulai || new Date().toISOString().split('T')[0]).slice(0, 20);
  const alasan = String(req.alasan || 'Izin').slice(0, 300);
  const lampiranUrl = String(req.lampiranUrl || '').slice(0, 500);
  const status = req.status || 'MENUNGGU';

  const payload: Record<string, unknown> = {
    id,
    nisn,
    nama,
    kelas,
    kategori,
    tanggalMulai,
    tanggalSelesai,
    alasan,
    status,
    createdAt: new Date().toISOString()
  };

  if (lampiranUrl) payload.lampiranUrl = lampiranUrl;
  if (req.disetujuiPada || (req as any).disetujuiOleh) {
    payload.disetujuiOleh = String((req as any).disetujuiOleh || req.petugas || 'Guru').slice(0, 100);
  }
  if (req.catatanGuru) {
    payload.catatanGuru = String(req.catatanGuru).slice(0, 200);
  }

  try {
    await setDoc(doc(db, 'leave_requests', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLeaveRequestStatusInFirestore(
  id: string,
  status: 'DISETUJUI' | 'DITOLAK',
  disetujuiOleh: string,
  catatanGuru: string
): Promise<void> {
  const path = `leave_requests/${id}`;
  try {
    await updateDoc(doc(db, 'leave_requests', id), {
      status,
      disetujuiOleh: disetujuiOleh || 'Guru',
      catatanGuru: catatanGuru || ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= ANNOUNCEMENTS SERVICE =================

export function subscribeAnnouncements(callback: (ann: PengumumanSekolah[]) => void): () => void {
  const path = 'announcements';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PengumumanSekolah[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          judul: d.judul || '',
          konten: d.konten || '',
          isi: d.konten || '',
          kategori: d.kategori || 'PENTING',
          targetAudience: d.targetAudience || 'SEMUA',
          targetKelas: d.targetAudience || 'SEMUA',
          tanggal: d.tanggal || '',
          waktu: '07:00',
          isPinned: d.priority === 'PENTING' || d.priority === 'MENDESAK',
          authorName: d.authorName || undefined,
          penulis: d.authorName || 'Admin',
          priority: d.priority || 'BIASA'
        } as PengumumanSekolah;
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addAnnouncementToFirestore(ann: PengumumanSekolah): Promise<void> {
  const id = String(ann.id || `ann_${Date.now()}`).slice(0, 128);
  const path = `announcements/${id}`;
  const judul = String(ann.judul || 'Pengumuman').slice(0, 150);
  const konten = String((ann as any).konten || ann.isi || '').slice(0, 1000);
  const kategori = ['AKADEMIK', 'KEGIATAN', 'PENTING', 'LIBUR'].includes(ann.kategori) ? ann.kategori : 'PENTING';
  const targetAudience = ['SEMUA', 'GURU', 'SISWA', 'WALI_MURID'].includes((ann as any).targetAudience) 
    ? (ann as any).targetAudience 
    : (ann.targetKelas === 'SEMUA' ? 'SEMUA' : 'SISWA');
  const tanggal = String(ann.tanggal || new Date().toISOString().split('T')[0]).slice(0, 20);
  const authorName = String((ann as any).authorName || ann.penulis || 'Admin').slice(0, 100);
  const priority = ['BIASA', 'PENTING', 'MENDESAK'].includes((ann as any).priority) ? (ann as any).priority : 'BIASA';

  const payload = {
    id,
    judul,
    konten,
    kategori,
    targetAudience,
    tanggal,
    authorName,
    priority,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'announcements', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ================= TEACHING JOURNALS SERVICE =================

export function subscribeTeachingJournals(callback: (journals: JurnalKbmRecord[]) => void): () => void {
  const path = 'teaching_journals';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: JurnalKbmRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const guruNama = String(d.namaGuru || d.guruNama || 'Guru');
        const mapel = String(d.mataPelajaran || d.mapel || 'Mata Pelajaran');
        const materiAjar = String(d.materiPokok || d.materiAjar || 'Materi Pembelajaran');

        return {
          id: docSnap.id,
          namaGuru: guruNama,
          guruNama,
          mataPelajaran: mapel,
          mapel,
          kelas: d.kelas || '',
          tanggal: d.tanggal || '',
          jamKe: d.jamKe || '',
          materiPokok: materiAjar,
          materiAjar,
          jumlahHadir: Number(d.jumlahHadir || 0),
          jumlahSakit: Number(d.jumlahSakit || 0),
          jumlahIzin: Number(d.jumlahIzin || 0),
          jumlahAlfa: Number(d.jumlahAlfa || 0),
          catatanKbm: d.catatanKbm || undefined,
          catatanKejadian: d.catatanKbm || '',
          absensiSiswa: [],
          dibuatPada: d.createdAt || d.tanggal || ''
        } as unknown as JurnalKbmRecord;
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addTeachingJournalToFirestore(jurnal: JurnalKbmRecord): Promise<void> {
  const id = String(jurnal.id || `jurnal_${Date.now()}`).slice(0, 128);
  const path = `teaching_journals/${id}`;
  const guruId = String(auth.currentUser?.uid || 'guest_guru').slice(0, 128);
  const namaGuru = String((jurnal as any).namaGuru || jurnal.guruNama || 'Guru').slice(0, 100);
  const mataPelajaran = String((jurnal as any).mataPelajaran || jurnal.mapel || 'Mata Pelajaran').slice(0, 100);
  const kelas = String(jurnal.kelas || '').slice(0, 20);
  const tanggal = String(jurnal.tanggal || new Date().toISOString().split('T')[0]).slice(0, 20);
  const jamKe = String(jurnal.jamKe || 'Jam 1-2').slice(0, 20);
  const materiPokok = String((jurnal as any).materiPokok || jurnal.materiAjar || 'Materi Pembelajaran').slice(0, 300);
  const jumlahHadir = typeof (jurnal as any).jumlahHadir === 'number' ? (jurnal as any).jumlahHadir : (jurnal.absensiSiswa ? jurnal.absensiSiswa.filter(s => s.status === 'HADIR').length : 0);
  const jumlahSakit = typeof (jurnal as any).jumlahSakit === 'number' ? (jurnal as any).jumlahSakit : (jurnal.absensiSiswa ? jurnal.absensiSiswa.filter(s => s.status === 'SAKIT').length : 0);
  const jumlahIzin = typeof (jurnal as any).jumlahIzin === 'number' ? (jurnal as any).jumlahIzin : (jurnal.absensiSiswa ? jurnal.absensiSiswa.filter(s => s.status === 'IZIN').length : 0);
  const jumlahAlfa = typeof (jurnal as any).jumlahAlfa === 'number' ? (jurnal as any).jumlahAlfa : (jurnal.absensiSiswa ? jurnal.absensiSiswa.filter(s => s.status === 'ALPA').length : 0);
  const catatanKbm = String(jurnal.catatanKejadian || (jurnal as any).catatanKbm || '').slice(0, 500);

  const payload = {
    id,
    guruId,
    namaGuru,
    mataPelajaran,
    kelas,
    tanggal,
    jamKe,
    materiPokok,
    jumlahHadir,
    jumlahSakit,
    jumlahIzin,
    jumlahAlfa,
    catatanKbm,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'teaching_journals', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ================= SCHOOL PROFILE SERVICE =================

export function subscribeSchoolProfile(callback: (profile: SchoolProfile) => void): () => void {
  const path = 'school_profile/main';
  return onSnapshot(
    doc(db, 'school_profile', 'main'),
    (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        callback({
          namaSekolah: d.namaSekolah || INITIAL_SCHOOL_PROFILE.namaSekolah,
          npsn: d.npsn || INITIAL_SCHOOL_PROFILE.npsn,
          alamat: d.alamat || INITIAL_SCHOOL_PROFILE.alamat,
          telepon: d.telepon || INITIAL_SCHOOL_PROFILE.telepon,
          email: d.email || INITIAL_SCHOOL_PROFILE.email,
          kepalaSekolah: d.kepalaSekolah || INITIAL_SCHOOL_PROFILE.kepalaSekolah,
          nipKepsek: d.nipKepsek || INITIAL_SCHOOL_PROFILE.nipKepsek,
          latitude: Number(d.latitude || INITIAL_SCHOOL_PROFILE.latitude),
          longitude: Number(d.longitude || INITIAL_SCHOOL_PROFILE.longitude),
          radiusMeter: Number(d.radiusMeter || INITIAL_SCHOOL_PROFILE.radiusMeter),
          toleransiKeterlambatanMenit: Number(d.toleransiKeterlambatanMenit || INITIAL_SCHOOL_PROFILE.toleransiKeterlambatanMenit)
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function updateSchoolProfileInFirestore(profile: Partial<SchoolProfile>): Promise<void> {
  const path = 'school_profile/main';
  try {
    // Only send valid metadata schema fields to Firestore (do not store multi-megabyte base64 logo in document)
    const dataToSave: Record<string, unknown> = {
      namaSekolah: profile.namaSekolah || INITIAL_SCHOOL_PROFILE.namaSekolah,
      latitude: Number(profile.latitude ?? INITIAL_SCHOOL_PROFILE.latitude),
      longitude: Number(profile.longitude ?? INITIAL_SCHOOL_PROFILE.longitude),
      radiusMeter: Number(profile.radiusMeter ?? INITIAL_SCHOOL_PROFILE.radiusMeter),
      updatedAt: new Date().toISOString()
    };

    if (profile.npsn) dataToSave.npsn = profile.npsn;
    if (profile.alamat) dataToSave.alamat = profile.alamat;
    if (profile.telepon) dataToSave.telepon = profile.telepon;
    if (profile.email) dataToSave.email = profile.email;
    if (profile.kepalaSekolah) dataToSave.kepalaSekolah = profile.kepalaSekolah;
    if (profile.nipKepsek) dataToSave.nipKepsek = profile.nipKepsek;
    if (profile.toleransiKeterlambatanMenit !== undefined) {
      dataToSave.toleransiKeterlambatanMenit = Number(profile.toleransiKeterlambatanMenit);
    }

    await setDoc(doc(db, 'school_profile', 'main'), dataToSave, { merge: true });
  } catch (error) {
    console.warn('Failed to update school profile in Firestore:', error);
    if (error instanceof Error && error.message.includes('exceeds the maximum allowed size')) {
      console.warn('Document payload exceeded Firestore 1MB limit. Preserving locally.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
