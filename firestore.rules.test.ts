/**
 * Firestore Security Rules Specification Test Suite
 * Verifies that all Dirty Dozen attack payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  { id: 1, name: 'Privilege Escalation on User Registration (role: admin)', collection: 'users', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 2, name: 'Shadow Field Injection on House Inquiry (isPriority: true)', collection: 'houseInquiries', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 3, name: 'Unverified Email Admin Spoof', collection: 'houses', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 4, name: 'PII Cross-User Read on Users Collection', collection: 'users', operation: 'get', expectedResult: 'PERMISSION_DENIED' },
  { id: 5, name: 'Unfiltered List Query on Visit Bookings', collection: 'visitBookings', operation: 'list', expectedResult: 'PERMISSION_DENIED' },
  { id: 6, name: 'Orphaned House Inquiry Creation (missing parent house)', collection: 'houseInquiries', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 7, name: 'Identity Spoofing on Gym Inquiry (userId mismatch)', collection: 'gymInquiries', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 8, name: 'Terminal State Re-opening Attack on Completed Booking', collection: 'visitBookings', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 9, name: 'Immortal Field Tampering (createdAt mutation)', collection: 'users', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 10, name: 'Denial of Wallet ID Poisoning', collection: 'contactMessages', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 11, name: 'Unbounded Array Overflow on Favorite Houses (>20 items)', collection: 'users', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 12, name: 'Value Poisoning on Whitelisted Update Key (oversized fullName)', collection: 'users', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
];
