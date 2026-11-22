// University of Ruhuna - Faculty of Agriculture
// Mobile-First Sticky Bottom Navigation Bar (iOS / Android Ergonomic Thumb Navigation)

import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  CalendarDays,
  FileText,
  Menu
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { NavView } from '../../types';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setMobileDrawerOpen,
    isMobileDrawerOpen,
    getActiveProfile
  } = useGradeStore();

  const profile = getActiveProfile();

  const navItems: Array<{
    id: NavView | 'more';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    isActive: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      action: () => setActiveTab('dashboard'),
      isActive: activeTab === 'dashboard'
    },
    {
      id: 'calculator',
      label: 'Calculator',
      icon: Calculator,
      action: () => setActiveTab('calculator'),
      isActive: activeTab === 'calculator' || activeTab === 'grades'
    },
    {
      id: 'planner',
      label: 'Planner',
      icon: CalendarDays,
      action: () => setActiveTab('planner'),
      isActive: activeTab === 'planner'
    },
    {
      id: 'transcript',
      label: 'Transcript',
      icon: FileText,
      action: () => setActiveTab('transcript'),
      isActive: activeTab === 'transcript'
    },
    {
      id: 'more',
      label: 'Menu',
      icon: Menu,
      action: () => setMobileDrawerOpen(!isMobileDrawerOpen),
      isActive: isMobileDrawerOpen
    }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-bottom"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-95 touch-manipulation min-h-[48px] ${
                item.isActive
                  ? 'text-emerald-800 font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-900 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  item.isActive
                    ? 'bg-emerald-100 text-emerald-800 scale-105 shadow-2xs'
                    : 'text-neutral-500'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
