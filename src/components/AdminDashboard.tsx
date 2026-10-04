import React, { useState } from 'react';
import {
  ShieldCheck,
  Home,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import {
  Amenity,
  Announcement,
  AvailabilityStatus,
  ContactMessage,
  GalleryItem,
  GymInquiry,
  House,
  HouseInquiry,
  HouseType,
  Park,
  SocietySettings,
  UserProfile,
  VisitBooking,
  VisitorLog,
} from '../types/society';
import {
  deleteContactMessageAdmin,
  deleteGymInquiryAdmin,
  deleteHouseAdmin,
  deleteHouseInquiryAdmin,
  deleteVisitBookingAdmin,
  deleteVisitorLogAdmin,
  saveContactMessageAdmin,
  saveGymInquiryAdmin,
  saveHouseAdmin,
  saveHouseInquiryAdmin,
  saveVisitBookingAdmin,
  saveVisitorLogAdmin,
  seedInitialCatalogIfNeeded,
  updateGymInquiryStatusAdmin,
  updateHouseInquiryAdmin,
  updateVisitBookingStatusAdmin,
} from '../lib/firestoreService';
import { uploadSocietyImage } from '../lib/firebase';
import { GENERATED_IMAGES } from '../data/initialSocietyData';
import {
  AdminTab5AmenitiesGallery,
  AdminTab6Users,
  AdminTab7Settings,
} from './AdminAmenitiesAndUsersTabs';

interface AdminDashboardProps {
  houses: House[];
  parks: Park[];
  amenities: Amenity[];
  allUsers: UserProfile[];
  houseInquiries: HouseInquiry[];
  visitBookings: VisitBooking[];
  gymInquiries: GymInquiry[];
  visitorLogs: VisitorLog[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  contactMessages: ContactMessage[];
  settings: SocietySettings;
  onHousesChange?: (updater: (prev: House[]) => House[]) => void;
  onParksChange?: (updater: (prev: Park[]) => Park[]) => void;
  onAmenitiesChange?: (updater: (prev: Amenity[]) => Amenity[]) => void;
  onAnnouncementsChange?: (updater: (prev: Announcement[]) => Announcement[]) => void;
  onGalleryChange?: (updater: (prev: GalleryItem[]) => GalleryItem[]) => void;
  onAllUsersChange?: (updater: (prev: UserProfile[]) => UserProfile[]) => void;
  onVisitBookingsChange?: (updater: (prev: VisitBooking[]) => VisitBooking[]) => void;
  onInquiriesChange?: (updater: (prev: HouseInquiry[]) => HouseInquiry[]) => void;
  onGymInquiriesChange?: (updater: (prev: GymInquiry[]) => GymInquiry[]) => void;
  onContactMessagesChange?: (updater: (prev: ContactMessage[]) => ContactMessage[]) => void;
  onVisitorLogsChange?: (updater: (prev: VisitorLog[]) => VisitorLog[]) => void;
  onSettingsChange?: (settings: SocietySettings) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  houses,
  parks,
  amenities,
  allUsers,
  houseInquiries,
  visitBookings,
  gymInquiries,
  visitorLogs,
  announcements,
  gallery,
  contactMessages,
  settings,
  onHousesChange,
  onParksChange,
  onAmenitiesChange,
  onAnnouncementsChange,
  onGalleryChange,
  onAllUsersChange,
  onVisitBookingsChange,
  onInquiriesChange,
  onGymInquiriesChange,
  onContactMessagesChange,
  onVisitorLogsChange,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'houses'
    | 'bookings'
    | 'inquiries'
    | 'announcements'
    | 'users'
    | 'settings'
  >('overview');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Tab 1: Visitor Log Form State
  const [editingVisitor, setEditingVisitor] = useState<VisitorLog | null>(null);

  // Tab 2: House Form State
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [isNewHouse, setIsNewHouse] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Tab 3: Visit Booking Form State
  const [editingBooking, setEditingBooking] = useState<VisitBooking | null>(null);

  // Tab 4: Inquiries Form States (House, Gym, Contact)
  const [editingHouseInq, setEditingHouseInq] = useState<HouseInquiry | null>(null);
  const [editingGymInq, setEditingGymInq] = useState<GymInquiry | null>(null);
  const [editingContactMsg, setEditingContactMsg] = useState<ContactMessage | null>(null);
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});

  const availableCount = houses.filter((h) => h.availability === 'Available').length;
  const occupiedOrReservedCount = houses.length - availableCount;
  const pendingInquiriesCount = houseInquiries.filter((i) => i.status === 'Pending').length;
  const pendingBookingsCount = visitBookings.filter((b) => b.status === 'Pending').length;

  // --- TAB 1 HANDLERS ---
  const startNewVisitorLog = () => {
    setEditingVisitor({
      id: `vlog_${Date.now()}`,
      userId: 'admin',
      visitorName: '',
      purpose: 'Property Inspection / Guest Visit',
      houseNumber: houses[0]?.houseNumber || 'GV-101',
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exitTime: 'Active On-Site',
      status: 'Checked-In',
    });
  };

  const handleSaveVisitorLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisitor) return;
    const updated = { ...editingVisitor };

    if (onVisitorLogsChange) {
      onVisitorLogsChange((prev) => {
        const idx = prev.findIndex((v) => v.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveVisitorLogAdmin(updated);
      setStatusBanner(`Saved visitor log for "${updated.visitorName}" successfully.`);
    } catch (err) {
      setStatusBanner(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingVisitor(null);
  };

  const handleDeleteVisitorLog = async (logId: string, name: string) => {
    if (onVisitorLogsChange) {
      onVisitorLogsChange((prev) => prev.filter((v) => v.id !== logId));
    }
    try {
      await deleteVisitorLogAdmin(logId);
      setStatusBanner(`Deleted visitor log for "${name}".`);
    } catch (err) {
      setStatusBanner(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // --- TAB 2 HANDLERS ---
  const startNewHouse = () => {
    setIsNewHouse(true);
    setEditingHouse({
      id: `house_gv_${Date.now()}`,
      houseNumber: `GV-${100 + houses.length + 1}`,
      title: 'New Emerald Residence',
      houseType: '10 Marla',
      plotSize: '10 Marla',
      bedrooms: 4,
      bathrooms: 5,
      kitchenDetails: 'Contemporary modular chef kitchen with quartz island.',
      coveredAreaSqFt: 3600,
      pricePKR: 52000000,
      availability: 'Available',
      sector: 'Sector B - Park View',
      street: 'Cypress Avenue',
      description: 'Newly constructed luxury residence in Green Valley Residencia.',
      floorPlanSummary:
        'Ground Floor: 2-Car Porch, Lounge, Kitchen, 1 Bed. First Floor: 3 En-Suite Beds.',
      images: [GENERATED_IMAGES.villaTenMarla],
    });
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHouse) return;
    const updated = { ...editingHouse };

    // Optimistic UI update
    if (onHousesChange) {
      onHousesChange((prev) => {
        const idx = prev.findIndex((h) => h.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveHouseAdmin(updated, isNewHouse);
      setStatusBanner(`Saved property ${updated.houseNumber} successfully.`);
    } catch (err) {
      setStatusBanner(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingHouse(null);
  };

  const handleDeleteHouse = async (houseId: string, houseNumber: string) => {
    // Optimistic delete
    if (onHousesChange) {
      onHousesChange((prev) => prev.filter((h) => h.id !== houseId));
    }
    try {
      await deleteHouseAdmin(houseId);
      setStatusBanner(`Deleted property ${houseNumber} from Firestore.`);
    } catch (err) {
      setStatusBanner(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingHouse) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadSocietyImage(file, 'houses');
      setEditingHouse({
        ...editingHouse,
        images: [url, ...editingHouse.images].slice(0, 6),
      });
      setStatusBanner('Photograph uploaded to Firebase Storage.');
    } catch (err) {
      setStatusBanner(`Upload note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // --- TAB 3 HANDLERS ---
  const startNewBooking = () => {
    const firstHouse = houses[0];
    setEditingBooking({
      id: `visit_${Date.now()}`,
      userId: 'admin',
      houseId: firstHouse?.id || 'house_gv_101',
      houseNumber: firstHouse?.houseNumber || 'GV-101',
      fullName: '',
      email: '',
      phone: '+92 329 8271687',
      preferredDate: new Date().toISOString().slice(0, 10),
      preferredTime: '11:00 AM',
      notes: 'Scheduled site tour with sales concierge.',
      status: 'Approved',
    });
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    const updated = { ...editingBooking };

    if (onVisitBookingsChange) {
      onVisitBookingsChange((prev) => {
        const idx = prev.findIndex((b) => b.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveVisitBookingAdmin(updated);
      setStatusBanner(`Saved visit booking for ${updated.fullName} successfully.`);
    } catch (err) {
      setStatusBanner(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingBooking(null);
  };

  const handleDeleteBooking = async (bookingId: string, name: string) => {
    if (onVisitBookingsChange) {
      onVisitBookingsChange((prev) => prev.filter((b) => b.id !== bookingId));
    }
    try {
      await deleteVisitBookingAdmin(bookingId);
      setStatusBanner(`Deleted visit booking for ${name}.`);
    } catch (err) {
      setStatusBanner(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // --- TAB 4 HANDLERS ---
  const startNewHouseInquiry = () => {
    const firstHouse = houses[0];
    setEditingHouseInq({
      id: `hinq_${Date.now()}`,
      userId: 'admin',
      houseId: firstHouse?.id || 'house_gv_101',
      houseNumber: firstHouse?.houseNumber || 'GV-101',
      fullName: '',
      email: '',
      phone: '+92 329 8271687',
      message: 'Requesting payment plan and possession details.',
      status: 'Pending',
      adminResponse: '',
    });
  };

  const handleSaveHouseInq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHouseInq) return;
    const updated = { ...editingHouseInq };

    if (onInquiriesChange) {
      onInquiriesChange((prev) => {
        const idx = prev.findIndex((i) => i.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveHouseInquiryAdmin(updated);
      setStatusBanner(`Saved house inquiry for ${updated.fullName} successfully.`);
    } catch (err) {
      setStatusBanner(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingHouseInq(null);
  };

  const handleDeleteHouseInquiry = async (inquiryId: string, name: string) => {
    if (onInquiriesChange) {
      onInquiriesChange((prev) => prev.filter((i) => i.id !== inquiryId));
    }
    try {
      await deleteHouseInquiryAdmin(inquiryId);
      setStatusBanner(`Deleted house inquiry from ${name}.`);
    } catch (err) {
      setStatusBanner(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startNewGymInquiry = () => {
    setEditingGymInq({
      id: `gym_${Date.now()}`,
      userId: 'admin',
      fullName: '',
      email: '',
      phone: '+92 329 8271687',
      preferredPlan: 'Monthly Standard',
      status: 'Pending',
    });
  };

  const handleSaveGymInq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGymInq) return;
    const updated = { ...editingGymInq };

    if (onGymInquiriesChange) {
      onGymInquiriesChange((prev) => {
        const idx = prev.findIndex((g) => g.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveGymInquiryAdmin(updated);
      setStatusBanner(`Saved gym inquiry for ${updated.fullName} successfully.`);
    } catch (err) {
      setStatusBanner(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingGymInq(null);
  };

  const handleDeleteGymInquiry = async (inquiryId: string, name: string) => {
    if (onGymInquiriesChange) {
      onGymInquiriesChange((prev) => prev.filter((g) => g.id !== inquiryId));
    }
    try {
      await deleteGymInquiryAdmin(inquiryId);
      setStatusBanner(`Deleted gym inquiry for ${name}.`);
    } catch (err) {
      setStatusBanner(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startNewContactMsg = () => {
    setEditingContactMsg({
      id: `msg_${Date.now()}`,
      userId: 'admin',
      name: '',
      email: '',
      phone: '+92 329 8271687',
      subject: 'General Colony Inquiry',
      message: '',
      status: 'Unread',
    });
  };

  const handleSaveContactMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContactMsg) return;
    const updated = { ...editingContactMsg };

    if (onContactMessagesChange) {
      onContactMessagesChange((prev) => {
        const idx = prev.findIndex((m) => m.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveContactMessageAdmin(updated);
      setStatusBanner(`Saved contact message from ${updated.name} successfully.`);
    } catch (err) {
      setStatusBanner(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingContactMsg(null);
  };

  const handleDeleteContactMessage = async (msgId: string, name: string) => {
    if (onContactMessagesChange) {
      onContactMessagesChange((prev) => prev.filter((m) => m.id !== msgId));
    }
    try {
      await deleteContactMessageAdmin(msgId);
      setStatusBanner(`Deleted message from ${name}.`);
    } catch (err) {
      setStatusBanner(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <section className="py-12 bg-[#0B1724] min-h-[85vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        {/* Admin Header */}
        <div className="bg-[#071827] border border-[#22C55E]/30 rounded-xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#22C55E]/15 text-[#22C55E]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono-tabular text-[#22C55E]">
                Verified Administrator Control Center
              </div>
              <h1 className="font-display text-3xl font-semibold text-white">
                Green Valley Residencia Admin Portal
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await seedInitialCatalogIfNeeded(true);
              setStatusBanner('Default society catalog restored & synced with Firestore.');
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-xs font-medium text-white rounded-lg transition-colors whitespace-nowrap"
          >
            Restore / Sync Default Catalog
          </button>
        </div>

        {statusBanner && (
          <div className="mb-6 p-3.5 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#4ADE80] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-white/10">
          {[
            { id: 'overview', label: '1. Overview', icon: ShieldCheck },
            { id: 'houses', label: `2. Houses (${houses.length})`, icon: Home },
            {
              id: 'bookings',
              label: `3. Visit Bookings (${visitBookings.length})`,
              icon: Calendar,
            },
            {
              id: 'inquiries',
              label: `4. Inquiries (${houseInquiries.length + gymInquiries.length + contactMessages.length})`,
              icon: MessageSquare,
            },
            { id: 'announcements', label: '5. Amenities & Gallery', icon: Megaphone },
            { id: 'users', label: `6. Users (${allUsers.length})`, icon: Users },
            { id: 'settings', label: '7. Website Settings', icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? 'bg-[#22C55E] text-[#071827] font-semibold'
                    : 'bg-[#071827] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* 1. OVERVIEW & VISITOR GATE LOGS (ADD, EDIT, DELETE)               */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-white">
                Real-Time Society Overview
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('houses');
                    startNewHouse();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add House</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Overview Statistics</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-mono-tabular">
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Registered Users</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {allUsers.length}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Total Houses</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {houses.length}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Available Houses</div>
                <div className="text-2xl font-semibold text-[#22C55E] mt-1">
                  {availableCount}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Sold / Reserved</div>
                <div className="text-2xl font-semibold text-amber-400 mt-1">
                  {occupiedOrReservedCount}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Pending Inquiries</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {pendingInquiriesCount}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Pending Visits</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {pendingBookingsCount}
                </div>
              </div>
            </div>

            {/* Security Gate Visitor Logs with Full Add, Edit, Delete */}
            <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-white">
                  Security Gate Visitor Logs ({visitorLogs.length})
                </h2>
                <button
                  type="button"
                  onClick={startNewVisitorLog}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Visitor Entry</span>
                </button>
              </div>

              {editingVisitor && (
                <form
                  onSubmit={handleSaveVisitorLog}
                  className="p-5 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-4 text-xs"
                >
                  <h3 className="font-display text-lg font-semibold text-white">
                    {visitorLogs.some((v) => v.id === editingVisitor.id)
                      ? `Edit Visitor Log: ${editingVisitor.visitorName}`
                      : 'Add New Security Gate Visitor Entry'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">Visitor Name *</label>
                      <input
                        type="text"
                        required
                        value={editingVisitor.visitorName}
                        onChange={(e) =>
                          setEditingVisitor({
                            ...editingVisitor,
                            visitorName: e.target.value,
                          })
                        }
                        placeholder="Visitor Full Name"
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Purpose *</label>
                      <input
                        type="text"
                        required
                        value={editingVisitor.purpose}
                        onChange={(e) =>
                          setEditingVisitor({ ...editingVisitor, purpose: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Plot / House # *</label>
                      <input
                        type="text"
                        required
                        value={editingVisitor.houseNumber}
                        onChange={(e) =>
                          setEditingVisitor({
                            ...editingVisitor,
                            houseNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Entry Time *</label>
                      <input
                        type="text"
                        required
                        value={editingVisitor.entryTime}
                        onChange={(e) =>
                          setEditingVisitor({
                            ...editingVisitor,
                            entryTime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Exit Time</label>
                      <input
                        type="text"
                        value={editingVisitor.exitTime}
                        onChange={(e) =>
                          setEditingVisitor({
                            ...editingVisitor,
                            exitTime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Status *</label>
                      <select
                        value={editingVisitor.status}
                        onChange={(e) =>
                          setEditingVisitor({
                            ...editingVisitor,
                            status: e.target.value as VisitorLog['status'],
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      >
                        <option value="Pre-Registered">Pre-Registered</option>
                        <option value="Checked-In">Checked-In</option>
                        <option value="Checked-Out">Checked-Out</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {visitorLogs.some((v) => v.id === editingVisitor.id) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const id = editingVisitor.id;
                          const name = editingVisitor.visitorName;
                          setEditingVisitor(null);
                          handleDeleteVisitorLog(id, name);
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Log</span>
                      </button>
                    ) : <div />}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingVisitor(null)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                      >
                        Save Visitor Log
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {visitorLogs.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No visitor logs recorded yet. Click &quot;Add Visitor Entry&quot; above to add one.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono-tabular">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2 pr-4">Visitor</th>
                        <th className="py-2 px-4">Purpose</th>
                        <th className="py-2 px-4">House</th>
                        <th className="py-2 px-4">Entry Time</th>
                        <th className="py-2 px-4">Exit Time</th>
                        <th className="py-2 px-4">Status</th>
                        <th className="py-2 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {visitorLogs.map((v) => (
                        <tr key={v.id}>
                          <td className="py-2.5 pr-4 text-white font-sans font-medium">
                            {v.visitorName}
                          </td>
                          <td className="py-2.5 px-4 text-slate-300 font-sans">{v.purpose}</td>
                          <td className="py-2.5 px-4 text-[#22C55E]">{v.houseNumber}</td>
                          <td className="py-2.5 px-4 text-slate-300">{v.entryTime}</td>
                          <td className="py-2.5 px-4 text-slate-400">{v.exitTime}</td>
                          <td className="py-2.5 px-4 text-slate-200">{v.status}</td>
                          <td className="py-2.5 pl-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingVisitor({ ...v })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVisitorLog(v.id, v.visitorName)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. HOUSE MANAGEMENT (ADD, EDIT, DELETE)                           */}
        {/* ================================================================= */}
        {activeTab === 'houses' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-white">
                Property Inventory Management ({houses.length})
              </h2>
              <button
                type="button"
                onClick={startNewHouse}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Residence</span>
              </button>
            </div>

            {editingHouse && (
              <form
                onSubmit={handleSaveHouse}
                className="bg-[#071827] border border-[#22C55E]/40 rounded-xl p-6 space-y-4 text-xs"
              >
                <h3 className="font-display text-xl font-semibold text-white">
                  {isNewHouse
                    ? 'Add New Residence'
                    : `Edit Residence: ${editingHouse.houseNumber}`}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1">House Number *</label>
                    <input
                      type="text"
                      required
                      value={editingHouse.houseNumber}
                      onChange={(e) =>
                        setEditingHouse({ ...editingHouse, houseNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={editingHouse.title}
                      onChange={(e) =>
                        setEditingHouse({ ...editingHouse, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Plot Size *</label>
                    <select
                      value={editingHouse.plotSize}
                      onChange={(e) => {
                        const sz = e.target.value as HouseType;
                        setEditingHouse({ ...editingHouse, plotSize: sz, houseType: sz });
                      }}
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    >
                      <option value="3 Marla">3 Marla</option>
                      <option value="5 Marla">5 Marla</option>
                      <option value="10 Marla">10 Marla</option>
                      <option value="1 Kanal">1 Kanal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Availability *</label>
                    <select
                      value={editingHouse.availability}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          availability: e.target.value as AvailabilityStatus,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Price (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={editingHouse.pricePKR}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          pricePKR: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">
                      Covered Area (sq.ft) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingHouse.coveredAreaSqFt}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          coveredAreaSqFt: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Bedrooms *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={editingHouse.bedrooms}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          bedrooms: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Bathrooms *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={editingHouse.bathrooms}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          bathrooms: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Sector *</label>
                    <input
                      type="text"
                      required
                      value={editingHouse.sector}
                      onChange={(e) =>
                        setEditingHouse({ ...editingHouse, sector: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Street *</label>
                    <input
                      type="text"
                      required
                      value={editingHouse.street}
                      onChange={(e) =>
                        setEditingHouse({ ...editingHouse, street: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 mb-1">Primary Image URL *</label>
                    <input
                      type="text"
                      required
                      value={editingHouse.images[0] || ''}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          images: [e.target.value, ...editingHouse.images.slice(1)],
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1">Kitchen Details</label>
                    <input
                      type="text"
                      value={editingHouse.kitchenDetails}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          kitchenDetails: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Floor Plan Summary</label>
                    <input
                      type="text"
                      value={editingHouse.floorPlanSummary}
                      onChange={(e) =>
                        setEditingHouse({
                          ...editingHouse,
                          floorPlanSummary: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={editingHouse.description}
                    onChange={(e) =>
                      setEditingHouse({ ...editingHouse, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>
                      {uploadingPhoto ? 'Uploading...' : 'Upload House Photograph'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    {!isNewHouse && (
                      <button
                        type="button"
                        onClick={() => {
                          const id = editingHouse.id;
                          const num = editingHouse.houseNumber;
                          setEditingHouse(null);
                          handleDeleteHouse(id, num);
                        }}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Property</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingHouse(null)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                    >
                      Save Property
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="bg-[#071827] border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-3 px-4">Plot #</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Beds/Baths</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-mono-tabular">
                  {houses.map((h) => (
                    <tr key={h.id}>
                      <td className="py-3 px-4 font-semibold text-white">
                        {h.houseNumber}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-200">{h.title}</td>
                      <td className="py-3 px-4 text-slate-300">{h.plotSize}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {h.bedrooms}B / {h.bathrooms}Ba
                      </td>
                      <td className="py-3 px-4 text-[#22C55E]">
                        PKR {(h.pricePKR / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 px-4">{h.availability}</td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewHouse(false);
                            setEditingHouse({ ...h });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHouse(h.id, h.houseNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. VISIT BOOKING MANAGEMENT (ADD, EDIT, DELETE)                   */}
        {/* ================================================================= */}
        {activeTab === 'bookings' && (
          <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-white">
                Property Visit Appointment Requests ({visitBookings.length})
              </h2>
              <button
                type="button"
                onClick={startNewBooking}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Visit Booking</span>
              </button>
            </div>

            {editingBooking && (
              <form
                onSubmit={handleSaveBooking}
                className="p-5 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-4 text-xs"
              >
                <h3 className="font-display text-lg font-semibold text-white">
                  {visitBookings.some((b) => b.id === editingBooking.id)
                    ? `Edit Visit Booking: ${editingBooking.fullName}`
                    : 'Add New Property Visit Booking'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">House / Plot # *</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.houseNumber}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          houseNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Visitor Name *</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.fullName}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, fullName: e.target.value })
                      }
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={editingBooking.email}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, email: e.target.value })
                      }
                      placeholder="visitor@example.com"
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.phone}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Preferred Date *</label>
                    <input
                      type="date"
                      required
                      value={editingBooking.preferredDate}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          preferredDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Preferred Time *</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.preferredTime}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          preferredTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Status *</label>
                    <select
                      value={editingBooking.status}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          status: e.target.value as VisitBooking['status'],
                        })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Notes</label>
                    <input
                      type="text"
                      value={editingBooking.notes}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {visitBookings.some((b) => b.id === editingBooking.id) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const id = editingBooking.id;
                        const name = editingBooking.fullName;
                        setEditingBooking(null);
                        handleDeleteBooking(id, name);
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Booking</span>
                    </button>
                  ) : <div />}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBooking(null)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                    >
                      Save Visit Booking
                    </button>
                  </div>
                </div>
              </form>
            )}

            {visitBookings.length === 0 ? (
              <p className="text-xs text-slate-400">
                No visit requests yet. Click &quot;Add Visit Booking&quot; above to schedule one.
              </p>
            ) : (
              <div className="space-y-3">
                {visitBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-lg bg-[#0B1724] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-mono-tabular text-white font-semibold">
                        {b.houseNumber} · {b.preferredDate} at {b.preferredTime} · Status:{' '}
                        <span className="text-[#22C55E]">{b.status}</span>
                      </div>
                      <div className="text-slate-300 mt-1">
                        Visitor: {b.fullName} ({b.email} · {b.phone})
                      </div>
                      {b.notes && <div className="text-slate-400 mt-0.5">{b.notes}</div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(['Approved', 'Rejected', 'Completed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            if (onVisitBookingsChange) {
                              onVisitBookingsChange((prev) =>
                                prev.map((item) =>
                                  item.id === b.id ? { ...item, status: st } : item
                                )
                              );
                            }
                            try {
                              await updateVisitBookingStatusAdmin(b.id, st);
                              setStatusBanner(`Visit booking marked as ${st}.`);
                            } catch (err) {
                              setStatusBanner(`Updated locally. Note: ${err instanceof Error ? err.message : String(err)}`);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-md"
                        >
                          {st}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditingBooking({ ...b })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-md"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(b.id, b.fullName)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. INQUIRY MANAGEMENT (HOUSE, GYM, CONTACT — ADD, EDIT, DELETE)   */}
        {/* ================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-8">
            {/* 4A. HOUSE BUYER INQUIRIES */}
            <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-white">
                  House Buyer Inquiries ({houseInquiries.length})
                </h2>
                <button
                  type="button"
                  onClick={startNewHouseInquiry}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add House Inquiry</span>
                </button>
              </div>

              {editingHouseInq && (
                <form
                  onSubmit={handleSaveHouseInq}
                  className="p-5 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-3 text-xs"
                >
                  <h3 className="font-display text-lg font-semibold text-white">
                    {houseInquiries.some((i) => i.id === editingHouseInq.id)
                      ? `Edit Inquiry: ${editingHouseInq.fullName}`
                      : 'Add New House Buyer Inquiry'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">Plot / House # *</label>
                      <input
                        type="text"
                        required
                        value={editingHouseInq.houseNumber}
                        onChange={(e) =>
                          setEditingHouseInq({
                            ...editingHouseInq,
                            houseNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editingHouseInq.fullName}
                        onChange={(e) =>
                          setEditingHouseInq({
                            ...editingHouseInq,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={editingHouseInq.email}
                        onChange={(e) =>
                          setEditingHouseInq({
                            ...editingHouseInq,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Phone *</label>
                      <input
                        type="text"
                        required
                        value={editingHouseInq.phone}
                        onChange={(e) =>
                          setEditingHouseInq({
                            ...editingHouseInq,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Status *</label>
                      <select
                        value={editingHouseInq.status}
                        onChange={(e) =>
                          setEditingHouseInq({
                            ...editingHouseInq,
                            status: e.target.value as HouseInquiry['status'],
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Responded">Responded</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">Buyer Message *</label>
                      <input
                        type="text"
                        required
                        value={editingHouseInq.message}
                        onChange={(e) =>
                          setEditingHouseInq({
                            ...editingHouseInq,
                            message: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Admin Response</label>
                      <input
                        type="text"
                        value={editingHouseInq.adminResponse}
                        onChange={(e) =>
                          setEditingHouseInq({
                            ...editingHouseInq,
                            adminResponse: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {houseInquiries.some((i) => i.id === editingHouseInq.id) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const id = editingHouseInq.id;
                          const name = editingHouseInq.fullName;
                          setEditingHouseInq(null);
                          handleDeleteHouseInquiry(id, name);
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Inquiry</span>
                      </button>
                    ) : <div />}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingHouseInq(null)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                      >
                        Save Inquiry
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {houseInquiries.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No house inquiries yet. Click &quot;Add House Inquiry&quot; above to add one.
                </p>
              ) : (
                houseInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-4 rounded-lg bg-[#0B1724] border border-white/10 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tabular">
                      <span className="text-white font-semibold">
                        Plot {inq.houseNumber} · {inq.fullName} ({inq.email} · {inq.phone})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#22C55E]">{inq.status}</span>
                        <button
                          type="button"
                          onClick={() => setEditingHouseInq({ ...inq })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded font-sans"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHouseInquiry(inq.id, inq.fullName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded font-sans"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300">{inq.message}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={responseDrafts[inq.id] ?? inq.adminResponse}
                        onChange={(e) =>
                          setResponseDrafts({ ...responseDrafts, [inq.id]: e.target.value })
                        }
                        placeholder="Write official concierge response..."
                        className="flex-1 px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const resp = responseDrafts[inq.id] ?? inq.adminResponse;
                          if (onInquiriesChange) {
                            onInquiriesChange((prev) =>
                              prev.map((i) =>
                                i.id === inq.id
                                  ? { ...i, status: 'Responded', adminResponse: resp }
                                  : i
                              )
                            );
                          }
                          try {
                            await updateHouseInquiryAdmin(inq.id, 'Responded', resp);
                            setStatusBanner(`Sent response to ${inq.fullName}.`);
                          } catch (err) {
                            setStatusBanner(`Updated locally. Note: ${err instanceof Error ? err.message : String(err)}`);
                          }
                        }}
                        className="px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg whitespace-nowrap"
                      >
                        Send Response
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 4B. GYM MEMBERSHIP INQUIRIES */}
              <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-semibold text-white">
                    Gym Membership Inquiries ({gymInquiries.length})
                  </h3>
                  <button
                    type="button"
                    onClick={startNewGymInquiry}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Gym Inquiry</span>
                  </button>
                </div>

                {editingGymInq && (
                  <form
                    onSubmit={handleSaveGymInq}
                    className="p-4 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-3 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Full Name *"
                      value={editingGymInq.fullName}
                      onChange={(e) =>
                        setEditingGymInq({ ...editingGymInq, fullName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        required
                        placeholder="Email *"
                        value={editingGymInq.email}
                        onChange={(e) =>
                          setEditingGymInq({ ...editingGymInq, email: e.target.value })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Phone *"
                        value={editingGymInq.phone}
                        onChange={(e) =>
                          setEditingGymInq({ ...editingGymInq, phone: e.target.value })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editingGymInq.preferredPlan}
                        onChange={(e) =>
                          setEditingGymInq({
                            ...editingGymInq,
                            preferredPlan: e.target.value as GymInquiry['preferredPlan'],
                          })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      >
                        <option value="Monthly Standard">Monthly Standard</option>
                        <option value="Quarterly Executive">Quarterly Executive</option>
                        <option value="Annual Family">Annual Family</option>
                        <option value="Personal Training">Personal Training</option>
                      </select>
                      <select
                        value={editingGymInq.status}
                        onChange={(e) =>
                          setEditingGymInq({
                            ...editingGymInq,
                            status: e.target.value as GymInquiry['status'],
                          })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {gymInquiries.some((g) => g.id === editingGymInq.id) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const id = editingGymInq.id;
                            const name = editingGymInq.fullName;
                            setEditingGymInq(null);
                            handleDeleteGymInquiry(id, name);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      ) : <div />}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingGymInq(null)}
                          className="px-3 py-1.5 bg-white/10 text-white rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {gymInquiries.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-lg bg-[#0B1724] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {g.fullName} · {g.preferredPlan}
                      </div>
                      <div className="text-slate-400">
                        {g.email} · {g.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const nextStatus = g.status === 'Approved' ? 'Closed' : 'Approved';
                          if (onGymInquiriesChange) {
                            onGymInquiriesChange((prev) =>
                              prev.map((item) =>
                                item.id === g.id ? { ...item, status: nextStatus } : item
                              )
                            );
                          }
                          try {
                            await updateGymInquiryStatusAdmin(g.id, nextStatus);
                          } catch (err) {
                            setStatusBanner(`Updated locally. Note: ${err instanceof Error ? err.message : String(err)}`);
                          }
                        }}
                        className="px-2.5 py-1 bg-[#22C55E]/20 text-[#22C55E] rounded font-mono-tabular"
                      >
                        {g.status}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGymInq({ ...g })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGymInquiry(g.id, g.fullName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4C. GENERAL CONTACT MESSAGES */}
              <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-semibold text-white">
                    General Contact Messages ({contactMessages.length})
                  </h3>
                  <button
                    type="button"
                    onClick={startNewContactMsg}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Message</span>
                  </button>
                </div>

                {editingContactMsg && (
                  <form
                    onSubmit={handleSaveContactMsg}
                    className="p-4 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Sender Name *"
                        value={editingContactMsg.name}
                        onChange={(e) =>
                          setEditingContactMsg({
                            ...editingContactMsg,
                            name: e.target.value,
                          })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email *"
                        value={editingContactMsg.email}
                        onChange={(e) =>
                          setEditingContactMsg({
                            ...editingContactMsg,
                            email: e.target.value,
                          })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Subject *"
                        value={editingContactMsg.subject}
                        onChange={(e) =>
                          setEditingContactMsg({
                            ...editingContactMsg,
                            subject: e.target.value,
                          })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      />
                      <select
                        value={editingContactMsg.status}
                        onChange={(e) =>
                          setEditingContactMsg({
                            ...editingContactMsg,
                            status: e.target.value as ContactMessage['status'],
                          })
                        }
                        className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                      >
                        <option value="Unread">Unread</option>
                        <option value="Responded">Responded</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Message *"
                      value={editingContactMsg.message}
                      onChange={(e) =>
                        setEditingContactMsg({
                          ...editingContactMsg,
                          message: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                    />
                    <div className="flex items-center justify-between gap-2">
                      {contactMessages.some((m) => m.id === editingContactMsg.id) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const id = editingContactMsg.id;
                            const name = editingContactMsg.name;
                            setEditingContactMsg(null);
                            handleDeleteContactMessage(id, name);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      ) : <div />}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingContactMsg(null)}
                          className="px-3 py-1.5 bg-white/10 text-white rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {contactMessages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-lg bg-[#0B1724] border border-white/10 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-white">
                        {m.subject} — {m.name} ({m.email})
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[#22C55E] font-mono-tabular">{m.status}</span>
                        <button
                          type="button"
                          onClick={() => setEditingContactMsg({ ...m })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContactMessage(m.id, m.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300">{m.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 5. AMENITIES, PARKS, ANNOUNCEMENTS & GALLERY (ADD, EDIT, DELETE)  */}
        {/* ================================================================= */}
        {activeTab === 'announcements' && (
          <AdminTab5AmenitiesGallery
            parks={parks}
            amenities={amenities}
            announcements={announcements}
            gallery={gallery}
            onParksChange={onParksChange}
            onAmenitiesChange={onAmenitiesChange}
            onAnnouncementsChange={onAnnouncementsChange}
            onGalleryChange={onGalleryChange}
            onNotify={setStatusBanner}
          />
        )}

        {/* ================================================================= */}
        {/* 6. USER MANAGEMENT (ADD, EDIT, DELETE)                            */}
        {/* ================================================================= */}
        {activeTab === 'users' && (
          <AdminTab6Users
            allUsers={allUsers}
            onAllUsersChange={onAllUsersChange}
            onNotify={setStatusBanner}
          />
        )}

        {/* ================================================================= */}
        {/* 7. WEBSITE SETTINGS (EDIT, SAVE, RESET/DELETE)                    */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <AdminTab7Settings
            settings={settings}
            onSettingsChange={onSettingsChange}
            onNotify={setStatusBanner}
          />
        )}
      </div>
    </section>
  );
};
