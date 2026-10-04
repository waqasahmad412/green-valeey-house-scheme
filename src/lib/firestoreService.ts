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
  where,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  Amenity,
  Announcement,
  ContactMessage,
  GalleryItem,
  GymInquiry,
  House,
  HouseInquiry,
  Park,
  SocietySettings,
  UserProfile,
  VisitBooking,
  VisitorLog,
} from '../types/society';
import {
  INITIAL_AMENITIES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_GALLERY,
  INITIAL_HOUSES,
  INITIAL_PARKS,
  INITIAL_SOCIETY_SETTINGS,
} from '../data/initialSocietyData';

// Defensive payload sanitization helpers matching firebase-blueprint.json
function sanitizeId(raw: string): string {
  const cleaned = (raw || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

function clampString(val: string, maxLen: number, fallback = ''): string {
  const trimmed = (val ?? fallback).trim();
  const effective = trimmed.length > 0 ? trimmed : fallback;
  return effective.slice(0, maxLen);
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'wama93637@gmail.com';

let catalogSeededInFirestore = false;

export function isUserVerifiedAdmin(
  email?: string | null,
  emailVerified?: boolean,
  profileRole?: string
): boolean {
  if (email && email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  if (!emailVerified) return false;
  return profileRole === 'admin';
}

// ============================================================================
// 1. USER PROFILE SERVICES
// ============================================================================
export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName?: string | null,
  phoneInput?: string
): Promise<UserProfile> {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}`;
  try {
    const userRef = doc(db, 'users', safeUid);
    const snap = await getDoc(userRef);
    const isAdminEmail =
      email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      return {
        ...data,
        role: isAdminEmail ? 'admin' : data.role,
      };
    }

    const newProfile: UserProfile = {
      uid: safeUid,
      fullName: clampString(displayName || email.split('@')[0] || 'Resident', 100, 'Resident'),
      email: clampString(email, 150, 'resident@example.com'),
      phone: clampString(phoneInput || '', 30, ''),
      role: isAdminEmail ? 'admin' : 'resident',
      status: 'active',
      favoriteHouseIds: [],
    };

    if (auth.currentUser && (auth.currentUser.emailVerified || isAdminEmail)) {
      await setDoc(userRef, {
        ...newProfile,
        role: isAdminEmail ? 'admin' : 'resident',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (isAdminEmail) {
        await setDoc(doc(db, 'admins', safeUid), {
          uid: safeUid,
          email: clampString(email, 150, ''),
          grantedAt: serverTimestamp(),
        });
      }
    }

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileDetails(
  uid: string,
  updates: { fullName: string; phone: string; favoriteHouseIds: string[] }
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}`;
  try {
    await updateDoc(doc(db, 'users', safeUid), {
      fullName: clampString(updates.fullName, 100, 'Resident'),
      phone: clampString(updates.phone, 30, ''),
      favoriteHouseIds: updates.favoriteHouseIds
        .slice(0, 20)
        .map((id) => clampString(id, 128)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// 2. SEEDING INITIAL PUBLIC CATALOG (ADMIN ONLY)
// ============================================================================
export async function seedInitialCatalogIfNeeded(forceReset = false): Promise<void> {
  if (!auth.currentUser) return;
  const email = auth.currentUser.email || '';
  const isAdmin =
    email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ||
    Boolean(auth.currentUser.emailVerified);
  if (!isAdmin) return;

  try {
    const settingsRef = doc(db, 'societySettings', INITIAL_SOCIETY_SETTINGS.id);
    const settingsSnap = await getDoc(settingsRef);

    // If societySettings/global_settings already exists and forceReset is false,
    // the database has already been initialized—do not re-seed deleted items!
    if (settingsSnap.exists() && !forceReset) {
      catalogSeededInFirestore = true;
      const data = settingsSnap.data() as SocietySettings;
      if (data.contactPhone === '+92 (300) 842-9900') {
        await updateDoc(settingsRef, {
          contactPhone: '03298271687',
          updatedAt: serverTimestamp(),
        });
      }
      return;
    }

    await setDoc(settingsRef, {
      ...INITIAL_SOCIETY_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    const housesSnap = await getDocs(collection(db, 'houses'));
    if (housesSnap.empty || forceReset) {
      for (const h of INITIAL_HOUSES) {
        await setDoc(doc(db, 'houses', h.id), {
          ...h,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    const parksSnap = await getDocs(collection(db, 'parks'));
    if (parksSnap.empty || forceReset) {
      for (const p of INITIAL_PARKS) {
        await setDoc(doc(db, 'parks', p.id), {
          ...p,
          updatedAt: serverTimestamp(),
        });
      }
    }

    const amenitiesSnap = await getDocs(collection(db, 'amenities'));
    if (amenitiesSnap.empty || forceReset) {
      for (const a of INITIAL_AMENITIES) {
        await setDoc(doc(db, 'amenities', a.id), {
          ...a,
          updatedAt: serverTimestamp(),
        });
      }
    }

    const annSnap = await getDocs(collection(db, 'announcements'));
    if (annSnap.empty || forceReset) {
      for (const ann of INITIAL_ANNOUNCEMENTS) {
        await setDoc(doc(db, 'announcements', ann.id), {
          ...ann,
          createdAt: serverTimestamp(),
        });
      }
    }

    const galSnap = await getDocs(collection(db, 'gallery'));
    if (galSnap.empty || forceReset) {
      for (const g of INITIAL_GALLERY) {
        await setDoc(doc(db, 'gallery', g.id), {
          ...g,
          createdAt: serverTimestamp(),
        });
      }
    }

    catalogSeededInFirestore = true;
  } catch (error) {
    console.warn('Catalog seed skipped or already populated:', error);
  }
}

// ============================================================================
// 3. PUBLIC CATALOG LISTENERS
// ============================================================================
export function subscribePublicCatalog(callbacks: {
  onHouses: (houses: House[]) => void;
  onParks: (parks: Park[]) => void;
  onAmenities: (amenities: Amenity[]) => void;
  onAnnouncements: (announcements: Announcement[]) => void;
  onGallery: (gallery: GalleryItem[]) => void;
  onSettings: (settings: SocietySettings) => void;
}): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      doc(db, 'societySettings', INITIAL_SOCIETY_SETTINGS.id),
      (snap) => {
        if (snap.exists()) {
          catalogSeededInFirestore = true;
          const s = snap.data() as SocietySettings;
          if (s.contactPhone === '+92 (300) 842-9900') {
            s.contactPhone = '03298271687';
          }
          callbacks.onSettings(s);
        } else {
          callbacks.onSettings(INITIAL_SOCIETY_SETTINGS);
        }
      },
      () => callbacks.onSettings(INITIAL_SOCIETY_SETTINGS)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'houses'),
      (snap) => {
        if (!snap.empty || catalogSeededInFirestore) {
          const list = snap.docs.map((d) => d.data() as House);
          list.sort((a, b) => a.houseNumber.localeCompare(b.houseNumber));
          callbacks.onHouses(list);
        } else {
          callbacks.onHouses(INITIAL_HOUSES);
        }
      },
      () => callbacks.onHouses(INITIAL_HOUSES)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'parks'),
      (snap) => {
        if (!snap.empty || catalogSeededInFirestore) {
          callbacks.onParks(snap.docs.map((d) => d.data() as Park));
        } else {
          callbacks.onParks(INITIAL_PARKS);
        }
      },
      () => callbacks.onParks(INITIAL_PARKS)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'amenities'),
      (snap) => {
        if (!snap.empty || catalogSeededInFirestore) {
          callbacks.onAmenities(snap.docs.map((d) => d.data() as Amenity));
        } else {
          callbacks.onAmenities(INITIAL_AMENITIES);
        }
      },
      () => callbacks.onAmenities(INITIAL_AMENITIES)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        if (!snap.empty || catalogSeededInFirestore) {
          callbacks.onAnnouncements(snap.docs.map((d) => d.data() as Announcement));
        } else {
          callbacks.onAnnouncements(INITIAL_ANNOUNCEMENTS);
        }
      },
      () => callbacks.onAnnouncements(INITIAL_ANNOUNCEMENTS)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'gallery'),
      (snap) => {
        if (!snap.empty || catalogSeededInFirestore) {
          callbacks.onGallery(snap.docs.map((d) => d.data() as GalleryItem));
        } else {
          callbacks.onGallery(INITIAL_GALLERY);
        }
      },
      () => callbacks.onGallery(INITIAL_GALLERY)
    )
  );

  return () => unsubs.forEach((u) => u());
}

// ============================================================================
// 4. AUTHENTICATED USER SUBSCRIPTIONS (STRICT QUERY ENFORCER)
// ============================================================================
export function subscribeUserPrivateRecords(
  uid: string,
  isAdmin: boolean,
  callbacks: {
    onHouseInquiries: (items: HouseInquiry[]) => void;
    onVisitBookings: (items: VisitBooking[]) => void;
    onGymInquiries: (items: GymInquiry[]) => void;
    onVisitorLogs: (items: VisitorLog[]) => void;
    onContactMessages?: (items: ContactMessage[]) => void;
    onAllUsers?: (items: UserProfile[]) => void;
  }
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];
  const safeUid = sanitizeId(uid);

  const inqQuery = isAdmin
    ? collection(db, 'houseInquiries')
    : query(collection(db, 'houseInquiries'), where('userId', '==', safeUid));
  unsubs.push(
    onSnapshot(
      inqQuery,
      (snap) => callbacks.onHouseInquiries(snap.docs.map((d) => d.data() as HouseInquiry)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'houseInquiries')
    )
  );

  const bookQuery = isAdmin
    ? collection(db, 'visitBookings')
    : query(collection(db, 'visitBookings'), where('userId', '==', safeUid));
  unsubs.push(
    onSnapshot(
      bookQuery,
      (snap) => callbacks.onVisitBookings(snap.docs.map((d) => d.data() as VisitBooking)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'visitBookings')
    )
  );

  const gymQuery = isAdmin
    ? collection(db, 'gymInquiries')
    : query(collection(db, 'gymInquiries'), where('userId', '==', safeUid));
  unsubs.push(
    onSnapshot(
      gymQuery,
      (snap) => callbacks.onGymInquiries(snap.docs.map((d) => d.data() as GymInquiry)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'gymInquiries')
    )
  );

  const visitorQuery = isAdmin
    ? collection(db, 'visitorLogs')
    : query(collection(db, 'visitorLogs'), where('userId', '==', safeUid));
  unsubs.push(
    onSnapshot(
      visitorQuery,
      (snap) => callbacks.onVisitorLogs(snap.docs.map((d) => d.data() as VisitorLog)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'visitorLogs')
    )
  );

  if (isAdmin && callbacks.onContactMessages) {
    unsubs.push(
      onSnapshot(
        collection(db, 'contactMessages'),
        (snap) => callbacks.onContactMessages!(snap.docs.map((d) => d.data() as ContactMessage)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'contactMessages')
      )
    );
  }

  if (isAdmin && callbacks.onAllUsers) {
    unsubs.push(
      onSnapshot(
        collection(db, 'users'),
        (snap) => callbacks.onAllUsers!(snap.docs.map((d) => d.data() as UserProfile)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      )
    );
  }

  return () => unsubs.forEach((u) => u());
}

// ============================================================================
// 5. FORM MUTATION SERVICES (WITH VOLUMETRIC ENFORCEMENT)
// ============================================================================

export async function submitHouseInquiry(payload: {
  userId: string;
  houseId: string;
  houseNumber: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
}): Promise<void> {
  const id = sanitizeId(`hinq_${Date.now()}`);
  const path = `houseInquiries/${id}`;
  try {
    const houseRef = doc(db, 'houses', sanitizeId(payload.houseId));
    const houseSnap = await getDoc(houseRef);
    if (!houseSnap.exists()) {
      throw new Error(
        'Selected property record must be synchronized in Firestore by an Administrator first.'
      );
    }

    await setDoc(doc(db, 'houseInquiries', id), {
      id,
      userId: sanitizeId(payload.userId),
      houseId: sanitizeId(payload.houseId),
      houseNumber: clampString(payload.houseNumber, 30, 'GV-101'),
      fullName: clampString(payload.fullName, 100, 'Resident'),
      email: clampString(payload.email, 150, 'user@example.com'),
      phone: clampString(payload.phone, 30, ''),
      message: clampString(payload.message, 1500, 'Interested in property details.'),
      status: 'Pending',
      adminResponse: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitVisitBooking(payload: {
  userId: string;
  houseId: string;
  houseNumber: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}): Promise<void> {
  const id = sanitizeId(`visit_${Date.now()}`);
  const path = `visitBookings/${id}`;
  try {
    await setDoc(doc(db, 'visitBookings', id), {
      id,
      userId: sanitizeId(payload.userId),
      houseId: sanitizeId(payload.houseId),
      houseNumber: clampString(payload.houseNumber, 30, 'GV-101'),
      fullName: clampString(payload.fullName, 100, 'Resident'),
      email: clampString(payload.email, 150, 'user@example.com'),
      phone: clampString(payload.phone, 30, ''),
      preferredDate: clampString(payload.preferredDate, 30, ''),
      preferredTime: clampString(payload.preferredTime, 30, ''),
      notes: clampString(payload.notes, 1000, ''),
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitGymInquiry(payload: {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  preferredPlan: GymInquiry['preferredPlan'];
}): Promise<void> {
  const id = sanitizeId(`gym_${Date.now()}`);
  const path = `gymInquiries/${id}`;
  try {
    await setDoc(doc(db, 'gymInquiries', id), {
      id,
      userId: sanitizeId(payload.userId),
      fullName: clampString(payload.fullName, 100, 'Resident'),
      email: clampString(payload.email, 150, 'user@example.com'),
      phone: clampString(payload.phone, 30, ''),
      preferredPlan: payload.preferredPlan,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitVisitorLog(payload: {
  userId: string;
  visitorName: string;
  purpose: string;
  houseNumber: string;
  entryTime: string;
  exitTime: string;
  status: VisitorLog['status'];
}): Promise<void> {
  const id = sanitizeId(`vlog_${Date.now()}`);
  const path = `visitorLogs/${id}`;
  try {
    await setDoc(doc(db, 'visitorLogs', id), {
      id,
      userId: sanitizeId(payload.userId),
      visitorName: clampString(payload.visitorName, 100, 'Visitor'),
      purpose: clampString(payload.purpose, 200, 'Resident Guest'),
      houseNumber: clampString(payload.houseNumber, 30, 'GV-101'),
      entryTime: clampString(payload.entryTime, 50, ''),
      exitTime: clampString(payload.exitTime, 50, 'Active On-Site'),
      status: payload.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVisitorCheckout(
  logId: string,
  exitTime: string
): Promise<void> {
  const safeId = sanitizeId(logId);
  const path = `visitorLogs/${safeId}`;
  try {
    await updateDoc(doc(db, 'visitorLogs', safeId), {
      exitTime: clampString(exitTime, 50, 'Checked Out'),
      status: 'Checked-Out',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitContactMessage(payload: {
  userId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<void> {
  const id = sanitizeId(`msg_${Date.now()}`);
  const path = `contactMessages/${id}`;
  try {
    await setDoc(doc(db, 'contactMessages', id), {
      id,
      userId: sanitizeId(payload.userId),
      name: clampString(payload.name, 100, 'Visitor'),
      email: clampString(payload.email, 150, 'visitor@example.com'),
      phone: clampString(payload.phone, 30, ''),
      subject: clampString(payload.subject, 150, 'General Inquiry'),
      message: clampString(payload.message, 2000, 'Inquiry details'),
      status: 'Unread',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ============================================================================
// 6. COMPLETE ADMIN CRUD OPERATIONS FOR ALL 7 TABS
// ============================================================================

// --- TAB 1: VISITOR LOGS (ADD, EDIT, DELETE) ---
export async function saveVisitorLogAdmin(log: VisitorLog): Promise<void> {
  const safeId = sanitizeId(log.id || `vlog_${Date.now()}`);
  const path = `visitorLogs/${safeId}`;
  const adminUid = sanitizeId(auth.currentUser?.uid || log.userId || 'admin');
  try {
    const ref = doc(db, 'visitorLogs', safeId);
    const snap = await getDoc(ref);
    const basePayload = {
      id: safeId,
      visitorName: clampString(log.visitorName, 100, 'Visitor'),
      purpose: clampString(log.purpose, 200, 'Society Visit'),
      houseNumber: clampString(log.houseNumber, 30, 'GV-101'),
      entryTime: clampString(log.entryTime, 50, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
      exitTime: clampString(log.exitTime, 50, 'Active On-Site'),
      status: log.status || 'Checked-In',
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, {
        ...basePayload,
        userId: adminUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVisitorLogAdmin(logId: string): Promise<void> {
  const safeId = sanitizeId(logId);
  const path = `visitorLogs/${safeId}`;
  try {
    await deleteDoc(doc(db, 'visitorLogs', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TAB 2: HOUSES (ADD, EDIT, DELETE) ---
export async function saveHouseAdmin(house: House, _isNew?: boolean): Promise<void> {
  const safeId = sanitizeId(house.id || `house_gv_${Date.now()}`);
  const path = `houses/${safeId}`;
  try {
    const ref = doc(db, 'houses', safeId);
    const snap = await getDoc(ref);
    const basePayload = {
      id: safeId,
      houseNumber: clampString(house.houseNumber, 30, 'GV-100'),
      title: clampString(house.title, 120, 'Green Valley Residence'),
      houseType: house.houseType,
      plotSize: house.plotSize,
      bedrooms: Math.max(1, Math.min(20, Number(house.bedrooms) || 3)),
      bathrooms: Math.max(1, Math.min(20, Number(house.bathrooms) || 3)),
      kitchenDetails: clampString(house.kitchenDetails, 300, 'Modern fitted kitchen'),
      coveredAreaSqFt: Math.max(200, Math.min(50000, Number(house.coveredAreaSqFt) || 2000)),
      pricePKR: Math.max(100000, Number(house.pricePKR) || 25000000),
      availability: house.availability,
      sector: clampString(house.sector, 60, 'Sector A'),
      street: clampString(house.street, 60, 'Main Boulevard'),
      description: clampString(house.description, 2000, 'Luxury residence in Green Valley Residencia.'),
      floorPlanSummary: clampString(house.floorPlanSummary, 500, 'Standard luxury floor plan.'),
      images: (house.images && house.images.length > 0 ? house.images : [INITIAL_HOUSES[0].images[0]])
        .slice(0, 6)
        .map((url) => clampString(url, 500)),
      ...(house.coordinates3D ? { coordinates3D: house.coordinates3D } : {}),
      updatedAt: serverTimestamp(),
    };

    if (snap.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, {
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteHouseAdmin(houseId: string): Promise<void> {
  const safeId = sanitizeId(houseId);
  const path = `houses/${safeId}`;
  try {
    await deleteDoc(doc(db, 'houses', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TAB 3: VISIT BOOKINGS (ADD, EDIT, DELETE, STATUS) ---
export async function saveVisitBookingAdmin(booking: VisitBooking): Promise<void> {
  const safeId = sanitizeId(booking.id || `visit_${Date.now()}`);
  const path = `visitBookings/${safeId}`;
  const adminUid = sanitizeId(auth.currentUser?.uid || booking.userId || 'admin');
  try {
    const ref = doc(db, 'visitBookings', safeId);
    const snap = await getDoc(ref);
    const basePayload = {
      id: safeId,
      houseId: sanitizeId(booking.houseId || 'house_gv_101'),
      houseNumber: clampString(booking.houseNumber, 30, 'GV-101'),
      fullName: clampString(booking.fullName, 100, 'Visitor'),
      email: clampString(booking.email, 150, 'visitor@example.com'),
      phone: clampString(booking.phone, 30, ''),
      preferredDate: clampString(booking.preferredDate, 30, new Date().toISOString().slice(0, 10)),
      preferredTime: clampString(booking.preferredTime, 30, '11:00 AM'),
      notes: clampString(booking.notes, 1000, ''),
      status: booking.status || 'Pending',
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, {
        ...basePayload,
        userId: adminUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateVisitBookingStatusAdmin(
  bookingId: string,
  status: VisitBooking['status']
): Promise<void> {
  const safeId = sanitizeId(bookingId);
  const path = `visitBookings/${safeId}`;
  try {
    await updateDoc(doc(db, 'visitBookings', safeId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVisitBookingAdmin(bookingId: string): Promise<void> {
  const safeId = sanitizeId(bookingId);
  const path = `visitBookings/${safeId}`;
  try {
    await deleteDoc(doc(db, 'visitBookings', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TAB 4: INQUIRIES (HOUSE, GYM, CONTACT — ADD, EDIT, DELETE) ---
export async function saveHouseInquiryAdmin(inquiry: HouseInquiry): Promise<void> {
  const safeId = sanitizeId(inquiry.id || `hinq_${Date.now()}`);
  const path = `houseInquiries/${safeId}`;
  const adminUid = sanitizeId(auth.currentUser?.uid || inquiry.userId || 'admin');
  try {
    const ref = doc(db, 'houseInquiries', safeId);
    const snap = await getDoc(ref);
    const basePayload = {
      id: safeId,
      houseId: sanitizeId(inquiry.houseId || 'house_gv_101'),
      houseNumber: clampString(inquiry.houseNumber, 30, 'GV-101'),
      fullName: clampString(inquiry.fullName, 100, 'Buyer'),
      email: clampString(inquiry.email, 150, 'buyer@example.com'),
      phone: clampString(inquiry.phone, 30, ''),
      message: clampString(inquiry.message, 1500, 'Interested in property details.'),
      status: inquiry.status || 'Pending',
      adminResponse: clampString(inquiry.adminResponse, 1500, ''),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, {
        ...basePayload,
        userId: adminUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateHouseInquiryAdmin(
  inquiryId: string,
  status: HouseInquiry['status'],
  adminResponse: string
): Promise<void> {
  const safeId = sanitizeId(inquiryId);
  const path = `houseInquiries/${safeId}`;
  try {
    await updateDoc(doc(db, 'houseInquiries', safeId), {
      status,
      adminResponse: clampString(adminResponse, 1500, ''),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteHouseInquiryAdmin(inquiryId: string): Promise<void> {
  const safeId = sanitizeId(inquiryId);
  const path = `houseInquiries/${safeId}`;
  try {
    await deleteDoc(doc(db, 'houseInquiries', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveGymInquiryAdmin(inquiry: GymInquiry): Promise<void> {
  const safeId = sanitizeId(inquiry.id || `gym_${Date.now()}`);
  const path = `gymInquiries/${safeId}`;
  const adminUid = sanitizeId(auth.currentUser?.uid || inquiry.userId || 'admin');
  try {
    const ref = doc(db, 'gymInquiries', safeId);
    const snap = await getDoc(ref);
    const basePayload = {
      id: safeId,
      fullName: clampString(inquiry.fullName, 100, 'Member'),
      email: clampString(inquiry.email, 150, 'member@example.com'),
      phone: clampString(inquiry.phone, 30, ''),
      preferredPlan: inquiry.preferredPlan || 'Monthly Standard',
      status: inquiry.status || 'Pending',
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, {
        ...basePayload,
        userId: adminUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateGymInquiryStatusAdmin(
  inquiryId: string,
  status: GymInquiry['status']
): Promise<void> {
  const safeId = sanitizeId(inquiryId);
  const path = `gymInquiries/${safeId}`;
  try {
    await updateDoc(doc(db, 'gymInquiries', safeId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteGymInquiryAdmin(inquiryId: string): Promise<void> {
  const safeId = sanitizeId(inquiryId);
  const path = `gymInquiries/${safeId}`;
  try {
    await deleteDoc(doc(db, 'gymInquiries', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveContactMessageAdmin(msg: ContactMessage): Promise<void> {
  const safeId = sanitizeId(msg.id || `msg_${Date.now()}`);
  const path = `contactMessages/${safeId}`;
  const adminUid = sanitizeId(auth.currentUser?.uid || msg.userId || 'admin');
  try {
    const ref = doc(db, 'contactMessages', safeId);
    const snap = await getDoc(ref);
    const basePayload = {
      id: safeId,
      name: clampString(msg.name, 100, 'Visitor'),
      email: clampString(msg.email, 150, 'visitor@example.com'),
      phone: clampString(msg.phone, 30, ''),
      subject: clampString(msg.subject, 150, 'General Inquiry'),
      message: clampString(msg.message, 2000, 'Inquiry details'),
      status: msg.status || 'Unread',
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, {
        ...basePayload,
        userId: adminUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteContactMessageAdmin(msgId: string): Promise<void> {
  const safeId = sanitizeId(msgId);
  const path = `contactMessages/${safeId}`;
  try {
    await deleteDoc(doc(db, 'contactMessages', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TAB 5: PARKS, AMENITIES, ANNOUNCEMENTS & GALLERY (ADD, EDIT, DELETE) ---
export async function saveParkAdmin(park: Park): Promise<void> {
  const safeId = sanitizeId(park.id || `park_${Date.now()}`);
  const path = `parks/${safeId}`;
  try {
    await setDoc(doc(db, 'parks', safeId), {
      id: safeId,
      name: clampString(park.name, 120, 'Green Valley Park'),
      sector: clampString(park.sector, 80, 'Sector A'),
      areaSize: clampString(park.areaSize, 60, '10 Kanals'),
      openingHours: clampString(park.openingHours, 100, '06:00 AM – 10:00 PM'),
      description: clampString(park.description, 1500, 'Landscaped community park.'),
      facilities: (park.facilities || [])
        .filter((f) => f.trim().length > 0)
        .slice(0, 10)
        .map((f) => clampString(f, 500)),
      imageUrl: clampString(park.imageUrl, 500, INITIAL_PARKS[0].imageUrl),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteParkAdmin(parkId: string): Promise<void> {
  const safeId = sanitizeId(parkId);
  const path = `parks/${safeId}`;
  try {
    await deleteDoc(doc(db, 'parks', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAmenityAdmin(amenity: Amenity): Promise<void> {
  const safeId = sanitizeId(amenity.id || `amenity_${Date.now()}`);
  const path = `amenities/${safeId}`;
  try {
    await setDoc(doc(db, 'amenities', safeId), {
      id: safeId,
      name: clampString(amenity.name, 120, 'Community Amenity'),
      category: amenity.category || 'Community',
      openingHours: clampString(amenity.openingHours, 100, '06:00 AM – 11:00 PM'),
      description: clampString(amenity.description, 1500, 'World-class facility.'),
      highlights: (amenity.highlights || [])
        .filter((h) => h.trim().length > 0)
        .slice(0, 10)
        .map((h) => clampString(h, 500)),
      imageUrl: clampString(amenity.imageUrl, 500, INITIAL_AMENITIES[0].imageUrl),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAmenityAdmin(amenityId: string): Promise<void> {
  const safeId = sanitizeId(amenityId);
  const path = `amenities/${safeId}`;
  try {
    await deleteDoc(doc(db, 'amenities', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAnnouncementAdmin(payload: {
  id?: string;
  title: string;
  category: Announcement['category'];
  content: string;
  priority: Announcement['priority'];
  publishedDate?: string;
}): Promise<void> {
  const safeId = sanitizeId(payload.id || `ann_${Date.now()}`);
  const path = `announcements/${safeId}`;
  try {
    const ref = doc(db, 'announcements', safeId);
    const snap = await getDoc(ref);
    const baseFields = {
      id: safeId,
      title: clampString(payload.title, 150, 'Community Notice'),
      category: payload.category,
      content: clampString(payload.content, 2000, 'Community update details.'),
      priority: payload.priority,
      publishedDate: clampString(
        payload.publishedDate ||
          new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        40,
        'October 2026'
      ),
    };
    if (snap.exists()) {
      await updateDoc(ref, baseFields);
    } else {
      await setDoc(ref, {
        ...baseFields,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function publishAnnouncementAdmin(payload: {
  title: string;
  category: Announcement['category'];
  content: string;
  priority: Announcement['priority'];
}): Promise<void> {
  return saveAnnouncementAdmin(payload);
}

export async function deleteAnnouncementAdmin(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `announcements/${safeId}`;
  try {
    await deleteDoc(doc(db, 'announcements', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveGalleryItemAdmin(payload: {
  id?: string;
  title: string;
  category: GalleryItem['category'];
  caption: string;
  imageUrl: string;
}): Promise<void> {
  const safeId = sanitizeId(payload.id || `gal_${Date.now()}`);
  const path = `gallery/${safeId}`;
  try {
    const ref = doc(db, 'gallery', safeId);
    const snap = await getDoc(ref);
    const baseFields = {
      id: safeId,
      title: clampString(payload.title, 120, 'Green Valley View'),
      category: payload.category,
      caption: clampString(payload.caption, 400, ''),
      imageUrl: clampString(payload.imageUrl, 500, INITIAL_GALLERY[0].imageUrl),
    };
    if (snap.exists()) {
      await updateDoc(ref, baseFields);
    } else {
      await setDoc(ref, {
        ...baseFields,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addGalleryItemAdmin(payload: {
  title: string;
  category: GalleryItem['category'];
  caption: string;
  imageUrl: string;
}): Promise<void> {
  return saveGalleryItemAdmin(payload);
}

export async function deleteGalleryItemAdmin(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `gallery/${safeId}`;
  try {
    await deleteDoc(doc(db, 'gallery', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TAB 6: USERS (ADD, EDIT, DELETE, ROLE/STATUS) ---
export async function saveUserProfileAdmin(user: UserProfile): Promise<void> {
  const safeUid = sanitizeId(user.uid || `user_${Date.now()}`);
  const path = `users/${safeUid}`;
  try {
    const ref = doc(db, 'users', safeUid);
    const snap = await getDoc(ref);
    const basePayload = {
      uid: safeUid,
      fullName: clampString(user.fullName, 100, 'Resident'),
      email: clampString(user.email, 150, 'resident@example.com'),
      phone: clampString(user.phone, 30, ''),
      role: user.role || 'resident',
      status: user.status || 'active',
      favoriteHouseIds: (user.favoriteHouseIds || [])
        .slice(0, 20)
        .map((id) => clampString(id, 128)),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, {
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    }

    if (user.role === 'admin') {
      await setDoc(doc(db, 'admins', safeUid), {
        uid: safeUid,
        email: clampString(user.email, 150, 'admin@example.com'),
        grantedAt: serverTimestamp(),
      });
    } else {
      const adminRef = doc(db, 'admins', safeUid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        await deleteDoc(adminRef);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserRoleOrStatusAdmin(
  targetUser: UserProfile,
  role: 'resident' | 'admin',
  status: 'active' | 'suspended'
): Promise<void> {
  return saveUserProfileAdmin({
    ...targetUser,
    role,
    status,
  });
}

export async function deleteUserProfileAdmin(uid: string): Promise<void> {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid));
    const adminRef = doc(db, 'admins', safeUid);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      await deleteDoc(adminRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TAB 7: WEBSITE SETTINGS (SAVE / UPDATE / RESET) ---
export async function saveSocietySettingsAdmin(
  settings: SocietySettings
): Promise<void> {
  const safeId = sanitizeId(settings.id || 'global_settings');
  const path = `societySettings/${safeId}`;
  try {
    await setDoc(doc(db, 'societySettings', safeId), {
      id: safeId,
      heroHeading: clampString(settings.heroHeading, 160, 'Your Dream Home in a Green Environment'),
      heroDescription: clampString(settings.heroDescription, 500, ''),
      totalHouses: Math.max(0, Number(settings.totalHouses) || 0),
      availableHouses: Math.max(0, Number(settings.availableHouses) || 0),
      totalParks: Math.max(0, Number(settings.totalParks) || 0),
      gymFacilitiesCount: Math.max(0, Number(settings.gymFacilitiesCount) || 0),
      securityCheckpoints: Math.max(0, Number(settings.securityCheckpoints) || 0),
      communityFacilities: Math.max(0, Number(settings.communityFacilities) || 0),
      officeAddress: clampString(settings.officeAddress, 250, ''),
      contactPhone: clampString(settings.contactPhone, 40, ''),
      contactEmail: clampString(settings.contactEmail, 150, ''),
      emergencyPhone: clampString(settings.emergencyPhone, 40, ''),
      mapCoordinatesConfigured: Boolean(settings.mapCoordinatesConfigured),
      mapSectorNote: clampString(settings.mapSectorNote, 250, ''),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
