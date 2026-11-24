// University of Ruhuna - Faculty of Agriculture
// Ruhuna Agri GPA Header — Responsive Mobile Header & Desktop Command Bar

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  PlusCircle,
  Users,
  Check
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { AppLogo } from '../common/AppLogo';

const ROUTE_INFO: Record<string, { section: string; title: string }> = {
  dashboard: { section: 'OVERVIEW', title: 'Dashboard' },
  calculator: { section: 'OVERVIEW', title: 'GPA Calculator' },
  grades: { section: 'OVERVIEW', title: 'GPA Calculator' },
  transcript: { section: 'OVERVIEW', title: 'Academic Transcript' },
  planner: { section: 'ACADEMIC', title: 'Semester Planner' },
  projection: { section: 'OVERVIEW', title: 'GPA Calculator' },
  progress: { section: 'ACADEMIC', title: 'Credit Progress' },
  requirements: { section: 'ACADEMIC', title: 'Degree Requirements' },
  specialization: { section: 'ACADEMIC', title: 'Specialization Eligibility' },
  analytics: { section: 'INSIGHTS', title: 'GPA Analytics' },
  simulator: { section: 'INSIGHTS', title: 'Grade Simulator' },
  forecast: { section: 'INSIGHTS', title: 'Grade Simulator' },
  goals: { section: 'INSIGHTS', title: 'Academic Goals' },
  profiles: { section: 'PERSONAL', title: 'Student Profiles' },
  settings: { section: 'PERSONAL', title: 'Settings' }
};

export const Header: React.FC = () => {
  const {
    activeTab,
    getActiveProfile,
    getOverallStats,
    setActiveTab,
    setShowOnboarding,
    profiles,
    activeProfileId,
    switchProfile
  } = useGradeStore();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const profile = getActiveProfile();
  const stats = getOverallStats();

  const currentInfo = ROUTE_INFO[activeTab] || { section: 'ACADEMIC', title: 'GPA Calculator' };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DCDDD7] px-3.5 sm:px-6 py-2.5 sm:py-3 transition-all shadow-xs min-w-0">
      {/* ======================================================== */}
      {/* MOBILE HEADER (<= 767px)                                 */}
      {/* Distinct, Compact, Purpose-Built: Logo + Title + Profile */}
      {/* ======================================================== */}
      <div className="flex md:hidden items-center justify-between w-full min-h-[40px]">
        {/* Left: Branding */}
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          onClick={() => setActiveTab('dashboard')}
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

        {/* Right: Accessible Student Profile Selector */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-[#DCDDD7] hover:border-[#176B45] text-[#242824] transition shadow-2xs group min-h-[44px] touch-manipulation"
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
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#DCDDD7] rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Switch Profile ({profiles.length})
                </div>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setActiveTab('profiles');
                  }}
                  className="text-[11px] font-bold text-[#176B45] hover:underline"
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
                      key={p.id}
                      onClick={() => {
                        switchProfile(p.id);
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition min-h-[44px] ${
                        isSelected
                          ? 'bg-[#EAF2ED] border border-[#176B45]/30 text-[#103B2D] font-bold'
                          : 'hover:bg-neutral-50 text-neutral-700 border border-transparent'
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
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setShowOnboarding(true);
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
            title="Cumulative GPA • Click to open calculator"
          >
            <span className="text-xs uppercase tracking-wider text-[#626962] font-bold">CGPA:</span>
            <span className="text-base font-mono font-black text-[#103B2D]">{stats.cgpa.toFixed(2)}</span>
            <span className="hidden lg:inline text-xs font-black px-2 py-0.5 rounded-full bg-[#176B45] text-white shadow-2xs">
              ★ {stats.classStanding}
            </span>
          </div>

          {/* Quick Credits Completed Pill */}
          <div
            onClick={() => setActiveTab('progress')}
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
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
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
                        key={p.id}
                        onClick={() => {
                          switchProfile(p.id);
                          setIsProfileDropdownOpen(false);
                        }}
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
                      setShowOnboarding(true);
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
  );
};
