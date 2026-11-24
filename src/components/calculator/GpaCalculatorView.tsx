// University of Ruhuna - Faculty of Agriculture
// Ruhuna Agri GPA — Unified GPA Calculator & Multi-Semester Academic Workspace
// One calculator. Two grade modes (Actual | Projection). Powerful tools on demand.

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  ShieldCheck,
  Award,
  Search,
  Sliders,
  Minus,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Check,
  Lock,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { Grade, SemesterKey, Course } from '../../types';
import {
  GRADING_SCALE,
  COURSE_CATALOG,
  DEGREE_INFO,
  parseCourseCode,
  getDepartmentStyle,
  getAvailableElectivesForStudent
} from '../../database';
import { calculateCourseGpv } from '../../utils/calculations';
import { isCourseGradeConfirmed, ALL_SEMESTER_KEYS } from '../../utils/projectionCalculations';
import { AppLogo } from '../common/AppLogo';
import { PendingResultsShortcut } from './PendingResultsShortcut';
import { PlanningTools } from './PlanningTools';

const SEMESTERS: Array<{ key: SemesterKey | 'ORIENTATION'; label: string }> = [
  { key: '1-1', label: 'Sem 1-1' },
  { key: '1-2', label: 'Sem 1-2' },
  { key: '2-1', label: 'Sem 2-1' },
  { key: '2-2', label: 'Sem 2-2' },
  { key: '3-1', label: 'Sem 3-1' },
  { key: '3-2', label: 'Sem 3-2' },
  { key: '4-1', label: 'Sem 4-1' },
  { key: '4-2', label: 'Sem 4-2' },
  { key: 'ORIENTATION', label: 'Non-GPA' }
];

const GRADE_OPTIONS: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];

// Plain language standing generator without misleading "achieved" claims
function getStandingDisplay(cgpa: number, creditsAttempted: number): { title: string; rangeText: string; color: string } {
  if (creditsAttempted === 0 || cgpa === 0) {
    return { title: 'No Grades Finalized', rangeText: 'Enter official grades to establish your standing', color: '#78827A' };
  }
  if (cgpa >= 3.70) {
    return { title: 'First Class Range', rangeText: 'Current GPA is within First Class Honours threshold (≥ 3.70)', color: '#27845B' };
  }
  if (cgpa >= 3.30) {
    return { title: 'Second Upper Range', rangeText: 'Current GPA is within Second Upper threshold (3.30 – 3.69)', color: '#245C45' };
  }
  if (cgpa >= 3.00) {
    return { title: 'Second Lower Range', rangeText: 'Current GPA is within Second Lower threshold (3.00 – 3.29)', color: '#2D6B82' };
  }
  if (cgpa >= 2.00) {
    return { title: 'General Pass Range', rangeText: 'Current GPA is within Pass threshold (2.00 – 2.99)', color: '#C58A35' };
  }
  return { title: 'Academic Warning Range', rangeText: 'Current GPA is below minimum degree pass threshold (< 2.00)', color: '#C65A55' };
}

export const GpaCalculatorView: React.FC = () => {
  const {
    getActiveProfile,
    getSemesterStats,
    getOverallStats,
    getAcademicProjections,
    selectedSemesterForCalculator,
    setSelectedSemesterForCalculator,
    setCurrentSemester,
    setCourseGrade,
    setCourseExpectedGrade,
    setCourseCredits,
    setCourseRepeat,
    setCourseExcused,
    addCourseToSemester,
    removeCourseFromSemester,
    setOrientationGrade,
    bulkSetSemesterGrades,
    clearSemesterGrades,
    setActiveTab
  } = useGradeStore();

  const profile = getActiveProfile();
  const stats = getOverallStats();
  const proj = getAcademicProjections();
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  // 1. Two Calculator Modes: 'actual' (Official Results) | 'projection' (Expected Grades)
  const [calculatorMode, setCalculatorMode] = useState<'actual' | 'projection'>('actual');

  // 2. Active Tab (defaults to current academic semester if unset)
  const [activeTabKey, setActiveTabKey] = useState<SemesterKey | 'ORIENTATION'>(() => {
    if (selectedSemesterForCalculator && selectedSemesterForCalculator !== 'ALL') {
      return selectedSemesterForCalculator;
    }
    return profile.currentSemester || '1-1';
  });

  // Modal for changing student's current academic semester
  const [showCurrentSemSelector, setShowCurrentSemSelector] = useState(false);

  // Auto-save feedback toast
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSaveNotification = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setSaveStatus('Saved');
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus(null);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Search & Filter
  const [courseSearch, setCourseSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ungraded' | 'repeat'>('all');

  // Fast inline course add state
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [inlineCode, setInlineCode] = useState('');
  const [inlineName, setInlineName] = useState('');
  const [inlineCredits, setInlineCredits] = useState<number>(2);

  // Handbook Electives Quick Add panel toggle
  const [showElectiveSuggestions, setShowElectiveSuggestions] = useState(false);

  const isOrientation = activeTabKey === 'ORIENTATION';

  // Active courses list
  const semCourses = useMemo(() => {
    if (isOrientation) {
      return profile.orientationCourses || [];
    }
    return profile.semesters[activeTabKey as SemesterKey] || [];
  }, [profile, activeTabKey, isOrientation]);

  // Semester Stats
  const semStats = useMemo(() => {
    if (isOrientation) return null;
    return getSemesterStats(activeTabKey as SemesterKey);
  }, [activeTabKey, isOrientation, getSemesterStats]);

  // Semester Projection Summary
  const semProjection = useMemo(() => {
    if (isOrientation) return null;
    return proj.semesterSummaries[activeTabKey as SemesterKey];
  }, [activeTabKey, isOrientation, proj]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return semCourses.filter((course) => {
      const q = courseSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        course.code.toLowerCase().includes(q) ||
        course.name.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === 'ungraded') {
        return !isCourseGradeConfirmed(course);
      }
      if (filterType === 'repeat') {
        return !!course.isRepeat;
      }
      return true;
    });
  }, [semCourses, courseSearch, filterType]);

  // Available handbook electives
  const availableElectives = useMemo(() => {
    if (isOrientation) return [];
    return getAvailableElectivesForStudent(
      profile.degree,
      activeTabKey as SemesterKey,
      semCourses.map(c => c.code)
    );
  }, [profile.degree, activeTabKey, semCourses, isOrientation]);

  const handleQuickAddElective = (catCourse: {
    code: string;
    name: string;
    credits: number;
    dept: string;
  }) => {
    if (isOrientation) return;
    addCourseToSemester(activeTabKey as SemesterKey, {
      code: catCourse.code,
      name: catCourse.name,
      credits: catCourse.credits,
      dept: catCourse.dept,
      isCompulsory: false,
      isNgpa: false,
      grade: '',
      isRepeat: false,
      isExcused: false,
      isExpected: false
    });
    triggerSaveNotification();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCode.trim() || isOrientation) return;
    const clean = inlineCode.trim().toUpperCase();
    const parsed = parseCourseCode(clean);
    const catalogMatch = COURSE_CATALOG[clean];

    addCourseToSemester(activeTabKey as SemesterKey, {
      code: clean,
      name: inlineName.trim() || catalogMatch?.name || clean,
      credits: inlineCredits || catalogMatch?.credits || parsed?.credits || 2,
      dept: catalogMatch?.dept || parsed?.dept || 'CC',
      isCompulsory: false,
      isNgpa: parsed ? parsed.isNgpa : false,
      grade: '',
      isRepeat: false,
      isExcused: false,
      isExpected: false
    });

    setInlineCode('');
    setInlineName('');
    setInlineCredits(2);
    setShowAddCustom(false);
    triggerSaveNotification();
  };

  // Grade button styles on Desktop
  const getGradeStyle = (grade: Grade | undefined) => {
    if (!grade) {
      return 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300 hover:border-neutral-400';
    }
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-gradient-to-br from-emerald-600 to-green-600 text-white font-black shadow-md shadow-emerald-600/30 border-emerald-700 ring-2 ring-emerald-400/40';
      case 'A-':
        return 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-black shadow-md shadow-teal-600/30 border-teal-700 ring-2 ring-teal-400/40';
      case 'B+':
        return 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-black shadow-md shadow-cyan-600/30 border-cyan-700 ring-2 ring-cyan-400/40';
      case 'B':
        return 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-600/30 border-blue-700 ring-2 ring-blue-400/40';
      case 'B-':
        return 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black shadow-md shadow-indigo-600/30 border-indigo-700 ring-2 ring-indigo-400/40';
      case 'C+':
        return 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white font-black shadow-md shadow-amber-500/30 border-amber-600 ring-2 ring-amber-400/40';
      case 'C':
        return 'bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black shadow-md shadow-orange-500/30 border-orange-600 ring-2 ring-orange-400/40';
      case 'C-':
        return 'bg-gradient-to-br from-orange-600 to-red-500 text-white font-black shadow-md shadow-orange-600/30 border-orange-700 ring-2 ring-orange-400/40';
      case 'D+':
      case 'D':
        return 'bg-gradient-to-br from-red-500 to-orange-600 text-white font-black shadow-md shadow-red-500/30 border-red-700 ring-2 ring-red-400/40';
      case 'E':
        return 'bg-gradient-to-br from-rose-600 to-red-700 text-white font-black shadow-md shadow-rose-600/30 border-rose-800 ring-2 ring-rose-400/40';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const hasAnyConfirmedGrades = proj.actualGpaCredits > 0;
  const standingInfo = getStandingDisplay(proj.actualCgpa, proj.actualGpaCredits);
  const totalCreditsPercent = Math.min(
    100,
    Math.round((stats.totalGpaCreditsEarned / stats.totalRequiredCredits) * 100)
  );
  const remainingCredits = Math.max(0, stats.totalRequiredCredits - stats.totalGpaCreditsEarned);

  return (
    <div className="max-w-[1440px] mx-auto pb-16 space-y-4 sm:space-y-5">
      {/* ======================================================== */}
      {/* 1. MOBILE COMPACT SUMMARY (<= 1023px)                    */}
      {/* High-density, Unified Actual & Projected Metrics         */}
      {/* ======================================================== */}
      <div className="block lg:hidden bg-white border border-[#DCDDD7] rounded-2xl p-4 shadow-subtle space-y-3">
        {/* Top Header: Degree, Profile Name & Mode Selector */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EDF1EC]">
          <div className="flex items-center gap-2 min-w-0">
            <AppLogo size="sm" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {profile.degree} (Hons)
              </span>
            </div>
          </div>

          {/* Mode Switcher on Mobile */}
          <div className="flex items-center p-0.5 bg-[#F8F8F4] border border-[#DCDDD7] rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setCalculatorMode('actual')}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                calculatorMode === 'actual'
                  ? 'bg-[#103B2D] text-white shadow-xs'
                  : 'text-[#626962]'
              }`}
            >
              Actual
            </button>
            <button
              type="button"
              onClick={() => setCalculatorMode('projection')}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all flex items-center gap-1 ${
                calculatorMode === 'projection'
                  ? 'bg-[#176B45] text-white shadow-xs'
                  : 'text-[#626962]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Projection</span>
            </button>
          </div>
        </div>

        {/* 4 Compact Metrics Grid: Actual CGPA, Projected CGPA, Active SGPA, Credits */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {/* Metric 1: Actual CGPA */}
          <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#626962]">
              Actual CGPA
            </span>
            <div className="font-mono font-black text-lg text-[#242824] leading-tight font-tabular mt-0.5">
              {hasAnyConfirmedGrades ? proj.actualCgpa.toFixed(2) : '—'}
            </div>
            <span className="text-[10px] text-[#626962] font-medium leading-none mt-0.5">
              {proj.actualGpaCredits} Cr confirmed
            </span>
          </div>

          {/* Metric 2: Projected CGPA */}
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
              Projected CGPA
            </span>
            <div className="font-mono font-black text-lg text-[#176B45] leading-tight font-tabular mt-0.5">
              {proj.combinedProjectedCgpa > 0 ? proj.combinedProjectedCgpa.toFixed(2) : '—'}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium leading-none mt-0.5">
              After Sem {proj.currentSemester} {proj.deltaCombined !== 0 ? `(${proj.deltaCombined > 0 ? `+${proj.deltaCombined}` : proj.deltaCombined})` : ''}
            </span>
          </div>

          {/* Metric 3: Active Semester SGPA */}
          <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#626962]">
              Sem {activeTabKey} {calculatorMode === 'actual' ? 'Actual' : 'Projected'}
            </span>
            <div className="font-mono font-black text-lg text-[#242824] leading-tight font-tabular mt-0.5">
              {calculatorMode === 'actual'
                ? semStats && semStats.realCreditsAttempted > 0
                  ? semStats.realSgpa.toFixed(2)
                  : '—'
                : semProjection && semProjection.projectedSgpa > 0
                ? semProjection.projectedSgpa.toFixed(2)
                : '—'}
            </div>
            <span className="text-[10px] text-[#626962] font-medium leading-none mt-0.5">
              {calculatorMode === 'actual'
                ? `${semStats?.realCreditsAttempted || 0} Cr finalized`
                : `${semProjection?.predictedGpaCredits || 0} Cr projected`}
            </span>
          </div>

          {/* Metric 4: Current Academic Semester Switcher */}
          <div
            onClick={() => setShowCurrentSemSelector(true)}
            className="p-2.5 rounded-xl bg-[#F8F8F4] hover:bg-neutral-100 border border-[#EDF1EC] flex flex-col justify-center cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#626962]">
              Current Sem
            </span>
            <div className="font-mono font-black text-lg text-[#176B45] leading-tight font-tabular mt-0.5 flex items-center justify-center gap-1">
              <span>{profile.currentSemester}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <span className="text-[10px] text-[#176B45] font-semibold leading-none mt-0.5">
              Tap to change
            </span>
          </div>
        </div>

        {/* Mode Guidance Bar */}
        <div className="p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border bg-neutral-50/80 border-[#EDF1EC]">
          <span className="text-[#626962]">
            {calculatorMode === 'actual'
              ? 'Entering official grades. Confirmed results are locked in your permanent record.'
              : 'Entering expected grades for upcoming or pending examinations. Confirmed grades remain locked.'}
          </span>
          {saveStatus && (
            <span className="text-[11px] font-bold text-[#176B45] shrink-0 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP UNIFIED COCKPIT HERO (>= 1024px)              */}
      {/* Retains Familiar Botanical Theme with Mode Switching     */}
      {/* ======================================================== */}
      <div className="hidden lg:block bg-gradient-to-br from-[#103B2D] via-[#174E38] to-[#123324] text-white rounded-3xl p-6 lg:p-7 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-6">
          {/* LEFT: Branding, Degree, Profile, Mode Toggle */}
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center p-2 shrink-0 shadow-lg backdrop-blur-md">
              <AppLogo size="lg" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  {profile.degree} (Hons)
                </span>
                <span className="text-sm text-emerald-200 font-medium truncate">
                  {profile.name} {profile.registrationNumber ? `• ${profile.registrationNumber}` : ''}
                </span>

                {/* Current Academic Semester Pill */}
                <button
                  type="button"
                  onClick={() => setShowCurrentSemSelector(true)}
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/20 flex items-center gap-1 transition"
                  title="Change your current academic semester"
                >
                  <span>Current: Sem {profile.currentSemester}</span>
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                </button>
              </div>

              {/* Big Metrics Display */}
              <div className="flex items-baseline gap-6">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-200/80 block">
                    {calculatorMode === 'actual' ? 'Actual CGPA' : 'Combined Projected CGPA'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-white font-tabular">
                      {calculatorMode === 'actual'
                        ? hasAnyConfirmedGrades
                          ? proj.actualCgpa.toFixed(2)
                          : '—'
                        : proj.combinedProjectedCgpa > 0
                        ? proj.combinedProjectedCgpa.toFixed(2)
                        : '—'}
                    </span>
                    <span className="text-lg font-bold text-emerald-300/80">/ 4.00</span>
                  </div>
                </div>

                {/* Scope Comparison */}
                <div className="border-l border-white/15 pl-5 space-y-0.5">
                  <div className="text-xs text-emerald-200 font-medium">
                    {calculatorMode === 'actual'
                      ? `${proj.actualGpaCredits} Credits Confirmed`
                      : `After Sem ${proj.currentSemester} (${proj.combinedTotalCredits} Cr)`}
                  </div>
                  <div className="text-xs text-emerald-300/90 font-bold">
                    {calculatorMode === 'actual'
                      ? standingInfo.title
                      : proj.deltaCombined >= 0
                      ? `+${proj.deltaCombined.toFixed(2)} vs confirmed`
                      : `${proj.deltaCombined.toFixed(2)} vs confirmed`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Active Semester SGPA & Mode Switcher */}
          <div className="flex items-center gap-6 shrink-0 border-l border-white/15 pl-6">
            {/* Active Semester Metric */}
            <div className="text-right space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/80 block">
                Sem {activeTabKey} {calculatorMode === 'actual' ? 'Actual SGPA' : 'Projected SGPA'}
              </span>
              <div className="font-mono text-3xl font-black text-white font-tabular">
                {calculatorMode === 'actual'
                  ? semStats && semStats.realCreditsAttempted > 0
                    ? semStats.realSgpa.toFixed(2)
                    : '—'
                  : semProjection && semProjection.projectedSgpa > 0
                  ? semProjection.projectedSgpa.toFixed(2)
                  : '—'}
              </div>
              <span className="text-xs text-emerald-200/80 font-medium block">
                {calculatorMode === 'actual'
                  ? `${semStats?.realCreditsAttempted || 0} Credits finalized`
                  : `${semProjection?.predictedGpaCredits || 0} Credits projected`}
              </span>
            </div>

            {/* Mode Switcher on Desktop */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center p-1 bg-black/20 border border-white/20 rounded-xl backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setCalculatorMode('actual')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                    calculatorMode === 'actual'
                      ? 'bg-white text-[#103B2D] shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  Actual grades
                </button>
                <button
                  type="button"
                  onClick={() => setCalculatorMode('projection')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                    calculatorMode === 'projection'
                      ? 'bg-white text-[#103B2D] shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Projection</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('transcript')}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1 border border-white/15 transition"
                >
                  <Printer className="w-3 h-3" />
                  <span>Transcript</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('simulator')}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1 border border-white/15 transition"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Forecast</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. PENDING RESULTS SHORTCUT SECTION                      */}
      {/* Direct inline resolver for earlier semester grades       */}
      {/* ======================================================== */}
      <PendingResultsShortcut
        mode={calculatorMode}
        onNavigateSemester={(sem) => {
          setActiveTabKey(sem);
          setSelectedSemesterForCalculator(sem);
        }}
        activeSemester={activeTabKey}
      />

      {/* ======================================================== */}
      {/* 4. SEMESTER NAVIGATION (Mobile Dropdown & Desktop Pills) */}
      {/* ======================================================== */}
      <div>
        {/* Mobile Full-width Semester Select */}
        <div className="block lg:hidden bg-white border border-[#DCDDD7] rounded-2xl p-3 shadow-subtle space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#626962]">
            Select Semester:
          </label>
          <div className="relative">
            <select
              aria-label="Select Semester"
              value={activeTabKey}
              onChange={(e) => {
                const val = e.target.value as SemesterKey | 'ORIENTATION';
                setActiveTabKey(val);
                if (val !== 'ORIENTATION') {
                  setSelectedSemesterForCalculator(val);
                }
              }}
              className="w-full appearance-none bg-[#F8F8F4] hover:bg-neutral-100 border border-[#DCDDD7] rounded-xl px-3.5 py-2.5 pr-10 text-sm font-bold text-[#242824] min-h-[44px] cursor-pointer focus:outline-none focus:border-[#176B45]"
            >
              {SEMESTERS.map((sem) => {
                let badge = '';
                if (sem.key !== 'ORIENTATION') {
                  const summary = proj.semesterSummaries[sem.key];
                  if (summary && summary.pendingResultsCount > 0) {
                    badge = ` • (${summary.pendingResultsCount} pending)`;
                  } else if (summary && summary.confirmedGpaCredits > 0) {
                    badge = ` — SGPA ${summary.actualSgpa.toFixed(2)}`;
                  }
                }
                return (
                  <option key={sem.key} value={sem.key}>
                    {sem.label} {badge}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-neutral-500 pointer-events-none" />
          </div>

          {/* Quick Actions on Mobile */}
          {!isOrientation && (
            <div className="flex items-center gap-2 pt-1">
              <select
                onChange={(e) => {
                  if (e.target.value === 'clear') {
                    clearSemesterGrades(activeTabKey as SemesterKey);
                  } else if (e.target.value) {
                    bulkSetSemesterGrades(activeTabKey as SemesterKey, e.target.value as Grade);
                  }
                  e.target.value = '';
                  triggerSaveNotification();
                }}
                defaultValue=""
                className="text-xs bg-white border border-[#DCDDD7] rounded-xl px-2.5 py-2 text-[#242824] font-semibold cursor-pointer shrink-0 min-h-[44px] flex-1 focus:outline-none focus:border-[#176B45]"
              >
                <option value="" disabled>Fast Fill...</option>
                <option value="A">All A (4.0)</option>
                <option value="A-">All A- (3.7)</option>
                <option value="B+">All B+ (3.3)</option>
                <option value="B">All B (3.0)</option>
                <option value="C">All C (2.0)</option>
                <option value="clear">Clear Grades</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAddCustom(!showAddCustom)}
                className="px-3 py-2 rounded-xl bg-[#176B45] text-white text-xs font-bold shrink-0 min-h-[44px] flex items-center gap-1 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom</span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Semester Pill Bar */}
        <div className="hidden lg:flex bg-white border border-[#DCDDD7] rounded-2xl p-2 items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-auto py-0.5">
            {SEMESTERS.map((sem) => {
              const isActive = activeTabKey === sem.key;
              const summary = sem.key !== 'ORIENTATION' ? proj.semesterSummaries[sem.key] : null;
              const hasPending = summary && summary.pendingResultsCount > 0;
              const sgpa = summary && summary.confirmedGpaCredits > 0 ? summary.actualSgpa.toFixed(2) : '';

              return (
                <button
                  key={sem.key}
                  type="button"
                  onClick={() => {
                    setActiveTabKey(sem.key);
                    if (sem.key !== 'ORIENTATION') {
                      setSelectedSemesterForCalculator(sem.key);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#103B2D] text-white shadow-md'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <span>{sem.label}</span>
                  {hasPending && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title={`${summary.pendingResultsCount} pending`} />
                  )}
                  {sgpa && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sgpa}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop Fast Fill Dropdown */}
          {!isOrientation && (
            <select
              onChange={(e) => {
                if (e.target.value === 'clear') {
                  clearSemesterGrades(activeTabKey as SemesterKey);
                } else if (e.target.value) {
                  bulkSetSemesterGrades(activeTabKey as SemesterKey, e.target.value as Grade);
                }
                e.target.value = '';
                triggerSaveNotification();
              }}
              defaultValue=""
              className="text-sm bg-neutral-50 hover:bg-neutral-100 border border-[#DCDDD7] rounded-xl px-3 py-2 text-neutral-800 font-semibold cursor-pointer shrink-0 focus:outline-none focus:border-[#176B45] transition"
              title="Batch set grades for this semester"
            >
              <option value="" disabled>Fast Fill...</option>
              <option value="A">All A (4.0)</option>
              <option value="A-">All A- (3.7)</option>
              <option value="B+">All B+ (3.3)</option>
              <option value="B">All B (3.0)</option>
              <option value="C">All C (2.0)</option>
              <option value="clear">Clear Grades</option>
            </select>
          )}
        </div>
      </div>

      {/* QUICK-ADD HANDBOOK ELECTIVES (Collapsible Panel) */}
      {!isOrientation && (
        <div className="bg-white border border-[#DCDDD7] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Electives for {profile.degree} (Sem {activeTabKey})
                </h3>
                <p className="text-xs text-neutral-500">
                  {availableElectives.length} official electives available.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowElectiveSuggestions(!showElectiveSuggestions)}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-bold px-2 py-1 rounded-md hover:bg-neutral-100"
            >
              {showElectiveSuggestions ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {showElectiveSuggestions && (
            availableElectives.length === 0 ? (
              <div className="p-3 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
                No additional electives required or available for Semester {activeTabKey} in {profile.degree}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {availableElectives.map((cat) => {
                  const deptStyle = getDepartmentStyle(cat.dept);
                  return (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => handleQuickAddElective(cat)}
                      className="p-2.5 rounded-xl bg-neutral-50 hover:bg-emerald-50/60 border border-neutral-200 hover:border-emerald-300 text-left flex items-center justify-between gap-2.5 group transition"
                      title={`${cat.code}: ${cat.name} (${cat.credits} Cr)`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}
                          >
                            {cat.dept}
                          </span>
                          <span className="font-mono font-bold text-xs text-neutral-900 group-hover:text-emerald-800">
                            {cat.code}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600 group-hover:text-neutral-900 font-medium truncate mt-0.5">
                          {cat.name}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 group-hover:bg-[#176B45] group-hover:text-white transition shrink-0">
                        +{cat.credits} Cr
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* Course Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search course code or name..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#DCDDD7] text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#176B45] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-[#DCDDD7] bg-white p-1 text-xs font-semibold text-neutral-600 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'all' ? 'bg-[#103B2D] text-white font-bold' : 'hover:text-neutral-900'
              }`}
            >
              All ({semCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ungraded')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'ungraded' ? 'bg-[#103B2D] text-white font-bold' : 'hover:text-neutral-900'
              }`}
            >
              Ungraded
            </button>
            <button
              type="button"
              onClick={() => setFilterType('repeat')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'repeat' ? 'bg-[#103B2D] text-white font-bold' : 'hover:text-neutral-900'
              }`}
            >
              Repeats
            </button>
          </div>

          {!isOrientation && (
            <button
              type="button"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="hidden lg:flex px-3.5 py-2 rounded-xl bg-[#176B45] hover:bg-[#103B2D] text-white text-xs sm:text-sm font-bold items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Custom</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Custom Course Adder */}
      {showAddCustom && !isOrientation && (
        <form
          onSubmit={handleAddCustom}
          className="p-4 bg-emerald-50/50 border border-emerald-300 rounded-2xl flex flex-wrap items-center gap-3 text-sm shadow-sm"
        >
          <input
            type="text"
            placeholder="Code (e.g. CS21023)"
            value={inlineCode}
            onChange={(e) => setInlineCode(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-[#DCDDD7] font-mono font-bold w-36 focus:outline-none focus:border-[#176B45]"
          />
          <input
            type="text"
            placeholder="Course title..."
            value={inlineName}
            onChange={(e) => setInlineName(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-[#DCDDD7] flex-1 min-w-[180px] focus:outline-none focus:border-[#176B45]"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-600 mr-1">Credits:</span>
            {[1, 2, 3, 6].map((cr) => (
              <button
                key={cr}
                type="button"
                onClick={() => setInlineCredits(cr)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                  inlineCredits === cr
                    ? 'bg-[#103B2D] text-white border-[#103B2D] shadow-xs'
                    : 'bg-white border-[#DCDDD7] text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {cr} Cr
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!inlineCode.trim()}
            className="px-4 py-2 rounded-xl bg-[#176B45] hover:bg-[#103B2D] text-white font-bold text-xs sm:text-sm disabled:opacity-40 transition shadow-sm"
          >
            Add Course
          </button>
        </form>
      )}

      {/* ======================================================== */}
      {/* 5. COURSE GRADE ENTRY (Desktop & Mobile Adaptive)        */}
      {/* ======================================================== */}
      <div className="space-y-3">
        {filteredCourses.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#626962] bg-white border border-[#DCDDD7] rounded-2xl">
            No matching courses found in Semester {activeTabKey}.
          </div>
        ) : (
          <>
            {/* -------------------------------------------------- */}
            {/* MOBILE COURSE CARDS (<= 1023px)                    */}
            {/* -------------------------------------------------- */}
            <div className="block lg:hidden space-y-3">
              {filteredCourses.map((course) => {
                const creds = Number(course.credits) || 0;
                const deptStyle = getDepartmentStyle(course.dept);
                const isConfirmed = isCourseGradeConfirmed(course);

                const projKey = `${activeTabKey}:${course.code}`;
                const projData = profile.courseProjections?.[projKey];
                const expectedGrade = projData?.predictedGrade || projData?.targetGrade || (course.isExpected ? course.grade : undefined);

                return (
                  <div
                    key={course.code}
                    className={`p-4 rounded-2xl border transition-all bg-white shadow-subtle ${
                      isConfirmed
                        ? 'border-[#176B45]/40 ring-1 ring-[#176B45]/20'
                        : expectedGrade && calculatorMode === 'projection'
                        ? 'border-emerald-300 ring-1 ring-emerald-300/40 bg-emerald-50/15'
                        : 'border-[#DCDDD7]'
                    }`}
                  >
                    {/* Header: Code, Dept, Credits, Delete */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EDF1EC]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-sm text-[#242824]">
                          {course.code}
                        </span>
                        {course.dept && (
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}
                          >
                            {course.dept}
                          </span>
                        )}
                        {course.isCompulsory ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Core
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Elective
                          </span>
                        )}
                        {course.isNgpa && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            NGPA
                          </span>
                        )}
                      </div>

                      {/* Credit Stepper */}
                      {!course.isNgpa && (
                        <div className="flex items-center gap-1 bg-[#F8F8F4] border border-[#DCDDD7] rounded-lg px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setCourseCredits(
                                activeTabKey as SemesterKey,
                                course.code,
                                Math.max(1, creds - 1)
                              );
                              triggerSaveNotification();
                            }}
                            className="text-neutral-500 hover:text-neutral-900 p-1 rounded min-w-[24px] min-h-[24px] flex items-center justify-center"
                            aria-label="Decrease credits"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-xs text-[#242824] px-1">
                            {creds} Cr
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCourseCredits(
                                activeTabKey as SemesterKey,
                                course.code,
                                creds + 1
                              );
                              triggerSaveNotification();
                            }}
                            className="text-neutral-500 hover:text-neutral-900 p-1 rounded min-w-[24px] min-h-[24px] flex items-center justify-center"
                            aria-label="Increase credits"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {!course.isCompulsory && !course.isNgpa && !isOrientation && (
                        <button
                          type="button"
                          onClick={() => {
                            removeCourseFromSemester(activeTabKey as SemesterKey, course.code);
                            triggerSaveNotification();
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-rose-600 transition"
                          title="Remove elective"
                          aria-label="Remove elective"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Full Course Name (Wrapped, Never Truncated) */}
                    <div className="py-2.5 text-sm font-semibold text-[#242824] leading-snug break-words">
                      {course.name}
                    </div>

                    {/* Bottom: Grade Selector & Repeat Controls */}
                    <div className="pt-2 border-t border-[#EDF1EC] space-y-2.5">
                      {/* Projection Mode with Confirmed Grade: Display Locked Official Grade */}
                      {calculatorMode === 'projection' && isConfirmed ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAF2ED] border border-[#176B45]/40 text-[#103B2D]">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-[#176B45]" />
                            <span className="text-xs font-bold">
                              Official Grade: {course.grade} ({GRADING_SCALE[course.grade || '']?.gpv.toFixed(1)} GPV)
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-[#176B45] border border-[#176B45]/20">
                            Locked
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          {/* Native Grade Dropdown with >= 44px Touch Target */}
                          <div className="relative flex-1">
                            <select
                              value={
                                calculatorMode === 'actual'
                                  ? course.grade || ''
                                  : expectedGrade || ''
                              }
                              onChange={(e) => {
                                const newGrade = e.target.value as Grade;
                                if (calculatorMode === 'actual') {
                                  if (isOrientation) {
                                    setOrientationGrade(course.code, newGrade);
                                  } else {
                                    setCourseGrade(activeTabKey as SemesterKey, course.code, newGrade);
                                  }
                                } else {
                                  setCourseExpectedGrade(activeTabKey as SemesterKey, course.code, newGrade);
                                }
                                triggerSaveNotification();
                              }}
                              aria-label={`Grade for ${course.code}`}
                              className={`w-full appearance-none rounded-xl px-3 py-2.5 pr-8 text-sm font-bold min-h-[44px] cursor-pointer border transition focus:outline-none ${
                                (calculatorMode === 'actual' && isConfirmed) ||
                                (calculatorMode === 'projection' && expectedGrade)
                                  ? 'bg-[#EAF2ED] text-[#103B2D] border-[#176B45]'
                                  : 'bg-white text-neutral-600 border-[#DCDDD7]'
                              }`}
                            >
                              <option value="">
                                {calculatorMode === 'actual'
                                  ? '[ Enter official grade ▼ ]'
                                  : '[ Set expected grade ▼ ]'}
                              </option>
                              {GRADE_OPTIONS.map((g) => (
                                <option key={g} value={g}>
                                  {g} ({GRADING_SCALE[g]?.gpv.toFixed(1)} GPV)
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-neutral-500 pointer-events-none" />
                          </div>

                          {/* Clear button in projection mode */}
                          {calculatorMode === 'projection' && expectedGrade && !isConfirmed && (
                            <button
                              type="button"
                              onClick={() => {
                                setCourseExpectedGrade(activeTabKey as SemesterKey, course.code, '' as Grade);
                                triggerSaveNotification();
                              }}
                              className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-sm shrink-0"
                              title="Clear expected grade"
                            >
                              ×
                            </button>
                          )}

                          {/* Repeat Checkbox with >= 44px Touch Target */}
                          {!course.isNgpa && (
                            <label
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border min-h-[44px] shrink-0 transition select-none ${
                                course.isRepeat
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-white text-neutral-600 border-[#DCDDD7]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!course.isRepeat}
                                onChange={(e) => {
                                  setCourseRepeat(
                                    activeTabKey as SemesterKey,
                                    course.code,
                                    e.target.checked
                                  );
                                  triggerSaveNotification();
                                }}
                                className="w-4 h-4 rounded text-[#176B45] focus:ring-[#176B45]"
                              />
                              <span>Repeat</span>
                            </label>
                          )}
                        </div>
                      )}

                      {/* Contextual Repeat Explanation */}
                      {course.isRepeat && !course.isNgpa && (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold">
                              {course.isExcused
                                ? 'Medical excused: Cap lifted up to 4.0'
                                : 'Capped at Grade C (2.0 GPV)'}
                            </span>
                            <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!course.isExcused}
                                onChange={(e) => {
                                  setCourseExcused(
                                    activeTabKey as SemesterKey,
                                    course.code,
                                    e.target.checked
                                  );
                                  triggerSaveNotification();
                                }}
                                className="w-3.5 h-3.5 rounded text-[#176B45] focus:ring-[#176B45]"
                              />
                              <span>Senate Medical?</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* -------------------------------------------------- */}
            {/* DESKTOP COURSE ROWS (>= 1024px)                    */}
            {/* -------------------------------------------------- */}
            <div className="hidden lg:block bg-white border border-[#DCDDD7] rounded-2xl shadow-sm divide-y divide-neutral-100 overflow-hidden">
              {filteredCourses.map((course) => {
                const creds = Number(course.credits) || 0;
                const deptStyle = getDepartmentStyle(course.dept);
                const isConfirmed = isCourseGradeConfirmed(course);

                const projKey = `${activeTabKey}:${course.code}`;
                const projData = profile.courseProjections?.[projKey];
                const expectedGrade = projData?.predictedGrade || projData?.targetGrade || (course.isExpected ? course.grade : undefined);

                return (
                  <div
                    key={course.code}
                    className={`p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-neutral-50/80 transition-colors ${
                      course.grade === 'E' && isConfirmed ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Code, Title, Department & Stepper */}
                    <div className="min-w-0 xl:w-5/12 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-base text-neutral-900">
                          {course.code}
                        </span>
                        {course.dept && (
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}
                          >
                            {course.dept}
                          </span>
                        )}

                        {!course.isNgpa && (
                          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                setCourseCredits(
                                  activeTabKey as SemesterKey,
                                  course.code,
                                  Math.max(1, creds - 1)
                                );
                                triggerSaveNotification();
                              }}
                              title="Decrease credit"
                              className="text-neutral-500 hover:text-neutral-900 p-0.5 rounded hover:bg-neutral-200"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono font-extrabold text-sm text-neutral-900 min-w-[16px] text-center">
                              {creds}
                            </span>
                            <span className="text-xs text-neutral-500 font-semibold">Cr</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCourseCredits(
                                  activeTabKey as SemesterKey,
                                  course.code,
                                  creds + 1
                                );
                                triggerSaveNotification();
                              }}
                              title="Increase credit"
                              className="text-neutral-500 hover:text-neutral-900 p-0.5 rounded hover:bg-neutral-200"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {course.isNgpa && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300">
                            NGPA
                          </span>
                        )}

                        {course.isCompulsory ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Core
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            Elective
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-neutral-800 break-words" title={course.name}>
                        {course.name}
                      </div>
                    </div>

                    {/* Grade Chips or Locked Badge */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full scrollbar-none">
                      {calculatorMode === 'projection' && isConfirmed ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EAF2ED] border border-[#176B45]/40 text-[#103B2D]">
                          <Lock className="w-3.5 h-3.5 text-[#176B45]" />
                          <span className="text-xs font-extrabold">
                            Confirmed Official Grade: {course.grade} ({GRADING_SCALE[course.grade || '']?.gpv.toFixed(1)} GPV)
                          </span>
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-white text-[#176B45] border border-[#176B45]/20">
                            Locked
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {GRADE_OPTIONS.map((g) => {
                            const isBtnSelected =
                              calculatorMode === 'actual'
                                ? course.grade === g
                                : expectedGrade === g;

                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  if (calculatorMode === 'actual') {
                                    if (isOrientation) {
                                      setOrientationGrade(course.code, isBtnSelected ? '' : g);
                                    } else {
                                      setCourseGrade(
                                        activeTabKey as SemesterKey,
                                        course.code,
                                        isBtnSelected ? '' : g
                                      );
                                    }
                                  } else {
                                    setCourseExpectedGrade(
                                      activeTabKey as SemesterKey,
                                      course.code,
                                      isBtnSelected ? '' : g
                                    );
                                  }
                                  triggerSaveNotification();
                                }}
                                className={`h-9 w-9 sm:h-9.5 sm:w-9.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shrink-0 border ${
                                  getGradeStyle(isBtnSelected ? g : undefined)
                                }`}
                                title={`${g} (${GRADING_SCALE[g]?.gpv.toFixed(1)} GPV)`}
                              >
                                {g}
                              </button>
                            );
                          })}

                          {calculatorMode === 'projection' && expectedGrade && !isConfirmed && (
                            <button
                              type="button"
                              onClick={() => {
                                setCourseExpectedGrade(activeTabKey as SemesterKey, course.code, '' as Grade);
                                triggerSaveNotification();
                              }}
                              className="h-9 px-2 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition shrink-0"
                              title="Clear expected grade"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Repeat Checks & Remove */}
                    <div className="flex items-center justify-between xl:justify-end gap-3 text-sm shrink-0">
                      {!course.isNgpa && (
                        <div className="flex items-center gap-1.5">
                          <label
                            className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer border transition ${
                              course.isRepeat
                                ? 'bg-amber-100 text-amber-900 border-amber-400'
                                : 'bg-white hover:bg-neutral-100 text-neutral-500 border-neutral-300'
                            }`}
                            title="Repeat attempt (Grade C 2.0 cap applies unless medical excused)"
                          >
                            <input
                              type="checkbox"
                              checked={!!course.isRepeat}
                              onChange={(e) => {
                                setCourseRepeat(
                                  activeTabKey as SemesterKey,
                                  course.code,
                                  e.target.checked
                                );
                                triggerSaveNotification();
                              }}
                              className="hidden"
                            />
                            <span>{course.isRepeat ? 'Repeat ✓' : 'Rep?'}</span>
                          </label>

                          {course.isRepeat && (
                            <label
                              className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer border transition ${
                                course.isExcused
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                  : 'bg-white text-neutral-400 border-neutral-300'
                              }`}
                              title="Senate medical excuse lifts repeat cap up to 4.0 GPV"
                            >
                              <input
                                type="checkbox"
                                checked={!!course.isExcused}
                                onChange={(e) => {
                                  setCourseExcused(
                                    activeTabKey as SemesterKey,
                                    course.code,
                                    e.target.checked
                                  );
                                  triggerSaveNotification();
                                }}
                                className="hidden"
                              />
                              <span>{course.isExcused ? 'Med✓' : 'Med?'}</span>
                            </label>
                          )}
                        </div>
                      )}

                      {!course.isCompulsory && !course.isNgpa && !isOrientation && (
                        <button
                          type="button"
                          onClick={() => {
                            removeCourseFromSemester(activeTabKey as SemesterKey, course.code);
                            triggerSaveNotification();
                          }}
                          className="text-neutral-400 hover:text-rose-600 transition p-1 rounded"
                          title="Remove elective course"
                          aria-label="Remove elective course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. EXPANDABLE PLANNING TOOLS (Section 21)                */}
      {/* Target CGPA, Quick Assumptions, Scenarios, Leverage      */}
      {/* ======================================================== */}
      <PlanningTools />

      {/* ======================================================== */}
      {/* CURRENT SEMESTER SWITCHER MODAL                          */}
      {/* ======================================================== */}
      {showCurrentSemSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-[#DCDDD7] shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-[#242824]">
                Current Academic Semester
              </h3>
              <p className="text-xs text-[#626962] font-medium mt-1">
                Select the semester you are currently studying. Earlier semesters are treated as completed, and upcoming examinations in this semester are projected.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ALL_SEMESTER_KEYS.map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => {
                    setCurrentSemester(sem);
                    setShowCurrentSemSelector(false);
                  }}
                  className={`p-3 rounded-xl text-center text-xs font-extrabold border transition ${
                    profile.currentSemester === sem
                      ? 'bg-[#103B2D] text-white border-[#103B2D] shadow-sm'
                      : 'bg-[#F8F8F4] text-[#242824] border-[#DCDDD7] hover:bg-neutral-100'
                  }`}
                >
                  Semester {sem}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCurrentSemSelector(false)}
              className="w-full py-2.5 rounded-xl border border-[#DCDDD7] text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
