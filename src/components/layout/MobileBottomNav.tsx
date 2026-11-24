// University of Ruhuna - Faculty of Agriculture
// Mobile-First Sticky Bottom Navigation Bar (iOS / Android Ergonomic Thumb Navigation)

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calculator,
  CalendarDays,
  Award,
  MoreHorizontal,
  X,
  FileText,
  Sliders,
  Target,
  LineChart,
  BookCheck,
  Compass,
  Users,
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { NavView } from '../../types';

interface SubNavModalState {
  isOpen: boolean;
  title: string;
  items: Array<{
    id: NavView;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setShowOnboarding
  } = useGradeStore();

  const [activeModal, setActiveModal] = useState<SubNavModalState | null>(null);

  const planItems = [
    {
      id: 'planner' as NavView,
      label: 'Semester Planner',
      description: 'Map future course selections',
      icon: CalendarDays
    },
    {
      id: 'simulator' as NavView,
      label: 'Grade Simulator',
      description: 'Simulate target grades & SGPA',
      icon: Sliders
    },
    {
      id: 'goals' as NavView,
      label: 'Academic Goals',
      description: 'Set & track Honours targets',
      icon: Target
    }
  ];

  const progressItems = [
    {
      id: 'progress' as NavView,
      label: 'Credit Progress',
      description: 'Track degree completion credits',
      icon: Award
    },
    {
      id: 'analytics' as NavView,
      label: 'GPA Analytics',
      description: 'Performance charts & trends',
      icon: LineChart
    },
    {
      id: 'requirements' as NavView,
      label: 'Degree Requirements',
      description: 'Compulsory & Non-GPA checklist',
      icon: BookCheck
    },
    {
      id: 'specialization' as NavView,
      label: 'Specialization Eligibility',
      description: 'Department selection prerequisites',
      icon: Compass
    }
  ];

  const moreItems = [
    {
      id: 'transcript' as NavView,
      label: 'Academic Transcript',
      description: 'Official formatted course transcript & print',
      icon: FileText
    },
    {
      id: 'profiles' as NavView,
      label: 'Student Profiles',
      description: 'Manage batches, degrees & profiles',
      icon: Users
    },
    {
      id: 'settings' as NavView,
      label: 'Settings & Backup',
      description: 'Export, import & data safety',
      icon: Settings
    }
  ];

  const isHomeActive = activeTab === 'dashboard';
  const isCalculatorActive = activeTab === 'calculator' || activeTab === 'grades';
  const isPlanActive = ['planner', 'simulator', 'forecast', 'goals'].includes(activeTab);
  const isProgressActive = ['progress', 'analytics', 'requirements', 'specialization'].includes(activeTab);
  const isMoreActive = ['transcript', 'profiles', 'settings'].includes(activeTab);

  const handleSelectSubItem = (id: NavView) => {
    setActiveTab(id);
    setActiveModal(null);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* SUB-NAVIGATION MODAL / ACTION SHEET                      */}
      {/* ======================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveModal(null)}
          />

          {/* Action Sheet Card */}
          <div className="relative z-10 bg-white rounded-t-3xl border-t border-neutral-200 shadow-2xl p-4 safe-area-bottom max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 px-1">
              <h3 className="text-base font-extrabold text-[#242824]">
                {activeModal.title}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              {activeModal.items.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSubItem(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition min-h-[48px] touch-manipulation ${
                      isSelected
                        ? 'bg-[#EAF2ED] text-[#176B45] font-bold border border-[#176B45]/20'
                        : 'hover:bg-neutral-50 text-[#242824]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#176B45] text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">
                          {item.label}
                        </div>
                        <div className="text-xs text-[#626962] truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#176B45]' : 'text-neutral-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5-ITEM FIXED BOTTOM NAVIGATION BAR                       */}
      {/* ======================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-[#DCDDD7] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-bottom"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-lg mx-auto">
          {/* 1. Home */}
          <button
            onClick={() => {
              setActiveModal(null);
              setActiveTab('dashboard');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation min-h-[48px] ${
              isHomeActive
                ? 'text-[#176B45] font-extrabold'
                : 'text-[#626962] hover:text-[#242824] font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isHomeActive
                  ? 'bg-[#EAF2ED] text-[#176B45]'
                  : 'text-[#626962]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[11px] tracking-tight leading-none mt-1">
              Home
            </span>
          </button>

          {/* 2. Calculator */}
          <button
            onClick={() => {
              setActiveModal(null);
              setActiveTab('calculator');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation min-h-[48px] ${
              isCalculatorActive
                ? 'text-[#176B45] font-extrabold'
                : 'text-[#626962] hover:text-[#242824] font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isCalculatorActive
                  ? 'bg-[#EAF2ED] text-[#176B45]'
                  : 'text-[#626962]'
              }`}
            >
              <Calculator className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[11px] tracking-tight leading-none mt-1">
              Calculator
            </span>
          </button>

          {/* 3. Plan */}
          <button
            onClick={() => {
              setActiveModal({
                isOpen: true,
                title: 'Academic Planning',
                items: planItems
              });
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation min-h-[48px] ${
              isPlanActive
                ? 'text-[#176B45] font-extrabold'
                : 'text-[#626962] hover:text-[#242824] font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isPlanActive
                  ? 'bg-[#EAF2ED] text-[#176B45]'
                  : 'text-[#626962]'
              }`}
            >
              <CalendarDays className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[11px] tracking-tight leading-none mt-1">
              Plan
            </span>
          </button>

          {/* 4. Progress */}
          <button
            onClick={() => {
              setActiveModal({
                isOpen: true,
                title: 'Academic Progress & Analytics',
                items: progressItems
              });
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation min-h-[48px] ${
              isProgressActive
                ? 'text-[#176B45] font-extrabold'
                : 'text-[#626962] hover:text-[#242824] font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isProgressActive
                  ? 'bg-[#EAF2ED] text-[#176B45]'
                  : 'text-[#626962]'
              }`}
            >
              <Award className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[11px] tracking-tight leading-none mt-1">
              Progress
            </span>
          </button>

          {/* 5. More */}
          <button
            onClick={() => {
              setActiveModal({
                isOpen: true,
                title: 'More Features & Tools',
                items: moreItems
              });
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation min-h-[48px] ${
              isMoreActive || activeModal !== null
                ? 'text-[#176B45] font-extrabold'
                : 'text-[#626962] hover:text-[#242824] font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isMoreActive || activeModal !== null
                  ? 'bg-[#EAF2ED] text-[#176B45]'
                  : 'text-[#626962]'
              }`}
            >
              <MoreHorizontal className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[11px] tracking-tight leading-none mt-1">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
