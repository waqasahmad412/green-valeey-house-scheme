import React, { useState } from 'react';
import {
  User,
  Heart,
  Calendar,
  MessageSquare,
  Dumbbell,
  Bell,
  Shield,
  LogOut,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import {
  Announcement,
  GymInquiry,
  House,
  HouseInquiry,
  UserProfile,
  VisitBooking,
  VisitorLog,
} from '../types/society';
import { updateUserProfileDetails } from '../lib/firestoreService';
import { ResilientImage } from './Logo';

interface UserDashboardProps {
  userProfile: UserProfile;
  houses: House[];
  houseInquiries: HouseInquiry[];
  visitBookings: VisitBooking[];
  gymInquiries: GymInquiry[];
  visitorLogs: VisitorLog[];
  announcements: Announcement[];
  onToggleFavorite: (houseId: string) => void;
  onInspectHouse: (house: House) => void;
  onLogout: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userProfile,
  houses,
  houseInquiries,
  visitBookings,
  gymInquiries,
  visitorLogs,
  announcements,
  onToggleFavorite,
  onInspectHouse,
  onLogout,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'favorites' | 'inquiries' | 'visits' | 'gym' | 'profile'
  >('overview');
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [phone, setPhone] = useState(userProfile.phone);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  const favoriteHouses = houses.filter((h) =>
    userProfile.favoriteHouseIds?.includes(h.id)
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSavedMsg(null);
    try {
      await updateUserProfileDetails(userProfile.uid, {
        fullName,
        phone,
        favoriteHouseIds: userProfile.favoriteHouseIds || [],
      });
      onProfileUpdated({
        ...userProfile,
        fullName,
        phone,
      });
      setProfileSavedMsg('Your profile settings have been saved to Firestore.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <section className="py-12 bg-[#0B1724] min-h-[80vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        {/* Welcome Banner */}
        <div className="bg-[#071827] border border-white/10 rounded-xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs text-[#22C55E] font-mono-tabular">
              Resident & Homebuyer Portal · Role: {userProfile.role} · Status:{' '}
              {userProfile.status}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white mt-1">
              Welcome, {userProfile.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {userProfile.email} · Private records isolated to your verified account.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Account Settings
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-medium rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview & Announcements', icon: Bell },
            {
              id: 'favorites',
              label: `Saved Houses (${favoriteHouses.length})`,
              icon: Heart,
            },
            {
              id: 'visits',
              label: `Visit Bookings (${visitBookings.length})`,
              icon: Calendar,
            },
            {
              id: 'inquiries',
              label: `House Inquiries (${houseInquiries.length})`,
              icon: MessageSquare,
            },
            {
              id: 'gym',
              label: `Gym & Gate Logs (${gymInquiries.length + visitorLogs.length})`,
              icon: Dumbbell,
            },
            { id: 'profile', label: 'Profile Settings', icon: User },
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

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono-tabular">
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Saved Residences</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {favoriteHouses.length}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Scheduled Visits</div>
                <div className="text-2xl font-semibold text-[#22C55E] mt-1">
                  {visitBookings.length}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Property Inquiries</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {houseInquiries.length}
                </div>
              </div>
              <div className="bg-[#071827] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-400">Gym & Gate Passes</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {gymInquiries.length + visitorLogs.length}
                </div>
              </div>
            </div>

            {/* Community Announcements */}
            <div className="bg-[#071827] border border-white/10 rounded-xl p-6">
              <h2 className="font-display text-2xl font-semibold text-white mb-4">
                Latest Society Announcements & Notifications
              </h2>
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-lg bg-[#0B1724] border border-white/10"
                  >
                    <div className="text-xs font-mono-tabular text-slate-400">
                      <span className="text-[#22C55E]">{a.category}</span> · Priority:{' '}
                      {a.priority} · {a.publishedDate}
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1">{a.title}</h3>
                    <p className="text-xs text-slate-300 mt-1">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Favorite Houses */}
        {activeTab === 'favorites' && (
          <div>
            {favoriteHouses.length === 0 ? (
              <div className="bg-[#071827] border border-white/10 rounded-xl p-10 text-center">
                <p className="font-display text-2xl text-white">No saved residences yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click the heart icon on any property card to save it to your shortlist.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteHouses.map((h) => (
                  <div
                    key={h.id}
                    className="bg-[#071827] border border-white/10 rounded-xl overflow-hidden"
                  >
                    <div className="h-48 relative">
                      <ResilientImage src={h.images[0]} alt={h.title} />
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="text-xs font-mono-tabular text-slate-400">
                        {h.houseNumber} · {h.plotSize} · {h.availability}
                      </div>
                      <h3 className="font-display text-xl font-semibold text-white">
                        {h.title}
                      </h3>
                      <div className="font-mono-tabular text-sm text-[#22C55E] font-semibold">
                        PKR {(h.pricePKR / 1000000).toFixed(2)}M
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => onInspectHouse(h)}
                          className="flex-1 py-2 px-3 bg-[#22C55E] text-[#071827] text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(h.id)}
                          className="py-2 px-3 bg-white/10 text-slate-300 hover:text-white text-xs rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Visit Bookings */}
        {activeTab === 'visits' && (
          <div className="bg-[#071827] border border-white/10 rounded-xl p-6">
            <h2 className="font-display text-2xl font-semibold text-white mb-4">
              Your Property Visit Appointments
            </h2>
            {visitBookings.length === 0 ? (
              <p className="text-xs text-slate-400">
                You have not booked any property visits yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-3 pr-4">House</th>
                      <th className="py-3 px-4">Preferred Date & Time</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 pl-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 font-mono-tabular">
                    {visitBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="py-3.5 pr-4 font-semibold text-white">
                          {b.houseNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {b.preferredDate} · {b.preferredTime}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-300">
                          {b.notes}
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <span
                            className={
                              b.status === 'Approved'
                                ? 'text-[#22C55E] font-semibold'
                                : b.status === 'Rejected'
                                ? 'text-red-400'
                                : 'text-amber-400'
                            }
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: House Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-white">
              Your Property Inquiries & Concierge Responses
            </h2>
            {houseInquiries.length === 0 ? (
              <p className="text-xs text-slate-400">
                No house inquiries submitted yet.
              </p>
            ) : (
              houseInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-4 rounded-lg bg-[#0B1724] border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="text-white font-semibold">
                      Plot {inq.houseNumber}
                    </span>
                    <span className="text-[#22C55E]">Status: {inq.status}</span>
                  </div>
                  <p className="text-xs text-slate-300">{inq.message}</p>
                  {inq.adminResponse && (
                    <div className="mt-2 p-3 rounded bg-[#071827] border border-[#22C55E]/30 text-xs text-slate-200">
                      <span className="font-semibold text-[#22C55E]">
                        Management Response:{' '}
                      </span>
                      {inq.adminResponse}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Gym Inquiries & Gate Visitor Logs */}
        {activeTab === 'gym' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-display text-2xl font-semibold text-white">
                Gym Membership Requests
              </h3>
              {gymInquiries.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No gym membership inquiries submitted yet.
                </p>
              ) : (
                gymInquiries.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-lg bg-[#0B1724] border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{g.preferredPlan}</div>
                      <div className="text-slate-400">{g.email}</div>
                    </div>
                    <span className="font-mono-tabular text-[#22C55E]">{g.status}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-display text-2xl font-semibold text-white">
                Pre-Registered Gate Visitors
              </h3>
              {visitorLogs.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No gate visitors registered yet.
                </p>
              ) : (
                visitorLogs.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-lg bg-[#0B1724] border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {v.visitorName} ({v.purpose})
                      </div>
                      <div className="text-slate-400 font-mono-tabular">
                        House {v.houseNumber} · Entry: {v.entryTime}
                      </div>
                    </div>
                    <span className="font-mono-tabular text-[#22C55E]">{v.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Profile Settings */}
        {activeTab === 'profile' && (
          <div className="max-w-xl bg-[#071827] border border-white/10 rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-white mb-1">
              Edit Resident Profile
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Update your contact details stored in Firestore.
            </p>

            {profileSavedMsg && (
              <div className="mb-4 p-3.5 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#4ADE80] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Verified Email (Immutable)
                </label>
                <input
                  type="email"
                  disabled
                  value={userProfile.email}
                  className="w-full px-3.5 py-2.5 bg-[#0B1724]/60 border border-white/10 rounded-lg text-sm text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] font-semibold text-xs rounded-lg transition-colors"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};
