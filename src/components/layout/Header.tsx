// University of Ruhuna - Faculty of Agriculture
// GradePath Contextual Header & Quick Status Command Bar (Vibrant & Enlarged)

import React from 'react';
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
  Settings
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
    setShowOnboarding
  } = useGradeStore();

  const profile = getActiveProfile();
  const stats = getOverallStats();

  const currentInfo = ROUTE_INFO[activeTab] || { section: 'ACADEMIC', title: 'GradePath' };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 sm:px-6 py-3 flex items-center justify-between transition-all shadow-xs">
        {/* Left: Mobile hamburger + Contextual Title */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-300"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-500 uppercase">
              <span>{currentInfo.section}</span>
              <span>/</span>
              <span className="text-emerald-700 font-extrabold">{currentInfo.title}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight leading-tight hidden sm:block">
              {currentInfo.title}
            </h1>
          </div>
        </div>

        {/* Right: Big Quick Status Pills & Guide */}
        <div className="flex items-center gap-3">
          {/* Quick Cumulative GPA Pill */}
          <div
            onClick={() => setActiveTab('calculator')}
            className="cursor-pointer flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-xs font-bold text-emerald-900 shadow-xs hover:border-emerald-400 transition"
            title="Cumulative GPA • Click to open calculator"
          >
            <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">CGPA:</span>
            <span className="text-base font-mono font-black text-emerald-800">{stats.cgpa.toFixed(2)}</span>
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

          {/* Onboarding Guide Trigger */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 transition shadow-2xs"
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

            <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-500 text-center font-medium">
              Undergraduate Handbook 2023/24
            </div>
          </div>
        </div>
      )}
    </>
  );
};
