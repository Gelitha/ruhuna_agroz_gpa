// University of Ruhuna - Faculty of Agriculture
// Planning Tools — Streamlined 3-Tab Academic Strategy & Simulation Suite
// 1. Target CGPA | 2. Forecast | 3. Course Impact

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Target,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Check,
  ArrowRight,
  Lock,
  RefreshCw
} from 'lucide-react';
import { TargetScope, Grade, SemesterKey, Course, StudentProfile } from '../../types';
import { useGradeStore } from '../../store/useGradeStore';
import {
  calculateTargetCgpaRequirement,
  calculateAcademicProjections,
  generateSuggestedGradeCombination,
  isCourseGradeConfirmed,
  calculateEffectiveGpvForGrade,
  ALL_SEMESTER_KEYS
} from '../../utils/projectionCalculations';
import { GRADING_SCALE } from '../../database';
import { HorizontalGradeSelector } from '../common/HorizontalGradeSelector';
import { HelpTooltip } from '../common/HelpTooltip';
import { SiSubtext } from '../common/BilingualText';
import { SI } from '../../constants/translations';

const GRADE_OPTIONS: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];

export const PlanningTools: React.FC = () => {
  const {
    getActiveProfile,
    setProjectionQuickAssumptions,
    resetQuickAssumptions,
    setProjectionTargetCgpa,
    getAcademicProjections,
    setCourseGrade,
    setCourseExpected,
    setCourseGradeAndStatus,
    applyTargetMixPlan,
    saveCurrentState,
    planningToolSubTab,
    planningToolsExpanded,
    setPlanningToolRequest
  } = useGradeStore();

  const profile = getActiveProfile();
  const proj = getAcademicProjections();

  // Collapsed by default unless requested by a redirected navigation shortcut
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'target' | 'forecast' | 'impact'>('target');

  useEffect(() => {
    if (planningToolsExpanded) {
      setIsOpen(true);
      if (planningToolSubTab) {
        setActiveSubTab(planningToolSubTab);
      }
      setPlanningToolRequest(null, false);
    }
  }, [planningToolsExpanded, planningToolSubTab, setPlanningToolRequest]);

  // Quick Assumptions State
  const quickAssumptions = profile.projectionQuickAssumptions;
  const isAssumptionsActive = !!quickAssumptions;
  const [prevAssumption, setPrevAssumption] = useState<number>(quickAssumptions?.remainingPrevAvgGpa ?? 3.30);
  const [currAssumption, setCurrAssumption] = useState<number>(quickAssumptions?.currentSemAvgGpa ?? 3.50);

  // Target CGPA Calculator State
  const [targetScope, setTargetScope] = useState<TargetScope>('after_current');
  const [targetCgpa, setTargetCgpa] = useState<number>(profile.projectionTargetCgpa ?? 3.50);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [manualGradeAllocations, setManualGradeAllocations] = useState<Record<string, Grade>>({});
  const [balanceTick, setBalanceTick] = useState<number>(0);

  // Course Impact Simulation State (Temporary What-If)
  const [simulatedTargets, setSimulatedTargets] = useState<Record<string, Grade>>({});
  const [impactSortMode, setImpactSortMode] = useState<'order' | 'credits' | 'impact'>('order');

  // Synchronize local state whenever active student profile switches
  useEffect(() => {
    setPrevAssumption(profile.projectionQuickAssumptions?.remainingPrevAvgGpa ?? 3.30);
    setCurrAssumption(profile.projectionQuickAssumptions?.currentSemAvgGpa ?? 3.50);
    setTargetCgpa(profile.projectionTargetCgpa ?? 3.50);

    // Initialize simulated targets from current profile state
    const initialTargets: Record<string, Grade> = {};
    const currentSem = profile.currentSemester || '1-1';
    const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem as SemesterKey);

    for (let idx = 0; idx <= currentIndex; idx++) {
      const semKey = ALL_SEMESTER_KEYS[idx];
      const courses = profile.semesters[semKey] || [];
      for (const c of courses) {
        if (!c.isNgpa && !isCourseGradeConfirmed(c)) {
          const key = `${semKey}:${c.code}`;
          initialTargets[key] = c.isExpected && c.grade ? c.grade : '';
        }
      }
    }
    setSimulatedTargets(initialTargets);
    setManualGradeAllocations({});
  }, [profile.id, profile.currentSemester, profile.projectionQuickAssumptions, profile.projectionTargetCgpa]);

  // Prune manual selections that fall outside the newly selected target scope
  useEffect(() => {
    const curSem = profile.currentSemester || '1-1';
    const curIdx = ALL_SEMESTER_KEYS.indexOf(curSem as SemesterKey);
    const allowedSems =
      targetScope === 'after_pending'
        ? new Set(ALL_SEMESTER_KEYS.slice(0, Math.max(0, curIdx)))
        : targetScope === 'after_current'
        ? new Set(ALL_SEMESTER_KEYS.slice(0, curIdx + 1))
        : new Set(ALL_SEMESTER_KEYS);

    setManualGradeAllocations(prev => {
      const next: Record<string, Grade> = {};
      let changed = false;
      for (const [k, g] of Object.entries(prev)) {
        const [sk] = k.split(':') as [SemesterKey, string];
        const courseExists = allowedSems.has(sk) && (profile.semesters[sk] || []).some(c => `${sk}:${c.code}` === k && !c.isNgpa && !isCourseGradeConfirmed(c));
        if (courseExists && g) {
          next[k] = g;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [targetScope, profile]);

  const targetResult = calculateTargetCgpaRequirement(profile, targetCgpa, targetScope);

  const handleApplyAssumptions = () => {
    setProjectionQuickAssumptions({
      remainingPrevAvgGpa: prevAssumption,
      currentSemAvgGpa: currAssumption
    });
    setAppliedToast('Quick assumptions applied to unresolved courses.');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  const handleResetAssumptions = () => {
    resetQuickAssumptions();
    setAppliedToast('Quick assumptions reset. Using individual course projections.');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  const handleTargetChange = (val: number) => {
    setTargetCgpa(val);
    setProjectionTargetCgpa(val);
  };

  // Trajectory Gap for Target CGPA
  const currentTrajectoryCgpa = targetScope === 'after_pending' ? proj.projectedCgpaPending : proj.combinedProjectedCgpa;
  const targetGap = currentTrajectoryCgpa > 0 ? Number((targetCgpa - currentTrajectoryCgpa).toFixed(2)) : null;

  // Initial auto-only baseline and live interactive combination
  const baselineCombination = useMemo(() => {
    return generateSuggestedGradeCombination(profile, targetCgpa, targetScope, {});
  }, [profile, targetCgpa, targetScope]);

  const suggestedCombination = useMemo(() => {
    void balanceTick;
    return generateSuggestedGradeCombination(profile, targetCgpa, targetScope, manualGradeAllocations);
  }, [profile, targetCgpa, targetScope, manualGradeAllocations, balanceTick]);

  const handleManualGradeChange = (courseKey: string, selected: string) => {
    setManualGradeAllocations(prev => {
      const next = { ...prev };
      if (!selected) {
        delete next[courseKey];
      } else {
        next[courseKey] = selected as Grade;
      }
      return next;
    });
  };

  const handleAutoBalanceRemaining = () => {
    setBalanceTick(t => t + 1);
    setAppliedToast('Remaining automatic subjects rebalanced around your locked selections.');
    setTimeout(() => setAppliedToast(null), 3500);
  };

  const handleResetAllocation = () => {
    setManualGradeAllocations({});
    setBalanceTick(t => t + 1);
    setAppliedToast('Temporary manual selections cleared. All eligible subjects returned to Auto.');
    setTimeout(() => setAppliedToast(null), 3500);
  };

  const handleApplySuggestedGrades = (allowBelowTarget = false) => {
    if (!profile || !profile.id) {
      setAppliedToast('Cannot apply: No active student profile.');
      setTimeout(() => setAppliedToast(null), 4000);
      return;
    }
    if (suggestedCombination.courses.length === 0) return;
    if (!allowBelowTarget && !suggestedCombination.possible) return;

    // Validate concrete enrolled, non-NGPA, unresolved courses only (never overwrite confirmed grades)
    const allocations = suggestedCombination.courses
      .filter(item => {
        if (!item.suggestedGrade || !GRADING_SCALE[item.suggestedGrade]) return false;
        const semCourses = profile.semesters[item.semesterKey] || [];
        const course = semCourses.find(c => c.code === item.courseCode);
        if (!course || course.isNgpa || isCourseGradeConfirmed(course)) return false;
        const effGpv = calculateEffectiveGpvForGrade(item.suggestedGrade, course.isRepeat, course.isExcused);
        if (effGpv === null) return false;
        if (course.isRepeat && !course.isExcused && effGpv > 2.0 + 1e-6) return false;
        return true;
      })
      .map(item => ({
        semKey: item.semesterKey,
        courseCode: item.courseCode,
        grade: item.suggestedGrade
      }));

    if (allocations.length === 0) {
      setAppliedToast('No eligible unresolved courses to apply.');
      setTimeout(() => setAppliedToast(null), 4000);
      return;
    }

    applyTargetMixPlan(allocations);
    const saved = saveCurrentState ? saveCurrentState() : true;
    if (!saved) {
      setAppliedToast('Save failed: Local browser storage unavailable.');
      setTimeout(() => setAppliedToast(null), 4500);
      return;
    }

    const estimateNote = suggestedCombination.isIncompleteEstimate
      ? ` (${suggestedCombination.unenrolledCredits} future Cr remain unenrolled)`
      : '';

    setAppliedToast(
      allowBelowTarget && !suggestedCombination.possible
        ? `Applied ${allocations.length} scenario grades as projected (shortfall: ${suggestedCombination.shortfall.toFixed(2)} CGPA)${estimateNote}.`
        : `Applied ${allocations.length} balanced grades as projected grades${estimateNote}!`
    );
    setTimeout(() => setAppliedToast(null), 5000);
  };

  // ========================================================
  // COURSE IMPACT SIMULATION ENGINE
  // ========================================================
  const currentSem = profile.currentSemester || '1-1';
  const currentIndex = ALL_SEMESTER_KEYS.indexOf(currentSem as SemesterKey);

  // Collect unresolved courses in scope (past pending + current semester)
  const unresolvedScopeCourses = useMemo(() => {
    const list: Array<{
      semKey: SemesterKey;
      course: Course;
      originalGrade: Grade;
      isRepeat: boolean;
      isExcused: boolean;
      maxGpv: number;
    }> = [];

    for (let idx = 0; idx <= currentIndex; idx++) {
      const semKey = ALL_SEMESTER_KEYS[idx];
      const courses = profile.semesters[semKey] || [];
      for (const c of courses) {
        if (!c.isNgpa && !isCourseGradeConfirmed(c)) {
          const maxGpv = c.isRepeat && !c.isExcused ? 2.0 : 4.0;
          list.push({
            semKey,
            course: c,
            originalGrade: c.isExpected && c.grade ? c.grade : '',
            isRepeat: !!c.isRepeat,
            isExcused: !!c.isExcused,
            maxGpv
          });
        }
      }
    }
    return list;
  }, [profile, currentIndex]);

  // Construct simulated profile reflecting current temporary targets
  const simulatedProfile = useMemo<StudentProfile>(() => {
    const clone: StudentProfile = {
      ...profile,
      semesters: { ...profile.semesters }
    };

    for (let idx = 0; idx <= currentIndex; idx++) {
      const semKey = ALL_SEMESTER_KEYS[idx];
      clone.semesters[semKey] = (profile.semesters[semKey] || []).map(c => {
        if (!c.isNgpa && !isCourseGradeConfirmed(c)) {
          const key = `${semKey}:${c.code}`;
          const simGrade = simulatedTargets[key];
          if (simGrade !== undefined) {
            return {
              ...c,
              grade: simGrade,
              isExpected: simGrade !== ''
            };
          }
        }
        return c;
      });
    }
    return clone;
  }, [profile, currentIndex, simulatedTargets]);

  // Run real production calculation on the simulated profile
  const simulatedProj = useMemo(() => {
    return calculateAcademicProjections(simulatedProfile, profile.projectionQuickAssumptions);
  }, [simulatedProfile, profile.projectionQuickAssumptions]);

  // Combined differences between original projection and temporary simulation
  const sgpaDiff = Number((simulatedProj.currentSemProjectedSgpa - proj.currentSemProjectedSgpa).toFixed(2));
  const cgpaDiff = Number((simulatedProj.combinedProjectedCgpa - proj.combinedProjectedCgpa).toFixed(3));

  // Count modified courses
  const modifiedCount = useMemo(() => {
    let count = 0;
    for (const item of unresolvedScopeCourses) {
      const key = `${item.semKey}:${item.course.code}`;
      const simGrade = simulatedTargets[key] ?? item.originalGrade;
      if (simGrade !== item.originalGrade) {
        count++;
      }
    }
    return count;
  }, [unresolvedScopeCourses, simulatedTargets]);

  // Calculate individual course impacts by testing a single-course target deviation
  const evaluatedCourseImpacts = useMemo(() => {
    return unresolvedScopeCourses.map(item => {
      const key = `${item.semKey}:${item.course.code}`;
      const currentTarget = simulatedTargets[key] ?? item.originalGrade;
      const isModified = currentTarget !== item.originalGrade;

      // Calculate individual impact: single course deviation against baseline
      const originalGpv = item.originalGrade
        ? calculateEffectiveGpvForGrade(item.originalGrade, item.isRepeat, item.isExcused) ?? 0
        : null;

      const targetGpv = currentTarget
        ? calculateEffectiveGpvForGrade(currentTarget, item.isRepeat, item.isExcused) ?? 0
        : null;

      let individualSgpaImpact = 0;
      let individualCgpaImpact = 0;
      const scopeTotalCr = proj.scopeTotalGpaCredits || 0;

      if (originalGpv !== null && targetGpv !== null) {
        const ptDiff = (targetGpv - originalGpv) * (item.course.credits || 0);
        if (item.semKey === currentSem && scopeTotalCr > 0) {
          const semCr = proj.semesterSummaries[currentSem]?.totalGpaCredits || 0;
          if (semCr > 0) individualSgpaImpact = Number((ptDiff / semCr).toFixed(2));
        }
        if (scopeTotalCr > 0) {
          individualCgpaImpact = Number((ptDiff / scopeTotalCr).toFixed(3));
        }
      } else if (originalGpv === null && targetGpv !== null) {
        // Course was previously unspecified, now assigned a target
        const ptDiff = targetGpv * (item.course.credits || 0);
        if (scopeTotalCr > 0) {
          individualCgpaImpact = Number((ptDiff / scopeTotalCr).toFixed(3));
        }
      } else if (originalGpv !== null && targetGpv === null) {
        // Course target cleared to unspecified
        const ptDiff = -originalGpv * (item.course.credits || 0);
        if (scopeTotalCr > 0) {
          individualCgpaImpact = Number((ptDiff / scopeTotalCr).toFixed(3));
        }
      }

      return {
        key,
        semKey: item.semKey,
        courseCode: item.course.code,
        courseName: item.course.name,
        credits: item.course.credits || 0,
        originalGrade: item.originalGrade,
        targetGrade: currentTarget,
        isRepeat: item.isRepeat,
        isExcused: item.isExcused,
        maxGpv: item.maxGpv,
        isModified,
        individualSgpaImpact,
        individualCgpaImpact
      };
    });
  }, [unresolvedScopeCourses, simulatedTargets, currentSem, proj]);

  // Sort course impacts according to user selection
  const sortedCourseImpacts = useMemo(() => {
    const list = [...evaluatedCourseImpacts];
    if (impactSortMode === 'credits') {
      list.sort((a, b) => b.credits - a.credits);
    } else if (impactSortMode === 'impact') {
      list.sort((a, b) => b.individualCgpaImpact - a.individualCgpaImpact);
    }
    return list;
  }, [evaluatedCourseImpacts, impactSortMode]);

  const handleTargetGradeChange = (key: string, newGrade: Grade) => {
    setSimulatedTargets(prev => ({
      ...prev,
      [key]: newGrade
    }));
  };

  const handleResetSingleCourseTarget = (key: string, originalGrade: Grade) => {
    setSimulatedTargets(prev => ({
      ...prev,
      [key]: originalGrade
    }));
  };

  const handleResetAllSimulatedTargets = () => {
    const resetMap: Record<string, Grade> = {};
    for (const item of unresolvedScopeCourses) {
      resetMap[`${item.semKey}:${item.course.code}`] = item.originalGrade;
    }
    setSimulatedTargets(resetMap);
    setAppliedToast('All course targets reset to saved expected grades.');
    setTimeout(() => setAppliedToast(null), 3000);
  };

  const handleApplySimulatedTargets = () => {
    let count = 0;
    for (const item of evaluatedCourseImpacts) {
      if (item.isModified) {
        if (item.targetGrade) {
          setCourseGradeAndStatus(item.semKey, item.courseCode, item.targetGrade, true);
        } else {
          setCourseGradeAndStatus(item.semKey, item.courseCode, '', false);
        }
        count++;
      }
    }
    setAppliedToast(`Applied ${count} simulated targets as projected grades!`);
    setTimeout(() => setAppliedToast(null), 5000);
  };

  return (
    <div className="bg-white border border-[#DCDDD7] rounded-2xl shadow-subtle overflow-hidden transition-all">
      {/* Simple Header with Expand / Collapse Arrow */}
      <div className="flex items-center justify-between pr-4 sm:pr-5 hover:bg-[#F8F8F4] transition-colors">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer touch-manipulation"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2ED] text-[#176B45] flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#242824]">
                Planning tools
              </h3>
              <SiSubtext text={SI.planning.title} className="text-[#626962]" />
            </div>
          </div>

          <div className="text-[#626962] hover:text-[#242824] transition">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
        <div className="shrink-0 ml-1">
          <HelpTooltip id="T22" size="xs" />
        </div>
      </div>

      {/* Expanded Tools Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-[#EDF1EC] space-y-5 animate-in fade-in">
          {/* Toast Notification */}
          {appliedToast && (
            <div className="p-3 rounded-xl bg-[#103B2D] text-white text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{appliedToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedToast(null)}
                className="text-emerald-200 hover:text-white px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* 3 Streamlined Sub-Tabs Navigation (Equal-width on Mobile) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 border-b border-[#EDF1EC] pb-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('target')}
              className={`px-2 sm:px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 text-center ${
                activeSubTab === 'target'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">
                <span className="block">Target</span>
                <SiSubtext text={SI.planning.targetCgpa} className={`text-[9.5px] ${activeSubTab === 'target' ? 'text-emerald-100' : 'text-[#626962]'}`} />
              </span>
              <HelpTooltip id="T23" size="xs" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('forecast')}
              className={`px-2 sm:px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 text-center ${
                activeSubTab === 'forecast'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">
                <span className="block">Forecast</span>
                <SiSubtext text={SI.planning.forecast} className={`text-[9.5px] ${activeSubTab === 'forecast' ? 'text-emerald-100' : 'text-[#626962]'}`} />
              </span>
              <HelpTooltip id="T25" size="xs" />
              {isAssumptionsActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('impact')}
              className={`px-2 sm:px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 text-center ${
                activeSubTab === 'impact'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-[#626962] hover:bg-neutral-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">
                <span className="block">Impact</span>
                <SiSubtext text={SI.planning.courseImpact} className={`text-[9.5px] ${activeSubTab === 'impact' ? 'text-emerald-100' : 'text-[#626962]'}`} />
              </span>
              {modifiedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                  {modifiedCount}
                </span>
              )}
            </button>
          </div>

          {/* ======================================================== */}
          {/* 1. TARGET CGPA TAB                                       */}
          {/* ======================================================== */}
          {activeSubTab === 'target' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Scope Selection */}
                <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#626962]">
                    Target Scope
                    <SiSubtext text={SI.planning.targetScope} className="text-[10px] text-[#626962]" />
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetScope('after_current')}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                        targetScope === 'after_current'
                          ? 'bg-[#176B45] text-white border-[#176B45] shadow-sm'
                          : 'bg-white text-[#242824] border-[#DCDDD7] hover:border-neutral-400'
                      }`}
                    >
                      <div>After the current semester (Sem {proj.currentSemester})</div>
                      <SiSubtext text={SI.planning.scopeAfterCurrent} className={`text-[10px] ${targetScope === 'after_current' ? 'text-emerald-100' : 'text-[#626962]'}`} />
                      <div className={`text-[11px] font-normal mt-0.5 ${targetScope === 'after_current' ? 'text-emerald-100' : 'text-[#626962]'}`}>
                        Pending results + upcoming Sem {proj.currentSemester} examinations
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetScope('after_pending')}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                        targetScope === 'after_pending'
                          ? 'bg-[#176B45] text-white border-[#176B45] shadow-sm'
                          : 'bg-white text-[#242824] border-[#DCDDD7] hover:border-neutral-400'
                      }`}
                    >
                      <div>After pending previous semester results</div>
                      <SiSubtext text={SI.planning.scopeAfterPending} className={`text-[10px] ${targetScope === 'after_pending' ? 'text-emerald-100' : 'text-[#626962]'}`} />
                      <div className={`text-[11px] font-normal mt-0.5 ${targetScope === 'after_pending' ? 'text-emerald-100' : 'text-[#626962]'}`}>
                        Resolves outstanding grades from earlier terms
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetScope('at_graduation')}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                        targetScope === 'at_graduation'
                          ? 'bg-[#176B45] text-white border-[#176B45] shadow-sm'
                          : 'bg-white text-[#242824] border-[#DCDDD7] hover:border-neutral-400'
                      }`}
                    >
                      <div>At graduation ({targetResult.totalScopeCredits} Credits)</div>
                      <SiSubtext text={SI.planning.scopeAtGraduation} className={`text-[10px] ${targetScope === 'at_graduation' ? 'text-emerald-100' : 'text-[#626962]'}`} />
                      <div className={`text-[11px] font-normal mt-0.5 ${targetScope === 'at_graduation' ? 'text-emerald-100' : 'text-[#626962]'}`}>
                        Degree classification across all remaining degree requirements
                      </div>
                    </button>
                  </div>
                </div>

                {/* Target Slider & Value */}
                <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-[#626962]">
                            Desired CGPA
                          </label>
                          <SiSubtext text={SI.planning.desiredCgpa} className="text-[10px] text-[#626962]" />
                        </div>
                        <HelpTooltip id="T23" size="xs" />
                      </div>
                      <span className="font-sans font-tabular text-xl font-black text-[#176B45]">
                        {targetCgpa.toFixed(2)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="2.00"
                      max="4.00"
                      step="0.01"
                      value={targetCgpa}
                      onChange={e => handleTargetChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#DCDDD7] rounded-lg appearance-none cursor-pointer accent-[#176B45] mt-3"
                    />

                    {/* Quick Preset Buttons (4 cols desktop, 2x2 mobile) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      {[
                        { label: 'First Class', si: SI.planning.classPresets.first, val: 3.70 },
                        { label: '2nd Upper Class', si: SI.planning.classPresets.upperSecond, val: 3.30 },
                        { label: '2nd Lower Class', si: SI.planning.classPresets.lowerSecond, val: 3.00 },
                        { label: 'General Class', si: SI.planning.classPresets.general, val: 2.00 }
                      ].map(preset => {
                        const isSelected = Math.abs(targetCgpa - preset.val) < 0.01;
                        return (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => handleTargetChange(preset.val)}
                            className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[52px] touch-manipulation cursor-pointer ${
                              isSelected
                                ? 'bg-[#176B45] text-white border-[#176B45] shadow-xs'
                                : 'bg-white text-[#242824] border-[#DCDDD7] hover:bg-neutral-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 w-full">
                              <span className="text-[11px] font-extrabold leading-tight">{preset.label}</span>
                              <span className={`font-mono text-[11px] font-black shrink-0 ${isSelected ? 'text-emerald-100' : 'text-[#176B45]'}`}>
                                {preset.val.toFixed(2)}
                              </span>
                            </div>
                            <SiSubtext
                              text={preset.si}
                              className={`text-[9.5px] mt-0.5 leading-tight ${isSelected ? 'text-emerald-100' : 'text-[#626962]'}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metrics Summary Strip */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDF1EC] text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-white border border-[#EDF1EC]">
                      <span className="text-[10px] text-[#626962] block">Max Achievable</span>
                      <SiSubtext text={SI.planning.maxAchievableCgpa} className="text-[9.5px] text-[#626962]" />
                      <span className="font-sans font-tabular font-bold text-neutral-900">
                        {targetResult.maxAchievableCgpa.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-[#EDF1EC]">
                      <span className="text-[10px] text-[#626962] block">Remaining</span>
                      <SiSubtext text={SI.planning.remainingCredits} className="text-[9.5px] text-[#626962]" />
                      <span className="font-sans font-tabular font-bold text-neutral-900">
                        {targetResult.remainingCredits} Cr
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-[#EDF1EC]">
                      <span className="text-[10px] text-[#626962] block">Trajectory Gap</span>
                      <SiSubtext text={SI.planning.trajectoryGap} className="text-[9.5px] text-[#626962]" />
                      <span className={`font-sans font-tabular font-bold ${
                        targetGap === null
                          ? 'text-neutral-500'
                          : targetGap <= 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}>
                        {targetGap === null ? '—' : targetGap > 0 ? `+${targetGap.toFixed(2)}` : targetGap.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Calculation Feasibility Result */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  targetResult.possible
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/70 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {targetResult.possible ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider">
                        {targetResult.possible ? 'Target Achievable' : 'Target Mathematically Unreachable'}
                      </span>
                      <SiSubtext
                        text={targetResult.possible ? SI.planning.targetAchievable : SI.planning.targetUnreachable}
                        className="text-[10px] font-semibold"
                      />
                      {targetResult.isRepeatCapRestricted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          <span>Repeat Capped</span>
                          <HelpTooltip id="T29" size="xs" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium mt-1 leading-relaxed">
                      {targetResult.explanation}
                    </p>
                  </div>
                </div>

                {targetResult.possible && targetResult.remainingCredits > 0 && targetResult.requiredAverage > 0 && (
                  <div className="shrink-0 text-right bg-white p-2.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[10px] uppercase font-bold text-[#626962] block">
                        Required Avg
                      </span>
                      <HelpTooltip id="T24" size="xs" />
                    </div>
                    <span className="font-sans font-tabular text-xl font-black text-[#176B45]">
                      {targetResult.requiredAverage.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#626962] block">
                      over {targetResult.remainingCredits} Cr
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Suggested Grade Combination for Target CGPA */}
              {suggestedCombination.courses.length > 0 && (
                <div className={`p-4 rounded-xl bg-white border shadow-2xs space-y-3.5 ${
                  suggestedCombination.possible ? 'border-emerald-300' : 'border-amber-300'
                }`}>
                  {/* Header + Action Buttons */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#176B45]" />
                        <span className="text-xs font-extrabold text-[#242824]">
                          Interactive Suggested Grade Combination ({suggestedCombination.courses.length} courses)
                        </span>
                        {suggestedCombination.isIncompleteEstimate && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Estimate ({suggestedCombination.unenrolledCredits} future Cr unenrolled)
                          </span>
                        )}
                      </div>
                      <SiSubtext text={SI.planning.suggestedCombination} className="text-[#176B45] font-semibold mt-0.5" />
                      <p className="text-[11px] text-[#626962] mt-0.5">
                        Select any grade beside a subject to lock it; remaining Auto subjects rebalance automatically. Temporary until applied as projected.
                      </p>
                      <SiSubtext text={SI.planning.suggestedHelp} className="text-[10px] text-[#626962]" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleAutoBalanceRemaining}
                        className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#242824] font-bold text-xs flex items-center justify-center gap-1.5 transition min-h-[40px] touch-manipulation cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#176B45]" />
                        <span className="text-left leading-tight">
                          <span className="block">Auto Balance</span>
                          <SiSubtext text={SI.planning.autoBalance} className="text-[9.5px] text-[#626962]" />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetAllocation}
                        className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center gap-1.5 transition min-h-[40px] touch-manipulation cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-left leading-tight">
                          <span className="block">Reset Allocation</span>
                          <SiSubtext text={SI.planning.resetAllocation} className="text-[9.5px] text-[#626962]" />
                        </span>
                      </button>

                      {suggestedCombination.possible ? (
                        <button
                          type="button"
                          onClick={() => handleApplySuggestedGrades(false)}
                          className="px-3.5 py-2 rounded-xl bg-[#176B45] hover:bg-[#103B2D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition min-h-[40px] touch-manipulation cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-left leading-tight">
                            <span className="block">Apply Suggested as Projected</span>
                            <SiSubtext text={SI.planning.applySuggested} className="text-[9.5px] text-emerald-100" />
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplySuggestedGrades(true)}
                          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition min-h-[40px] touch-manipulation cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-left leading-tight">
                            <span className="block">Apply Below-Target Scenario (−{suggestedCombination.shortfall.toFixed(2)})</span>
                            <SiSubtext text={SI.planning.applyBelowTarget} className="text-[9.5px] text-amber-100" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Unreachable Target / Allocation Shortfall Warning */}
                  {!suggestedCombination.possible && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          {suggestedCombination.theoreticallyAchievable
                            ? 'Generated allocation falls short of target under current course weights or locks.'
                            : 'Target currently unreachable with your selected grades.'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Max achievable CGPA: <strong>{suggestedCombination.maxAchievableCgpa.toFixed(2)}</strong> • Shortfall: <strong>{suggestedCombination.shortfall.toFixed(2)}</strong> • Required remaining avg: <strong>{suggestedCombination.autoCredits + suggestedCombination.unenrolledCredits > 0 ? suggestedCombination.requiredRemainingAverage.toFixed(2) : 'N/A'}</strong> across {suggestedCombination.autoCredits + suggestedCombination.unenrolledCredits} remaining Cr. Change manual grades, return subjects to Auto, or adjust your target.
                      </p>
                    </div>
                  )}

                  {/* Live Grade Quota Summary */}
                  <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      <div className="p-2 rounded-lg bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold uppercase text-[#626962] block">Actual CGPA</span>
                        <span className="font-mono font-black text-sm text-[#242824]">
                          {proj.actualGpaCredits > 0 ? suggestedCombination.actualCgpa.toFixed(2) : '—'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold uppercase text-[#626962] block">Target CGPA</span>
                        <span className="font-mono font-black text-sm text-[#176B45]">
                          {targetCgpa.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold uppercase text-[#626962] block">Eligible Credits</span>
                        <span className="font-mono font-black text-sm text-[#242824]">
                          {suggestedCombination.totalEligibleCredits} Cr
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold uppercase text-[#626962] block">Manual / Auto</span>
                        <span className="font-mono font-black text-sm text-[#242824]">
                          {suggestedCombination.manualCredits} / {suggestedCombination.autoCredits} Cr
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold uppercase text-[#626962] block">Req. Remaining Avg</span>
                        <span className="font-mono font-black text-sm text-[#242824]">
                          {suggestedCombination.autoCredits + suggestedCombination.unenrolledCredits > 0
                            ? suggestedCombination.requiredRemainingAverage.toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                      <div className={`p-2 rounded-lg border ${
                        suggestedCombination.possible
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <span className="text-[10px] font-bold uppercase text-[#626962] block">Est. Achieved CGPA</span>
                        <span className={`font-mono font-black text-sm ${
                          suggestedCombination.possible ? 'text-[#176B45]' : 'text-amber-800'
                        }`}>
                          {suggestedCombination.estimatedAchievedCgpa.toFixed(2)}
                          <span className="text-[10px] font-semibold ml-1">
                            ({suggestedCombination.estimatedAchievedCgpa >= targetCgpa ? '+' : ''}
                            {(suggestedCombination.estimatedAchievedCgpa - targetCgpa).toFixed(2)})
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Credit Quota Badges: Manual vs Remaining Auto */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-neutral-200/70">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#626962]">Remaining Auto Quota ({SI.planning.autoQuota}):</span>
                        {suggestedCombination.autoQuotas.length === 0 ? (
                          <span className="text-[11px] text-neutral-500">All subjects manually assigned</span>
                        ) : (
                          suggestedCombination.autoQuotas.map(q => (
                            <span
                              key={`auto-${q.grade}-${q.gpv.toFixed(2)}`}
                              title={`${q.credits} Cr × ${q.gpv.toFixed(1)} GPV = ${q.weightedPoints.toFixed(1)} pts`}
                              className={`px-2 py-0.5 rounded-full border font-bold text-[11px] ${
                                q.isRepeatCapped
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-100 text-[#103B2D] border-emerald-300'
                              }`}
                            >
                              {q.grade}{q.isRepeatCapped ? ` (repeat capped · ${q.gpv.toFixed(1)})` : ''}: {q.credits} Cr
                            </span>
                          ))
                        )}
                      </div>

                      {suggestedCombination.manualQuotas.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-blue-700">Manual Locked ({SI.planning.manualQuota}):</span>
                          {suggestedCombination.manualQuotas.map(q => (
                            <span
                              key={`man-${q.grade}-${q.gpv.toFixed(2)}`}
                              title={`${q.credits} Cr × ${q.gpv.toFixed(1)} GPV = ${q.weightedPoints.toFixed(1)} pts`}
                              className={`px-2 py-0.5 rounded-full border font-bold text-[11px] ${
                                q.isRepeatCapped
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-blue-100 text-blue-900 border-blue-300'
                              }`}
                            >
                              {q.grade}{q.isRepeatCapped ? ` (repeat capped · ${q.gpv.toFixed(1)})` : ''}: {q.credits} Cr
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {suggestedCombination.manualCredits > 0 && baselineCombination.autoQuotas.length > 0 && (
                      <div className="text-[10px] text-neutral-500 flex flex-wrap items-center gap-1">
                        <span>Initial Auto Baseline:</span>
                        {baselineCombination.autoQuotas.map(q => (
                          <span key={`base-${q.grade}-${q.gpv.toFixed(2)}`} className="font-mono">
                            {q.grade}{q.isRepeatCapped ? ` (repeat capped)` : ''} ({q.credits} Cr)
                          </span>
                        ))}
                        <span>• Combination Avg: {suggestedCombination.achievedGpa.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Subject Card Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1 max-h-80 overflow-y-auto pr-1">
                    {suggestedCombination.courses.map(sc => {
                      const courseKey = `${sc.semesterKey}:${sc.courseCode}`;
                      const isCappedSelection =
                        sc.isRepeat && !sc.isExcused && sc.suggestedGpv > 2.0;

                      return (
                        <div
                          key={courseKey}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 text-xs transition ${
                            sc.isManual
                              ? 'bg-blue-50/60 border-blue-300'
                              : 'bg-[#F8F8F4] border-[#DCDDD7]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#242824] truncate">
                                  {sc.courseCode}
                                </span>
                                {sc.isManual && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                                    <Lock className="w-2.5 h-2.5" />
                                    Manual
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#626962] block">
                                Sem {sc.semesterKey} · {sc.credits} Cr
                                {sc.existingProjectedGrade ? ` · Saved Proj: ${sc.existingProjectedGrade}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <select
                              aria-label={`Grade for ${sc.courseCode} (${sc.semesterKey})`}
                              value={sc.isManual ? sc.suggestedGrade : ''}
                              onChange={(e) => handleManualGradeChange(courseKey, e.target.value)}
                              className={`w-full rounded-lg px-2.5 py-2 text-xs font-bold border min-h-[44px] touch-manipulation cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#176B45]/30 ${
                                sc.isManual
                                  ? 'bg-white border-blue-400 text-blue-900'
                                  : 'bg-white border-emerald-300 text-[#103B2D]'
                              }`}
                            >
                              <option value="">Auto ({sc.suggestedGrade}) · {SI.planning.auto}</option>
                              {GRADE_OPTIONS.map(g => (
                                <option key={g} value={g}>
                                  {g} ({GRADING_SCALE[g].gpv.toFixed(1)})
                                </option>
                              ))}
                            </select>

                            {isCappedSelection && (
                              <p className="text-[10px] text-amber-800 font-semibold leading-tight">
                                Repeat cap: {sc.suggestedGrade} counts as {sc.effectiveGpv.toFixed(2)} (C)
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. CONSOLIDATED FORECAST TAB                             */}
          {/* ======================================================== */}
          {activeSubTab === 'forecast' && (
            <div className="space-y-4">
              {/* 4-Card Primary Forecast Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7]">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-[#626962]">Actual CGPA</span>
                    <HelpTooltip id="T08" size="xs" />
                  </div>
                  <div className="font-sans font-tabular text-xl font-bold text-[#242824] mt-1">
                    {proj.actualGpaCredits > 0 ? proj.actualCgpa.toFixed(2) : '—'}
                  </div>
                  <span className="text-[11px] text-[#626962] block mt-0.5">
                    {proj.actualGpaCredits} Credits confirmed
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-emerald-800">Expected CGPA</span>
                    <HelpTooltip id="T09" size="xs" />
                  </div>
                  <div className="font-sans font-tabular text-xl font-bold text-[#176B45] mt-1">
                    {(proj.hasFutureExpected ? (proj.overallProjectedCgpa ?? proj.combinedProjectedCgpa) : proj.combinedTotalCredits > 0 ? proj.combinedProjectedCgpa : 0) > 0
                      ? (proj.hasFutureExpected ? (proj.overallProjectedCgpa ?? proj.combinedProjectedCgpa) : proj.combinedProjectedCgpa).toFixed(2)
                      : '—'}
                  </div>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">
                    {proj.hasFutureExpected ? 'Includes future semesters' : proj.scenarios.isExpectedIncomplete ? 'Partial coverage' : 'Full projection'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7]">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-[#626962]">Best Case</span>
                    <HelpTooltip id="T26" size="xs" />
                  </div>
                  <div className="font-sans font-tabular text-xl font-bold text-emerald-700 mt-1">
                    {(proj.scopeTotalGpaCredits && proj.scopeTotalGpaCredits > 0)
                      ? proj.scenarios.bestCase.toFixed(2)
                      : '—'}
                  </div>
                  <span className="text-[11px] text-[#626962] block mt-0.5">
                    Remaining A (or C repeat)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7]">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-[#626962]">Worst Case</span>
                    <HelpTooltip id="T27" size="xs" />
                  </div>
                  <div className="font-sans font-tabular text-xl font-bold text-rose-700 mt-1">
                    {(proj.scopeTotalGpaCredits && proj.scopeTotalGpaCredits > 0)
                      ? proj.scenarios.worstCase.toFixed(2)
                      : '—'}
                  </div>
                  <span className="text-[11px] text-[#626962] block mt-0.5">
                    Remaining E (0.00 GPV)
                  </span>
                </div>
              </div>

              {/* Incomplete Projection Warning Banner */}
              {proj.scenarios.isExpectedIncomplete && (
                <div className="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Incomplete projection: Forecast currently covers {proj.combinedTotalCredits} of {proj.scopeTotalGpaCredits} credits. Unspecified courses are accounted for in Best/Worst bounds.
                    </span>
                  </div>
                  <HelpTooltip id="T14" size="xs" />
                </div>
              )}

              {/* Optional Quick Assumptions Controls */}
              <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#242824]">
                      Optional Quick Assumptions
                    </h4>
                    <p className="text-[11px] text-[#626962] mt-0.5">
                      Fills only courses that have neither confirmed nor individually entered expected grades. Repeat courses are strictly capped at 2.00 (Grade C).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Previous Pending Credits Assumption */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#242824]">
                        Outstanding Previous Results ({proj.pendingResultsCount} courses)
                      </span>
                      <span className="font-sans font-tabular font-bold text-[#176B45]">
                        {prevAssumption.toFixed(2)} GPV
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.00"
                      max="4.00"
                      step="0.05"
                      value={prevAssumption}
                      onChange={e => setPrevAssumption(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#DCDDD7] rounded-lg appearance-none cursor-pointer accent-[#176B45]"
                    />
                  </div>

                  {/* Current Semester Assumption */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#DCDDD7] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#242824]">
                        Upcoming Current Semester (Sem {proj.currentSemester})
                      </span>
                      <span className="font-sans font-tabular font-bold text-[#176B45]">
                        {currAssumption.toFixed(2)} GPV
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.00"
                      max="4.00"
                      step="0.05"
                      value={currAssumption}
                      onChange={e => setCurrAssumption(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#DCDDD7] rounded-lg appearance-none cursor-pointer accent-[#176B45]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[#626962]">
                    {isAssumptionsActive ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Quick assumptions active
                      </span>
                    ) : (
                      <span>Quick assumptions inactive (using individual course projections)</span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    {isAssumptionsActive && (
                      <button
                        type="button"
                        onClick={handleResetAssumptions}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#DCDDD7] text-neutral-600 hover:bg-neutral-100 transition-colors"
                      >
                        Reset / Disable
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleApplyAssumptions}
                      className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#176B45] text-white hover:bg-[#103B2D] shadow-sm transition-all"
                    >
                      Apply Assumptions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. INDIVIDUAL COURSE IMPACT & SIMULATION TAB             */}
          {/* ======================================================== */}
          {activeSubTab === 'impact' && (
            <div className="space-y-4">
              {/* Compact Combined Impact Summary */}
              <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#DCDDD7] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#176B45]" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#242824]">
                      Combined Impact Simulation (Temporary What-If)
                    </span>
                    <HelpTooltip id="T22" size="xs" />
                  </div>

                  <div className="flex items-center gap-2">
                    {modifiedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetAllSimulatedTargets}
                        className="px-3 py-1.5 rounded-lg border border-[#DCDDD7] text-[#626962] hover:bg-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset All</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={modifiedCount === 0}
                      onClick={handleApplySimulatedTargets}
                      className="px-4 py-1.5 rounded-xl bg-[#176B45] hover:bg-[#103B2D] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply as Projected ({modifiedCount})</span>
                    </button>
                  </div>
                </div>

                {/* Before vs After Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* SGPA Summary */}
                  <div className="p-3 rounded-lg bg-white border border-[#EDF1EC] flex items-center justify-between">
                    <div>
                      <span className="text-[#626962] block text-[11px]">Semester {currentSem} SGPA:</span>
                      <span className="font-sans font-tabular font-bold text-sm text-[#242824]">
                        {proj.currentSemProjectedSgpa > 0 ? proj.currentSemProjectedSgpa.toFixed(2) : '—'}
                        <span className="mx-1.5 text-neutral-400">→</span>
                        {simulatedProj.currentSemProjectedSgpa > 0 ? simulatedProj.currentSemProjectedSgpa.toFixed(2) : '—'}
                      </span>
                    </div>
                    <span className={`font-sans font-tabular font-extrabold text-sm ${
                      sgpaDiff > 0 ? 'text-emerald-700' : sgpaDiff < 0 ? 'text-rose-600' : 'text-neutral-500'
                    }`}>
                      {sgpaDiff > 0 ? `+${sgpaDiff.toFixed(2)}` : sgpaDiff < 0 ? sgpaDiff.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  {/* CGPA Summary */}
                  <div className="p-3 rounded-lg bg-white border border-[#EDF1EC] flex items-center justify-between">
                    <div>
                      <span className="text-[#626962] block text-[11px]">Scope Cumulative CGPA:</span>
                      <span className="font-sans font-tabular font-bold text-sm text-[#242824]">
                        {proj.combinedProjectedCgpa > 0 ? proj.combinedProjectedCgpa.toFixed(2) : '—'}
                        <span className="mx-1.5 text-neutral-400">→</span>
                        {simulatedProj.combinedProjectedCgpa > 0 ? simulatedProj.combinedProjectedCgpa.toFixed(2) : '—'}
                      </span>
                    </div>
                    <span className={`font-sans font-tabular font-extrabold text-sm ${
                      cgpaDiff > 0 ? 'text-emerald-700' : cgpaDiff < 0 ? 'text-rose-600' : 'text-neutral-500'
                    }`}>
                      {cgpaDiff > 0 ? `+${cgpaDiff.toFixed(3)}` : cgpaDiff < 0 ? cgpaDiff.toFixed(3) : '0.000'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#626962]">
                  <span>Adjust individual targets below to simulate hypotheticals without modifying saved grades.</span>
                  {/* Sorting Buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-500">Sort:</span>
                    <button
                      type="button"
                      onClick={() => setImpactSortMode('order')}
                      className={`px-2 py-0.5 rounded font-bold transition ${
                        impactSortMode === 'order' ? 'bg-[#176B45] text-white' : 'hover:bg-neutral-200'
                      }`}
                    >
                      Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setImpactSortMode('credits')}
                      className={`px-2 py-0.5 rounded font-bold transition ${
                        impactSortMode === 'credits' ? 'bg-[#176B45] text-white' : 'hover:bg-neutral-200'
                      }`}
                    >
                      Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setImpactSortMode('impact')}
                      className={`px-2 py-0.5 rounded font-bold transition ${
                        impactSortMode === 'impact' ? 'bg-[#176B45] text-white' : 'hover:bg-neutral-200'
                      }`}
                    >
                      Impact
                    </button>
                  </div>
                </div>
              </div>

              {/* Individual Courses Table / Cards */}
              {sortedCourseImpacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#626962] bg-[#F8F8F4] rounded-xl border border-[#EDF1EC]">
                  No unresolved courses in Semester {currentSem} or earlier pending semesters.
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedCourseImpacts.map(courseItem => {
                    return (
                      <div
                        key={courseItem.key}
                        className={`p-3.5 rounded-xl border transition-all ${
                          courseItem.isModified
                            ? 'bg-[#EDF5FF] border-[#A5C5EC] ring-1 ring-[#A5C5EC]/40'
                            : 'bg-white border-[#DCDDD7] hover:bg-[#F8F8F4]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Course Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-[#242824]">
                                {courseItem.courseCode}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                                Sem {courseItem.semKey}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {courseItem.credits} Cr
                              </span>
                              {courseItem.isRepeat && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  <span>Repeat (Max 2.0)</span>
                                  <HelpTooltip id="T29" size="xs" />
                                </span>
                              )}
                              {courseItem.isModified && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                                  Modified
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-[#242824] truncate mt-0.5">
                              {courseItem.courseName}
                            </div>
                          </div>

                          {/* Expected Grade & CGPA Impact Summary */}
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Existing Expected */}
                            <div className="text-right text-xs">
                              <span className="text-[10px] text-[#626962] block">Expected:</span>
                              <span className="font-bold text-[#242824]">
                                {courseItem.originalGrade ? `${courseItem.originalGrade} (${GRADING_SCALE[courseItem.originalGrade]?.gpv.toFixed(1)})` : '—'}
                              </span>
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />

                            {/* Target Display & Reset Button */}
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[10px] text-[#626962] block">Target:</span>
                              <span className={`font-bold px-2 py-0.5 rounded ${courseItem.isModified ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'text-[#242824]'}`}>
                                {courseItem.targetGrade || '—'}
                              </span>
                              {courseItem.isModified && (
                                <button
                                  type="button"
                                  onClick={() => handleResetSingleCourseTarget(courseItem.key, courseItem.originalGrade)}
                                  className="p-1 rounded text-neutral-400 hover:text-neutral-700"
                                  title="Reset this course"
                                  aria-label="Reset this course"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Individual Impact Metrics */}
                            <div className="w-20 text-right text-xs shrink-0">
                              <span className="text-[10px] text-[#626962] block">CGPA Impact:</span>
                              <span className={`font-sans font-tabular font-bold ${
                                courseItem.individualCgpaImpact > 0
                                  ? 'text-emerald-700'
                                  : courseItem.individualCgpaImpact < 0
                                  ? 'text-rose-600'
                                  : 'text-neutral-500'
                              }`}>
                                {courseItem.individualCgpaImpact > 0
                                  ? `+${courseItem.individualCgpaImpact.toFixed(3)}`
                                  : courseItem.individualCgpaImpact < 0
                                  ? courseItem.individualCgpaImpact.toFixed(3)
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Single-tap Horizontal Grade Selector for Course Impact Target */}
                        <div className="pt-2.5 mt-2 border-t border-[#EDF1EC]">
                          <HorizontalGradeSelector
                            value={courseItem.targetGrade}
                            onChange={(g) => handleTargetGradeChange(courseItem.key, g)}
                            isProjected={true}
                            isRepeat={courseItem.isRepeat}
                            isExcused={courseItem.isExcused}
                            size="sm"
                            ariaLabel={`Target grade for ${courseItem.courseCode}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
