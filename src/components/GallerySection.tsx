import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { GalleryItem } from '../types/society';
import { ResilientImage } from './Logo';

interface GallerySectionProps {
  gallery: GalleryItem[];
}

const GALLERY_CATEGORIES: ('All' | GalleryItem['category'])[] = [
  'All',
  'Modern Houses',
  'Society Entrance',
  'Roads',
  'Parks',
  'Gardens',
  'Gym',
  'Security',
  'Night View',
  'Community Facilities',
];

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | GalleryItem['category']>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return gallery;
    return gallery.filter((item) => item.category === selectedCategory);
  }, [gallery, selectedCategory]);

  const activeItem =
    lightboxIndex !== null && filteredItems[lightboxIndex]
      ? filteredItems[lightboxIndex]
      : null;

  return (
    <section id="gallery-section" className="py-20 bg-[#0B1724] border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
              Visual Portfolio
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Architectural & Community Gallery
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Explore high-resolution views of Green Valley Residencia’s constructed villas,
              boulevards, botanical parks, wellness pavilion, and twilight illumination.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono-tabular">
            {filteredItems.length} Photographs
          </div>
        </div>

        {/* Interactive Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-8">
          {GALLERY_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                setLightboxIndex(null);
              }}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === category
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'bg-[#071827] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setLightboxIndex(idx);
              }}
              className="group relative h-64 rounded-xl overflow-hidden bg-[#071827] border border-white/10 hover:border-[#22C55E]/50 cursor-pointer"
            >
              <ResilientImage
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              <div className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4" />
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-xs text-[#22C55E] font-mono-tabular">
                  {item.category}
                </div>
                <h3 className="font-display text-xl font-semibold text-white mt-0.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1 mt-1">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-Screen Lightbox Viewer */}
      {activeItem && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex(
                lightboxIndex === 0 ? filteredItems.length - 1 : lightboxIndex - 1
              )
            }
            className="absolute left-4 sm:left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-5xl w-full flex flex-col items-center">
            <div className="w-full h-[60vh] sm:h-[70vh] rounded-xl overflow-hidden border border-white/15 bg-[#071827]">
              <ResilientImage
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-4 text-center max-w-2xl">
              <div className="text-xs text-[#22C55E] font-mono-tabular">
                {activeItem.category} · {lightboxIndex + 1} of {filteredItems.length}
              </div>
              <h3 className="font-display text-2xl font-semibold text-white mt-1">
                {activeItem.title}
              </h3>
              <p className="text-sm text-slate-300 mt-1">{activeItem.caption}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((lightboxIndex + 1) % filteredItems.length)
            }
            className="absolute right-4 sm:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </section>
  );
};
