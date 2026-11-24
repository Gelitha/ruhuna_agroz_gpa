// University of Ruhuna - Faculty of Agriculture
// Academic Projection View — Smart Multi-Semester Forecasting & Examination Cockpit

import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  Target,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { SemesterKey, Grade, AcademicSemesterStatus } from '../../types';
import { calculateRequiredGpaForTarget } from '../../utils/projectionCalculations';
import { GpaJourneyBar } from './GpaJourneyBar';
import { ResultReleaseTracker } from './ResultReleaseTracker';
import { ProjectionCourseCard } from './ProjectionCourseCard';
import { AppLogo } from '../common/AppLogo';
import { DEGREE_INFO } from '../../database';

const ALL_SEMESTERS: Array<{ key: SemesterKey; label: string }> = [
  { key: '1-1', label: 'Semester 1-1' },
  { key: '1-2', label: 'Semester 1-2' },
  { key: '2-1', label: 'Semester 2-1' },
  { key: '2-2', label: 'Semester 2-2' },
  { key: '3-1', label: 'Semester 3-1' },
  { key: '3-2', label: 'Semester 3-2' },
  { key: '4-1', label: 'Semester 4-1' },
  { key: '4-2', label: 'Semester 4-2' }
];

export const AcademicProjectionView: React.FC = () => {
  const {
    getActiveProfile,
    getAcademicProjections,
    setCurrentSemester,
    setAcademicSemesterStatus,
    setCoursePredictedGrade,
    setCourseTargetGrade,
    setCourseExamStatus,
    setProjectionQuickAssumptions,
    setProjectionTargetCgpa,
    resetCourseProjection,
    resetSemesterProjections,
    resetAllProjections,
    setActiveTab
  } = useGradeStore();

  const profile = getActiveProfile();
  const projection = getAcademicProjections();

  // Mode Selection: 'course' | 'quick' | 'target'
  const [activeMode, setActiveMode] = useState<'course' | 'quick' | 'target'>('course');

  // Active Scenario Selection: 'expected' | 'best' | 'worst' | 'actual'
  const [activeScenario, setActiveScenario] = useState<'expected' | 'best' | 'worst' | 'actual'>('expected');

  // Expanded Semesters in Section B
  const [expandedSemesters, setExpandedSemesters] = useState<Record<SemesterKey, boolean>>({
    '1-1': false,
    '1-2': true,
    '2-1': true,
    '2-2': false,
    '3-1': false,
    '3-2': false,
    '4-1': false,
    '4-2': false
  });

  // Mode 2 Quick Assumptions Slider State
  const [prevAvgGpa, setPrevAvgGpa] = useState<number>(
    profile.projectionQuickAssumptions?.remainingPrevAvgGpa ?? 3.4
  );
  const [currentAvgGpa, setCurrentAvgGpa] = useState<number>(
    profile.projectionQuickAssumptions?.currentSemAvgGpa ?? 3.5
  );

  // Mode 3 Target CGPA State
  const [targetCgpaInput, setTargetCgpaInput] = useState<number>(
    profile.projectionTargetCgpa ?? 3.70
  );

  const toggleSemesterExpand = (key: SemesterKey) => {
    setExpandedSemesters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentSem = profile.currentSemester || '1-1';
  const totalDegreeCredits = DEGREE_INFO[profile.degree]?.totalMinGpaCredits || 126;

  // Calculate Target CGPA feasibility
  const targetFeasibility = calculateRequiredGpaForTarget(
    projection.actualCgpa,
    projection.actualGpaCredits,
    totalDegreeCredits,
    targetCgpaInput
  );

  // Pending Previous Semesters List
  const pendingSemesters = ALL_SEMESTERS.filter(s => {
    const summary = projection.semesterSummaries[s.key];
    const currentIndex = ALL_SEMESTERS.findIndex(sem => sem.key === currentSem);
    const thisIndex = ALL_SEMESTERS.findIndex(sem => sem.key === s.key);
    return thisIndex < currentIndex && summary && summary.pendingResultsCount > 0;
  });

  // Current Semester Courses
  const currentSemesterCourses = profile.semesters[currentSem] || [];
  const currentSemesterGpaCourses = currentSemesterCourses.filter(c => !c.isNgpa);

  // Active displayed CGPA based on selected scenario
  const displayedScenarioCgpa =
    activeScenario === 'actual'
      ? projection.scenarios.actualOnly
      : activeScenario === 'best'
      ? projection.scenarios.bestCase
      : activeScenario === 'worst'
      ? projection.scenarios.worstCase
      : projection.scenarios.expected;

  return (
    <div className="max-w-[1440px] mx-auto pb-16 space-y-5">
      {/* ======================================================== */}
      {/* SECTION A — ACADEMIC OVERVIEW BANNER                     */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-[#103B2D] via-[#174E38] to-[#123324] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-700/50 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <AppLogo size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  {profile.degree} (Hons)
                </span>
                <span className="text-xs text-emerald-200 font-semibold">
                  {profile.name}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Smart Academic Projection
              </h1>
              <p className="text-xs text-emerald-200/90 leading-tight">
                Simultaneous multi-semester forecasting accommodating unreleased past results &amp; upcoming exams
              </p>
            </div>
          </div>

          {/* Current Academic Semester Selector */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center justify-between gap-3 shrink-0">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                Current Studying Semester:
              </div>
              <select
                value={currentSem}
                onChange={(e) => setCurrentSemester(e.target.value as SemesterKey)}
                aria-label="Select Current Academic Semester"
                className="bg-transparent text-sm font-extrabold text-white cursor-pointer focus:outline-none"
              >
                {ALL_SEMESTERS.map(s => (
                  <option key={s.key} value={s.key} className="text-neutral-900 font-bold">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setActiveTab('calculator')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
            >
              Open Cockpit
            </button>
          </div>
        </div>

        {/* 4 Overview Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/15">
          {/* Metric 1: Actual Confirmed CGPA */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 flex items-center justify-between">
              <span>Actual CGPA</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            </span>
            <div className="font-mono font-black text-2xl text-white font-tabular">
              {projection.actualCgpa > 0 ? projection.actualCgpa.toFixed(2) : '—'}
            </div>
            <span className="text-[11px] text-emerald-200/80 font-medium truncate block">
              {projection.actualGpaCredits} Confirmed Credits
            </span>
          </div>

          {/* Metric 2: Projected CGPA */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 flex items-center justify-between">
              <span>Projected CGPA</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </span>
            <div className="font-mono font-black text-2xl text-white font-tabular">
              {projection.combinedProjectedCgpa > 0 ? projection.combinedProjectedCgpa.toFixed(2) : '—'}
            </div>
            <span className="text-[11px] text-emerald-200 font-medium truncate block">
              After Sem {currentSem} ({projection.combinedTotalCredits} Cr)
            </span>
          </div>

          {/* Metric 3: Pending Results Count */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 flex items-center justify-between">
              <span>Pending Results</span>
              <Clock className="w-3.5 h-3.5 text-amber-300" />
            </span>
            <div className="font-mono font-black text-2xl text-white font-tabular">
              {projection.pendingResultsCount}
            </div>
            <span className="text-[11px] text-emerald-200/80 font-medium truncate block">
              From previous semesters
            </span>
          </div>

          {/* Metric 4: Projection Coverage */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 flex items-center justify-between">
              <span>Projection Coverage</span>
              <Award className="w-3.5 h-3.5 text-emerald-300" />
            </span>
            <div className="font-mono font-black text-2xl text-white font-tabular">
              {projection.projectionCoveragePercent}%
            </div>
            <span className="text-[11px] text-emerald-200/80 font-medium truncate block">
              {projection.isCurrentSemComplete ? 'Full Semester Covered ✓' : 'Partial Estimation'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION E — YOUR GPA JOURNEY VISUALIZATION               */}
      {/* ======================================================== */}
      <GpaJourneyBar
        actualCgpa={projection.actualCgpa}
        projectedPendingCgpa={projection.projectedCgpaPending}
        combinedProjectedCgpa={projection.combinedProjectedCgpa}
        targetCgpa={targetCgpaInput}
        pendingCount={projection.pendingResultsCount}
        currentSemester={currentSem}
      />

      {/* ======================================================== */}
      {/* SCENARIOS BAR (Actual / Expected / Best / Worst)         */}
      {/* ======================================================== */}
      <div className="bg-white border border-[#DCDDD7] rounded-2xl p-3.5 sm:p-4 shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#626962] uppercase tracking-wider">
            Scenario View:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveScenario('expected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                activeScenario === 'expected'
                  ? 'bg-[#103B2D] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Expected ({projection.scenarios.expected.toFixed(2)})
            </button>
            <button
              onClick={() => setActiveScenario('best')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                activeScenario === 'best'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Best Case ({projection.scenarios.bestCase.toFixed(2)})
            </button>
            <button
              onClick={() => setActiveScenario('worst')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                activeScenario === 'worst'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Worst Case ({projection.scenarios.worstCase.toFixed(2)})
            </button>
            <button
              onClick={() => setActiveScenario('actual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                activeScenario === 'actual'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Confirmed Only ({projection.scenarios.actualOnly.toFixed(2)})
            </button>
          </div>
        </div>

        <button
          onClick={resetAllProjections}
          className="text-xs font-bold text-neutral-500 hover:text-rose-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition"
          title="Reset all predicted and target grades"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Predictions</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3 PROJECTION MODES SELECTOR TABS                         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[#F8F8F4] border border-[#DCDDD7] rounded-2xl text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveMode('course')}
          className={`py-2.5 rounded-xl transition min-h-[44px] flex items-center justify-center gap-1.5 ${
            activeMode === 'course'
              ? 'bg-white text-[#176B45] shadow-xs'
              : 'text-[#626962] hover:text-[#242824]'
          }`}
        >
          <span>Course-by-Course</span>
        </button>
        <button
          onClick={() => setActiveMode('quick')}
          className={`py-2.5 rounded-xl transition min-h-[44px] flex items-center justify-center gap-1.5 ${
            activeMode === 'quick'
              ? 'bg-white text-[#176B45] shadow-xs'
              : 'text-[#626962] hover:text-[#242824]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Quick Assumptions</span>
        </button>
        <button
          onClick={() => setActiveMode('target')}
          className={`py-2.5 rounded-xl transition min-h-[44px] flex items-center justify-center gap-1.5 ${
            activeMode === 'target'
              ? 'bg-white text-[#176B45] shadow-xs'
              : 'text-[#626962] hover:text-[#242824]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Target CGPA</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODE 2: QUICK ASSUMPTIONS SLIDERS                        */}
      {/* ======================================================== */}
      {activeMode === 'quick' && (
        <div className="bg-white border border-[#DCDDD7] rounded-2xl p-5 shadow-subtle space-y-4">
          <div className="border-b border-[#EDF1EC] pb-2">
            <h3 className="text-sm font-extrabold text-[#242824]">
              Quick Average GPA Projections
            </h3>
            <p className="text-xs text-[#626962]">
              Set separate average GPA estimates for outstanding previous results and current semester examinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Slider 1: Previous Semester Pending Credits */}
            <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#242824]">Pending Previous Semesters:</span>
                <span className="font-mono text-base font-black text-[#176B45]">{prevAvgGpa.toFixed(2)} SGPA</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="4.00"
                step="0.05"
                value={prevAvgGpa}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPrevAvgGpa(val);
                  setProjectionQuickAssumptions({
                    remainingPrevAvgGpa: val,
                    currentSemAvgGpa: currentAvgGpa
                  });
                }}
                className="w-full accent-[#176B45] cursor-pointer h-2 bg-neutral-200 rounded-lg min-h-[36px]"
              />
              <p className="text-[11px] text-[#626962]">
                Applied to all courses without confirmed grades in completed semesters.
              </p>
            </div>

            {/* Slider 2: Current Semester Credits */}
            <div className="p-4 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#242824]">Current Semester ({currentSem}):</span>
                <span className="font-mono text-base font-black text-[#176B45]">{currentAvgGpa.toFixed(2)} SGPA</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="4.00"
                step="0.05"
                value={currentAvgGpa}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentAvgGpa(val);
                  setProjectionQuickAssumptions({
                    remainingPrevAvgGpa: prevAvgGpa,
                    currentSemAvgGpa: val
                  });
                }}
                className="w-full accent-[#176B45] cursor-pointer h-2 bg-neutral-200 rounded-lg min-h-[36px]"
              />
              <p className="text-[11px] text-[#626962]">
                Applied to unresolved courses in Semester {currentSem}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: TARGET CGPA CALCULATOR & FEASIBILITY             */}
      {/* ======================================================== */}
      {activeMode === 'target' && (
        <div className="bg-white border border-[#DCDDD7] rounded-2xl p-5 shadow-subtle space-y-4">
          <div className="border-b border-[#EDF1EC] pb-2">
            <h3 className="text-sm font-extrabold text-[#242824]">
              Target Cumulative GPA Planner
            </h3>
            <p className="text-xs text-[#626962]">
              Determine required average grades across remaining graduation credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-5 space-y-2">
              <label className="block text-xs font-bold text-[#626962]">
                Desired Cumulative Target GPA:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="2.00"
                  max="4.00"
                  step="0.01"
                  value={targetCgpaInput}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setTargetCgpaInput(val);
                    setProjectionTargetCgpa(val);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-[#DCDDD7] font-mono font-black text-lg text-[#242824] w-36 focus:outline-none focus:border-[#176B45] min-h-[44px]"
                />
                <div className="flex gap-1.5">
                  {[3.70, 3.30, 3.00].map(tier => (
                    <button
                      key={tier}
                      onClick={() => {
                        setTargetCgpaInput(tier);
                        setProjectionTargetCgpa(tier);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#F8F8F4] border border-[#DCDDD7] hover:border-[#176B45] text-[#242824] transition min-h-[36px]"
                    >
                      {tier.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feasibility Result Box */}
            <div className={`md:col-span-7 p-4 rounded-xl border space-y-1.5 ${
              targetFeasibility.possible
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/70 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span>{targetFeasibility.possible ? 'Target Feasible' : 'Target Mathematically Unreachable'}</span>
                {targetFeasibility.possible && (
                  <span className="font-mono text-sm font-black text-[#176B45]">
                    Required Avg: {targetFeasibility.requiredAverage.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed">
                {targetFeasibility.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION C — PENDING PREVIOUS SEMESTER RESULTS            */}
      {/* ======================================================== */}
      {pendingSemesters.length > 0 && (
        <div className="bg-amber-50/40 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              <div>
                <h3 className="text-sm font-extrabold text-amber-950">
                  Unreleased Results from Completed Semesters
                </h3>
                <p className="text-xs text-amber-800">
                  Examinations completed but university results pending. Set predictions below.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
              Projected CGPA: {projection.projectedCgpaPending.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3">
            {pendingSemesters.map(s => {
              const semCourses = profile.semesters[s.key] || [];
              const pendingCourses = semCourses.filter(c => !c.isNgpa && !c.grade);

              return (
                <div key={s.key} className="space-y-2">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    {s.label} ({pendingCourses.length} pending)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingCourses.map(c => {
                      const projKey = `${s.key}:${c.code}`;
                      const projData = profile.courseProjections?.[projKey];

                      return (
                        <ProjectionCourseCard
                          key={c.code}
                          course={c}
                          semesterKey={s.key}
                          projection={projData}
                          isCurrentSemester={false}
                          onSetPredictedGrade={(g) => setCoursePredictedGrade(s.key, c.code, g)}
                          onSetTargetGrade={(g) => setCourseTargetGrade(s.key, c.code, g)}
                          onSetExamStatus={(status) => setCourseExamStatus(s.key, c.code, status)}
                          onResetProjection={() => resetCourseProjection(s.key, c.code)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION D — CURRENT SEMESTER TARGETS & COURSES           */}
      {/* ======================================================== */}
      <div className="bg-white border border-[#DCDDD7] rounded-2xl p-4 sm:p-5 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EDF1EC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#242824]">
                Current Semester {currentSem} Course Plan
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#176B45]">
                {currentSemesterGpaCourses.length} Courses
              </span>
            </div>
            <p className="text-xs text-[#626962]">
              Set expected target grades before exams, or update predictions as you sit papers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-[#626962]">
              Expected SGPA:{' '}
              <span className="text-sm font-black text-[#176B45]">
                {projection.currentSemProjectedSgpa > 0 ? projection.currentSemProjectedSgpa.toFixed(2) : '—'}
              </span>
            </span>
          </div>
        </div>

        {/* Current Semester Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentSemesterGpaCourses.map(course => {
            const projKey = `${currentSem}:${course.code}`;
            const projData = profile.courseProjections?.[projKey];

            return (
              <ProjectionCourseCard
                key={course.code}
                course={course}
                semesterKey={currentSem}
                projection={projData}
                isCurrentSemester={true}
                onSetPredictedGrade={(g) => setCoursePredictedGrade(currentSem, course.code, g)}
                onSetTargetGrade={(g) => setCourseTargetGrade(currentSem, course.code, g)}
                onSetExamStatus={(status) => setCourseExamStatus(currentSem, course.code, status)}
                onResetProjection={() => resetCourseProjection(currentSem, course.code)}
              />
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 13 — EXAMINATION PREPARATION SUPPORT IMPACT     */}
      {/* ======================================================== */}
      {projection.courseImpacts.length > 0 && (
        <div className="bg-white border border-[#DCDDD7] rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3">
          <div className="border-b border-[#EDF1EC] pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#242824]">
                Examination Preparation: Priority Course Impact
              </h3>
              <p className="text-xs text-[#626962]">
                Courses where performance has the highest mathematical leverage on your graduation CGPA
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {projection.courseImpacts.slice(0, 6).map(impact => (
              <div
                key={impact.courseCode}
                className="p-3 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="font-mono text-[#242824]">{impact.courseCode}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono">
                    +{impact.cgpaGain} CGPA
                  </span>
                </div>
                <div className="text-xs text-[#242824] font-semibold truncate" title={impact.courseName}>
                  {impact.courseName}
                </div>
                <p className="text-[11px] text-[#626962] leading-tight">
                  {impact.advice}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 14 — RESULT-RELEASE TRACKER                     */}
      {/* ======================================================== */}
      <ResultReleaseTracker
        summaries={projection.semesterSummaries}
        currentSemester={currentSem}
      />

      {/* ======================================================== */}
      {/* SECTION 15 — HISTORICAL PREDICTION ACCURACY REPORT       */}
      {/* ======================================================== */}
      {projection.accuracyReport.totalCompared > 0 && (
        <div className="bg-white border border-[#DCDDD7] rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3">
          <div className="border-b border-[#EDF1EC] pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#242824]">
                Prediction Accuracy &amp; Calibration
              </h3>
              <p className="text-xs text-[#626962]">
                Comparison between your earlier predictions and confirmed university results
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {projection.accuracyReport.accuracyPercentage}% Exact Matches
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC]">
              <span className="text-[#626962]">Compared Courses</span>
              <div className="font-mono font-bold text-base text-[#242824]">
                {projection.accuracyReport.totalCompared}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC]">
              <span className="text-[#626962]">Average Error</span>
              <div className="font-mono font-bold text-base text-[#242824]">
                {projection.accuracyReport.averageErrorGpv.toFixed(2)} GPV
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8F8F4] border border-[#EDF1EC]">
              <span className="text-[#626962]">Net Calibration Bias</span>
              <div className="font-mono font-bold text-base text-[#242824]">
                {projection.accuracyReport.netGpvBias > 0
                  ? `+${projection.accuracyReport.netGpvBias} (Slightly Optimistic)`
                  : projection.accuracyReport.netGpvBias < 0
                  ? `${projection.accuracyReport.netGpvBias} (Conservative)`
                  : 'Balanced'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 20 — ACADEMIC CLASSIFICATION SAFEGUARDS          */}
      {/* ======================================================== */}
      <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-300 text-xs text-neutral-600 space-y-1 leading-relaxed">
        <div className="font-bold text-neutral-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#176B45]" />
          <span>Academic Classification Safeguards</span>
        </div>
        <p>
          All projections, forecasts and target calculations presented on this page are hypothetical estimates designed for personal study planning. Official degree awards and class standing remain subject to formal Faculty of Agriculture Senate confirmation, course registration eligibility, Dean's Office audit and all graduation regulations.
        </p>
      </div>
    </div>
  );
};
