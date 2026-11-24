// University of Ruhuna - Faculty of Agriculture
// Reusable Contextual Sinhala & English Tooltip Component
// Supports Desktop hover/focus and Mobile tap-to-open with viewport containment & ARIA accessibility

import React, { useState, useEffect, useRef, useId } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';
import { TooltipId, getAcademicTooltip } from '../../constants/tooltips';

interface HelpTooltipProps {
  id: TooltipId;
  label?: string; // Optional custom label or accessible name
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  size?: 'xs' | 'sm' | 'md';
  icon?: 'info' | 'help';
  className?: string;
  showIconOnly?: boolean;
  children?: React.ReactNode;
}

// Global listener to ensure only ONE tooltip is open at a time across the entire application
const ACTIVE_TOOLTIP_EVENT = 'gradePath:activeTooltipChanged';
let currentActiveTooltipId: string | null = null;

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  id,
  label,
  position = 'top',
  align = 'center',
  size = 'sm',
  icon = 'info',
  className = '',
  showIconOnly = true,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const instanceId = useId();
  const tooltipContentId = `tooltip-${id}-${instanceId}`;

  const entry = getAcademicTooltip(id);
  const displayLabel = label || entry.label;

  // Listen for other tooltips opening and close this one
  useEffect(() => {
    const handleActiveChanged = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      if (customEvent.detail !== instanceId) {
        setIsOpen(false);
      }
    };

    window.addEventListener(ACTIVE_TOOLTIP_EVENT, handleActiveChanged);
    return () => {
      window.removeEventListener(ACTIVE_TOOLTIP_EVENT, handleActiveChanged);
    };
  }, [instanceId]);

  const notifyActive = (open: boolean) => {
    currentActiveTooltipId = open ? instanceId : null;
    window.dispatchEvent(
      new CustomEvent<string | null>(ACTIVE_TOOLTIP_EVENT, { detail: currentActiveTooltipId })
    );
  };

  // Close on outside tap or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        notifyActive(false);
        triggerRef.current?.focus();
      }
    };

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
        notifyActive(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isOpen]);

  const toggleOpen = (e: React.MouseEvent | React.TouchEvent) => {
    // Crucial: stop propagation so clicking the tooltip icon never triggers checkbox, grade selection, or row click!
    e.stopPropagation();
    e.preventDefault();
    const next = !isOpen;
    setIsOpen(next);
    notifyActive(next);
  };

  const IconComponent = icon === 'help' ? HelpCircle : Info;
  const iconSizeClass = size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center relative align-middle ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        onMouseEnter={() => {
          // On non-touch desktop devices, open on hover
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            setIsOpen(true);
            notifyActive(true);
          }
        }}
        onMouseLeave={() => {
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            setIsOpen(false);
            notifyActive(false);
          }
        }}
        onFocus={() => {
          setIsOpen(true);
          notifyActive(true);
        }}
        onBlur={() => {
          // Small delay so users can tab or mouse into tooltip if needed
          setTimeout(() => {
            if (!tooltipRef.current?.contains(document.activeElement)) {
              setIsOpen(false);
              notifyActive(false);
            }
          }, 150);
        }}
        aria-describedby={isOpen ? tooltipContentId : undefined}
        aria-expanded={isOpen}
        aria-label={`${displayLabel} academic explanation`}
        className="inline-flex items-center justify-center p-1 rounded-full text-neutral-400 hover:text-emerald-700 hover:bg-emerald-50/80 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer min-w-[28px] min-h-[28px] sm:min-w-[22px] sm:min-h-[22px] transition-colors touch-manipulation select-none"
      >
        {children ? (
          children
        ) : (
          <IconComponent className={`${iconSizeClass} shrink-0`} />
        )}
      </button>

      {/* Floating Sinhala & English Tooltip Card */}
      {isOpen && (
        <>
          {/* Mobile Bottom Sheet Modal (< 640px) to prevent viewport clipping */}
          <div
            className="sm:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-3 animate-in fade-in duration-150"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              notifyActive(false);
            }}
          >
            <div
              ref={tooltipRef}
              id={tooltipContentId}
              role="tooltip"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-left animate-in slide-in-from-bottom duration-200 space-y-3"
            >
              {/* Header with Title and Close Button */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {entry.id}
                  </span>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {displayLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    notifyActive(false);
                  }}
                  aria-label="Close explanation"
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sinhala Primary Translation */}
              <div
                lang="si"
                className="pt-1 font-sinhala text-[14px] leading-[1.7] text-neutral-800 dark:text-neutral-200 font-normal break-words"
              >
                {entry.sinhala}
              </div>

              {/* English Context Description */}
              {entry.english && (
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
                  {entry.english}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Hover/Focus Card (>= 640px) */}
          <div
            ref={tooltipRef}
            id={`${tooltipContentId}-desktop`}
            role="tooltip"
            onClick={(e) => e.stopPropagation()}
            className={`hidden sm:block absolute z-50 w-72 sm:w-80 max-w-[calc(100vw-32px)] p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150 ${
              position === 'bottom'
                ? 'top-full mt-2'
                : position === 'left'
                ? 'right-full mr-2 top-1/2 -translate-y-1/2'
                : position === 'right'
                ? 'left-full ml-2 top-1/2 -translate-y-1/2'
                : 'bottom-full mb-2'
            } ${
              align === 'start'
                ? 'left-0'
                : align === 'end'
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2'
            }`}
            style={{
              maxWidth: 'min(320px, calc(100vw - 32px))'
            }}
          >
            {/* Header with Title and Close Button */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {entry.id}
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {displayLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  notifyActive(false);
                }}
                aria-label="Close explanation"
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition -mr-1 -mt-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sinhala Primary Translation */}
            <div
              lang="si"
              className="pt-2.5 font-sinhala text-[13px] sm:text-[13.5px] leading-[1.7] text-neutral-800 dark:text-neutral-200 font-normal break-words"
            >
              {entry.sinhala}
            </div>

            {/* English Context Description */}
            {entry.english && (
              <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
                {entry.english}
              </div>
            )}
          </div>
        </>
      )}
    </span>
  );
};
