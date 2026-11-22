// University of Ruhuna - Faculty of Agriculture
// GradePath Persistent Navigation Sidebar (Enlarged, Tactile & Vivid)

import React from 'react';
import {
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { NavView } from '../../types';

interface NavSection {
  title: string;
  items: Array<{
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

const NAV_SECTIONS: NavSection[] = [
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

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarExpanded,
    toggleSidebar,
    profiles,
    activeProfileId,
    switchProfile,
    getActiveProfile,
    getOverallStats
  } = useGradeStore();

  const activeProfile = getActiveProfile();
  const stats = getOverallStats();

  const getIsActive = (id: NavView) => {
    if (activeTab === id) return true;
    if (id === 'calculator' && activeTab === 'grades') return true;
    return false;
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col justify-between bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out shadow-xs ${
        isSidebarExpanded ? 'w-68' : 'w-20'
      }`}
    >
      {/* Top Section: Brand + Collapse Toggle */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className="h-18 px-4 flex items-center justify-between border-b border-neutral-200 shrink-0">
          <div
            className="flex items-center gap-3 overflow-hidden cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
            title="GradePath Dashboard"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-700 to-green-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-700/20 transition-transform group-hover:scale-105">
              <span className="text-xl">🌿</span>
            </div>
            {isSidebarExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-neutral-900 text-base tracking-tight leading-none flex items-center gap-1.5">
                  Ruhuna Agri GPA
                  <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    UoR
                  </span>
                </span>
                <span className="text-xs text-neutral-500 truncate mt-1 font-medium">
                  Faculty of Agriculture
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="hidden md:flex p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0"
          >
            {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-thin">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1.5">
              {isSidebarExpanded ? (
                <div className="px-3 py-1 text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                  {section.title}
                </div>
              ) : (
                <div className="h-px bg-neutral-200 my-2.5 mx-1" />
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = getIsActive(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={!isSidebarExpanded ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-800 to-green-800 text-white shadow-md shadow-emerald-800/20'
                        : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                    {isSidebarExpanded && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {isSidebarExpanded && item.badge && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Profile Switcher & Fast CGPA Pill */}
      <div className="p-3 border-t border-neutral-200 bg-white shrink-0">
        {isSidebarExpanded ? (
          <div className="p-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2.5 shadow-2xs">
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              onClick={() => setActiveTab('profiles')}
              title="Manage student profiles"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-300">
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate leading-tight">
                  {activeProfile.name}
                </span>
                <span className="text-xs text-neutral-500 truncate mt-0.5">
                  {activeProfile.degree} • <span className="font-bold text-emerald-700">{stats.cgpa.toFixed(2)} CGPA</span>
                </span>
              </div>
            </div>

            <select
              value={activeProfileId}
              onChange={(e) => switchProfile(e.target.value)}
              className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 text-neutral-800 cursor-pointer focus:outline-none focus:border-emerald-600 font-bold"
              title="Switch profile"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.degree})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('profiles')}
            title={`Active: ${activeProfile.name} (${activeProfile.degree}) • CGPA ${stats.cgpa.toFixed(2)}`}
            className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-300 hover:ring-2 hover:ring-emerald-500/30 transition shadow-2xs"
          >
            {activeProfile.name.charAt(0).toUpperCase()}
          </button>
        )}
      </div>
    </aside>
  );
};
