// University of Ruhuna - Faculty of Agriculture
// Ruhuna Agri GPA Header — Responsive Mobile Header & Desktop Command Bar

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  PlusCircle,
  Users,
  Check,
  Menu,
  X
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { NAV_SECTIONS, getRouteInfo, normalizeNavView } from '../../config/navigation';
import { AppLogo } from '../common/AppLogo';

export const Header: React.FC = () => {
  const {
    activeTab,
    getActiveProfile,
    getOverallStats,
    setActiveTab,
    setShowOnboarding,
    openProfileModal,
    profiles,
    activeProfileId,
    switchProfile
  } = useGradeStore();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);

  const profile = getActiveProfile();
  const stats = getOverallStats();

  const currentInfo = getRouteInfo(activeTab);

  const handleSelectProfile = (profileId: string) => {
    switchProfile(profileId);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen((prev) => {
      const next = !prev;
      if (next) setIsMobileMenuOpen(false);
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) setIsProfileDropdownOpen(false);
      return next;
    });
  };

  // Dynamically measure and register header height on root for layout-aware offsets
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight, { passive: true });
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Close profile dropdown on outside pointer events across mobile and desktop
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent | MouseEvent) => {
      const target = event.target as Node | null;
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      const isInsideMobile =
        mobileDropdownRef.current &&
        (path.includes(mobileDropdownRef.current) ||
          (target !== null && mobileDropdownRef.current.contains(target)));
      const isInsideDesktop =
        desktopDropdownRef.current &&
        (path.includes(desktopDropdownRef.current) ||
          (target !== null && desktopDropdownRef.current.contains(target)));
      if (!isInsideMobile && !isInsideDesktop) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <>
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCDDD7] px-3.5 sm:px-6 py-2.5 sm:py-3 transition-all shadow-xs min-w-0"
    >
      {/* ======================================================== */}
      {/* MOBILE HEADER (<= 767px)                                 */}
      {/* Distinct, Compact, Purpose-Built: Menu + Logo + Profile  */}
      {/* ======================================================== */}
      <div className="flex md:hidden items-center justify-between w-full min-h-[40px] gap-2">
        {/* Left: Hamburger Menu + Branding */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            className="p-2 -ml-1.5 rounded-xl text-[#242824] hover:bg-neutral-100 active:scale-95 transition min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation cursor-pointer shrink-0"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer touch-manipulation"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsProfileDropdownOpen(false);
              setActiveTab('dashboard');
            }}
            title="Ruhuna Agri GPA Dashboard"
          >
            <AppLogo size="sm" />
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-[#242824] leading-tight tracking-tight truncate">
                Ruhuna Agri GPA
              </h1>
              <p className="text-[11px] text-[#626962] font-medium leading-none truncate mt-0.5">
                Faculty of Agriculture
              </p>
            </div>
          </div>
        </div>

        {/* Right: Accessible Student Profile Selector */}
        <div className="relative shrink-0" ref={mobileDropdownRef}>
          <button
            type="button"
            onClick={toggleProfileDropdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-[#DCDDD7] hover:border-[#176B45] text-[#242824] transition shadow-2xs group min-h-[44px] touch-manipulation cursor-pointer select-none"
            aria-label={`Student profile: ${profile.name} (${profile.degree})`}
            aria-expanded={isProfileDropdownOpen}
          >
            <div className="w-6 h-6 rounded-full bg-[#103B2D] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col text-left max-w-[85px] xs:max-w-[110px]">
              <span className="text-xs font-bold text-[#242824] leading-none truncate">
                {profile.name || 'Student'}
              </span>
              <span className="text-[10px] text-[#176B45] font-semibold leading-none mt-0.5 truncate">
                {profile.degree}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform ${
                isProfileDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-72 bg-white border border-[#DCDDD7] rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Switch Profile ({profiles.length})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setActiveTab('profiles');
                  }}
                  className="text-[11px] font-bold text-[#176B45] hover:underline min-h-[32px] px-1.5 touch-manipulation cursor-pointer"
                >
                  Manage
                </button>
              </div>

              {/* Profile List */}
              <div className="py-1.5 max-h-56 overflow-y-auto space-y-1">
                {profiles.map((p) => {
                  const isSelected = p.id === activeProfileId;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleSelectProfile(p.id)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition min-h-[44px] touch-manipulation cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[#EAF2ED] border border-[#176B45]/30 text-[#103B2D] font-bold'
                          : 'hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-[#103B2D] text-white'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#242824] truncate flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isSelected && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-800">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#626962] truncate">
                            {p.degree} • Sem {p.currentSemester} {p.registrationNumber ? `(${p.registrationNumber})` : ''}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#176B45] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    openProfileModal('create');
                  }}
                  className="p-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-[#176B45] hover:bg-[#EAF2ED] border border-[#DCDDD7] flex items-center justify-center gap-1.5 transition min-h-[44px] touch-manipulation cursor-pointer select-none"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#176B45]" />
                  <span>New Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setActiveTab('profiles');
                  }}
                  className="p-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-[#DCDDD7] flex items-center justify-center gap-1.5 transition min-h-[44px] touch-manipulation cursor-pointer select-none"
                >
                  <Users className="w-3.5 h-3.5 text-neutral-600" />
                  <span>All Profiles</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP HEADER (>= 768px)                                */}
      {/* Contextual Navigation Breadcrumbs + Pills + Switcher     */}
      {/* ======================================================== */}
      <div className="hidden md:flex items-center justify-between w-full">
        {/* Left: Contextual Breadcrumb & View Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#626962] uppercase truncate">
            <span>{currentInfo.section}</span>
            <span>/</span>
            <span className="text-[#176B45] font-extrabold">{currentInfo.title}</span>
          </div>
          <h1 className="text-lg font-black text-[#242824] tracking-tight leading-tight truncate">
            {currentInfo.title}
          </h1>
        </div>

        {/* Right: Cumulative Status Pills, Profile & Guide */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Cumulative GPA Pill */}
          <div
            onClick={() => setActiveTab('calculator')}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-xs font-bold text-emerald-900 shadow-xs hover:border-emerald-400 transition"
            title={`Cumulative GPA: ${stats.totalGpaCreditsAttempted > 0 ? stats.cgpa.toFixed(2) : 'No grades'}${stats.hasExpectedCourses ? ` (Projected: ${stats.projectedCgpa?.toFixed(2)} Est.)` : ''} • Click to open calculator`}
          >
            <span className="text-xs uppercase tracking-wider text-[#626962] font-bold">CGPA:</span>
            <span className="text-base font-mono font-black text-[#103B2D]">
              {stats.totalGpaCreditsAttempted > 0 ? stats.cgpa.toFixed(2) : '—'}
            </span>
            <span className="hidden lg:inline text-xs font-black px-2 py-0.5 rounded-full bg-[#176B45] text-white shadow-2xs">
              ★ {stats.classStanding}
            </span>
          </div>

          {/* Quick Credits Completed Pill */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs text-neutral-700 font-medium transition"
            title="Total GPA Credits Earned"
          >
            <span className="text-xs uppercase tracking-wider font-bold text-[#626962]">Credits:</span>
            <span className="font-mono font-black text-[#242824] text-sm">
              {stats.totalGpaCreditsEarned} / {stats.totalRequiredCredits}
            </span>
          </div>

          {/* Degree & Year Tag */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCDDD7] text-xs font-semibold text-neutral-700 shadow-2xs">
            <span className="font-bold text-[#242824]">{profile.degree}</span>
            <span>•</span>
            <span>Sem {profile.currentSemester}</span>
          </div>

          {/* Desktop Profile Switcher */}
          <div className="relative" ref={desktopDropdownRef}>
            <button
              type="button"
              onClick={toggleProfileDropdown}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-[#DCDDD7] hover:border-[#176B45] text-[#242824] transition shadow-2xs group cursor-pointer"
              title={`Switch Profile • Currently: ${profile.name} (${profile.degree})`}
            >
              <div className="w-6 h-6 rounded-full bg-[#103B2D] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-extrabold text-[#242824] leading-none truncate max-w-[110px]">
                  {profile.name || 'Student'}
                </span>
                <span className="text-[10px] text-[#176B45] font-bold leading-none mt-0.5">
                  {profile.degree} • Sem {profile.currentSemester}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu for Desktop */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#DCDDD7] rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Switch Profile ({profiles.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveTab('profiles');
                    }}
                    className="text-[11px] font-bold text-[#176B45] hover:underline"
                  >
                    Manage
                  </button>
                </div>

                <div className="py-1.5 max-h-60 overflow-y-auto space-y-1">
                  {profiles.map((p) => {
                    const isSelected = p.id === activeProfileId;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleSelectProfile(p.id)}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition ${
                          isSelected
                            ? 'bg-[#EAF2ED] border border-[#176B45]/30 text-[#103B2D] font-bold'
                            : 'hover:bg-neutral-50 text-neutral-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected
                                ? 'bg-[#103B2D] text-white shadow-2xs'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#242824] truncate flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isSelected && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-800">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#626962] truncate">
                              {p.degree} • Sem {p.currentSemester} {p.registrationNumber ? `(${p.registrationNumber})` : ''}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-[#176B45] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      openProfileModal('create');
                    }}
                    className="p-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-[#176B45] hover:bg-[#EAF2ED] border border-[#DCDDD7] flex items-center justify-center gap-1.5 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#176B45]" />
                    <span>New Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveTab('profiles');
                    }}
                    className="p-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-[#DCDDD7] flex items-center justify-center gap-1.5 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-neutral-600" />
                    <span>All Profiles</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Guide Trigger */}
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-xl border border-[#DCDDD7] hover:bg-neutral-100 transition shadow-2xs"
            title="Open Welcome Guide"
          >
            <Sparkles className="w-4 h-4 text-[#176B45]" />
            <span>Guide</span>
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Hamburger Slide-Over Navigation Drawer */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <nav className="relative z-10 w-72 max-w-[85vw] bg-white h-full shadow-2xl border-r border-[#DCDDD7] flex flex-col animate-in slide-in-from-left duration-200">
          <div className="px-4 py-3.5 border-b border-[#DCDDD7] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <AppLogo size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[#242824] truncate">Ruhuna Agri GPA</div>
                <div className="text-[11px] text-[#626962] truncate">
                  {profile.name} • {profile.degree} (Sem {profile.currentSemester})
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = normalizeNavView(activeTab) === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition min-h-[44px] touch-manipulation cursor-pointer select-none ${
                        isActive
                          ? 'bg-[#EAF2ED] text-[#176B45] font-extrabold border border-[#176B45]/25'
                          : 'text-[#242824] font-semibold hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#176B45]' : 'text-neutral-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#DCDDD7] space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setShowOnboarding(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-[#242824] min-h-[44px] touch-manipulation cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#176B45]" />
              <span>Welcome Guide</span>
            </button>
            <p className="text-[11px] text-[#626962] text-center font-medium px-1">
              Your academic data stays on your device.
            </p>
          </div>
        </nav>
      </div>
    )}
    </>
  );
};
