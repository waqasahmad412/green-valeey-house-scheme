import React, { useState } from 'react';
import {
  Trees,
  Dumbbell,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  UserCheck,
  X,
} from 'lucide-react';
import {
  Amenity,
  Announcement,
  GymInquiry,
  Park,
  SocietySettings,
  UserProfile,
  VisitorLog,
} from '../types/society';
import { ResilientImage } from './Logo';
import {
  submitGymInquiry,
  submitVisitorLog,
  updateVisitorCheckout,
} from '../lib/firestoreService';

interface AmenitiesSectionProps {
  parks: Park[];
  amenities: Amenity[];
  announcements: Announcement[];
  visitorLogs: VisitorLog[];
  settings: SocietySettings;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  onRequireAuth: () => void;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  parks,
  amenities,
  announcements,
  visitorLogs,
  settings,
  userProfile,
  isAdmin,
  onRequireAuth,
}) => {
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);

  // Gym Inquiry Form State
  const [gymName, setGymName] = useState(userProfile?.fullName || '');
  const [gymEmail, setGymEmail] = useState(userProfile?.email || '');
  const [gymPhone, setGymPhone] = useState(userProfile?.phone || '');
  const [gymPlan, setGymPlan] =
    useState<GymInquiry['preferredPlan']>('Monthly Standard');
  const [gymSubmitting, setGymSubmitting] = useState(false);
  const [gymFeedback, setGymFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Security Gate Visitor Registration Form State
  const [visitorName, setVisitorName] = useState('');
  const [visitorPurpose, setVisitorPurpose] = useState('Family Guest');
  const [visitorHouse, setVisitorHouse] = useState('GV-101');
  const [visitorEntryTime, setVisitorEntryTime] = useState('18:00');
  const [visitorSubmitting, setVisitorSubmitting] = useState(false);
  const [visitorFeedback, setVisitorFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const gymAmenity = amenities.find((a) => a.category === 'Gym') || amenities[0];

  const handleGymSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    setGymSubmitting(true);
    setGymFeedback(null);
    try {
      await submitGymInquiry({
        userId: userProfile.uid,
        fullName: gymName || userProfile.fullName,
        email: gymEmail || userProfile.email,
        phone: gymPhone,
        preferredPlan: gymPlan,
      });
      setGymFeedback({
        type: 'success',
        text: `Gym membership inquiry (${gymPlan}) saved to Firebase. View status in your Resident Dashboard.`,
      });
    } catch (err) {
      setGymFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not submit gym inquiry.',
      });
    } finally {
      setGymSubmitting(false);
    }
  };

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    setVisitorSubmitting(true);
    setVisitorFeedback(null);
    try {
      await submitVisitorLog({
        userId: userProfile.uid,
        visitorName,
        purpose: visitorPurpose,
        houseNumber: visitorHouse,
        entryTime: `${new Date().toLocaleDateString()} ${visitorEntryTime}`,
        exitTime: 'Active On-Site',
        status: 'Pre-Registered',
      });
      setVisitorName('');
      setVisitorFeedback({
        type: 'success',
        text: 'Visitor pre-registered with Main Entrance Gate Security.',
      });
    } catch (err) {
      setVisitorFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to register visitor.',
      });
    } finally {
      setVisitorSubmitting(false);
    }
  };

  return (
    <div className="space-y-24 py-20 bg-[#071827] border-t border-white/10">
      {/* ================================================================= */}
      {/* 1. PARKS AND BOTANICAL GARDENS SECTION                            */}
      {/* ================================================================= */}
      <section id="parks-section" className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
              01. Sustainable Landscape & Recreation
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Parks & Botanical Gardens
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Over 36 Kanals of dedicated emerald parkland featuring cushioned walking tracks,
              children’s adventure playgrounds, fragrant flower parterres, shaded teakwood benches,
              and solar pathway illumination.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono-tabular">
            {parks.length} Landscaped Parks · 1.4 km Tartan Track
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {parks.map((park) => (
            <article
              key={park.id}
              className="bg-[#0B1724] border border-white/10 hover:border-[#22C55E]/40 rounded-xl overflow-hidden flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="h-52 w-full overflow-hidden relative">
                  <ResilientImage
                    src={park.imageUrl}
                    alt={park.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1724] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 text-xs font-mono-tabular text-[#22C55E]">
                    {park.areaSize}
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-xs text-slate-400 font-mono-tabular">
                    {park.sector} · {park.openingHours}
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-white mt-1">
                    {park.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {park.description}
                  </p>

                  <ul className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                    {park.facilities.slice(0, 4).map((fac) => (
                      <li key={fac} className="flex items-center gap-2">
                        <span className="text-[#22C55E]">·</span>
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setSelectedPark(park)}
                  className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Inspect Park Facilities & Hours
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Park Details Modal */}
        {selectedPark && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#071827] border border-white/15 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
              <div className="relative h-64">
                <ResilientImage
                  src={selectedPark.imageUrl}
                  alt={selectedPark.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPark(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-xs text-slate-400 font-mono-tabular">
                  {selectedPark.sector} · {selectedPark.areaSize} · {selectedPark.openingHours}
                </div>
                <h3 className="font-display text-3xl font-semibold text-white">
                  {selectedPark.name}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedPark.description}
                </p>
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#22C55E] mb-3">
                    Complete Park Facilities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                    {selectedPark.facilities.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Trees className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 2. MODERN GYM & WELLNESS PAVILION SECTION                         */}
      {/* ================================================================= */}
      <section id="gym-section" className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 7 Columns: Gym Showcase & Equipment Zones */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
                02. Resident Fitness & Athletics
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                {gymAmenity?.name || 'Green Valley Wellness & Fitness Club'}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2">
                {gymAmenity?.description}
              </p>
            </div>

            <div className="h-72 sm:h-80 rounded-xl overflow-hidden border border-white/10 relative">
              <ResilientImage
                src={gymAmenity?.imageUrl || ''}
                alt="Modern Gym Interior and Pavilion"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071827] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono-tabular text-slate-200">
                <span>Hours: {gymAmenity?.openingHours || '06:00 AM – 11:00 PM'}</span>
                <span className="text-[#22C55E]">Dedicated Men, Women & Family Hours</span>
              </div>
            </div>

            {/* Equipment Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">
                  Cardio & Endurance Deck
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Commercial motorized treadmills, upright & recumbent exercise bikes, rowing
                  ergometers, and stair climbers overlooking Central Park.
                </p>
              </div>
              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">
                  Free Weights & Dumbbells
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Complete urethane dumbbell racks (2kg to 50kg), Olympic squat racks, bench press
                  stations, and calibrated bumper plates.
                </p>
              </div>
              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">
                  Biomechanical Weight Machines
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Dual-pulley cable crossovers, lat pulldown towers, leg press sleds, and isolated
                  strength training circuit machines.
                </p>
              </div>
              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">
                  Changing Suites & Recovery
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Digital keypad lockers, heated rain showers, steam rooms, and post-workout
                  hydration bar.
                </p>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Gym Membership Inquiry Form */}
          <div className="lg:col-span-5 bg-[#0B1724] border border-white/10 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs text-[#22C55E] font-medium mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>Club Membership Registration</span>
            </div>
            <h3 className="font-display text-2xl font-semibold text-white">
              Gym Membership Inquiry
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Reserve your resident or executive fitness pass. Inquiries are stored directly in
              Firebase and reviewed by our club coordinator.
            </p>

            {gymFeedback && (
              <div
                className={`mb-4 p-3.5 rounded-lg border flex items-center gap-2 text-xs ${
                  gymFeedback.type === 'success'
                    ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#4ADE80]'
                    : 'bg-red-500/15 border-red-500/40 text-red-300'
                }`}
              >
                {gymFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{gymFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleGymSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  maxLength={150}
                  value={gymEmail}
                  onChange={(e) => setGymEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={30}
                  value={gymPhone}
                  onChange={(e) => setGymPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Preferred Membership Plan *
                </label>
                <select
                  value={gymPlan}
                  onChange={(e) =>
                    setGymPlan(e.target.value as GymInquiry['preferredPlan'])
                  }
                  className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="Monthly Standard">
                    Monthly Standard — PKR 8,500 / month
                  </option>
                  <option value="Quarterly Executive">
                    Quarterly Executive — PKR 22,000 / quarter
                  </option>
                  <option value="Annual Family">
                    Annual Family (Up to 4 Members) — PKR 75,000 / year
                  </option>
                  <option value="Personal Training">
                    Personal Training + Nutrition Coaching — PKR 18,000 / month
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={gymSubmitting}
                className="w-full py-3 px-5 bg-[#22C55E] hover:bg-[#4ADE80] disabled:opacity-50 text-[#071827] font-semibold text-xs rounded-lg transition-colors"
              >
                {gymSubmitting
                  ? 'Submitting Inquiry...'
                  : userProfile
                  ? 'Submit Gym Membership Inquiry'
                  : 'Sign In to Submit Gym Inquiry'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. RESIDENTIAL SECURITY SYSTEM & VISITOR MANAGEMENT               */}
      {/* ================================================================= */}
      <section id="security-section" className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
              03. 24/7 Command & Access Control
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Gated Security & Visitor Management
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Multi-layered perimeter protection featuring staffed guard cabins, RFID resident
              lanes, digital visitor pre-registration, and strict privacy controls protecting
              resident records.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#22C55E] bg-[#0B1724] border border-white/10 px-4 py-2.5 rounded-lg">
            <PhoneCall className="w-4 h-4" />
            <span>Emergency Control: {settings.emergencyPhone}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 6 Columns: Security Infrastructure & Active Bulletins */}
          <div className="lg:col-span-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
                <ShieldCheck className="w-5 h-5 text-[#22C55E] mb-2" />
                <h3 className="text-sm font-semibold text-white">
                  Main Entrance Gate & Cabins
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Dual-lane boom barriers with ANPR cameras and 24/7 uniformed security personnel
                  at all 4 sector checkpoints.
                </p>
              </div>
              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
                <UserCheck className="w-5 h-5 text-[#22C55E] mb-2" />
                <h3 className="text-sm font-semibold text-white">
                  Encrypted Resident Privacy
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Visitor entry logs are isolated via Firestore security rules—only the host
                  resident and authorized security administrators can view entry records.
                </p>
              </div>
            </div>

            {/* Security & Community Announcements */}
            <div className="bg-[#0B1724] border border-white/10 rounded-xl p-6">
              <h3 className="font-display text-2xl font-semibold text-white mb-4">
                Security & Community Bulletins
              </h3>
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="pb-4 border-b border-white/10 last:border-none last:pb-0"
                  >
                    <div className="flex items-center gap-2 text-xs font-mono-tabular text-slate-400">
                      <span
                        className={
                          ann.priority === 'Urgent' || ann.priority === 'High'
                            ? 'text-amber-400 font-semibold'
                            : 'text-[#22C55E]'
                        }
                      >
                        {ann.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Priority: {ann.priority}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ann.publishedDate}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 6 Columns: Visitor Registration & Protected Entry Logs */}
          <div className="lg:col-span-6 bg-[#0B1724] border border-white/10 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="font-display text-2xl font-semibold text-white">
                Gate Visitor Pre-Registration & Logs
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pre-authorize guests for seamless clearance at Main Gate Cabin 1.
              </p>
            </div>

            {visitorFeedback && (
              <div
                className={`p-3.5 rounded-lg border flex items-center gap-2 text-xs ${
                  visitorFeedback.type === 'success'
                    ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#4ADE80]'
                    : 'bg-red-500/15 border-red-500/40 text-red-300'
                }`}
              >
                <span>{visitorFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleVisitorSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Tariq Mahmood"
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Destination House *</label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={visitorHouse}
                  onChange={(e) => setVisitorHouse(e.target.value)}
                  placeholder="GV-101"
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Visit Purpose *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={visitorPurpose}
                  onChange={(e) => setVisitorPurpose(e.target.value)}
                  placeholder="Family Guest / Delivery"
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Expected Entry Time *</label>
                <input
                  type="time"
                  required
                  value={visitorEntryTime}
                  onChange={(e) => setVisitorEntryTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={visitorSubmitting}
                  className="w-full py-2.5 px-4 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] font-semibold text-xs rounded-lg transition-colors"
                >
                  {visitorSubmitting
                    ? 'Registering Gate Pass...'
                    : userProfile
                    ? 'Register Visitor at Main Gate'
                    : 'Sign In to Pre-Register Visitors'}
                </button>
              </div>
            </form>

            {/* Authenticated Visitor Entry Logs Table */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white">
                  {isAdmin
                    ? 'All Society Gate Entry Logs (Admin View)'
                    : 'Your Registered Visitor Entry Logs'}
                </span>
                <span className="text-xs text-slate-400 font-mono-tabular">
                  {userProfile ? `${visitorLogs.length} Records` : 'Protected Access'}
                </span>
              </div>

              {!userProfile ? (
                <div className="p-4 rounded-lg bg-[#071827] border border-white/10 text-xs text-slate-400">
                  Visitor entry logs are restricted to authenticated residents and security
                  administrators to protect resident privacy.
                </div>
              ) : visitorLogs.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#071827] border border-white/10 text-xs text-slate-400">
                  No visitor logs recorded yet. Use the form above to pre-register a guest.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2 pr-3">Visitor</th>
                        <th className="py-2 px-3">House</th>
                        <th className="py-2 px-3">Entry / Exit</th>
                        <th className="py-2 pl-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 font-mono-tabular">
                      {visitorLogs.slice(0, 5).map((log) => (
                        <tr key={log.id} className="text-slate-200">
                          <td className="py-2.5 pr-3 font-sans">
                            <div className="font-medium text-white">{log.visitorName}</div>
                            <div className="text-slate-400">{log.purpose}</div>
                          </td>
                          <td className="py-2.5 px-3">{log.houseNumber}</td>
                          <td className="py-2.5 px-3">
                            <div>In: {log.entryTime}</div>
                            <div className="text-slate-400">Out: {log.exitTime}</div>
                          </td>
                          <td className="py-2.5 pl-3 text-right">
                            {log.status !== 'Checked-Out' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  updateVisitorCheckout(
                                    log.id,
                                    new Date().toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  )
                                }
                                className="text-[#22C55E] hover:underline"
                              >
                                Mark Exit
                              </button>
                            ) : (
                              <span className="text-slate-400">Checked-Out</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
