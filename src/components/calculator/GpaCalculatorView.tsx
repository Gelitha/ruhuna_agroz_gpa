// University of Ruhuna - Faculty of Agriculture
// Ruhuna Agri GPA — Simplified Unified GPA Calculator & Academic Workspace
// Core principle: One calculator. One course list. One grade selector. Two independent checkboxes: Rep and Proj.

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Sliders,
  Minus,
  PlusCircle,
  ChevronDown,
  Check,
  Sparkles,
  Search,
  RotateCcw,
  MoreVertical,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  AlertCircle
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
import {
  isCourseGradeConfirmed,
  calculateEffectiveGpvForGrade,
  ALL_SEMESTER_KEYS
} from '../../utils/projectionCalculations';
import { AppLogo } from '../common/AppLogo';
import { PlanningTools } from './PlanningTools';
import { HelpTooltip } from '../common/HelpTooltip';
import { HorizontalGradeSelector } from '../common/HorizontalGradeSelector';
import { getCourseRowVisualState } from '../../utils/courseRowStyles';

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
  if (creditsAttempted === 0) {
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
    saveCurrentState,
    setCourseGrade,
    setCourseExpected,
    setCourseCredits,
    setCourseRepeat,
    setCourseExcused,
    addCourseToSemester,
    removeCourseFromSemester,
    setOrientationGrade,
    bulkSetSemesterGrades,
    clearSemesterGrades,
    markUnresolvedAsProjected,
    clearSemesterProjections,
    setCourseGradeAndStatus,
    setActiveTab,
    dismissCalculatorTips,
    markSemesterReviewed
  } = useGradeStore();

  const profile = getActiveProfile();
  const stats = getOverallStats();
  const proj = getAcademicProjections();
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  // Active Tab (defaults to current academic semester if unset)
  const [activeTabKey, setActiveTabKey] = useState<SemesterKey | 'ORIENTATION'>(() => {
    if (selectedSemesterForCalculator && selectedSemesterForCalculator !== 'ALL') {
      return selectedSemesterForCalculator;
    }
    return profile.currentSemester || '1-1';
  });

  // Synchronize viewed semester when selectedSemesterForCalculator changes
  useEffect(() => {
    if (selectedSemesterForCalculator && selectedSemesterForCalculator !== 'ALL') {
      setActiveTabKey(selectedSemesterForCalculator);
      if (markSemesterReviewed) {
        markSemesterReviewed(selectedSemesterForCalculator);
      }
    }
  }, [selectedSemesterForCalculator, markSemesterReviewed]);

  // Permanent Chronological Semester Sequence
  const CHRONOLOGICAL_SEMESTERS: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const currentChronoIdx = CHRONOLOGICAL_SEMESTERS.indexOf(activeTabKey as SemesterKey);
  const prevSemester = currentChronoIdx > 0 ? CHRONOLOGICAL_SEMESTERS[currentChronoIdx - 1] : activeTabKey === 'ORIENTATION' ? '4-2' : null;
  const nextSemester = currentChronoIdx >= 0 && currentChronoIdx < CHRONOLOGICAL_SEMESTERS.length - 1 ? CHRONOLOGICAL_SEMESTERS[currentChronoIdx + 1] : null;

  const courseListTopRef = useRef<HTMLDivElement | null>(null);

  const handleNavigateSemester = (destSem: SemesterKey | 'ORIENTATION') => {
    // Ensure entered grades are saved before presenting successful navigation
    const saveSuccess = saveCurrentState ? saveCurrentState() : true;
    if (!saveSuccess) {
      setSaveStatus('Save failed: Storage unavailable');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus(null);
      }, 4000);
      return;
    }

    setSaveStatus('Saved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus(null);
    }, 2000);

    // Update only the currently viewed calculator semester (preserves profile.currentSemester)
    setActiveTabKey(destSem);
    if (destSem !== 'ORIENTATION') {
      setSelectedSemesterForCalculator(destSem);
      if (markSemesterReviewed) {
        markSemesterReviewed(destSem);
      }
    }

    // Scroll smoothly to the beginning of the new semester's course list
    if (courseListTopRef.current) {
      courseListTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Modal for changing student's current academic semester
  const [showCurrentSemSelector, setShowCurrentSemSelector] = useState(false);

  // Auto-save feedback toast
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSaveNotification = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    const success = saveCurrentState ? saveCurrentState() : true;
    setSaveStatus(success ? 'Saved' : 'Save failed');
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus(null);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Undo accidental grade changes
  interface UndoRecord {
    profileId: string;
    semKey: SemesterKey;
    courseCode: string;
    courseName?: string;
    previousGrade: Grade;
    previousIsExpected: boolean;
    previousIsRepeat?: boolean;
    previousIsExcused?: boolean;
    newGrade: Grade;
  }
  const [undoRecord, setUndoRecord] = useState<UndoRecord | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Invalidate undo records and modals on profile change
  useEffect(() => {
    setUndoRecord(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setCourseModal(null);
  }, [profile.id]);

  // Sticky Summary Observer on Mobile
  const [isStickySummaryVisible, setIsStickySummaryVisible] = useState(false);
  const summaryTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = summaryTopRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickySummaryVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Course Options Modal (3-dot options menu)
  interface CourseModalState {
    type: 'menu' | 'credits' | 'info' | 'confirm_clear' | 'confirm_delete';
    course: Course;
    semKey: SemesterKey;
  }
  const [courseModal, setCourseModal] = useState<CourseModalState | null>(null);

  // Handle single-tap grade change with Undo toast
  const handleGradeChangeWithUndo = (semKey: SemesterKey, course: Course, newGrade: Grade) => {
    if (course.grade === newGrade) return;

    const prev: UndoRecord = {
      profileId: profile.id,
      semKey,
      courseCode: course.code,
      courseName: course.name,
      previousGrade: course.grade || '',
      previousIsExpected: !!course.isExpected,
      previousIsRepeat: !!course.isRepeat,
      previousIsExcused: !!course.isExcused,
      newGrade
    };
    setUndoRecord(prev);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoRecord(null);
    }, 4500);

    if (isOrientation) {
      setOrientationGrade(course.code, newGrade);
    } else {
      setCourseGrade(semKey, course.code, newGrade);
    }
    triggerSaveNotification();
  };

  const handleUndo = () => {
    if (!undoRecord || undoRecord.profileId !== profile.id) return;
    const { semKey, courseCode, previousGrade, previousIsExpected, previousIsRepeat, previousIsExcused } = undoRecord;
    if (isOrientation) {
      setOrientationGrade(courseCode, previousGrade);
    } else {
      setCourseGradeAndStatus(semKey, courseCode, previousGrade, previousIsExpected);
      if (previousIsRepeat !== undefined) {
        setCourseRepeat(semKey, courseCode, previousIsRepeat);
      }
      if (previousIsExcused !== undefined) {
        setCourseExcused(semKey, courseCode, previousIsExcused);
      }
    }
    setUndoRecord(null);
    triggerSaveNotification();
  };

  // Synchronize viewed semester when switching student profiles
  const prevProfileIdRef = useRef<string>(profile.id);
  useEffect(() => {
    if (prevProfileIdRef.current !== profile.id) {
      prevProfileIdRef.current = profile.id;
      if (profile.currentSemester) {
        setActiveTabKey(profile.currentSemester);
      }
    }
  }, [profile.id, profile.currentSemester]);

  // Search & Filter
  const [courseSearch, setCourseSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ungraded' | 'repeat' | 'projected'>('all');

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

  // Semester Completion Indicator Counts (Mutually Exclusive: Confirmed, Projected, Missing)
  const completionCounts = useMemo(() => {
    const courses = isOrientation ? profile.orientationCourses || [] : semCourses;
    let confirmed = 0;
    let projected = 0;
    let missing = 0;

    for (const c of courses) {
      if (c.isExpected && c.grade && GRADING_SCALE[c.grade]) {
        projected++;
      } else if (isCourseGradeConfirmed(c) && !c.isExpected) {
        confirmed++;
      } else {
        missing++;
      }
    }

    return {
      total: courses.length,
      confirmed,
      projected,
      missing
    };
  }, [semCourses, profile.orientationCourses, isOrientation]);

  // Semester Stats (Official confirmed results)
  const semStats = useMemo(() => {
    if (isOrientation) return null;
    return getSemesterStats(activeTabKey as SemesterKey);
  }, [activeTabKey, isOrientation, getSemesterStats, profile]);

  // Semester Projection Summary
  const semProjection = useMemo(() => {
    if (isOrientation) return null;
    return proj.semesterSummaries[activeTabKey as SemesterKey];
  }, [activeTabKey, isOrientation, proj]);

  // Check whether any projected grades or assumptions exist across the student's profile
  const hasAnyProjectedGrades = useMemo(() => {
    const hasExpectedCourse = ALL_SEMESTER_KEYS.some(sk =>
      (profile.semesters[sk] || []).some(c => c.isExpected && c.grade)
    );
    const hasCustomAssumptions = !!profile.projectionQuickAssumptions;
    return hasExpectedCourse || hasCustomAssumptions;
  }, [profile]);

  const hasFutureExpectedCourses = useMemo(() => {
    return !!proj.hasFutureExpected;
  }, [proj.hasFutureExpected]);

  const displayedProjectedCgpa = useMemo(() => {
    if (hasFutureExpectedCourses && proj.overallProjectedCgpa !== undefined) {
      return proj.overallProjectedCgpa;
    }
    return proj.combinedTotalCredits > 0 ? proj.combinedProjectedCgpa : (stats.projectedCgpa ?? proj.actualCgpa);
  }, [hasFutureExpectedCourses, proj.overallProjectedCgpa, proj.combinedTotalCredits, proj.combinedProjectedCgpa, stats.projectedCgpa, proj.actualCgpa]);

  const displayedProjectedCredits = useMemo(() => {
    if (hasFutureExpectedCourses && proj.overallProjectedCredits !== undefined) {
      return proj.overallProjectedCredits;
    }
    return Math.max(0, proj.combinedTotalCredits - proj.actualGpaCredits);
  }, [hasFutureExpectedCourses, proj.overallProjectedCredits, proj.combinedTotalCredits, proj.actualGpaCredits]);

  const displayedDeltaCgpa = useMemo(() => {
    const baseActual = proj.actualGpaCredits > 0 ? proj.actualCgpa : 0;
    return Number((displayedProjectedCgpa - baseActual).toFixed(2));
  }, [displayedProjectedCgpa, proj.actualGpaCredits, proj.actualCgpa]);

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
        return !course.grade;
      }
      if (filterType === 'repeat') {
        return !!course.isRepeat;
      }
      if (filterType === 'projected') {
        return !!course.isExpected;
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
  const getGradeStyle = (grade: Grade | undefined, isExpected = false) => {
    if (!grade) {
      return 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300 hover:border-neutral-400';
    }
    // Projected style uses dashed ring or emerald styling with Proj indicator
    if (isExpected) {
      return 'bg-gradient-to-br from-emerald-700 to-teal-800 text-white font-black shadow-md border-emerald-500 ring-2 ring-emerald-300 ring-offset-1';
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

  // Status for each semester tab
  const getSemesterStatusInfo = (semKey: SemesterKey | 'ORIENTATION') => {
    if (semKey === 'ORIENTATION') {
      return { text: 'Non-GPA', badgeClass: 'text-neutral-500' };
    }
    const semIndex = ALL_SEMESTER_KEYS.indexOf(semKey as SemesterKey);
    const currentIndex = ALL_SEMESTER_KEYS.indexOf(profile.currentSemester || '1-1');
    const summary = proj.semesterSummaries[semKey as SemesterKey];

    if (semKey === profile.currentSemester) {
      if (summary && summary.pendingResultsCount > 0) {
        return { text: `${summary.pendingResultsCount} pending`, badgeClass: 'bg-amber-100 text-amber-900 font-bold' };
      }
      return { text: 'Current', badgeClass: 'bg-emerald-100 text-[#176B45] font-bold' };
    }
    if (semIndex < currentIndex) {
      if (summary && summary.pendingResultsCount > 0) {
        return { text: `${summary.pendingResultsCount} pending`, badgeClass: 'bg-amber-100 text-amber-900 font-bold' };
      }
      if (summary && summary.confirmedGpaCredits > 0) {
        return { text: 'Complete', badgeClass: 'bg-neutral-100 text-neutral-600 font-medium' };
      }
      return { text: 'Awaiting', badgeClass: 'bg-amber-50 text-amber-800' };
    }
    return { text: 'Not started', badgeClass: 'text-neutral-400' };
  };

  return (
    <div className="max-w-[1440px] mx-auto pb-16 space-y-4 sm:space-y-5">
      {/* Compact Sticky Summary on Mobile (< 1024px) when top summary scrolls out of view - Layout-aware dynamic offset */}
      {isStickySummaryVisible && (
        <div
          style={{ top: 'var(--header-height, 58px)' }}
          className="block lg:hidden fixed left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#DCDDD7] shadow-md px-4 py-2.5 animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto text-xs">
            <div className="flex items-center gap-3">
              {/* Actual CGPA (Dominant Green) */}
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Actual:</span>
                <span className="font-sans font-tabular font-black text-sm text-[#103B2D]">
                  {hasAnyConfirmedGrades ? proj.actualCgpa.toFixed(2) : '—'}
                </span>
              </div>

              {/* Projected CGPA (Blue, if active) */}
              {hasAnyProjectedGrades && (
                <div className="flex items-baseline gap-1 border-l border-neutral-300 pl-3">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Proj:</span>
                  <span className="font-sans font-tabular font-black text-sm text-blue-700">
                    {proj.combinedTotalCredits > 0 || displayedProjectedCredits > 0 ? displayedProjectedCgpa.toFixed(2) : '—'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-bold text-neutral-700">
              <span className="px-2 py-0.5 rounded-lg bg-neutral-100 border border-neutral-200">
                Sem {activeTabKey}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. MOBILE COMPACT SUMMARY (<= 1023px)                    */}
      {/* ======================================================== */}
      <div ref={summaryTopRef} className="block lg:hidden bg-white border border-[#DCDDD7] rounded-2xl p-4 shadow-subtle space-y-3">
        {/* Top Header: Degree & Profile Name */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EDF1EC]">
          <div className="flex items-center gap-2 min-w-0">
            <AppLogo size="sm" />
            <div className="min-w-0">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {profile.degree} (Hons)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-neutral-600 truncate block max-w-[160px]">
              {profile.name}
            </span>
          </div>
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {/* Metric 1: Actual CGPA */}
          <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-[#626962]">
                Actual CGPA
              </span>
              <HelpTooltip id="T08" size="xs" />
            </div>
            <div className="font-sans font-tabular font-black text-xl text-[#242824] leading-tight mt-0.5">
              {hasAnyConfirmedGrades ? proj.actualCgpa.toFixed(2) : '—'}
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#626962] font-medium leading-none mt-1">
              <span>{proj.actualGpaCredits} Cr confirmed</span>
              <HelpTooltip id="T12" size="xs" />
            </div>
          </div>

          {/* Metric 2: Projected CGPA (or Degree Credits when no projections exist) */}
          {hasAnyProjectedGrades ? (
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs font-medium text-emerald-800">
                  Projected CGPA
                </span>
                <HelpTooltip id="T09" size="xs" />
                {proj.isExpectedIncomplete && (
                  <span className="inline-flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <HelpTooltip id="T14" size="xs" />
                  </span>
                )}
              </div>
              <div className="font-sans font-tabular font-black text-xl text-[#176B45] leading-tight mt-0.5">
                {proj.combinedTotalCredits > 0 || displayedProjectedCredits > 0 ? displayedProjectedCgpa.toFixed(2) : '—'}
              </div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-700 font-medium leading-none mt-1">
                <span>{hasFutureExpectedCourses ? 'Incl. future' : `After Sem ${proj.currentSemester}`} {displayedDeltaCgpa !== 0 ? `(${displayedDeltaCgpa > 0 ? `+${displayedDeltaCgpa.toFixed(2)}` : displayedDeltaCgpa.toFixed(2)})` : ''}</span>
                <HelpTooltip id="T13" size="xs" />
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] flex flex-col justify-center">
              <span className="text-xs font-medium text-[#626962]">
                Degree Credits
              </span>
              <div className="font-sans font-tabular font-black text-xl text-[#242824] leading-tight mt-0.5">
                {stats.totalGpaCreditsEarned}
              </div>
              <span className="text-[11px] text-[#626962] font-medium leading-none mt-1">
                of {stats.totalRequiredCredits} required
              </span>
            </div>
          )}

          {/* Metric 3: Active Semester Actual SGPA */}
          <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-[#626962]">
                Sem {activeTabKey} SGPA
              </span>
              <HelpTooltip id="T10" size="xs" />
            </div>
            <div className="font-sans font-tabular font-black text-xl text-[#242824] leading-tight mt-0.5">
              {semStats && semStats.realCreditsAttempted > 0 ? semStats.realSgpa.toFixed(2) : '—'}
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#626962] font-medium leading-none mt-1">
              <span>
                {semProjection && semProjection.predictedGpaCredits > 0
                  ? `Proj: ${semProjection.projectedSgpa.toFixed(2)} (${semProjection.predictedGpaCredits} Cr)`
                  : `${semStats?.realCreditsAttempted || 0} Cr finalized`}
              </span>
              <HelpTooltip id={semProjection && semProjection.predictedGpaCredits > 0 ? 'T11' : 'T12'} size="xs" />
            </div>
          </div>

          {/* Metric 4: Current Academic Semester Switcher */}
          <div
            onClick={() => setShowCurrentSemSelector(true)}
            className="p-2.5 rounded-xl bg-[#F8F8F4] hover:bg-neutral-100 border border-[#EDF1EC] flex flex-col justify-center cursor-pointer transition"
          >
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-[#626962]">
                Current semester
              </span>
              <HelpTooltip id="T15" size="xs" />
            </div>
            <div className="font-sans font-tabular font-black text-xl text-[#176B45] leading-tight mt-0.5 flex items-center justify-center gap-1">
              <span>{profile.currentSemester}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <span className="text-[11px] text-[#176B45] font-semibold leading-none mt-1">
              Tap to change
            </span>
          </div>
        </div>

        {/* Guidance / Status Bar */}
        <div className="p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border bg-neutral-50/80 border-[#EDF1EC]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[#626962]">
              {hasAnyProjectedGrades
                ? 'Projected grades are included in projected GPA and excluded from official transcripts.'
                : 'Official confirmed grades. Check Projected to test expected examination grades.'}
            </span>
            <HelpTooltip id="T21" size="xs" />
          </div>
          {saveStatus && (
            <span className={`text-[11px] font-bold shrink-0 flex items-center gap-1 ${saveStatus === 'Saved' ? 'text-[#176B45]' : 'text-rose-600'}`}>
              {saveStatus === 'Saved' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {saveStatus}
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP COCKPIT HERO (>= 1024px)                      */}
      {/* ======================================================== */}
      <div className="hidden lg:block bg-gradient-to-br from-[#103B2D] via-[#174E38] to-[#123324] text-white rounded-3xl p-6 lg:p-7 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-6">
          {/* LEFT: Branding, Degree, Profile, CGPA */}
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
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/20 flex items-center gap-1.5 transition"
                  title="Change your current academic semester"
                >
                  <span>Current: Sem {profile.currentSemester}</span>
                  <HelpTooltip id="T15" size="xs" />
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                </button>
              </div>

              {/* Big Metrics Display: ACTUAL FIRST, PROJECTED SEPARATE */}
              <div className="flex items-baseline gap-6 flex-wrap">
                {/* Metric 1: Actual CGPA (Primary Source of Truth) */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-200/90 block">
                      Actual CGPA
                    </span>
                    <HelpTooltip id="T08" size="xs" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl lg:text-5xl font-black font-sans tracking-tight text-white font-tabular">
                      {hasAnyConfirmedGrades ? proj.actualCgpa.toFixed(2) : '—'}
                    </span>
                    <span className="text-lg font-bold text-emerald-300/80">/ 4.00</span>
                  </div>
                  <div className="text-xs text-emerald-300/90 font-bold mt-0.5">
                    {standingInfo.title} • {proj.actualGpaCredits} Cr Confirmed
                  </div>
                </div>

                {/* Metric 2: Projected CGPA (Displayed Separately When Active) */}
                {hasAnyProjectedGrades && (
                  <div className="border-l border-white/20 pl-5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs uppercase font-bold tracking-wider text-cyan-200 block">
                        Projected CGPA
                      </span>
                      <HelpTooltip id="T09" size="xs" />
                      <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-900/50 px-1.5 py-0.2 rounded border border-cyan-400/30">
                        Estimate
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl lg:text-4xl font-black font-sans tracking-tight text-cyan-100 font-tabular">
                        {proj.combinedTotalCredits > 0 || displayedProjectedCredits > 0 ? displayedProjectedCgpa.toFixed(2) : '—'}
                      </span>
                      {displayedDeltaCgpa !== 0 && (
                        <span className={`text-xs font-bold font-mono ${displayedDeltaCgpa > 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                          ({displayedDeltaCgpa > 0 ? `+${displayedDeltaCgpa.toFixed(2)}` : displayedDeltaCgpa.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-200/80 font-medium">
                      {hasFutureExpectedCourses ? 'All semesters incl. future' : `After Sem ${proj.currentSemester}`} • {displayedProjectedCredits} Cr projected
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Active Semester SGPA & Tools */}
          <div className="flex items-center gap-6 shrink-0 border-l border-white/15 pl-6">
            {/* Active Semester Metric (Actual SGPA Primary) */}
            <div className="text-right space-y-0.5">
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/80 block">
                  Sem {activeTabKey} Actual SGPA
                </span>
                <HelpTooltip id="T10" size="xs" />
              </div>
              <div className="font-sans text-3xl font-black text-white font-tabular">
                {semStats && semStats.realCreditsAttempted > 0 ? semStats.realSgpa.toFixed(2) : '—'}
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-emerald-200/80 font-medium">
                <span>{semStats?.realCreditsAttempted || 0} Credits finalized</span>
                <HelpTooltip id="T12" size="xs" />
              </div>

              {/* Projected SGPA Sub-Indicator (When Active) */}
              {semProjection && semProjection.predictedGpaCredits > 0 && (
                <div className="pt-1 mt-0.5 border-t border-white/10 flex items-center justify-end gap-1.5 text-xs text-cyan-200 font-semibold">
                  <span>Projected: {semProjection.projectedSgpa.toFixed(2)}</span>
                  <span className="text-[10px] text-cyan-300">({semProjection.predictedGpaCredits} Cr est.)</span>
                  <HelpTooltip id="T11" size="xs" />
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Transcript</span>
                <HelpTooltip id="T33" size="xs" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Forecast</span>
                <HelpTooltip id="T25" size="xs" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2.5 FIRST-USE CONTEXTUAL GRADE-ENTRY TIPS                */}
      {/* ======================================================== */}
      {!profile.guidedSetup?.calculatorTipsDismissed && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Grade-Entry Tips</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-emerald-900 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span><strong>Tap a grade</strong> to select it</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span><strong>Tap again</strong> to clear a grade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span><strong>Swipe horizontally</strong> to access all grades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Select <strong>Repeat</strong> for repeat courses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Select <strong>Projected</strong> for expected results</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Use <strong>course options (⋯)</strong> for details</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissCalculatorTips}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold shrink-0 min-h-[44px] flex items-center justify-center gap-1 transition touch-manipulation self-start sm:self-center"
            aria-label="Dismiss quick tips"
          >
            <span>Got it</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SEMESTER NAVIGATION & FAST ACTIONS                    */}
      {/* ======================================================== */}
      <div ref={courseListTopRef} className="space-y-3">
        {/* Mobile Semester Dropdown */}
        <div className="block lg:hidden bg-white border border-[#DCDDD7] rounded-2xl p-3 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#626962] uppercase tracking-wider">
              Select Semester
            </span>
            <span className="text-xs font-semibold text-[#176B45]">
              {semCourses.length} courses
            </span>
          </div>

          <div className="relative">
            <select
              value={activeTabKey}
              onChange={(e) => {
                const sk = e.target.value as SemesterKey | 'ORIENTATION';
                setActiveTabKey(sk);
                if (sk !== 'ORIENTATION') {
                  setSelectedSemesterForCalculator(sk);
                }
              }}
              className="w-full appearance-none bg-[#F8F8F4] hover:bg-neutral-100 border border-[#DCDDD7] rounded-xl px-3.5 py-2.5 pr-10 text-sm font-bold text-[#242824] min-h-[44px] cursor-pointer focus:outline-none focus:border-[#176B45]"
            >
              {SEMESTERS.map((sem) => {
                const status = getSemesterStatusInfo(sem.key);
                const summary = sem.key !== 'ORIENTATION' ? proj.semesterSummaries[sem.key] : null;
                const sgpaText = summary && summary.confirmedGpaCredits > 0 ? ` [SGPA ${summary.actualSgpa.toFixed(2)}]` : '';
                return (
                  <option key={sem.key} value={sem.key}>
                    {sem.label} — {status.text}{sgpaText}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-neutral-500 pointer-events-none" />
          </div>

          {/* Semester Completion Indicator on Mobile */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 flex-wrap pt-0.5">
            <span className="font-bold text-[#242824]">{completionCounts.total} courses</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {completionCounts.confirmed} confirmed
            </span>
            <span>•</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              {completionCounts.projected} projected
            </span>
            <span>•</span>
            <span className="text-neutral-500 font-medium bg-neutral-100 px-1.5 py-0.5 rounded">
              {completionCounts.missing} missing
            </span>
          </div>

          {/* Quick Actions on Mobile */}
          {!isOrientation && (
            <div className="flex items-center gap-2 pt-1">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'clear') {
                    clearSemesterGrades(activeTabKey as SemesterKey);
                  } else if (val === 'mark_proj') {
                    markUnresolvedAsProjected(activeTabKey as SemesterKey);
                  } else if (val === 'clear_proj') {
                    clearSemesterProjections(activeTabKey as SemesterKey);
                  } else if (val) {
                    bulkSetSemesterGrades(activeTabKey as SemesterKey, val as Grade);
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
                <option value="mark_proj">Mark unresolved as projected</option>
                <option value="clear_proj">Clear projections</option>
                <option value="clear">Clear all grades</option>
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
              const status = getSemesterStatusInfo(sem.key);
              const summary = sem.key !== 'ORIENTATION' ? proj.semesterSummaries[sem.key] : null;
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
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#103B2D] text-white shadow-md'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <span>{sem.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : status.badgeClass
                    }`}
                  >
                    {status.text}
                  </span>
                  {sgpa && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded font-sans font-tabular font-bold ${
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

          {/* Desktop Fast Actions Dropdown */}
          {!isOrientation && (
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'clear') {
                  clearSemesterGrades(activeTabKey as SemesterKey);
                } else if (val === 'mark_proj') {
                  markUnresolvedAsProjected(activeTabKey as SemesterKey);
                } else if (val === 'clear_proj') {
                  clearSemesterProjections(activeTabKey as SemesterKey);
                } else if (val) {
                  bulkSetSemesterGrades(activeTabKey as SemesterKey, val as Grade);
                }
                e.target.value = '';
                triggerSaveNotification();
              }}
              defaultValue=""
              className="text-xs sm:text-sm bg-neutral-50 hover:bg-neutral-100 border border-[#DCDDD7] rounded-xl px-3 py-2 text-neutral-800 font-semibold cursor-pointer shrink-0 focus:outline-none focus:border-[#176B45] transition"
              title="Batch actions for this semester"
            >
              <option value="" disabled>Fast Fill...</option>
              <option value="A">All A (4.0)</option>
              <option value="A-">All A- (3.7)</option>
              <option value="B+">All B+ (3.3)</option>
              <option value="B">All B (3.0)</option>
              <option value="C">All C (2.0)</option>
              <option value="mark_proj">Mark unresolved as projected</option>
              <option value="clear_proj">Clear projections</option>
              <option value="clear">Clear all grades</option>
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
              onClick={() => setFilterType('projected')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'projected' ? 'bg-[#103B2D] text-white font-bold' : 'hover:text-neutral-900'
              }`}
            >
              Projected
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

      {/* Helper Guidance Banner */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-900 font-medium">
        <div className="flex items-center gap-2">
          <span>
            Tick <strong className="font-bold text-[#176B45]">Projected</strong> for expected grades that have not been officially released. Untick <strong className="font-bold text-[#176B45]">Projected</strong> when you receive and enter your official result.
          </span>
          <HelpTooltip id="T21" size="xs" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. COURSE GRADE ENTRY (Desktop & Mobile Adaptive)        */}
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
                const isConfirmedOfficial = isConfirmed && !course.isExpected;
                const visual = getCourseRowVisualState(course.isRepeat, course.isExpected);
                const effectiveGpv = course.grade ? calculateEffectiveGpvForGrade(course.grade, course.isRepeat, course.isExcused) : null;

                return (
                  <div
                    key={course.code}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-subtle ${visual.className}`}
                  >
                    {/* Top Row: Code, Dept, Core/Elective, Credits & 3-Dot Options Button */}
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
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span>Core</span>
                            <HelpTooltip id="T30" size="xs" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            <span>Elective</span>
                            <HelpTooltip id="T31" size="xs" />
                          </span>
                        )}
                        {course.isNgpa && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            <span>NGPA</span>
                            <HelpTooltip id="T06" size="xs" />
                          </span>
                        )}
                        {!course.isNgpa && (
                          <span className="font-mono font-bold text-xs text-[#242824] bg-[#F8F8F4] border border-[#DCDDD7] rounded-lg px-2 py-0.5">
                            {creds} Cr
                          </span>
                        )}
                      </div>

                      {/* 3-Dot Options Button */}
                      <button
                        type="button"
                        onClick={() => setCourseModal({ type: 'menu', course, semKey: activeTabKey as SemesterKey })}
                        aria-label={`Options for ${course.code}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition min-w-[32px] min-h-[32px] shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Middle Row: Full Course Name & Selected Grade Badge */}
                    <div className="py-2.5 flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-[#242824] leading-snug break-words flex-1">
                        {course.name}
                      </div>
                      {course.grade && (
                        <div className="shrink-0 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs border ${
                            course.isExpected
                              ? 'bg-blue-50 text-blue-900 border-blue-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}>
                            <span>{course.grade}</span>
                            <span className="text-[10px] font-bold opacity-80 font-sans font-tabular">
                              ({effectiveGpv !== null ? effectiveGpv.toFixed(1) : ''} GPV)
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Checkboxes Row: Repeat and Projected (Full Words, >= 44px Touch Targets) */}
                    {!course.isNgpa && (
                      <div className="pt-2 border-t border-[#EDF1EC] space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer border min-h-[44px] transition select-none ${
                              course.isRepeat
                                ? 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold'
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
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>Repeat</span>
                          </label>

                          <label
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border min-h-[44px] transition select-none ${
                              course.isExpected
                                ? 'bg-blue-50 text-blue-900 border-blue-400 ring-1 ring-blue-300 font-extrabold'
                                : 'bg-white text-neutral-600 border-[#DCDDD7]'
                            } ${isConfirmedOfficial ? 'opacity-60 cursor-not-allowed bg-neutral-100 text-neutral-400' : 'cursor-pointer'}`}
                            title={isConfirmedOfficial ? "This grade is officially confirmed and protected. Use Planning Tools > What-If to explore hypothetical changes." : "Projected / expected grade"}
                          >
                            <input
                              type="checkbox"
                              checked={!!course.isExpected}
                              disabled={isConfirmedOfficial}
                              onChange={(e) => {
                                setCourseExpected(
                                  activeTabKey as SemesterKey,
                                  course.code,
                                  e.target.checked
                                );
                                triggerSaveNotification();
                              }}
                              className="w-4 h-4 rounded text-[#176B45] focus:ring-[#176B45]"
                            />
                            <span>Projected</span>
                          </label>
                        </div>

                        {/* Contextual Repeat Explanation */}
                        {course.isRepeat && (
                          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold flex items-center gap-1">
                                <span>
                                  {course.isExcused
                                    ? 'Medical excused: Cap lifted up to 4.0'
                                    : 'Capped at Grade C (2.0 GPV)'}
                                </span>
                                <HelpTooltip id="T29" size="xs" />
                              </span>
                              <div className="flex items-center gap-1.5">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
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
                                <HelpTooltip id="T03" size="xs" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: Horizontal Grade Selector (Single-tap, Min 44px Touch Targets, Auto Reveal, Edge Fades) */}
                    <div className="pt-2.5 mt-2 border-t border-[#EDF1EC]">
                      <HorizontalGradeSelector
                        value={course.grade || ''}
                        onChange={(newGrade) => handleGradeChangeWithUndo(activeTabKey as SemesterKey, course, newGrade)}
                        isProjected={!!course.isExpected}
                        isRepeat={!!course.isRepeat}
                        isExcused={!!course.isExcused}
                        isConfirmedOfficial={isConfirmedOfficial}
                        ariaLabel={`Grade for ${course.code}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* -------------------------------------------------- */}
            {/* DESKTOP COURSE ROWS (>= 1024px)                    */}
            {/* -------------------------------------------------- */}
            <div className="hidden lg:block space-y-2">
              {/* Desktop Column Header Bar with Shared Sinhala Tooltips */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#F8F8F4] border border-[#DCDDD7] rounded-2xl text-xs font-bold text-neutral-700 uppercase tracking-wider items-center shadow-2xs">
                <div className="col-span-5 flex items-center gap-1.5">
                  <span>Course Details &amp; Credits</span>
                  <HelpTooltip id="T05" label="Credits" size="xs" />
                </div>
                <div className="col-span-4 flex items-center justify-center gap-1.5">
                  <span>Grade Selection</span>
                  <HelpTooltip id="T04" label="Grade" size="xs" />
                </div>
                <div className="col-span-3 flex items-center justify-end gap-4">
                  <div className="flex items-center gap-1">
                    <span>Repeat</span>
                    <HelpTooltip id="T01" label="Repeat" size="xs" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Projected</span>
                    <HelpTooltip id="T02" label="Projected" size="xs" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#DCDDD7] rounded-2xl shadow-sm divide-y divide-neutral-100 overflow-hidden">
                {filteredCourses.map((course) => {
                  const creds = Number(course.credits) || 0;
                  const deptStyle = getDepartmentStyle(course.dept);
                  const isConfirmed = isCourseGradeConfirmed(course);
                  const isConfirmedOfficial = isConfirmed && !course.isExpected;
                  const visual = getCourseRowVisualState(course.isRepeat, course.isExpected);

                  return (
                    <div
                      key={course.code}
                      className={`p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors ${visual.className}`}
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
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300">
                              <span>NGPA</span>
                              <HelpTooltip id="T06" size="xs" />
                            </span>
                          )}

                          {course.isCompulsory ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <span>Core</span>
                              <HelpTooltip id="T30" size="xs" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              <span>Elective</span>
                              <HelpTooltip id="T31" size="xs" />
                            </span>
                          )}

                          {course.isExpected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <span>Projected</span>
                              <HelpTooltip id="T02" size="xs" />
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-semibold text-neutral-800 break-words" title={course.name}>
                          {course.name}
                        </div>
                      </div>

                      {/* Grade Chips */}
                      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 max-w-full scrollbar-none">
                        {GRADE_OPTIONS.map((g) => {
                          const isBtnSelected = course.grade === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                const targetGrade = isBtnSelected ? '' : g;
                                handleGradeChangeWithUndo(activeTabKey as SemesterKey, course, targetGrade);
                              }}
                              className={`h-9 w-9 sm:h-9.5 sm:w-9.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shrink-0 border ${
                                getGradeStyle(isBtnSelected ? g : undefined, isBtnSelected && course.isExpected)
                              }`}
                              title={`${g} (${GRADING_SCALE[g]?.gpv.toFixed(1)} GPV)${course.isExpected ? ' • Projected' : ''}`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: Repeat Checkbox, Projected Checkbox & Remove */}
                      <div className="flex items-center justify-between xl:justify-end gap-2.5 text-sm shrink-0">
                        {!course.isNgpa && (
                          <div className="flex items-center gap-2">
                            {/* Repeat Checkbox */}
                            <label
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition flex items-center gap-1.5 select-none ${
                                course.isRepeat
                                  ? 'bg-amber-100 text-amber-900 border-amber-400'
                                  : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300'
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
                                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span>Repeat</span>
                            </label>

                            {course.isRepeat && (
                              <div className="inline-flex items-center gap-1">
                                <label
                                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer border transition flex items-center gap-1 ${
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
                                  <span>{course.isExcused ? 'Excused ✓' : 'Medical?'}</span>
                                </label>
                                <HelpTooltip id="T03" size="xs" />
                              </div>
                            )}

                            {/* Projected Checkbox */}
                            <label
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 select-none ${
                                course.isExpected
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400/40'
                                  : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-300'
                              } ${isConfirmedOfficial ? 'opacity-60 cursor-not-allowed bg-neutral-100 text-neutral-400' : 'cursor-pointer'}`}
                              title={isConfirmedOfficial ? "This grade is officially confirmed and protected. Use Planning Tools > What-If for hypothetical scenarios." : "Projected / expected grade (excluded from confirmed GPA and transcripts)"}
                            >
                              <input
                                type="checkbox"
                                checked={!!course.isExpected}
                                disabled={isConfirmedOfficial}
                                onChange={(e) => {
                                  setCourseExpected(
                                    activeTabKey as SemesterKey,
                                    course.code,
                                    e.target.checked
                                  );
                                  triggerSaveNotification();
                                }}
                                className="w-3.5 h-3.5 rounded text-[#176B45] focus:ring-[#176B45]"
                              />
                              <span>Projected</span>
                            </label>
                          </div>
                        )}

                        {!course.isCompulsory && !course.isNgpa && !isOrientation && (
                          <button
                            type="button"
                            onClick={() => {
                              removeCourseFromSemester(activeTabKey as SemesterKey, course.code);
                              triggerSaveNotification();
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remove course"
                            aria-label="Remove course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4.5 PERMANENT PREVIOUS & NEXT SEMESTER NAVIGATION ROW     */}
      {/* Immediately after final course, immediately before Plan   */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-2 pt-2 pb-1">
        <div className="flex items-center justify-between gap-3">
          {prevSemester ? (
            <button
              type="button"
              onClick={() => handleNavigateSemester(prevSemester)}
              className="flex-1 sm:flex-initial sm:min-w-[140px] px-4 py-3 rounded-2xl bg-white hover:bg-neutral-100 border border-[#DCDDD7] hover:border-[#176B45] text-[#242824] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-2xs min-h-[44px] touch-manipulation active:scale-95"
              aria-label={`Previous Semester ${prevSemester} (← ${prevSemester})`}
            >
              <ArrowLeft className="w-4 h-4 shrink-0 text-neutral-600" />
              <span>← {prevSemester}</span>
            </button>
          ) : (
            <div className="flex-1 sm:flex-initial sm:min-w-[140px]" />
          )}

          <div className="hidden xs:flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
            <span>Viewing:</span>
            <span className="font-extrabold text-[#176B45]">
              {activeTabKey === 'ORIENTATION' ? 'Non-GPA' : `Sem ${activeTabKey}`}
            </span>
          </div>

          {nextSemester ? (
            <button
              type="button"
              onClick={() => handleNavigateSemester(nextSemester)}
              className="flex-1 sm:flex-initial sm:min-w-[140px] px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition shadow-sm hover:scale-[1.01] min-h-[44px] touch-manipulation active:scale-95"
              aria-label={`Next Semester ${nextSemester} (${nextSemester} →)`}
            >
              <span>{nextSemester} →</span>
              <ArrowRight className="w-4 h-4 shrink-0 text-white" />
            </button>
          ) : (
            <div className="flex-1 sm:flex-initial sm:min-w-[140px]" />
          )}
        </div>

        {saveStatus && saveStatus !== 'Saved' && (
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. ADVANCED PLANNING & FORECAST TOOLS                    */}
      {/* Target Planning, Assumptions, Scenarios & Course Impact  */}
      {/* ======================================================== */}
      <PlanningTools />

      {/* Modal: Change Current Academic Semester */}
      {showCurrentSemSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900">
              Set Current Academic Semester
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Your current semester indicates your active term of study. Earlier semesters are completed, while upcoming terms are planned.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {ALL_SEMESTER_KEYS.map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => {
                    setCurrentSemester(sem);
                    setShowCurrentSemSelector(false);
                    triggerSaveNotification();
                  }}
                  className={`p-3 rounded-xl text-center text-sm font-bold border transition ${
                    profile.currentSemester === sem
                      ? 'bg-[#103B2D] text-white border-[#103B2D] shadow-sm'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                  }`}
                >
                  Sem {sem}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCurrentSemSelector(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Lightweight Undo Toast Notification (4.5s auto-dismiss) - Positioned safely above mobile bottom nav */}
      {undoRecord && (
        <div
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 bg-[#103B2D] text-white text-xs font-semibold rounded-2xl shadow-2xl border border-emerald-600/40 animate-in slide-in-from-bottom duration-200 max-w-[92vw]"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">
            {undoRecord.newGrade ? (
              <>
                Grade updated to <strong className="font-extrabold text-white">{undoRecord.newGrade}</strong>
              </>
            ) : (
              <>
                Grade cleared for <strong className="font-extrabold text-white">{undoRecord.courseCode}</strong>
              </>
            )}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="ml-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition active:scale-95 flex items-center gap-1 shadow-xs shrink-0 cursor-pointer pointer-events-auto touch-manipulation min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={() => setUndoRecord(null)}
            className="text-emerald-300 hover:text-white p-1.5 -mr-1 shrink-0 pointer-events-auto touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Course Options & Action Modal / Bottom Sheet */}
      {courseModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150"
          onClick={() => setCourseModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-5 border border-neutral-200 shadow-2xl text-left animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-[#242824]">
                    {courseModal.course.code}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {courseModal.course.credits} Cr
                  </span>
                </div>
                <div className="text-xs font-medium text-neutral-600 mt-1 line-clamp-1">
                  {courseModal.course.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCourseModal(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {courseModal.type === 'menu' && (
              <div className="space-y-2">
                {/* Action 1: Course Info */}
                <button
                  type="button"
                  onClick={() => setCourseModal({ ...courseModal, type: 'info' })}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition text-xs font-bold text-neutral-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>Course Information</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-neutral-400" />
                </button>

                {/* Action 2: Edit Credits */}
                {!courseModal.course.isNgpa && (
                  <button
                    type="button"
                    onClick={() => setCourseModal({ ...courseModal, type: 'credits' })}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition text-xs font-bold text-neutral-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <span>Change Credits ({courseModal.course.credits} Cr)</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-neutral-400" />
                  </button>
                )}

                {/* Action 3: Clear Grade */}
                {courseModal.course.grade && (
                  <button
                    type="button"
                    onClick={() => setCourseModal({ ...courseModal, type: 'confirm_clear' })}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition text-xs font-bold text-amber-900 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>Clear Grade ({courseModal.course.grade})</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-neutral-400" />
                  </button>
                )}

                {/* Action 4: Remove Course (if custom / elective) */}
                {!courseModal.course.isCompulsory && !courseModal.course.isNgpa && !isOrientation && (
                  <button
                    type="button"
                    onClick={() => setCourseModal({ ...courseModal, type: 'confirm_delete' })}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 transition text-xs font-bold text-rose-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Remove Course</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-neutral-400" />
                  </button>
                )}
              </div>
            )}

            {/* Credit Edit View */}
            {courseModal.type === 'credits' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-700">Select course credits:</div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 6].map((cr) => (
                    <button
                      key={cr}
                      type="button"
                      onClick={() => {
                        setCourseCredits(courseModal.semKey, courseModal.course.code, cr);
                        triggerSaveNotification();
                        setCourseModal(null);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        courseModal.course.credits === cr
                          ? 'bg-[#103B2D] text-white border-[#103B2D] shadow-xs'
                          : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {cr} Cr
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCourseModal({ ...courseModal, type: 'menu' })}
                  className="w-full py-2 rounded-xl bg-neutral-100 text-xs font-bold text-neutral-600 hover:bg-neutral-200 transition"
                >
                  Back
                </button>
              </div>
            )}

            {/* Course Info View */}
            {courseModal.type === 'info' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-neutral-50 rounded-xl space-y-1.5 border border-neutral-200">
                  <div><span className="text-neutral-500">Name:</span> <strong className="text-neutral-900">{courseModal.course.name}</strong></div>
                  <div><span className="text-neutral-500">Type:</span> <strong className="text-neutral-900">{courseModal.course.isCompulsory ? 'Compulsory (Core)' : 'Elective'}</strong></div>
                  <div><span className="text-neutral-500">Credits:</span> <strong className="text-neutral-900">{courseModal.course.credits} Credits</strong></div>
                  <div><span className="text-neutral-500">Status:</span> <strong className="text-neutral-900">{courseModal.course.grade ? (courseModal.course.isExpected ? 'Projected' : 'Confirmed Official') : 'Ungraded'}</strong></div>
                </div>
                <button
                  type="button"
                  onClick={() => setCourseModal({ ...courseModal, type: 'menu' })}
                  className="w-full py-2 rounded-xl bg-neutral-100 text-xs font-bold text-neutral-600 hover:bg-neutral-200 transition"
                >
                  Back
                </button>
              </div>
            )}

            {/* Confirm Clear View */}
            {courseModal.type === 'confirm_clear' && (
              <div className="space-y-3 text-xs">
                <p className="text-neutral-700">
                  Are you sure you want to clear the grade for <strong>{courseModal.course.code}</strong>?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleGradeChangeWithUndo(courseModal.semKey, courseModal.course, '');
                      setCourseModal(null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition"
                  >
                    Clear Grade
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseModal({ ...courseModal, type: 'menu' })}
                    className="flex-1 py-2 rounded-xl bg-neutral-100 font-bold text-neutral-600 hover:bg-neutral-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Delete View */}
            {courseModal.type === 'confirm_delete' && (
              <div className="space-y-3 text-xs">
                <p className="text-rose-700 font-semibold">
                  Are you sure you want to remove <strong>{courseModal.course.code}</strong> from this semester?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      removeCourseFromSemester(courseModal.semKey, courseModal.course.code);
                      triggerSaveNotification();
                      setCourseModal(null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseModal({ ...courseModal, type: 'menu' })}
                    className="flex-1 py-2 rounded-xl bg-neutral-100 font-bold text-neutral-600 hover:bg-neutral-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GpaCalculatorView;
