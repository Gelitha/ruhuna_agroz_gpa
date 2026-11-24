// University of Ruhuna - Faculty of Agriculture
// Reusable Horizontal Grade Selection Component (Mobile & Desktop)
// Smooth single-tap grade entry with native touch scrolling & minimum 44px touch targets

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Grade } from '../../types';
import { GRADING_SCALE } from '../../database';
import { calculateEffectiveGpvForGrade } from '../../utils/projectionCalculations';

export const GRADE_OPTIONS: Grade[] = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D+', 'D', 'E'
];

export interface HorizontalGradeSelectorProps {
  selectedGrade?: Grade | '';
  value?: Grade | '';
  onSelectGrade?: (grade: Grade | '') => void;
  onChange?: (grade: Grade) => void;
  isProjected?: boolean;
  isRepeat?: boolean;
  isExcused?: boolean;
  disabled?: boolean;
  isConfirmedOfficial?: boolean;
  courseCode?: string;
  allowClear?: boolean;
  size?: 'sm' | 'md' | 'touch'; // 'touch' enforces >=44px touch targets on mobile
  className?: string;
  ariaLabel?: string;
}

export const HorizontalGradeSelector: React.FC<HorizontalGradeSelectorProps> = ({
  selectedGrade,
  value,
  onSelectGrade,
  onChange,
  isProjected = false,
  isRepeat = false,
  isExcused = false,
  disabled = false,
  isConfirmedOfficial = false,
  courseCode = '',
  allowClear = true,
  size = 'touch',
  className = '',
  ariaLabel
}) => {
  const currentGrade = value !== undefined ? value : (selectedGrade || '');
  const handleSelect = (g: Grade | '') => {
    if (onSelectGrade) onSelectGrade(g);
    if (onChange) onChange(g as Grade);
  };
  const isDisabled = disabled || isConfirmedOfficial;
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedBtnRef = useRef<HTMLButtonElement>(null);
  const isInteractingRef = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollIndicators = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkScrollIndicators();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollIndicators, { passive: true });
    window.addEventListener('resize', checkScrollIndicators, { passive: true });
    return () => {
      el.removeEventListener('scroll', checkScrollIndicators);
      window.removeEventListener('resize', checkScrollIndicators);
    };
  }, [checkScrollIndicators]);

  // Reveal selected grade on mount or external grade change (when not actively swiping)
  useEffect(() => {
    if (currentGrade && selectedBtnRef.current && scrollRef.current && !isInteractingRef.current) {
      const container = scrollRef.current;
      const btn = selectedBtnRef.current;
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const containerWidth = container.clientWidth;
      const containerScroll = container.scrollLeft;

      if (btnLeft < containerScroll || btnLeft + btnWidth > containerScroll + containerWidth) {
        container.scrollTo({
          left: Math.max(0, btnLeft - 20),
          behavior: 'smooth'
        });
      }
    }
  }, [currentGrade]);

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(10);
      }
    } catch {
      // Ignore vibration errors silently
    }
  };

  const handleGradeClick = (grade: Grade) => {
    if (isDisabled) return;
    triggerHaptic();
    if (allowClear && currentGrade === grade) {
      handleSelect('');
    } else {
      handleSelect(grade);
    }
  };

  const isTouchSize = size === 'touch';
  const btnSizeClasses = isTouchSize
    ? 'min-w-[44px] min-h-[44px] h-11 px-2.5 text-sm'
    : size === 'sm'
    ? 'min-w-[34px] min-h-[34px] h-8.5 px-1.5 text-xs'
    : 'min-w-[40px] min-h-[40px] h-10 px-2 text-xs sm:text-sm';

  return (
    <div
      className={`relative w-full max-w-full group ${className}`}
      onTouchStart={() => { isInteractingRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { isInteractingRef.current = false; }, 300); }}
    >
      {/* Subtle edge fades communicating horizontal scrollability */}
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-white via-white/80 to-transparent z-10 transition-opacity"
          aria-hidden="true"
        />
      )}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-white via-white/80 to-transparent z-10 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Horizontally scrollable buttons row */}
      <div
        ref={scrollRef}
        role="radiogroup"
        aria-label={ariaLabel || (courseCode ? `Grade selection for ${courseCode}` : 'Grade selection')}
        className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar touch-pan-x scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {GRADE_OPTIONS.map((g) => {
          const isSelected = currentGrade === g;
          const gpv = GRADING_SCALE[g]?.gpv ?? 0;
          const effectiveGpv = calculateEffectiveGpvForGrade(g, isRepeat, isExcused);
          const isCapped = isRepeat && !isExcused && gpv > 2.0;

          // Compute selected styling based on confirmed vs projected
          let colorStyle = 'bg-white text-neutral-700 border-[#DCDDD7] hover:bg-neutral-50 active:bg-neutral-100';
          if (isSelected) {
            if (isProjected) {
              colorStyle = 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/40 font-black';
            } else {
              colorStyle = 'bg-[#176B45] text-white border-[#103B2D] shadow-xs ring-2 ring-emerald-500/30 font-black';
            }
          }

          return (
            <button
              key={g}
              ref={isSelected ? selectedBtnRef : undefined}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isDisabled}
              onClick={() => handleGradeClick(g)}
              aria-label={`${courseCode ? courseCode + ' ' : ''}Grade ${g} (${gpv.toFixed(1)} GPV)${isCapped ? ', capped at 2.0' : ''}${isProjected ? ', projected' : ''}`}
              title={`${g} (${gpv.toFixed(1)} GPV)${isCapped ? ' • Repeat capped at 2.0 (Grade C)' : ''}${isProjected ? ' • Projected' : ''}`}
              className={`shrink-0 rounded-xl font-bold border transition-all flex flex-col items-center justify-center select-none ${btnSizeClasses} ${colorStyle} ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
              }`}
            >
              <span className="leading-none">{g}</span>
              {isTouchSize && (
                <span className={`text-[9px] font-medium leading-none mt-0.5 ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                  {effectiveGpv !== null ? effectiveGpv.toFixed(1) : gpv.toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
