# Green Valley Residencia — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Unmatched paths in `/databases/{database}/documents/{document=**}` are unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin Authorization Invariant**: Admin privileges (`isAdmin()`) are strictly granted only if the authenticated user has a verified email matching the bootstrapped administrator (`wama93637@gmail.com`) or an existing record in `/admins/$(request.auth.uid)`. Users cannot self-assign `role: "admin"` when creating or updating `/users/{userId}`.
4. **PII Isolation Invariant**: Collections storing PII (`users`, `houseInquiries`, `visitBookings`, `gymInquiries`, `visitorLogs`, `contactMessages`) forbid blanket reads. Both `get` and `list` operations enforce `resource.data.userId == request.auth.uid || isAdmin()` (or `resource.data.uid == request.auth.uid` for `users`).
5. **Relational Existence Invariant**: Creating a `houseInquiries` or `visitBookings` document requires `exists(/databases/$(database)/documents/houses/$(incoming().houseId))` so inquiries cannot reference nonexistent houses.
6. **Temporal & Immutable Fields Invariant**: Every `create` operation enforces `incoming().createdAt == request.time` (and `updatedAt == request.time` where present). Every `update` operation enforces immutability of `createdAt`, `uid`, `userId`, and `houseId`, and enforces `incoming().updatedAt == request.time`.
7. **Terminal State Locking Invariant**: Once a `houseInquiries`, `visitBookings`, `gymInquiries`, or `visitorLogs` document reaches a terminal status (`Closed`, `Completed`, `Rejected`, `Checked-Out`), non-admin users cannot mutate it further.
8. **Path Variable & Volumetric Boundaries**: Every single-document operation (`get`, `create`, `update`, `delete`) validates `isValidId(docId)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars). Every string and list property enforces strict `.size()` bounds matching `firebase-blueprint.json`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 — Privilege Escalation on User Registration**:
   `POST /users/user_123` with `{ "uid": "user_123", "role": "admin", ... }` by a non-admin user. -> **MUST DENY** (`role == 'resident'` enforced on self-registration).
2. **Payload 2 — Shadow Field Injection on House Inquiry**:
   `POST /houseInquiries/inq_1` with `{ ..., "isPriority": true }`. -> **MUST DENY** (`hasOnly` key allowlist rejects ghost fields).
3. **Payload 3 — Unverified Email Admin Spoof**:
   `POST /houses/house_99` by token `{ email: "wama93637@gmail.com", email_verified: false }`. -> **MUST DENY** (`email_verified == true` required).
4. **Payload 4 — PII Cross-User Read on Users Collection**:
   `GET /users/victim_uid` by `attacker_uid`. -> **MUST DENY** (`request.auth.uid == userId || isAdmin()`).
5. **Payload 5 — Unfiltered List Query on Visit Bookings**:
   `LIST /visitBookings` without `where('userId', '==', auth.uid)` by non-admin. -> **MUST DENY** (`resource.data.userId == request.auth.uid || isAdmin()`).
6. **Payload 6 — Orphaned House Inquiry Creation**:
   `POST /houseInquiries/inq_2` referencing `houseId: "non_existent_house"`. -> **MUST DENY** (`exists(/databases/$(database)/documents/houses/$(incoming().houseId))`).
7. **Payload 7 — Identity Spoofing on Gym Inquiry**:
   `POST /gymInquiries/gym_1` where `incoming().userId != request.auth.uid`. -> **MUST DENY**.
8. **Payload 8 — Terminal State Re-opening Attack**:
   `PATCH /visitBookings/book_1` changing `status` from `'Completed'` back to `'Pending'` by non-admin. -> **MUST DENY** (`existing().status != 'Completed'`).
9. **Payload 9 — Immortal Field Tampering (`createdAt`)**:
   `PATCH /users/user_123` modifying `createdAt` to a new timestamp. -> **MUST DENY** (`incoming().createdAt == existing().createdAt`).
10. **Payload 10 — Denial of Wallet ID Poisoning**:
    `POST /contactMessages/invalid$id!with@spaces` -> **MUST DENY** (`isValidId(messageId)`).
11. **Payload 11 — Unbounded Array Overflow on Favorites**:
    `PATCH /users/user_123` setting `favoriteHouseIds` to an array of 25 items (max 20) or non-string first item. -> **MUST DENY**.
12. **Payload 12 — Value Poisoning on Whitelisted Update Key**:
    `PATCH /users/user_123` updating `fullName` with a 5,000-character string or numeric value. -> **MUST DENY** (`isValidUserProfile(incoming())` wraps the entire update block).
