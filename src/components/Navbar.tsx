import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Menu,
  X,
  User,
  ShieldCheck,
  LogOut,
  Search,
} from 'lucide-react';
import { ActivePage, LightingMode, UserProfile } from '../types/society';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, sectionId?: string) => void;
  lightingMode: LightingMode;
  onLightingModeChange: (mode: LightingMode) => void;
  effectiveNight: boolean;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onOpenQuickSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  lightingMode,
  onLightingModeChange,
  effectiveNight,
  userProfile,
  isAdmin,
  onOpenAuth,
  onLogout,
  onOpenQuickSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryLinks: { label: string; page: ActivePage; sectionId?: string }[] = [
    { label: 'Home', page: 'home' },
    { label: '3D Colony', page: 'colony3d' },
    { label: 'Houses', page: 'houses' },
    { label: 'Amenities', page: 'parks' },
    { label: 'Gallery', page: 'gallery' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleNavClick = (page: ActivePage, sectionId?: string) => {
    onNavigate(page, sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#071827]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark per Top Bar Contract */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white hover:text-[#22C55E] transition-colors whitespace-nowrap shrink-0"
        >
          Green Valley Residencia
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
          {primaryLinks.map((item) => {
            const isActive =
              activePage === item.page ||
              (item.page === 'parks' &&
                (activePage === 'gym' || activePage === 'security'));
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.page, item.sectionId)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-white border-[#22C55E]'
                    : 'border-transparent hover:text-white hover:border-white/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Day/Night Switcher + Auth Action) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenQuickSearch}
            title="Search Houses by Plot or Number"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Search houses"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Interactive Day / Night / Auto Segmented Control */}
          <div
            className="flex items-center bg-[#0B1724] border border-white/10 rounded-lg p-0.5"
            role="group"
            aria-label="Colony Environment Lighting Mode"
          >
            <button
              type="button"
              onClick={() => onLightingModeChange('day')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                lightingMode === 'day'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Day</span>
            </button>
            <button
              type="button"
              onClick={() => onLightingModeChange('night')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                lightingMode === 'night'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Night</span>
            </button>
            <button
              type="button"
              onClick={() => onLightingModeChange('auto')}
              title={`Auto Mode (${effectiveNight ? 'Night' : 'Day'} via local clock)`}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                lightingMode === 'auto'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>

          {userProfile ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activePage === 'admin-dashboard'
                      ? 'bg-[#22C55E] text-[#071827]'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Admin</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNavClick('user-dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activePage === 'user-dashboard'
                    ? 'bg-[#22C55E] text-[#071827]'
                    : 'bg-[#22C55E] text-[#071827] hover:bg-[#4ADE80]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[110px] truncate">{userProfile.fullName}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 text-xs font-semibold bg-[#22C55E] text-[#071827] rounded-lg hover:bg-[#4ADE80] transition-colors whitespace-nowrap"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onLightingModeChange(effectiveNight ? 'day' : 'night')
            }
            className="p-2 text-slate-300 hover:text-white bg-white/5 rounded-lg"
            aria-label="Toggle Day/Night Mode"
          >
            {effectiveNight ? (
              <Moon className="w-4 h-4 text-[#22C55E]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-2 text-slate-200 hover:text-white bg-white/5 rounded-lg"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#071827] border-b border-white/10 px-4 pt-3 pb-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {primaryLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.page, item.sectionId)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activePage === item.page
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : 'text-slate-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNavClick('gym')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Modern Gym
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('security')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Gated Security
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400">Environment Lighting:</span>
            <div className="flex items-center gap-1 bg-[#0B1724] p-1 rounded-lg border border-white/10">
              {(['day', 'night', 'auto'] as LightingMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onLightingModeChange(m)}
                  className={`px-2.5 py-1 text-xs rounded capitalize ${
                    lightingMode === m
                      ? 'bg-[#22C55E] text-[#071827] font-semibold'
                      : 'text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
            {userProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('user-dashboard')}
                  className="flex-1 py-2.5 px-4 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg text-center"
                >
                  Resident Dashboard ({userProfile.fullName})
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleNavClick('admin-dashboard')}
                    className="py-2.5 px-4 bg-white/10 text-white font-semibold text-xs rounded-lg"
                  >
                    Admin Portal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 bg-red-500/15 text-red-300 text-xs rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 bg-white/10 text-white font-medium text-xs rounded-lg"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
