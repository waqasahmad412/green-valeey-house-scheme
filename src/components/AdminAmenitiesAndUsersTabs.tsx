import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  Trees,
  Dumbbell,
  Megaphone,
  Image as ImageIcon,
  Users,
  Settings,
  RotateCcw,
} from 'lucide-react';
import {
  Amenity,
  Announcement,
  GalleryItem,
  Park,
  SocietySettings,
  UserProfile,
} from '../types/society';
import {
  deleteAmenityAdmin,
  deleteAnnouncementAdmin,
  deleteGalleryItemAdmin,
  deleteParkAdmin,
  deleteUserProfileAdmin,
  saveAmenityAdmin,
  saveAnnouncementAdmin,
  saveGalleryItemAdmin,
  saveParkAdmin,
  saveSocietySettingsAdmin,
  saveUserProfileAdmin,
  updateUserRoleOrStatusAdmin,
} from '../lib/firestoreService';
import { uploadSocietyImage } from '../lib/firebase';
import {
  GENERATED_IMAGES,
  INITIAL_SOCIETY_SETTINGS,
} from '../data/initialSocietyData';

interface Tab5Props {
  parks: Park[];
  amenities: Amenity[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  onParksChange?: (updater: (prev: Park[]) => Park[]) => void;
  onAmenitiesChange?: (updater: (prev: Amenity[]) => Amenity[]) => void;
  onAnnouncementsChange?: (updater: (prev: Announcement[]) => Announcement[]) => void;
  onGalleryChange?: (updater: (prev: GalleryItem[]) => GalleryItem[]) => void;
  onNotify: (msg: string) => void;
}

export const AdminTab5AmenitiesGallery: React.FC<Tab5Props> = ({
  parks,
  amenities,
  announcements,
  gallery,
  onParksChange,
  onAmenitiesChange,
  onAnnouncementsChange,
  onGalleryChange,
  onNotify,
}) => {
  // Park Form State
  const [editingPark, setEditingPark] = useState<Park | null>(null);
  const [parkFacilitiesText, setParkFacilitiesText] = useState('');

  // Amenity Form State
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [amenityHighlightsText, setAmenityHighlightsText] = useState('');

  // Announcement Form State
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  // Gallery Form State
  const [editingGal, setEditingGal] = useState<GalleryItem | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const startNewPark = () => {
    const newPark: Park = {
      id: `park_${Date.now()}`,
      name: '',
      sector: 'Sector B - Park View',
      areaSize: '8 Kanals Lush Green',
      openingHours: '06:00 AM – 10:30 PM Daily',
      description: 'Lush family botanical park with walking trails.',
      facilities: ['Walking Track', 'Family Gazebo', 'Kids Play Zone'],
      imageUrl: GENERATED_IMAGES.parkClubhouse,
    };
    setEditingPark(newPark);
    setParkFacilitiesText(newPark.facilities.join(', '));
  };

  const startEditPark = (p: Park) => {
    setEditingPark({ ...p });
    setParkFacilitiesText((p.facilities || []).join(', '));
  };

  const handleSavePark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPark) return;
    const facilities = parkFacilitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = { ...editingPark, facilities };

    // Optimistic update
    if (onParksChange) {
      onParksChange((prev) => {
        const idx = prev.findIndex((p) => p.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveParkAdmin(updated);
      onNotify(`Saved park "${updated.name}" successfully.`);
    } catch (err) {
      onNotify(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingPark(null);
  };

  const handleDeletePark = async (parkId: string, parkName: string) => {
    // Optimistic delete
    if (onParksChange) {
      onParksChange((prev) => prev.filter((p) => p.id !== parkId));
    }
    try {
      await deleteParkAdmin(parkId);
      onNotify(`Deleted park "${parkName}".`);
    } catch (err) {
      onNotify(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startNewAmenity = () => {
    const newAm: Amenity = {
      id: `amenity_${Date.now()}`,
      name: '',
      category: 'Gym',
      openingHours: '06:00 AM – 11:00 PM',
      description: 'Contemporary wellness and fitness pavilion.',
      highlights: ['Modern Equipment', 'Certified Trainers', 'Air Conditioned'],
      imageUrl: GENERATED_IMAGES.parkClubhouse,
    };
    setEditingAmenity(newAm);
    setAmenityHighlightsText(newAm.highlights.join(', '));
  };

  const startEditAmenity = (a: Amenity) => {
    setEditingAmenity({ ...a });
    setAmenityHighlightsText((a.highlights || []).join(', '));
  };

  const handleSaveAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAmenity) return;
    const highlights = amenityHighlightsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = { ...editingAmenity, highlights };

    // Optimistic update
    if (onAmenitiesChange) {
      onAmenitiesChange((prev) => {
        const idx = prev.findIndex((a) => a.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveAmenityAdmin(updated);
      onNotify(`Saved amenity "${updated.name}" successfully.`);
    } catch (err) {
      onNotify(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingAmenity(null);
  };

  const handleDeleteAmenity = async (amenityId: string, name: string) => {
    if (onAmenitiesChange) {
      onAmenitiesChange((prev) => prev.filter((a) => a.id !== amenityId));
    }
    try {
      await deleteAmenityAdmin(amenityId);
      onNotify(`Deleted amenity "${name}".`);
    } catch (err) {
      onNotify(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startNewAnn = () => {
    setEditingAnn({
      id: `ann_${Date.now()}`,
      title: '',
      category: 'Community',
      priority: 'Normal',
      content: '',
      publishedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });
  };

  const handleSaveAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn) return;
    const updated = { ...editingAnn };

    if (onAnnouncementsChange) {
      onAnnouncementsChange((prev) => {
        const idx = prev.findIndex((a) => a.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveAnnouncementAdmin(updated);
      onNotify(`Saved announcement "${updated.title}" successfully.`);
    } catch (err) {
      onNotify(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingAnn(null);
  };

  const handleDeleteAnn = async (annId: string, title: string) => {
    if (onAnnouncementsChange) {
      onAnnouncementsChange((prev) => prev.filter((a) => a.id !== annId));
    }
    try {
      await deleteAnnouncementAdmin(annId);
      onNotify(`Deleted announcement "${title}".`);
    } catch (err) {
      onNotify(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startNewGal = () => {
    setEditingGal({
      id: `gal_${Date.now()}`,
      title: '',
      category: 'Modern Houses',
      caption: '',
      imageUrl: GENERATED_IMAGES.villaKanal,
    });
  };

  const handleSaveGal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGal) return;
    const updated = { ...editingGal };

    if (onGalleryChange) {
      onGalleryChange((prev) => {
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
      await saveGalleryItemAdmin(updated);
      onNotify(`Saved gallery photo "${updated.title}" successfully.`);
    } catch (err) {
      onNotify(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingGal(null);
  };

  const handleDeleteGal = async (galId: string, title: string) => {
    if (onGalleryChange) {
      onGalleryChange((prev) => prev.filter((g) => g.id !== galId));
    }
    try {
      await deleteGalleryItemAdmin(galId);
      onNotify(`Deleted gallery photo "${title}".`);
    } catch (err) {
      onNotify(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingGal) return;
    setUploadingImg(true);
    try {
      const url = await uploadSocietyImage(file, 'gallery');
      setEditingGal({ ...editingGal, imageUrl: url });
      onNotify('Uploaded photograph for gallery item.');
    } finally {
      setUploadingImg(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 5A. PARKS MANAGEMENT */}
      <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trees className="w-5 h-5 text-[#22C55E]" />
            <h3 className="font-display text-2xl font-semibold text-white">
              Society Parks ({parks.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={startNewPark}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Park</span>
          </button>
        </div>

        {editingPark && (
          <form
            onSubmit={handleSavePark}
            className="p-5 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-3 text-xs"
          >
            <h4 className="font-display text-lg font-semibold text-white">
              {parks.some((p) => p.id === editingPark.id)
                ? `Edit Park: ${editingPark.name}`
                : 'Add New Society Park'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Park Name *</label>
                <input
                  type="text"
                  required
                  value={editingPark.name}
                  onChange={(e) => setEditingPark({ ...editingPark, name: e.target.value })}
                  placeholder="Emerald Central Park"
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Sector / Location *</label>
                <input
                  type="text"
                  required
                  value={editingPark.sector}
                  onChange={(e) => setEditingPark({ ...editingPark, sector: e.target.value })}
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Area Size *</label>
                <input
                  type="text"
                  required
                  value={editingPark.areaSize}
                  onChange={(e) => setEditingPark({ ...editingPark, areaSize: e.target.value })}
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Opening Hours *</label>
                <input
                  type="text"
                  required
                  value={editingPark.openingHours}
                  onChange={(e) =>
                    setEditingPark({ ...editingPark, openingHours: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">
                  Facilities (comma-separated)
                </label>
                <input
                  type="text"
                  value={parkFacilitiesText}
                  onChange={(e) => setParkFacilitiesText(e.target.value)}
                  placeholder="Jogging Track, Kids Play Area, Benches"
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingPark.imageUrl}
                  onChange={(e) => setEditingPark({ ...editingPark, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Description *</label>
              <textarea
                rows={2}
                required
                value={editingPark.description}
                onChange={(e) =>
                  setEditingPark({ ...editingPark, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              {parks.some((p) => p.id === editingPark.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = editingPark.id;
                    const name = editingPark.name;
                    setEditingPark(null);
                    handleDeletePark(id, name);
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Park</span>
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPark(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                >
                  Save Park
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {parks.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-[#0B1724] border border-white/10 flex flex-col justify-between gap-3 text-xs"
            >
              <div>
                <div className="text-[#22C55E] font-mono-tabular">{p.areaSize}</div>
                <div className="text-white font-semibold text-sm mt-0.5">{p.name}</div>
                <div className="text-slate-400 mt-0.5">{p.sector}</div>
                <p className="text-slate-300 mt-2 line-clamp-2">{p.description}</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => startEditPark(p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-md"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePark(p.id, p.name)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5B. AMENITIES (GYM, SECURITY, COMMUNITY) MANAGEMENT */}
      <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#22C55E]" />
            <h3 className="font-display text-2xl font-semibold text-white">
              Gym, Security & Society Amenities ({amenities.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={startNewAmenity}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Amenity</span>
          </button>
        </div>

        {editingAmenity && (
          <form
            onSubmit={handleSaveAmenity}
            className="p-5 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-3 text-xs"
          >
            <h4 className="font-display text-lg font-semibold text-white">
              {amenities.some((a) => a.id === editingAmenity.id)
                ? `Edit Amenity: ${editingAmenity.name}`
                : 'Add New Society Amenity'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={editingAmenity.name}
                  onChange={(e) =>
                    setEditingAmenity({ ...editingAmenity, name: e.target.value })
                  }
                  placeholder="Green Valley Fitness Club"
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Category *</label>
                <select
                  value={editingAmenity.category}
                  onChange={(e) =>
                    setEditingAmenity({
                      ...editingAmenity,
                      category: e.target.value as Amenity['category'],
                    })
                  }
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                >
                  <option value="Gym">Gym</option>
                  <option value="Security">Security</option>
                  <option value="Community">Community</option>
                  <option value="Recreation">Recreation</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Opening Hours *</label>
                <input
                  type="text"
                  required
                  value={editingAmenity.openingHours}
                  onChange={(e) =>
                    setEditingAmenity({
                      ...editingAmenity,
                      openingHours: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">
                  Highlights / Equipment (comma-separated)
                </label>
                <input
                  type="text"
                  value={amenityHighlightsText}
                  onChange={(e) => setAmenityHighlightsText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingAmenity.imageUrl}
                  onChange={(e) =>
                    setEditingAmenity({ ...editingAmenity, imageUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Description *</label>
              <textarea
                rows={2}
                required
                value={editingAmenity.description}
                onChange={(e) =>
                  setEditingAmenity({ ...editingAmenity, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              {amenities.some((a) => a.id === editingAmenity.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = editingAmenity.id;
                    const name = editingAmenity.name;
                    setEditingAmenity(null);
                    handleDeleteAmenity(id, name);
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Amenity</span>
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAmenity(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                >
                  Save Amenity
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {amenities.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-xl bg-[#0B1724] border border-white/10 flex flex-col justify-between gap-3 text-xs"
            >
              <div>
                <div className="text-[#22C55E] font-mono-tabular">
                  {a.category} · {a.openingHours}
                </div>
                <div className="text-white font-semibold text-sm mt-0.5">{a.name}</div>
                <p className="text-slate-300 mt-1.5">{a.description}</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => startEditAmenity(a)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-md"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAmenity(a.id, a.name)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5C & 5D. ANNOUNCEMENTS & GALLERY SIDE BY SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 5C. COMMUNITY ANNOUNCEMENTS */}
        <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#22C55E]" />
              <h3 className="font-display text-2xl font-semibold text-white">
                Announcements ({announcements.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={startNewAnn}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Notice</span>
            </button>
          </div>

          {editingAnn && (
            <form
              onSubmit={handleSaveAnn}
              className="p-4 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-3 text-xs"
            >
              <h4 className="font-semibold text-white">
                {announcements.some((x) => x.id === editingAnn.id)
                  ? 'Edit Announcement'
                  : 'New Community Announcement'}
              </h4>
              <input
                type="text"
                required
                placeholder="Announcement Title *"
                value={editingAnn.title}
                onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={editingAnn.category}
                  onChange={(e) =>
                    setEditingAnn({
                      ...editingAnn,
                      category: e.target.value as Announcement['category'],
                    })
                  }
                  className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                >
                  <option value="Security">Security</option>
                  <option value="Community">Community</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Event">Event</option>
                </select>
                <select
                  value={editingAnn.priority}
                  onChange={(e) =>
                    setEditingAnn({
                      ...editingAnn,
                      priority: e.target.value as Announcement['priority'],
                    })
                  }
                  className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <input
                  type="text"
                  value={editingAnn.publishedDate}
                  onChange={(e) =>
                    setEditingAnn({ ...editingAnn, publishedDate: e.target.value })
                  }
                  placeholder="Date"
                  className="px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder="Announcement details..."
                value={editingAnn.content}
                onChange={(e) => setEditingAnn({ ...editingAnn, content: e.target.value })}
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
              <div className="flex items-center justify-between gap-2">
                {announcements.some((x) => x.id === editingAnn.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingAnn.id;
                      const title = editingAnn.title;
                      setEditingAnn(null);
                      handleDeleteAnn(id, title);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Notice</span>
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAnn(null)}
                    className="px-3.5 py-1.5 bg-white/10 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                  >
                    Save Notice
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-lg bg-[#0B1724] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="text-[#22C55E] font-mono-tabular">
                    {a.category} · {a.priority} · {a.publishedDate}
                  </div>
                  <div className="text-white font-semibold mt-0.5">{a.title}</div>
                  <p className="text-slate-400 line-clamp-1 mt-0.5">{a.content}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingAnn({ ...a })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded-md"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnn(a.id, a.title)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5D. GALLERY PHOTOGRAPHS */}
        <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#22C55E]" />
              <h3 className="font-display text-2xl font-semibold text-white">
                Gallery Photos ({gallery.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={startNewGal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Photo</span>
            </button>
          </div>

          {editingGal && (
            <form
              onSubmit={handleSaveGal}
              className="p-4 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-3 text-xs"
            >
              <h4 className="font-semibold text-white">
                {gallery.some((g) => g.id === editingGal.id)
                  ? 'Edit Gallery Photograph'
                  : 'Add New Gallery Photograph'}
              </h4>
              <input
                type="text"
                required
                placeholder="Photograph Title *"
                value={editingGal.title}
                onChange={(e) => setEditingGal({ ...editingGal, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
              <select
                value={editingGal.category}
                onChange={(e) =>
                  setEditingGal({
                    ...editingGal,
                    category: e.target.value as GalleryItem['category'],
                  })
                }
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              >
                <option value="Modern Houses">Modern Houses</option>
                <option value="Society Entrance">Society Entrance</option>
                <option value="Roads">Roads</option>
                <option value="Parks">Parks</option>
                <option value="Gardens">Gardens</option>
                <option value="Gym">Gym</option>
                <option value="Security">Security</option>
                <option value="Night View">Night View</option>
                <option value="Community Facilities">Community Facilities</option>
              </select>
              <input
                type="text"
                required
                placeholder="Caption *"
                value={editingGal.caption}
                onChange={(e) => setEditingGal({ ...editingGal, caption: e.target.value })}
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="Image URL *"
                  value={editingGal.imageUrl}
                  onChange={(e) =>
                    setEditingGal({ ...editingGal, imageUrl: e.target.value })
                  }
                  className="flex-1 px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
                />
                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>{uploadingImg ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-2">
                {gallery.some((g) => g.id === editingGal.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingGal.id;
                      const title = editingGal.title;
                      setEditingGal(null);
                      handleDeleteGal(id, title);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGal(null)}
                    className="px-3.5 py-1.5 bg-white/10 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
                  >
                    Save Photo
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {gallery.map((g) => (
              <div
                key={g.id}
                className="p-3 rounded-lg bg-[#0B1724] border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="text-[#22C55E] font-mono-tabular">{g.category}</div>
                  <div className="text-white font-semibold truncate">{g.title}</div>
                  <div className="text-slate-400 truncate">{g.caption}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingGal({ ...g })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded-md"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGal(g.id, g.title)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface Tab6UsersProps {
  allUsers: UserProfile[];
  onAllUsersChange?: (updater: (prev: UserProfile[]) => UserProfile[]) => void;
  onNotify: (msg: string) => void;
}

export const AdminTab6Users: React.FC<Tab6UsersProps> = ({
  allUsers,
  onAllUsersChange,
  onNotify,
}) => {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const startNewUser = () => {
    setEditingUser({
      uid: `user_${Date.now()}`,
      fullName: '',
      email: '',
      phone: '+92 329 8271687',
      role: 'resident',
      status: 'active',
      favoriteHouseIds: [],
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const updated = { ...editingUser };

    if (onAllUsersChange) {
      onAllUsersChange((prev) => {
        const idx = prev.findIndex((u) => u.uid === updated.uid);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }

    try {
      await saveUserProfileAdmin(updated);
      onNotify(`Saved user profile "${updated.fullName}" successfully.`);
    } catch (err) {
      onNotify(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditingUser(null);
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (onAllUsersChange) {
      onAllUsersChange((prev) => prev.filter((u) => u.uid !== uid));
    }
    try {
      await deleteUserProfileAdmin(uid);
      onNotify(`Deleted user "${name}".`);
    } catch (err) {
      onNotify(`Deleted locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    const newRole: 'admin' | 'resident' = user.role === 'admin' ? 'resident' : 'admin';
    const updated: UserProfile = { ...user, role: newRole };
    if (onAllUsersChange) {
      onAllUsersChange((prev) => prev.map((u) => (u.uid === user.uid ? updated : u)));
    }
    try {
      await updateUserRoleOrStatusAdmin(user, newRole, user.status);
      onNotify(`Updated role for "${user.fullName}" to ${newRole}.`);
    } catch (err) {
      onNotify(`Updated role locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="bg-[#071827] border border-white/10 rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#22C55E]" />
          <h2 className="font-display text-2xl font-semibold text-white">
            Registered Society Users ({allUsers.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={startNewUser}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {editingUser && (
        <form
          onSubmit={handleSaveUser}
          className="p-5 rounded-xl bg-[#0B1724] border border-[#22C55E]/40 space-y-4 text-xs"
        >
          <h3 className="font-display text-lg font-semibold text-white">
            {allUsers.some((u) => u.uid === editingUser.uid)
              ? `Edit User: ${editingUser.fullName}`
              : 'Add New Resident / Admin User'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editingUser.fullName}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, fullName: e.target.value })
                }
                placeholder="Resident Name"
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                placeholder="resident@example.com"
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={editingUser.phone}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Role *</label>
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value as 'resident' | 'admin',
                  })
                }
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              >
                <option value="resident">resident</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Status *</label>
              <select
                value={editingUser.status}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    status: e.target.value as 'active' | 'suspended',
                  })
                }
                className="w-full px-3 py-2 bg-[#071827] border border-white/15 rounded-lg text-white"
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {allUsers.some((u) => u.uid === editingUser.uid) ? (
              <button
                type="button"
                onClick={() => {
                  const uid = editingUser.uid;
                  const name = editingUser.fullName;
                  setEditingUser(null);
                  handleDeleteUser(uid, name);
                }}
                className="inline-flex items-center gap-1 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete User</span>
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#22C55E] text-[#071827] font-semibold rounded-lg"
              >
                Save User
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 font-mono-tabular">
            {allUsers.map((u) => (
              <tr key={u.uid}>
                <td className="py-3 pr-4 font-sans text-white font-medium">
                  {u.fullName}
                </td>
                <td className="py-3 px-4 text-slate-300">{u.email}</td>
                <td className="py-3 px-4 text-slate-400">{u.phone || '—'}</td>
                <td className="py-3 px-4 text-[#22C55E]">{u.role}</td>
                <td className="py-3 px-4">{u.status}</td>
                <td className="py-3 pl-4 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...u })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleRole(u)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-200 rounded"
                  >
                    Toggle Role
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.uid, u.fullName)}
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
  );
};

interface Tab7SettingsProps {
  settings: SocietySettings;
  onSettingsChange?: (settings: SocietySettings) => void;
  onNotify: (msg: string) => void;
}

export const AdminTab7Settings: React.FC<Tab7SettingsProps> = ({
  settings,
  onSettingsChange,
  onNotify,
}) => {
  const [settingsForm, setSettingsForm] = useState<SocietySettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSettingsChange) {
      onSettingsChange(settingsForm);
    }
    try {
      await saveSocietySettingsAdmin(settingsForm);
      onNotify('Website statistics, hero copy, and contact settings saved successfully.');
    } catch (err) {
      onNotify(`Saved locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleResetDefaults = async () => {
    setSettingsForm(INITIAL_SOCIETY_SETTINGS);
    if (onSettingsChange) {
      onSettingsChange(INITIAL_SOCIETY_SETTINGS);
    }
    try {
      await saveSocietySettingsAdmin(INITIAL_SOCIETY_SETTINGS);
      onNotify('Website settings reset to default values.');
    } catch (err) {
      onNotify(`Reset locally. Firestore sync note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <form
      onSubmit={handleSaveSettings}
      className="bg-[#071827] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#22C55E]" />
          <h2 className="font-display text-2xl font-semibold text-white">
            Website Settings, Hero Copy & Statistics
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset / Delete Custom Settings</span>
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] font-semibold text-xs rounded-lg"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Save Website Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-300 mb-1">Hero Banner Heading *</label>
          <input
            type="text"
            required
            value={settingsForm.heroHeading}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, heroHeading: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Hero Description *</label>
          <input
            type="text"
            required
            value={settingsForm.heroDescription}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, heroDescription: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
        <div>
          <label className="block text-slate-300 mb-1">Total Houses</label>
          <input
            type="number"
            value={settingsForm.totalHouses}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                totalHouses: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Available Houses</label>
          <input
            type="number"
            value={settingsForm.availableHouses}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                availableHouses: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Total Parks</label>
          <input
            type="number"
            value={settingsForm.totalParks}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                totalParks: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Gym Zones</label>
          <input
            type="number"
            value={settingsForm.gymFacilitiesCount}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                gymFacilitiesCount: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Security Gates</label>
          <input
            type="number"
            value={settingsForm.securityCheckpoints}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                securityCheckpoints: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Community Facilities</label>
          <input
            type="number"
            value={settingsForm.communityFacilities}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                communityFacilities: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-slate-300 mb-1">Contact Phone</label>
          <input
            type="text"
            value={settingsForm.contactPhone}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, contactPhone: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Contact Email</label>
          <input
            type="email"
            value={settingsForm.contactEmail}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Emergency Security Phone</label>
          <input
            type="text"
            value={settingsForm.emergencyPhone}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, emergencyPhone: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-300 mb-1">Society Office Address</label>
          <input
            type="text"
            value={settingsForm.officeAddress}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, officeAddress: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Master Plan Sector Note</label>
          <input
            type="text"
            value={settingsForm.mapSectorNote}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, mapSectorNote: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#0B1724] border border-white/15 rounded-lg text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-6 py-3 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] font-semibold text-xs rounded-lg transition-colors"
      >
        Save Global Settings to Firestore
      </button>
    </form>
  );
};
