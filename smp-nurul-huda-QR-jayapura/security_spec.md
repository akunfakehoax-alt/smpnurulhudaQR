# Security Specification & Threat Model
## SMP Nurul Huda Jayapura - Presensi QR Code System

### 1. Data Invariants
1. **User Identity & Role Sanctity:** A user can only register their own `/users/{uid}` matching `request.auth.uid`. Regular users cannot elevate their own role to 'admin' or alter their `role` field on update.
2. **Admin Gateway:** Only UIDs present in `/admins/{uid}` or authenticated as the bootstrapped system administrator (`akunfakehoax@gmail.com`) can grant or revoke admin privileges and modify school master profiles.
3. **Student Record Integrity:** Student records in `/students/{studentId}` can only be created or modified by verified staff (Admin or Guru Piket). Student IDs must conform to valid alphanumeric NISN patterns.
4. **Attendance Immutability:** An attendance record in `/attendance_records/{recordId}` once created cannot have its `nisn`, `tanggal`, or `sesiId` tampered with. Updates are restricted to verified staff for status corrections (e.g., changing ALFA to IZIN with verified note).
5. **Session Control:** Active QR sessions in `/sessions/{sessionId}` can only be created, opened, or closed by staff/admin.
6. **Leave Request Accountability:** Students may only submit leave requests where `nisn` matches their registered profile or authenticated identity, and status on initial creation must be 'MENUNGGU'. Only teachers/admins can transition status to 'DISETUJUI' or 'DITOLAK'.
7. **PII Protection:** Student guardian phone numbers and student identity details are shielded from anonymous unauthenticated scrapers.

---

### 2. The "Dirty Dozen" Malicious Payloads

1. **Privilege Escalation on User Creation:** An attacker attempts to set `role: "admin"` on registration when not authorized.
2. **Ghost Field Injection (Shadow Update):** An attacker injects `isSuperAdmin: true` or `bypassed: true` into their user document.
3. **Impersonated Attendance Injection:** An unauthenticated user attempts to inject an attendance record without a valid auth session.
4. **Retroactive Attendance Date Alteration:** A student attempts to alter the `tanggal` or `jam` of an existing attendance record.
5. **Fake Student Master Injection:** An unauthenticated client attempts to add a student to `/students` directly.
6. **Denial of Wallet String Bomb:** An attacker sends a 50KB string in `keterangan` or `alasan` to exhaust storage quotas.
7. **Session Code Hijack:** An unauthenticated user attempts to update `/sessions/{sessionId}` to mark an expired session as `isActive: true`.
8. **Leave Request Status Forgery:** A student submits a leave request with `status: "DISETUJUI"` directly instead of `MENUNGGU`.
9. **Journal Tampering:** A user attempts to delete or overwrite another teacher's teaching journal in `/teaching_journals`.
10. **School Geofencing GPS Spoofing:** An attacker attempts to modify `/school_profile/main` to alter coordinates or expand the radius to 100,000 meters.
11. **Path Traversal / Malicious ID Injection:** An attacker targets document ID with SQL/bash injection characters `../../admin` or non-alphanumeric symbols.
12. **Self-Admin Granting:** An attacker attempts to write directly to `/admins/{attackerUid}`.

---

### 3. Test Runner Specification
All twelve dirty dozen payloads MUST result in `PERMISSION_DENIED` under Firestore Security Rules.
Rules enforce:
- Default deny catch-all `match /{document=**} { allow read, write: if false; }`
- Global helpers `isValidId()`, `isSignedIn()`, `isAdmin()`, `isStaff()`
- Standalone `isValid[Entity]()` validation functions for all models
- Strict key matching with `hasAll()` and `hasOnly()`
- Server timestamp checks where applicable
