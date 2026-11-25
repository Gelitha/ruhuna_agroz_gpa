// University of Ruhuna - Faculty of Agriculture
// Simplified Mobile-First Sticky Bottom Navigation Bar (4 Primary Destinations)

import React from 'react';
import { useGradeStore } from '../../store/useGradeStore';
import { MOBILE_BOTTOM_NAV_ITEMS, normalizeNavView } from '../../config/navigation';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useGradeStore();
  const normalizedActive = normalizeNavView(activeTab);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-[#DCDDD7] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-bottom"
    >
      <div className="grid grid-cols-4 items-center justify-around max-w-lg mx-auto">
        {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedActive === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation min-h-[48px] cursor-pointer ${
                isActive
                  ? 'text-[#176B45] font-extrabold'
                  : 'text-[#626962] hover:text-[#242824] font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#EAF2ED] text-[#176B45]'
                    : 'text-[#626962]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[11px] tracking-tight leading-none mt-1">
                {item.mobileLabel || item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
