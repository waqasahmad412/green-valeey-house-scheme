/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Compass,
  ArrowRight,
  Search,
  X,
  CheckCircle2,
  ShieldCheck,
  Trees,
  Dumbbell,
  Home as HomeIcon,
} from 'lucide-react';
import { auth } from './lib/firebase';
import {
  ensureUserProfile,
  isUserVerifiedAdmin,
  seedInitialCatalogIfNeeded,
  subscribePublicCatalog,
  subscribeUserPrivateRecords,
  updateUserProfileDetails,
} from './lib/firestoreService';
import {
  ActivePage,
  Amenity,
  Announcement,
  ContactMessage,
  GalleryItem,
  GymInquiry,
  House,
  HouseInquiry,
  LightingMode,
  Park,
  SocietySettings,
  UserProfile,
  VisitBooking,
  VisitorLog,
} from './types/society';
import {
  GENERATED_IMAGES,
  INITIAL_AMENITIES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_GALLERY,
  INITIAL_HOUSES,
  INITIAL_PARKS,
  INITIAL_SOCIETY_SETTINGS,
} from './data/initialSocietyData';
import { GreenValleyLogo, ResilientImage } from './components/Logo';
import { Navbar } from './components/Navbar';
import { Colony3DScene } from './components/Colony3DScene';
import { HousesSection } from './components/HousesSection';
import { AmenitiesSection } from './components/AmenitiesSection';
import { GallerySection } from './components/GallerySection';
import { ContactSection } from './components/ContactSection';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { HeroLiveSimulation } from './components/HeroLiveSimulation';

function AnimatedHeroHeading({ text }: { text: string }) {
  const words = useMemo(() => text.trim().split(/\s+/), [text]);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    setVisibleCount(1);
    let timeoutId: ReturnType<typeof setTimeout>;

    const stepWords = (current: number) => {
      if (current < words.length) {
        timeoutId = setTimeout(() => {
          setVisibleCount(current + 1);
          stepWords(current + 1);
        }, 340);
      } else {
        // Hold full heading on screen, then replay one-by-one animation
        timeoutId = setTimeout(() => {
          setVisibleCount(1);
          stepWords(1);
        }, 3800);
      }
    };

    stepWords(1);
    return () => clearTimeout(timeoutId);
  }, [words]);

  return (
    <h1
      aria-label={text}
      className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.08] flex flex-wrap gap-x-3 gap-y-1"
    >
      {words.map((word, idx) => {
        const isShown = idx < visibleCount;
        const isEmeraldHighlight =
          word.toLowerCase().includes('green') ||
          word.toLowerCase().includes('environment');

        return (
          <span
            key={`${word}-${idx}`}
            className={`inline-block transition-all duration-500 ease-out transform ${
              isShown
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
            } ${isEmeraldHighlight ? 'text-[#22C55E]' : 'text-white'}`}
          >
            {word}
          </span>
        );
      })}
    </h1>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');

  // Public Catalog State (Real-time synced with Firestore)
  const [houses, setHouses] = useState<House[]>(INITIAL_HOUSES);
  const [parks, setParks] = useState<Park[]>(INITIAL_PARKS);
  const [amenities, setAmenities] = useState<Amenity[]>(INITIAL_AMENITIES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [settings, setSettings] = useState<SocietySettings>(INITIAL_SOCIETY_SETTINGS);

  // Authenticated User & Private Collections
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [houseInquiries, setHouseInquiries] = useState<HouseInquiry[]>([]);
  const [visitBookings, setVisitBookings] = useState<VisitBooking[]>([]);
  const [gymInquiries, setGymInquiries] = useState<GymInquiry[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Interactive 3D & House Modal States
  const [selected3DHouse, setSelected3DHouse] = useState<House | null>(null);
  const [detailModalHouse, setDetailModalHouse] = useState<House | null>(null);
  const [detailModalAction, setDetailModalAction] = useState<'details' | 'inquiry' | 'visit'>('details');

  // Auth & Quick Search Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Compute Effective Night Mode (Day, Night, or Auto based on user's local clock)
  const effectiveNight = useMemo(() => {
    if (lightingMode === 'night') return true;
    if (lightingMode === 'day') return false;
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  }, [lightingMode]);

  // Subscribe to Public Firestore Catalog
  useEffect(() => {
    const unsub = subscribePublicCatalog({
      onHouses: setHouses,
      onParks: setParks,
      onAmenities: setAmenities,
      onAnnouncements: setAnnouncements,
      onGallery: setGallery,
      onSettings: setSettings,
    });
    return () => unsub();
  }, []);

  // Listen to Firebase Auth State & Private Collections
  useEffect(() => {
    let unsubPrivate: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubPrivate) {
        unsubPrivate();
        unsubPrivate = null;
      }

      if (!fbUser || !fbUser.email) {
        setUserProfile(null);
        setIsAdmin(false);
        setHouseInquiries([]);
        setVisitBookings([]);
        setGymInquiries([]);
        setVisitorLogs([]);
        return;
      }

      try {
        const profile = await ensureUserProfile(
          fbUser.uid,
          fbUser.email,
          fbUser.displayName
        );
        const verifiedAdmin = isUserVerifiedAdmin(
          fbUser.email,
          fbUser.emailVerified,
          profile.role
        );
        setUserProfile(profile);
        setIsAdmin(verifiedAdmin);

        if (verifiedAdmin) {
          await seedInitialCatalogIfNeeded();
        }

        unsubPrivate = subscribeUserPrivateRecords(fbUser.uid, verifiedAdmin, {
          onHouseInquiries: setHouseInquiries,
          onVisitBookings: setVisitBookings,
          onGymInquiries: setGymInquiries,
          onVisitorLogs: setVisitorLogs,
          onContactMessages: setContactMessages,
          onAllUsers: setAllUsers,
        });
      } catch (err) {
        console.warn('Profile initialization warning:', err);
      }
    });

    return () => {
      unsubAuth();
      if (unsubPrivate) unsubPrivate();
    };
  }, []);

  // Dynamic SEO Document Title Sync
  useEffect(() => {
    const pageTitles: Record<ActivePage, string> = {
      home: 'Green Valley Residencia – Where Modern Living Meets Nature',
      colony3d: 'Interactive 3D Colony – Green Valley Residencia',
      houses: 'Luxury Houses & Plots – Green Valley Residencia',
      parks: 'Botanical Parks & Gardens – Green Valley Residencia',
      gym: 'Wellness & Fitness Club – Green Valley Residencia',
      security: '24/7 Gated Security – Green Valley Residencia',
      gallery: 'Architectural Image Gallery – Green Valley Residencia',
      contact: 'Location & Concierge Contact – Green Valley Residencia',
      'user-dashboard': 'Resident Dashboard – Green Valley Residencia',
      'admin-dashboard': 'Admin Control Center – Green Valley Residencia',
      'not-found': 'Page Not Found – Green Valley Residencia',
    };
    document.title = pageTitles[activePage] || 'Green Valley Residencia';
  }, [activePage]);

  const handleNavigate = (page: ActivePage, sectionId?: string) => {
    setActivePage(page);
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleFavorite = async (houseId: string) => {
    if (!userProfile) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    const existing = userProfile.favoriteHouseIds || [];
    const updatedIds = existing.includes(houseId)
      ? existing.filter((id) => id !== houseId)
      : [...existing, houseId].slice(0, 20);

    const updatedProfile = { ...userProfile, favoriteHouseIds: updatedIds };
    setUserProfile(updatedProfile);
    await updateUserProfileDetails(userProfile.uid, {
      fullName: userProfile.fullName,
      phone: userProfile.phone,
      favoriteHouseIds: updatedIds,
    });
  };

  const handleLocateHouseIn3D = (house: House) => {
    setSelected3DHouse(house);
    setActivePage('home');
    setTimeout(() => {
      document.getElementById('colony-3d-anchor')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const liveAvailableCount = houses.filter((h) => h.availability === 'Available').length;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#0B1724] text-[#F8FAFC]">
      {/* Sticky Navigation Bar */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        lightingMode={lightingMode}
        onLightingModeChange={setLightingMode}
        effectiveNight={effectiveNight}
        userProfile={userProfile}
        isAdmin={isAdmin}
        onOpenAuth={(m) => {
          setAuthModalMode(m);
          setAuthModalOpen(true);
        }}
        onLogout={() => {
          signOut(auth);
          setActivePage('home');
        }}
        onOpenQuickSearch={() => setQuickSearchOpen(true)}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activePage === 'user-dashboard' ? (
          userProfile ? (
            <UserDashboard
              userProfile={userProfile}
              houses={houses}
              houseInquiries={houseInquiries}
              visitBookings={visitBookings}
              gymInquiries={gymInquiries}
              visitorLogs={visitorLogs}
              announcements={announcements}
              onToggleFavorite={handleToggleFavorite}
              onInspectHouse={(h) => {
                setDetailModalAction('details');
                setDetailModalHouse(h);
              }}
              onLogout={() => {
                signOut(auth);
                setActivePage('home');
              }}
              onProfileUpdated={setUserProfile}
            />
          ) : (
            <div className="py-24 text-center px-4">
              <h2 className="font-display text-3xl text-white">
                Resident Authentication Required
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Please sign in to access your private resident dashboard.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="mt-5 px-6 py-2.5 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
              >
                Login to Continue
              </button>
            </div>
          )
        ) : activePage === 'admin-dashboard' ? (
          isAdmin ? (
            <AdminDashboard
              houses={houses}
              parks={parks}
              amenities={amenities}
              allUsers={allUsers}
              houseInquiries={houseInquiries}
              visitBookings={visitBookings}
              gymInquiries={gymInquiries}
              visitorLogs={visitorLogs}
              announcements={announcements}
              gallery={gallery}
              contactMessages={contactMessages}
              settings={settings}
              onHousesChange={setHouses}
              onParksChange={setParks}
              onAmenitiesChange={setAmenities}
              onAnnouncementsChange={setAnnouncements}
              onGalleryChange={setGallery}
              onAllUsersChange={setAllUsers}
              onVisitBookingsChange={setVisitBookings}
              onInquiriesChange={setHouseInquiries}
              onGymInquiriesChange={setGymInquiries}
              onContactMessagesChange={setContactMessages}
              onVisitorLogsChange={setVisitorLogs}
              onSettingsChange={setSettings}
            />
          ) : (
            <div className="py-24 text-center px-4">
              <h2 className="font-display text-3xl text-white">
                Restricted Administrator Portal
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Access to the Green Valley Residencia Admin Dashboard requires a verified
                administrator role in Firestore.
              </p>
              <button
                type="button"
                onClick={() => setActivePage('home')}
                className="mt-5 px-6 py-2.5 bg-white/10 text-white text-xs rounded-lg"
              >
                Return to Home Page
              </button>
            </div>
          )
        ) : activePage === 'not-found' ? (
          <div className="py-28 text-center px-4">
            <p className="text-xs font-mono-tabular text-[#22C55E]">ERROR 404</p>
            <h1 className="font-display text-4xl text-white mt-2">
              Sector or Page Not Found
            </h1>
            <button
              type="button"
              onClick={() => setActivePage('home')}
              className="mt-6 px-6 py-2.5 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
            >
              Return to Main Boulevard
            </button>
          </div>
        ) : (
          <>
            {/* ============================================================= */}
            {/* 1. CINEMATIC HERO SECTION                                     */}
            {/* ============================================================= */}
            {activePage === 'home' && (
              <section className="relative min-h-[620px] lg:min-h-[680px] flex items-center overflow-hidden border-b border-white/10">
                <HeroLiveSimulation effectiveNight={effectiveNight} />

                <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 py-20 w-full">
                  <div className="max-w-2xl space-y-6">
                    <div className="text-xs font-medium tracking-widest uppercase text-[#22C55E]">
                      Where Modern Living Meets Nature
                    </div>

                    <AnimatedHeroHeading text={settings.heroHeading} />

                    <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                      {settings.heroDescription}
                    </p>

                    {/* Hero Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById('colony-3d-anchor')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="px-6 py-3.5 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] font-semibold text-xs sm:text-sm rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                      >
                        <Compass className="w-4 h-4" />
                        <span>Explore Our Colony</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById('houses-section')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="px-6 py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white font-medium text-xs sm:text-sm rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                      >
                        <span>View Available Houses</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {!userProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthModalMode('signup');
                            setAuthModalOpen(true);
                          }}
                          className="px-5 py-3.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-[#22C55E] transition-colors whitespace-nowrap"
                        >
                          Create Account →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* 2. DATABASE-DRIVEN SOCIETY STATISTICS BAR                     */}
            {/* ============================================================= */}
            {activePage === 'home' && (
              <section className="bg-[#071827] border-b border-white/10 py-10">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 font-mono-tabular">
                    <div className="border-l-2 border-[#22C55E] pl-4">
                      <div className="text-2xl sm:text-3xl font-semibold text-white">
                        {houses.length}
                      </div>
                      <div className="text-xs text-slate-400 font-sans mt-0.5">
                        Total Constructed Houses
                      </div>
                    </div>
                    <div className="border-l-2 border-[#22C55E] pl-4">
                      <div className="text-2xl sm:text-3xl font-semibold text-[#22C55E]">
                        {liveAvailableCount}
                      </div>
                      <div className="text-xs text-slate-400 font-sans mt-0.5">
                        Available Houses
                      </div>
                    </div>
                    <div className="border-l-2 border-white/15 pl-4">
                      <div className="text-2xl sm:text-3xl font-semibold text-white">
                        {settings.totalParks}
                      </div>
                      <div className="text-xs text-slate-400 font-sans mt-0.5">
                        Botanical Parks
                      </div>
                    </div>
                    <div className="border-l-2 border-white/15 pl-4">
                      <div className="text-2xl sm:text-3xl font-semibold text-white">
                        {settings.gymFacilitiesCount} Zones
                      </div>
                      <div className="text-xs text-slate-400 font-sans mt-0.5">
                        Modern Gym & Spa
                      </div>
                    </div>
                    <div className="border-l-2 border-white/15 pl-4">
                      <div className="text-2xl sm:text-3xl font-semibold text-white">
                        24/7 ({settings.securityCheckpoints} Gates)
                      </div>
                      <div className="text-xs text-slate-400 font-sans mt-0.5">
                        Gated Security System
                      </div>
                    </div>
                    <div className="border-l-2 border-white/15 pl-4">
                      <div className="text-2xl sm:text-3xl font-semibold text-white">
                        {settings.communityFacilities}
                      </div>
                      <div className="text-xs text-slate-400 font-sans mt-0.5">
                        Community Facilities
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* 3. ABOUT & ARCHITECTURAL FEATURES BENTO GRID                  */}
            {/* ============================================================= */}
            {activePage === 'home' && (
              <section id="about-section" className="py-20 bg-[#0B1724]">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
                  <div className="max-w-2xl mb-12">
                    <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
                      About Green Valley Residencia
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                      Master-Planned for Sustainable Family Living
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base mt-2">
                      Designed around lush botanical corridors, underground utility infrastructure,
                      and contemporary architectural standards.
                    </p>
                  </div>

                  {/* Asymmetric Bento Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#071827] border border-white/10 rounded-xl p-7 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-mono-tabular text-[#22C55E]">
                          01. Architectural Excellence
                        </span>
                        <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white mt-1">
                          Move-In Ready Designer Residences Across Four Plot Categories
                        </h3>
                        <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-xl">
                          Every villa in Green Valley Residencia is constructed with seismic-grade
                          reinforced concrete, acoustic double glazing, imported sanitary fittings,
                          and solar-ready rooftops. Choose from 1 Kanal flagship estates, 10 Marla
                          park-facing homes, or smartly planned 5 and 3 Marla family residences.
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-mono-tabular">
                        <span>Underground Electrification</span>
                        <span aria-hidden="true">·</span>
                        <span>80-Ft Wide Main Boulevard</span>
                        <span aria-hidden="true">·</span>
                        <span>Fiber-to-the-Home (FTTH)</span>
                      </div>
                    </div>

                    <div className="bg-[#071827] border border-white/10 rounded-xl p-7 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-mono-tabular text-[#22C55E]">
                          02. Green Ecology
                        </span>
                        <h3 className="font-display text-2xl font-semibold text-white mt-1">
                          36+ Kanals of Botanical Parks & Walking Trails
                        </h3>
                        <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                          Over 35% of the colony footprint is dedicated to open green parks, tree
                          canopies, children’s play groves, and cushioned jogging tracks.
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/10 text-xs text-[#22C55E] font-mono-tabular">
                        1,200+ Mature Indigenous Trees Planted
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* 4. REALISTIC 3D HOUSING SOCIETY VIEWPORT                      */}
            {/* ============================================================= */}
            {(activePage === 'home' || activePage === 'colony3d') && (
              <div id="colony-3d-anchor">
                <Colony3DScene
                  houses={houses}
                  lightingMode={lightingMode}
                  onLightingModeChange={setLightingMode}
                  effectiveNight={effectiveNight}
                  selectedHouse={selected3DHouse}
                  onSelectHouse={setSelected3DHouse}
                  onInspectHouseDetails={(h) => {
                    setDetailModalAction('details');
                    setDetailModalHouse(h);
                  }}
                  onBookVisit={(h) => {
                    setDetailModalAction('visit');
                    setDetailModalHouse(h);
                  }}
                  onInquireHouse={(h) => {
                    setDetailModalAction('inquiry');
                    setDetailModalHouse(h);
                  }}
                />
              </div>
            )}

            {/* ============================================================= */}
            {/* 5. COMPLETE HOUSES LISTING SECTION                            */}
            {/* ============================================================= */}
            {(activePage === 'home' || activePage === 'houses') && (
              <HousesSection
                houses={houses}
                userProfile={userProfile}
                onToggleFavorite={handleToggleFavorite}
                onLocateIn3D={handleLocateHouseIn3D}
                onRequireAuth={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                selectedDetailHouse={detailModalHouse}
                onSelectDetailHouse={setDetailModalHouse}
                initialModalAction={detailModalAction}
              />
            )}

            {/* ============================================================= */}
            {/* 6. PARKS, MODERN GYM & SECURITY SYSTEM SECTIONS               */}
            {/* ============================================================= */}
            {(activePage === 'home' ||
              activePage === 'parks' ||
              activePage === 'gym' ||
              activePage === 'security') && (
              <AmenitiesSection
                parks={parks}
                amenities={amenities}
                announcements={announcements}
                visitorLogs={visitorLogs}
                settings={settings}
                userProfile={userProfile}
                isAdmin={isAdmin}
                onRequireAuth={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
              />
            )}

            {/* ============================================================= */}
            {/* 7. ARCHITECTURAL IMAGE GALLERY                                */}
            {/* ============================================================= */}
            {(activePage === 'home' || activePage === 'gallery') && (
              <GallerySection gallery={gallery} />
            )}

            {/* ============================================================= */}
            {/* 8. LOCATION & CONTACT SECTION                                 */}
            {/* ============================================================= */}
            {(activePage === 'home' || activePage === 'contact') && (
              <ContactSection
                settings={settings}
                userProfile={userProfile}
                onRequireAuth={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                onExplore3D={() => handleNavigate('colony3d')}
              />
            )}
          </>
        )}
      </main>

      {/* Global Quick House Search Modal */}
      {quickSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-[#071827] border border-white/15 rounded-2xl max-w-xl w-full p-5 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <Search className="w-4 h-4 text-[#22C55E]" />
              <input
                type="text"
                autoFocus
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                placeholder="Quick search by house number (GV-101), plot size (1 Kanal), or sector..."
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuickSearchOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-white/10">
              {houses
                .filter((h) => {
                  const q = quickSearchQuery.toLowerCase();
                  return (
                    h.houseNumber.toLowerCase().includes(q) ||
                    h.title.toLowerCase().includes(q) ||
                    h.plotSize.toLowerCase().includes(q) ||
                    h.sector.toLowerCase().includes(q)
                  );
                })
                .map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setQuickSearchOpen(false);
                      setDetailModalAction('details');
                      setDetailModalHouse(h);
                    }}
                    className="w-full py-3 px-2 flex items-center justify-between text-left hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-xs font-mono-tabular text-[#22C55E]">
                        {h.houseNumber} · {h.plotSize} · {h.availability}
                      </div>
                      <div className="text-sm font-medium text-white">{h.title}</div>
                    </div>
                    <div className="text-xs font-mono-tabular text-slate-300">
                      PKR {(h.pricePKR / 1000000).toFixed(2)}M
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#071827] border-t border-white/10 py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <GreenValleyLogo className="w-9 h-9" />
            <div>
              <div className="font-display text-xl font-semibold text-white">
                Green Valley Residencia
              </div>
              <div className="text-xs text-slate-400">
                Where Modern Living Meets Nature
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} Green Valley Residencia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
