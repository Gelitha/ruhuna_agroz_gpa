// University of Ruhuna - Faculty of Agriculture
// Permanent, Collapsible Bilingual "How to Use" Guide for Dashboard

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Calculator,
  Target,
  LineChart,
  Download,
  Info
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { SiSubtext } from '../common/BilingualText';
import { SI } from '../../constants/translations';

const HOW_TO_USE_STORAGE_KEY = 'gradepath_how_to_use_expanded_v1';

function loadInitialExpanded(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return true;
    const saved = localStorage.getItem(HOW_TO_USE_STORAGE_KEY);
    if (saved === null) return true; // Expanded by default for new users
    return saved === 'true';
  } catch {
    return true;
  }
}

interface GuideStep {
  num: number;
  title: string;
  siTitle: string;
  enDesc: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    num: 1,
    title: 'Set up your academic profile',
    siTitle: SI.howToUse.step1,
    enDesc: 'Select your degree programme (ARMT, ABM, or GT) and current academic semester in your profile.'
  },
  {
    num: 2,
    title: 'Enter official grades',
    siTitle: SI.howToUse.step2,
    enDesc: 'Enter confirmed results from previous and current semesters in the GPA Calculator.'
  },
  {
    num: 3,
    title: 'Add expected grades',
    siTitle: SI.howToUse.step3,
    enDesc: 'Expected grades update your Projected GPA without changing your official Actual GPA.'
  },
  {
    num: 4,
    title: 'Understand Repeat and Excused',
    siTitle: SI.howToUse.step4,
    enDesc: 'Repeat attempts are capped at Grade C (2.00 GPV) unless officially excused by the Faculty/Senate.'
  },
  {
    num: 5,
    title: 'Plan your target CGPA',
    siTitle: SI.howToUse.step5,
    enDesc: 'Open Planning Tools inside GPA Calculator and select Target CGPA to check required grades.'
  },
  {
    num: 6,
    title: 'Customize suggested grades',
    siTitle: SI.howToUse.step6,
    enDesc: 'Lock any subject grade using the dropdown; remaining Auto subjects rebalance dynamically with credit quotas, feasibility status, and Apply Suggested as Projected.'
  },
  {
    num: 7,
    title: 'Update results when released',
    siTitle: SI.howToUse.step7,
    enDesc: 'Untick Projected on the course and confirm the official grade once university results are released.'
  },
  {
    num: 8,
    title: 'Review academic performance',
    siTitle: SI.howToUse.step8,
    enDesc: 'Use Analytics for GPA trends and grade distribution, and Academic Transcript for a printable record.'
  },
  {
    num: 9,
    title: 'Back up academic records',
    siTitle: SI.howToUse.step9,
    enDesc: 'Data is saved locally in your browser; clearing browser data can remove it, so export and restore JSON backups from Settings & Backup.'
  }
];

export const HowToUseGuide: React.FC = () => {
  const { setActiveTab } = useGradeStore();
  const [isExpanded, setIsExpanded] = useState<boolean>(loadInitialExpanded);

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
          localStorage.setItem(HOW_TO_USE_STORAGE_KEY, String(next));
        }
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/70 transition cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold text-neutral-900">How to Use</div>
            <SiSubtext text={SI.dashboard.howToUse} className="text-[#626962]" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-right">
            <span className="block">{isExpanded ? 'Hide Guide' : 'Show Guide'}</span>
            <SiSubtext text={isExpanded ? SI.common.hideGuide : SI.common.showGuide} className="text-[9.5px] text-emerald-700" />
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-neutral-100 space-y-4">
          {/* Quick Contextual Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-left leading-tight">
                <span className="block">Open GPA Calculator</span>
                <SiSubtext text={SI.common.openCalculator} className="text-[9.5px] text-emerald-800" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projection')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-left leading-tight">
                <span className="block">Open Target CGPA</span>
                <SiSubtext text={SI.common.openTargetCgpa} className="text-[9.5px] text-emerald-800" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LineChart className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-left leading-tight">
                <span className="block">View Analytics</span>
                <SiSubtext text={SI.common.viewAnalytics} className="text-[9.5px] text-[#626962]" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-left leading-tight">
                <span className="block">Export Backup</span>
                <SiSubtext text={SI.settings.exportBackup} className="text-[9.5px] text-[#626962]" />
              </span>
            </button>
          </div>

          {/* 9-Step Bilingual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {GUIDE_STEPS.map(step => (
              <div
                key={step.num}
                className="p-3.5 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {step.num}
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 leading-snug">{step.title}</h4>
                </div>
                <SiSubtext text={step.siTitle} className="text-emerald-900 font-medium" />
                <p className="text-[11px] text-neutral-600 leading-relaxed">{step.enDesc}</p>
              </div>
            ))}
          </div>

          {/* Practical GPA Example */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Practical GPA Example (Illustrative Only)</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                Sample values only — {SI.common.sampleValuesOnly}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 space-y-1">
                <div className="font-bold text-neutral-900">
                  Actual CGPA: <span className="font-mono text-emerald-800">3.20</span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Actual CGPA represents confirmed academic results.
                </p>
                <SiSubtext
                  text={SI.howToUse.actualExample}
                  className="text-emerald-900"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 space-y-1">
                <div className="font-bold text-neutral-900">
                  Projected CGPA: <span className="font-mono text-emerald-800">3.50</span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Projected CGPA represents estimated performance including expected grades.
                </p>
                <SiSubtext
                  text={SI.howToUse.projectedExample}
                  className="text-emerald-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
