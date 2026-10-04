import React, { useMemo, useState } from 'react';
import {
  Search,
  Heart,
  Eye,
  Calendar,
  MessageSquare,
  Compass,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Tv,
} from 'lucide-react';
import {
  AvailabilityStatus,
  House,
  HouseType,
  UserProfile,
} from '../types/society';
import { ResilientImage } from './Logo';
import {
  submitHouseInquiry,
  submitVisitBooking,
} from '../lib/firestoreService';

interface HousesSectionProps {
  houses: House[];
  userProfile: UserProfile | null;
  onToggleFavorite: (houseId: string) => void;
  onLocateIn3D: (house: House) => void;
  onRequireAuth: () => void;
  selectedDetailHouse: House | null;
  onSelectDetailHouse: (house: House | null) => void;
  initialModalAction?: 'details' | 'inquiry' | 'visit';
}

export const HousesSection: React.FC<HousesSectionProps> = ({
  houses,
  userProfile,
  onToggleFavorite,
  onLocateIn3D,
  onRequireAuth,
  selectedDetailHouse,
  onSelectDetailHouse,
  initialModalAction = 'details',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlotSize, setSelectedPlotSize] = useState<'All' | HouseType>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<'All' | AvailabilityStatus>('All');
  const [maxPriceMillion, setMaxPriceMillion] = useState<number>(120);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'area-desc'>('price-asc');

  // Active sub-tab inside the house modal ('details' | 'inquiry' | 'visit')
  const [modalTab, setModalTab] = useState<'details' | 'inquiry' | 'visit'>(initialModalAction);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Inquiry & Visit Booking Form States
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('11:00 AM');
  const [visitNotes, setVisitNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openHouseModal = (house: House, tab: 'details' | 'inquiry' | 'visit') => {
    onSelectDetailHouse(house);
    setModalTab(tab);
    setActivePhotoIdx(0);
    setFeedback(null);
    if (userProfile) {
      setFullName(userProfile.fullName);
      setEmail(userProfile.email);
      setPhone(userProfile.phone);
    }
  };

  const filteredHouses = useMemo(() => {
    return houses
      .filter((h) => {
        const q = searchQuery.trim().toLowerCase();
        if (
          q &&
          !h.houseNumber.toLowerCase().includes(q) &&
          !h.title.toLowerCase().includes(q) &&
          !h.sector.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (selectedPlotSize !== 'All' && h.plotSize !== selectedPlotSize) {
          return false;
        }
        if (
          selectedAvailability !== 'All' &&
          h.availability !== selectedAvailability
        ) {
          return false;
        }
        if (h.pricePKR / 1000000 > maxPriceMillion) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.pricePKR - b.pricePKR;
        if (sortBy === 'price-desc') return b.pricePKR - a.pricePKR;
        return b.coveredAreaSqFt - a.coveredAreaSqFt;
      });
  }, [houses, searchQuery, selectedPlotSize, selectedAvailability, maxPriceMillion, sortBy]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailHouse) return;
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    if (inquiryMessage.trim().length < 5) {
      setFeedback({ type: 'error', text: 'Please enter a message of at least 5 characters.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await submitHouseInquiry({
        userId: userProfile.uid,
        houseId: selectedDetailHouse.id,
        houseNumber: selectedDetailHouse.houseNumber,
        fullName: fullName || userProfile.fullName,
        email: email || userProfile.email,
        phone,
        message: inquiryMessage,
      });
      setInquiryMessage('');
      setFeedback({
        type: 'success',
        text: `Inquiry for ${selectedDetailHouse.houseNumber} recorded. Track responses in your Resident Dashboard.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to submit inquiry.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailHouse) return;
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    if (!preferredDate) {
      setFeedback({ type: 'error', text: 'Please select a preferred visit date.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await submitVisitBooking({
        userId: userProfile.uid,
        houseId: selectedDetailHouse.id,
        houseNumber: selectedDetailHouse.houseNumber,
        fullName: fullName || userProfile.fullName,
        email: email || userProfile.email,
        phone,
        preferredDate,
        preferredTime,
        notes: visitNotes || 'Guided architectural tour requested.',
      });
      setVisitNotes('');
      setFeedback({
        type: 'success',
        text: `Site visit for ${selectedDetailHouse.houseNumber} requested for ${preferredDate} at ${preferredTime}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to schedule visit.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="houses-section" className="py-20 bg-[#0B1724]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
              Architectural Residences & Plots
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Constructed Luxury Homes
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Browse verified 3 Marla, 5 Marla, 10 Marla, and 1 Kanal residences. Every listing
              reflects real-time database availability and includes complete architectural
              specifications.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono-tabular">
            Showing {filteredHouses.length} of {houses.length} Verified Properties
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#071827] border border-white/10 rounded-xl p-5 mb-10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search by House Number or Title */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search house number (e.g. GV-101)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B1724] border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            {/* Availability Selector */}
            <div>
              <select
                value={selectedAvailability}
                onChange={(e) =>
                  setSelectedAvailability(e.target.value as 'All' | AvailabilityStatus)
                }
                aria-label="Filter by Availability"
                className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
              >
                <option value="All">All Availability Statuses</option>
                <option value="Available">Available Only</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold / Occupied</option>
              </select>
            </div>

            {/* Price Ceiling Slider */}
            <div className="flex flex-col justify-center bg-[#0B1724] border border-white/10 rounded-lg px-3.5 py-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Max Price</span>
                <span className="font-mono-tabular text-[#22C55E] font-semibold">
                  Up to PKR {maxPriceMillion}M
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={maxPriceMillion}
                onChange={(e) => setMaxPriceMillion(Number(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'price-asc' | 'price-desc' | 'area-desc')
                }
                aria-label="Sort properties"
                className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
              >
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
                <option value="area-desc">Sort: Covered Area (Largest)</option>
              </select>
            </div>
          </div>

          {/* Interactive Plot Size Segmented Filter Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', '3 Marla', '5 Marla', '10 Marla', '1 Kanal'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedPlotSize(size)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    selectedPlotSize === size
                      ? 'bg-[#22C55E] text-[#071827] font-semibold'
                      : 'bg-[#0B1724] text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {size === 'All' ? 'All Plot Sizes' : size}
                </button>
              ))}
            </div>

            {(searchQuery ||
              selectedPlotSize !== 'All' ||
              selectedAvailability !== 'All' ||
              maxPriceMillion < 120) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPlotSize('All');
                  setSelectedAvailability('All');
                  setMaxPriceMillion(120);
                }}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Property Cards Grid */}
        {filteredHouses.length === 0 ? (
          <div className="bg-[#071827] border border-white/10 rounded-xl p-12 text-center">
            <p className="font-display text-2xl text-white">
              No residences match your current filter criteria
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Try expanding your price ceiling or selecting all plot sizes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedPlotSize('All');
                setSelectedAvailability('All');
                setMaxPriceMillion(120);
              }}
              className="mt-5 px-5 py-2.5 bg-[#22C55E] text-[#071827] text-xs font-semibold rounded-lg hover:bg-[#4ADE80] transition-colors"
            >
              Show All Residences
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredHouses.map((house) => {
              const isFavorite = userProfile?.favoriteHouseIds?.includes(house.id);
              return (
                <article
                  key={house.id}
                  className="group bg-[#071827] border border-white/10 hover:border-[#22C55E]/50 rounded-xl overflow-hidden flex flex-col transition-colors"
                >
                  {/* Image Header */}
                  <div className="relative h-60 w-full overflow-hidden bg-[#0B1724]">
                    <ResilientImage
                      src={house.images[0]}
                      alt={`${house.houseNumber} - ${house.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071827] via-transparent to-black/30" />

                    {/* Favorite Action Button */}
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(house.id)}
                      aria-label={`Save ${house.houseNumber} to favorites`}
                      className={`absolute top-3 right-3 p-2.5 rounded-lg backdrop-blur-md border transition-colors ${
                        isFavorite
                          ? 'bg-[#22C55E] text-[#071827] border-[#22C55E]'
                          : 'bg-black/50 text-white border-white/15 hover:bg-black/75'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Price Overlay at bottom-left */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-baseline justify-between">
                      <span className="font-mono-tabular text-xl font-semibold text-white">
                        PKR {(house.pricePKR / 1000000).toFixed(2)}M
                      </span>
                      <span
                        className={`text-xs font-medium font-mono-tabular ${
                          house.availability === 'Available'
                            ? 'text-[#22C55E]'
                            : house.availability === 'Reserved'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        ● {house.availability}
                      </span>
                    </div>
                  </div>

                  {/* Card Body — Clean Unboxed Metadata per Zero-Pill Discipline */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
                        <span>{house.houseNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{house.plotSize}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{house.sector}</span>
                      </div>

                      <h3 className="font-display text-2xl font-semibold text-white mt-1">
                        {house.title}
                      </h3>

                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3 text-xs text-slate-300 font-mono-tabular">
                        <span>{house.bedrooms} Bedrooms</span>
                        <span aria-hidden="true">·</span>
                        <span>{house.bathrooms} Bathrooms</span>
                        <span aria-hidden="true">·</span>
                        <span>{house.coveredAreaSqFt.toLocaleString()} sq.ft</span>
                      </div>

                      <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {house.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => openHouseModal(house, 'details')}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openHouseModal(house, 'visit')}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Visit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onLocateIn3D(house)}
                        title="View Plot in 3D Colony"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span>3D View</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete House Details, Floor Plan, Inquiry & Visit Booking Modal */}
      {selectedDetailHouse && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#071827] border border-white/15 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl my-8">
            {/* Modal Top Bar */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400 font-mono-tabular">
                  {selectedDetailHouse.houseNumber} · {selectedDetailHouse.plotSize} ·{' '}
                  {selectedDetailHouse.sector}
                </div>
                <h3 className="font-display text-2xl font-semibold text-white">
                  {selectedDetailHouse.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectDetailHouse(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Mode Switcher Tabs */}
            <div className="px-6 py-3 bg-[#0B1724] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('details');
                    setFeedback(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    modalTab === 'details'
                      ? 'bg-[#22C55E] text-[#071827] font-semibold'
                      : 'text-slate-300 hover:text-white bg-white/5'
                  }`}
                >
                  Specifications & Floor Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('visit');
                    setFeedback(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    modalTab === 'visit'
                      ? 'bg-[#22C55E] text-[#071827] font-semibold'
                      : 'text-slate-300 hover:text-white bg-white/5'
                  }`}
                >
                  Book a Site Visit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('inquiry');
                    setFeedback(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    modalTab === 'inquiry'
                      ? 'bg-[#22C55E] text-[#071827] font-semibold'
                      : 'text-slate-300 hover:text-white bg-white/5'
                  }`}
                >
                  Send Property Inquiry
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const h = selectedDetailHouse;
                    onSelectDetailHouse(null);
                    onLocateIn3D(h);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#4ADE80] border border-[#22C55E]/40 text-xs rounded-lg font-semibold transition-colors"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Walk Inside Room (Live LCD TV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const h = selectedDetailHouse;
                    onSelectDetailHouse(null);
                    onLocateIn3D(h);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium"
                >
                  <Compass className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Inspect in 3D Colony</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {modalTab === 'details' && (
                <div className="space-y-6">
                  {/* Photo Carousel */}
                  <div className="relative h-72 sm:h-80 rounded-xl overflow-hidden bg-[#0B1724] border border-white/10">
                    <ResilientImage
                      src={
                        selectedDetailHouse.images[activePhotoIdx] ||
                        selectedDetailHouse.images[0]
                      }
                      alt={selectedDetailHouse.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedDetailHouse.images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActivePhotoIdx((i) =>
                              i === 0 ? selectedDetailHouse.images.length - 1 : i - 1
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActivePhotoIdx(
                              (i) => (i + 1) % selectedDetailHouse.images.length
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 rounded text-xs font-mono-tabular text-white">
                      Photo {activePhotoIdx + 1} / {selectedDetailHouse.images.length}
                    </div>
                  </div>

                  {/* Key Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-white/10 font-mono-tabular">
                    <div>
                      <div className="text-xs text-slate-400">Asking Price</div>
                      <div className="text-lg font-semibold text-[#22C55E]">
                        PKR {selectedDetailHouse.pricePKR.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Plot & Covered Area</div>
                      <div className="text-sm font-semibold text-white">
                        {selectedDetailHouse.plotSize} ·{' '}
                        {selectedDetailHouse.coveredAreaSqFt.toLocaleString()} sq.ft
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Accommodation</div>
                      <div className="text-sm font-semibold text-white">
                        {selectedDetailHouse.bedrooms} Beds · {selectedDetailHouse.bathrooms} Baths
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Database Status</div>
                      <div
                        className={`text-sm font-semibold ${
                          selectedDetailHouse.availability === 'Available'
                            ? 'text-[#22C55E]'
                            : selectedDetailHouse.availability === 'Reserved'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {selectedDetailHouse.availability}
                      </div>
                    </div>
                  </div>

                  {/* Description & Kitchen Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Architectural Overview
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedDetailHouse.description}
                      </p>
                      <div className="mt-4 text-xs text-slate-400">
                        Location: {selectedDetailHouse.street}, {selectedDetailHouse.sector}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Kitchen & Culinary Fit-Out
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedDetailHouse.kitchenDetails}
                      </p>
                      <h4 className="text-sm font-semibold text-white mt-4 mb-2">
                        Floor Plan Zoning
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedDetailHouse.floorPlanSummary}
                      </p>
                    </div>
                  </div>

                  {/* Architectural Floor Plan Schematic SVG */}
                  <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#22C55E]">
                        Architectural Floor Plan Schematic — {selectedDetailHouse.plotSize}
                      </span>
                      <span className="text-xs font-mono-tabular text-slate-400">
                        {selectedDetailHouse.coveredAreaSqFt.toLocaleString()} sq.ft Total Covered
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 600 220"
                      className="w-full h-44 stroke-[#22C55E]/70 fill-none"
                    >
                      <rect x="10" y="10" width="275" height="200" strokeWidth="2" />
                      <line x1="10" y1="90" x2="285" y2="90" strokeWidth="1.2" />
                      <line x1="145" y1="10" x2="145" y2="210" strokeWidth="1.2" />
                      <text x="24" y="45" fill="#94A3B8" fontSize="11" stroke="none">
                        Master Suite 01
                      </text>
                      <text x="160" y="45" fill="#94A3B8" fontSize="11" stroke="none">
                        Chef Kitchen & Dining
                      </text>
                      <text x="24" y="155" fill="#94A3B8" fontSize="11" stroke="none">
                        Car Porch & Veranda
                      </text>
                      <text x="160" y="155" fill="#94A3B8" fontSize="11" stroke="none">
                        Double-Height Lounge
                      </text>

                      <rect x="315" y="10" width="275" height="200" strokeWidth="2" />
                      <line x1="315" y1="110" x2="590" y2="110" strokeWidth="1.2" />
                      <line x1="450" y1="10" x2="450" y2="210" strokeWidth="1.2" />
                      <text x="330" y="55" fill="#94A3B8" fontSize="11" stroke="none">
                        Upper Suite 02
                      </text>
                      <text x="465" y="55" fill="#94A3B8" fontSize="11" stroke="none">
                        Upper Suite 03
                      </text>
                      <text x="330" y="165" fill="#94A3B8" fontSize="11" stroke="none">
                        Family Lounge
                      </text>
                      <text x="465" y="165" fill="#94A3B8" fontSize="11" stroke="none">
                        Landscaped Terrace
                      </text>
                    </svg>
                  </div>
                </div>
              )}

              {modalTab === 'visit' && (
                <form onSubmit={handleVisitSubmit} className="space-y-4">
                  <p className="text-sm text-slate-300">
                    Schedule a private guided tour of{' '}
                    <span className="text-white font-semibold">
                      {selectedDetailHouse.houseNumber} ({selectedDetailHouse.title})
                    </span>{' '}
                    with our on-site architectural concierge.
                  </p>

                  {feedback && (
                    <div
                      className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs ${
                        feedback.type === 'success'
                          ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#4ADE80]'
                          : 'bg-red-500/15 border-red-500/40 text-red-300'
                      }`}
                    >
                      {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        maxLength={30}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                        className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Preferred Date *</label>
                      <input
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Preferred Time *</label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                      >
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="02:30 PM">02:30 PM</option>
                        <option value="04:30 PM">04:30 PM</option>
                        <option value="06:00 PM (Twilight Lighting Tour)">
                          06:00 PM (Twilight Lighting Tour)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Additional Visit Notes
                    </label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder="Specify number of family members attending or questions about payment plans..."
                      className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-[#22C55E] hover:bg-[#4ADE80] disabled:opacity-50 text-[#071827] font-semibold text-xs rounded-lg transition-colors"
                  >
                    {submitting
                      ? 'Scheduling Appointment...'
                      : userProfile
                      ? 'Confirm Visit Booking'
                      : 'Sign In to Book Visit'}
                  </button>
                </form>
              )}

              {modalTab === 'inquiry' && (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <p className="text-sm text-slate-300">
                    Submit a direct inquiry regarding{' '}
                    <span className="text-white font-semibold">
                      {selectedDetailHouse.houseNumber} ({selectedDetailHouse.title})
                    </span>
                    . Responses are delivered directly to your Resident Dashboard.
                  </p>

                  {feedback && (
                    <div
                      className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs ${
                        feedback.type === 'success'
                          ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#4ADE80]'
                          : 'bg-red-500/15 border-red-500/40 text-red-300'
                      }`}
                    >
                      {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        maxLength={30}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                        className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Your Message *</label>
                    <textarea
                      rows={4}
                      required
                      minLength={5}
                      maxLength={1500}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder="Ask about possession timelines, structural warranty, or custom interior finishes..."
                      className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-[#22C55E] hover:bg-[#4ADE80] disabled:opacity-50 text-[#071827] font-semibold text-xs rounded-lg transition-colors"
                  >
                    {submitting
                      ? 'Sending Inquiry...'
                      : userProfile
                      ? 'Submit Official Inquiry'
                      : 'Sign In to Send Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
