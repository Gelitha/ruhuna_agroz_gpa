// University of Ruhuna - Faculty of Agriculture
// GradePath Contextual Header & Quick Status Command Bar (Vibrant & Enlarged)

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Calculator,
  FileText,
  CalendarDays,
  Award,
  BookCheck,
  Compass,
  LineChart,
  Sliders,
  Target,
  Users,
  Settings,
  ChevronDown,
  UserCheck,
  PlusCircle,
  Check
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { NavView } from '../../types';

const ROUTE_INFO: Record<string, { section: string; title: string }> = {
  dashboard: { section: 'OVERVIEW', title: 'Dashboard' },
  calculator: { section: 'OVERVIEW', title: 'GPA Calculator' },
  grades: { section: 'OVERVIEW', title: 'GPA Calculator' },
  transcript: { section: 'OVERVIEW', title: 'Academic Transcript' },
  planner: { section: 'ACADEMIC', title: 'Semester Planner' },
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

const MOBILE_NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'calculator', label: 'GPA Calculator', icon: Calculator },
      { id: 'transcript', label: 'Academic Transcript', icon: FileText }
    ]
  },
  {
    title: 'ACADEMIC',
    items: [
      { id: 'planner', label: 'Semester Planner', icon: CalendarDays },
      { id: 'progress', label: 'Credit Progress', icon: Award },
      { id: 'requirements', label: 'Degree Requirements', icon: BookCheck },
      { id: 'specialization', label: 'Specialization Eligibility', icon: Compass }
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      { id: 'analytics', label: 'GPA Analytics', icon: LineChart },
      { id: 'simulator', label: 'Grade Simulator', icon: Sliders },
      { id: 'goals', label: 'Academic Goals', icon: Target }
    ]
  },
  {
    title: 'PERSONAL',
    items: [
      { id: 'profiles', label: 'Student Profiles', icon: Users },
      { id: 'settings', label: 'Settings', icon: Settings }
    ]
  }
];

export const Header: React.FC = () => {
  const {
    activeTab,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
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

  const currentInfo = ROUTE_INFO[activeTab] || { section: 'ACADEMIC', title: 'GradePath' };

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
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all shadow-xs min-w-0">
        {/* Left: Mobile hamburger + Contextual Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-300 shrink-0"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold tracking-wider text-neutral-500 uppercase truncate">
              <span>{currentInfo.section}</span>
              <span>/</span>
              <span className="text-emerald-700 font-extrabold">{currentInfo.title}</span>
            </div>
            <h1 className="text-sm sm:text-lg font-black text-neutral-900 tracking-tight leading-tight hidden sm:block truncate">
              {currentInfo.title}
            </h1>
          </div>
        </div>

        {/* Right: Profile Switcher, Big Quick Status Pills & Guide */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Cumulative GPA Pill */}
          <div
            onClick={() => setActiveTab('calculator')}
            className="cursor-pointer flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-xs font-bold text-emerald-900 shadow-xs hover:border-emerald-400 transition"
            title="Cumulative GPA • Click to open calculator"
          >
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-neutral-500 font-bold">CGPA:</span>
            <span className="text-sm sm:text-base font-mono font-black text-emerald-800">{stats.cgpa.toFixed(2)}</span>
            <span className="hidden lg:inline text-xs font-black px-2 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
              ★ {stats.classStanding}
            </span>
          </div>

          {/* Quick Credits Completed Pill */}
          <div
            onClick={() => setActiveTab('progress')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs text-neutral-700 font-medium transition"
            title="Total GPA Credits Earned"
          >
            <span className="text-xs uppercase tracking-wider font-bold text-neutral-500">Credits:</span>
            <span className="font-mono font-black text-neutral-900 text-sm">
              {stats.totalGpaCreditsEarned} / {stats.totalRequiredCredits}
            </span>
          </div>

          {/* Degree & Year Tag */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-semibold text-neutral-700 shadow-2xs">
            <span className="font-bold text-neutral-900">{profile.degree}</span>
            <span>•</span>
            <span>Sem {profile.currentSemester}</span>
          </div>

          {/* Switch Profile Dropdown / Button in Header */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-emerald-500 text-neutral-800 transition shadow-2xs group cursor-pointer"
              title={`Switch Profile • Currently: ${profile.name} (${profile.degree})`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-700 to-green-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-extrabold text-neutral-900 leading-none truncate max-w-[110px]">
                  {profile.name || 'Student'}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold leading-none mt-0.5">
                  {profile.degree} • Sem {profile.currentSemester}
                </span>
              </div>
              <span className="hidden sm:inline-block md:hidden text-xs font-bold text-neutral-700">
                Profile
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                    Switch Profile ({profiles.length})
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveTab('profiles');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Manage
                  </button>
                </div>

                {/* Profile List */}
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
                            ? 'bg-emerald-50/80 border border-emerald-300 text-emerald-950 shadow-2xs'
                            : 'hover:bg-neutral-50 text-neutral-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-neutral-900 truncate flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isSelected && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-800">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate">
                              {p.degree} • Sem {p.currentSemester} {p.registrationNumber ? `(${p.registrationNumber})` : ''}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Quick Actions */}
                <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setShowOnboarding(true);
                    }}
                    className="p-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-emerald-800 hover:bg-emerald-50/60 border border-neutral-200 flex items-center justify-center gap-1.5 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>New Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveTab('profiles');
                    }}
                    className="p-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center gap-1.5 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-neutral-600" />
                    <span>All Profiles</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Onboarding Guide Trigger */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-900 px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 transition shadow-2xs"
            title="Open Welcome Guide"
          >
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 border-r border-neutral-200">
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🌿</span>
                  <div>
                    <div className="font-black text-neutral-900 text-base">GradePath</div>
                    <div className="text-xs text-neutral-500 font-medium">Faculty of Agriculture, UoR</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Links */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5">
                {MOBILE_NAV_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <div className="px-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id as NavView);
                            setMobileDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                            isActive
                              ? 'bg-emerald-800 text-white shadow-md'
                              : 'text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 pb-1 border-t border-neutral-200">
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 truncate">{profile.name}</div>
                    <div className="text-[10px] text-neutral-500 truncate">{profile.degree} • Sem {profile.currentSemester}</div>
                  </div>
                </div>
                <select
                  value={activeProfileId}
                  onChange={(e) => {
                    switchProfile(e.target.value);
                  }}
                  className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 text-neutral-800 font-bold focus:outline-none"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-neutral-500 text-center font-medium space-y-0.5">
              <div>Curriculum: Undergraduate Handbook 2023/24</div>
              <div className="text-[10px] text-neutral-400">Powered by Gelitha Jayawickrama (47th Batch)</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
