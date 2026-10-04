import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

export function GreenValleyLogo({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="10"
        fill="#071827"
        stroke="#22C55E"
        strokeWidth="1.75"
      />
      {/* Architectural House Roofline */}
      <path
        d="M10 24L24 12L38 24"
        stroke="#F8FAFC"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 21V33H33V21"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Emerald Leaf & Landscape Horizon */}
      <path
        d="M24 18C28.5 18 31 21.5 31 25.5C31 29.5 27.5 32 24 32C20.5 32 17 29.5 17 25.5C17 21.5 19.5 18 24 18Z"
        fill="#22C55E"
        fillOpacity="0.2"
      />
      <path
        d="M24 32V21M24 26L28 23M24 28L20 25"
        stroke="#22C55E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 36C14 33.5 20 33.5 24 35C28 36.5 34 36.5 40 34"
        stroke="#4ADE80"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#071827] via-[#0B1724] to-[#0F2922] text-slate-300 p-6 text-center ${className}`}
      >
        <Building2 className="w-10 h-10 text-[#22C55E] mb-2 opacity-80" />
        <span className="text-xs font-medium tracking-wide text-slate-300">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
