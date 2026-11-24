// University of Ruhuna - Faculty of Agriculture
// GradePath — Completely Redesigned Forecast, Goals & Simulator Hub

import React, { useState } from 'react';
import {
  Sliders,
  Target,
  RefreshCw,
  Sparkles,
  Award,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  BookOpen,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { calculateWhatIf, calculateTargetGpa, calculateRepeatImpact } from '../../utils/calculations';
import { Grade, SemesterKey, ComprehensiveGradeStrategy } from '../../types';
import { getDepartmentStyle, GRADING_SCALE } from '../../database';
import { HelpTooltip } from '../common/HelpTooltip';

export const GradeSimulatorView: React.FC = () => {
  const {
    getActiveProfile,
    getOverallStats,
    applyTargetMixPlan,
    clearAppliedTargetMix,
    setActiveTab,
    setSelectedSemesterForCalculator
  } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();

  // 1. What-If State
  const [simulatedGpa, setSimulatedGpa] = useState<number>(3.50);
  const whatIfResult = calculateWhatIf(profile, simulatedGpa);

  // 2. Target GPA & Comprehensive Grade Mix State
  const [targetCgpa, setTargetCgpa] = useState<number>(3.70);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('usual-pace');
  const [showCourseRoster, setShowCourseRoster] = useState<boolean>(true);
  const [showMathCombos, setShowMathCombos] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const targetResult = calculateTargetGpa(profile, targetCgpa);
  const userProfile = targetResult.userProfile;
  const strategies = targetResult.strategies || [];
  const activeStrategy = strategies.find(s => s.id === selectedStrategyId) || strategies[0];

  const handleApplyStrategy = (strategy: ComprehensiveGradeStrategy) => {
    const allocations = strategy.courseAllocations.map(c => ({
      semKey: c.semester,
      courseCode: c.code,
      grade: c.recommendedGrade
    }));
    applyTargetMixPlan(allocations);
    setAppliedToast(`Applied "${strategy.name}" (${allocations.length} courses) as Expected Grades! All views now reflect this target trajectory.`);
    setTimeout(() => setAppliedToast(null), 5500);
  };

  const handleClearApplied = () => {
    clearAppliedTargetMix();
    setAppliedToast('Cleared applied target grades. Courses reverted to unfinalized state.');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  // 3. Repeat Benefit State
  const [selectedRepeatCode, setSelectedRepeatCode] = useState<string>('');
  const [targetRepeatGrade, setTargetRepeatGrade] = useState<Grade>('C');
  const [isExcusedMedical, setIsExcusedMedical] = useState<boolean>(false);

  // Collect graded courses
  const allGradedCourses: Array<{ code: string; name: string; grade: Grade; sem: SemesterKey }> = [];
  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  semKeys.forEach(k => {
    (profile.semesters[k] || []).forEach(c => {
      if (c.grade && !c.isNgpa) {
        allGradedCourses.push({ code: c.code, name: c.name, grade: c.grade, sem: k });
      }
    });
  });

  const repeatResult = selectedRepeatCode
    ? calculateRepeatImpact(profile, selectedRepeatCode, targetRepeatGrade, isExcusedMedical)
    : null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* 1. TOP FORECAST HERO CARD */}
      <div className="rounded-2xl bg-gradient-to-r from-[#17382D] to-[#122A21] text-white p-5 shadow-xs border border-emerald-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-200">
              Predictive Analytics
            </span>
            <span className="text-xs text-emerald-300/70">Scenario Modelling</span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">
              Academic Forecast & Goals
            </h2>
            <HelpTooltip id="T25" size="xs" />
          </div>
        </div>

        <div className="flex items-baseline gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
          <div className="text-3xl font-black font-mono text-white">{stats.cgpa.toFixed(2)}</div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-emerald-200 font-bold">{stats.classStanding}</span>
            <HelpTooltip id="T28" size="xs" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. WHAT-IF PROJECTION SIMULATOR */}
      {/* ======================================================== */}
      <div className="p-7 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-800" />
              <span>What-If Semester Projection</span>
              <HelpTooltip id="T22" size="xs" />
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Drag to see your final graduation standing based on remaining {whatIfResult.remainingCredits} credits:
            </p>
          </div>
          <span className="text-xs font-bold font-mono px-3.5 py-1 rounded-full bg-neutral-100 text-neutral-800">
            {whatIfResult.remainingCredits} Credits Remaining
          </span>
        </div>

        {/* Dynamic Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-neutral-600">Anticipated Average SGPA:</span>
            <span className="text-3xl font-black text-emerald-800 font-mono">{simulatedGpa.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="2.00"
            max="4.00"
            step="0.05"
            value={simulatedGpa}
            onChange={(e) => setSimulatedGpa(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-emerald-800"
          />
          <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
            <span>2.00 (Pass)</span>
            <span>3.00 (2nd Lower)</span>
            <span>3.30 (2nd Upper)</span>
            <span>3.70 (1st Class)</span>
            <span>4.00 (Max)</span>
          </div>
        </div>

        {/* Dynamic Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
            <span className="text-[11px] font-bold uppercase text-neutral-400">Current Cumulative CGPA</span>
            <div className="text-3xl font-black text-neutral-900 font-mono">
              {whatIfResult.currentCgpa.toFixed(2)}
            </div>
            <span className="text-xs text-neutral-500 font-semibold">{stats.classStanding}</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[11px] font-bold uppercase text-emerald-800">Projected Graduation CGPA</span>
            <div className="text-3xl font-black text-emerald-900 font-mono">
              {whatIfResult.projectedCgpa.toFixed(2)}
            </div>
            <span className="text-xs font-bold text-emerald-800">★ {whatIfResult.projectedStanding}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TARGET GPA & HONOURS CLASS SOLVER (COMPREHENSIVE) */}
      {/* ======================================================== */}
      <div className="p-7 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Course & Credit Solvers
              </span>
              <span className="text-xs text-neutral-400 font-semibold">Calibrated to Your Profile</span>
            </div>
            <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2 mt-1">
              <Target className="w-5 h-5 text-emerald-800" />
              <span>Target Class Solver & Comprehensive Grade Mixes</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Generates tailored grade combinations across your real upcoming curriculum courses based on your historical performance:
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`text-xs font-bold px-3.5 py-1 rounded-full border ${
              targetResult.possible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {targetResult.possible ? '✓ Achievable' : '✕ Mathematically Unattainable'}
            </span>
          </div>
        </div>

        {/* Applied Strategy Toast Notification */}
        {appliedToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-900 text-white text-xs flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{appliedToast}</span>
            </div>
            <button
              onClick={() => setAppliedToast(null)}
              className="text-emerald-200 hover:text-white font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 Preset Goal Tiles + Custom Input */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <label className="block text-xs font-bold text-neutral-700">Select Desired Graduation Honours Standing:</label>
            <HelpTooltip id="T23" size="xs" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'First Class Honours', gpa: 3.70, desc: 'CGPA ≥ 3.70' },
              { label: 'Second Upper Division', gpa: 3.30, desc: '3.30 ≤ CGPA < 3.70' },
              { label: 'Second Lower Division', gpa: 3.00, desc: '3.00 ≤ CGPA < 3.30' },
              { label: 'General Pass', gpa: 2.00, desc: '2.00 ≤ CGPA < 3.00' }
            ].map(p => {
              const isSelected = targetCgpa === p.gpa;
              return (
                <button
                  key={p.label}
                  onClick={() => setTargetCgpa(p.gpa)}
                  className={`p-4 rounded-2xl border text-left transition relative overflow-hidden ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                  }`}
                >
                  <span className="text-[11px] font-bold block">{p.label}</span>
                  <span className="text-2xl font-black font-mono mt-1 block">≥ {p.gpa.toFixed(2)}</span>
                  <span className={`text-[10px] mt-0.5 block ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-neutral-500 font-semibold">Or enter custom target CGPA:</span>
            <input
              type="number"
              min="2.00"
              max="4.00"
              step="0.01"
              value={targetCgpa}
              onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 2.0)}
              className="w-24 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-700"
            />
          </div>
        </div>

        {/* USER'S HISTORICAL ENTRIES & PACE ANALYSIS CARD */}
        {userProfile && (
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Calibrated to Your Historical Entries
                </span>
              </div>
              <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                userProfile.feasibilityRating === 'Secured' || userProfile.feasibilityRating === 'Comfortable'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : userProfile.feasibilityRating === 'On Track'
                  ? 'bg-teal-100 text-teal-900 border-teal-300'
                  : userProfile.feasibilityRating === 'Moderate Stretch'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300'
              }`}>
                ● Feasibility: {userProfile.feasibilityRating}
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs">
                <span className="text-[11px] text-neutral-500 font-semibold block">Your Historical Pace</span>
                <span className="text-lg font-black font-mono text-neutral-900 mt-0.5 block">
                  {userProfile.historicalGpa.toFixed(2)} GPV
                </span>
                <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                  {userProfile.usualGradeBand}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs">
                <span className="text-[11px] text-neutral-500 font-semibold block">Required Target Pace</span>
                <span className="text-lg font-black font-mono text-emerald-800 mt-0.5 block">
                  {targetResult.requiredAverageGpa !== undefined ? targetResult.requiredAverageGpa.toFixed(2) : '—'} GPV
                </span>
                <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
                  Across remaining {targetResult.remainingCredits ?? 0} Cr
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs">
                <span className="text-[11px] text-neutral-500 font-semibold block">Required Pace Delta</span>
                <span className={`text-lg font-black font-mono mt-0.5 block ${
                  userProfile.deltaToTarget <= 0 ? 'text-emerald-700' : 'text-neutral-900'
                }`}>
                  {userProfile.deltaToTarget <= 0
                    ? `${userProfile.deltaToTarget.toFixed(2)} GPV (Surplus)`
                    : `+${userProfile.deltaToTarget.toFixed(2)} GPV`}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
                  {userProfile.deltaToTarget <= 0 ? 'Current pace exceeds goal' : 'Uplift needed from usual'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs">
                <span className="text-[11px] text-neutral-500 font-semibold block">Your Historical Data</span>
                <span className="text-lg font-black font-mono text-neutral-900 mt-0.5 block">
                  {userProfile.totalGradedCourses} Modules
                </span>
                <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
                  {userProfile.totalGradedCredits} Completed GPA Cr
                </span>
              </div>
            </div>

            {/* Explanation & Past Frequency Chips */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                {userProfile.feasibilityDescription}
              </p>

              {userProfile.topGrades.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-neutral-500 font-semibold mr-1">Your habitual grade distribution:</span>
                  {userProfile.topGrades.slice(0, 5).map(g => (
                    <span
                      key={g.grade}
                      className="px-2 py-0.5 rounded-lg bg-white border border-neutral-200 font-mono font-bold text-neutral-800"
                    >
                      {g.grade}: {g.count} ({g.percentage}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4 COMPREHENSIVE STRATEGY CARDS */}
        {strategies.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-800" />
                  <span>Comprehensive Grade Mix Strategies (Tailored Pathways)</span>
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Select a strategy to view its course credit breakdown and semester roadmap:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCourseRoster(!showCourseRoster)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{showCourseRoster ? 'Hide Modules' : 'View Course Roster'}</span>
                  {showCourseRoster ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* 4 Strategy Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {strategies.map(s => {
                const isActive = s.id === (activeStrategy?.id || 'usual-pace');
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStrategyId(s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                      isActive
                        ? 'border-emerald-800 bg-emerald-50/70 ring-2 ring-emerald-700/20 shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                          {s.badge}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.difficulty === 'Very High'
                            ? 'bg-rose-100 text-rose-800'
                            : s.difficulty === 'Demanding'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.difficulty}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-neutral-900 mt-2">{s.name}</div>
                      <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                        {s.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-200/80 flex items-baseline justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Achieves:</span>
                      <span className="font-mono font-black text-emerald-900 text-sm">
                        {s.achievedCgpa.toFixed(2)} CGPA
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTIVE STRATEGY DEEP DIVE */}
            {activeStrategy && (
              <div className="p-6 rounded-3xl bg-neutral-900 text-white space-y-6 shadow-md border border-neutral-800">
                {/* Active Strategy Header & Apply CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400 text-neutral-950 uppercase tracking-wider">
                        Active Strategy
                      </span>
                      <span className="text-xs text-emerald-200 font-semibold">{activeStrategy.badge}</span>
                    </div>
                    <h5 className="text-lg font-black text-white">{activeStrategy.name}</h5>
                    <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                      {activeStrategy.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApplyStrategy(activeStrategy)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black shadow-sm flex items-center gap-2 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Apply Strategy to Forecast</span>
                    </button>
                    <button
                      onClick={handleClearApplied}
                      title="Clear applied expected target grades"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Faculty Credit Tiers Breakdown */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Faculty Course Credit Tier Allocation (High-Impact Weighting):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeStrategy.tiers.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-300">{t.tierName}</span>
                          <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            Grade {t.recommendedGrade}
                          </span>
                        </div>
                        <div className="text-2xl font-black font-mono text-white">
                          {t.gpv.toFixed(1)} <span className="text-xs font-normal text-neutral-400">GPV</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 border-t border-white/5 pt-1.5 flex justify-between">
                          <span>{t.courseCount} Courses ({t.totalCredits} Cr)</span>
                          <span className="text-emerald-300/80 font-medium">{t.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Semester Milestone Roadmap */}
                {activeStrategy.semesterRoadmap.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                      Target Semester SGPA Roadmap (Paced Milestones):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {activeStrategy.semesterRoadmap.map(sem => (
                        <div
                          key={sem.semester}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 text-center space-y-1"
                        >
                          <span className="text-[11px] font-bold text-neutral-300 block">Sem {sem.semester}</span>
                          <span className="text-lg font-black font-mono text-emerald-400 block">
                            {sem.targetSgpa.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-neutral-400 block font-medium">
                            {sem.credits} Cr ({sem.courseCount} courses)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade Counts Summary */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs">
                  <span className="text-neutral-400 font-semibold mr-1">Grades Required under this Strategy:</span>
                  {Object.entries(activeStrategy.gradesBreakdown).map(([grade, info]) => (
                    <span
                      key={grade}
                      className="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-bold text-emerald-200 border border-white/10"
                    >
                      {grade}: {info?.count} course(s) [{info?.credits} Cr]
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* EXPANDABLE COURSE-BY-COURSE TARGET ROSTER */}
            {showCourseRoster && activeStrategy && activeStrategy.courseAllocations.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200 gap-2">
                  <div>
                    <h5 className="text-sm font-black text-neutral-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-800" />
                      <span>Upcoming Curriculum Modules with Target Grade Assignments</span>
                    </h5>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Actual courses from your degree curriculum ({activeStrategy.courseAllocations.length} uncompleted modules):
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    Total {activeStrategy.courseAllocations.reduce((sum, c) => sum + c.credits, 0)} Credits
                  </span>
                </div>

                <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto pr-1">
                  {activeStrategy.courseAllocations.map(c => {
                    const deptStyle = getDepartmentStyle(c.dept);
                    return (
                      <div
                        key={`${c.semester}:${c.code}`}
                        className="py-2.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50 rounded-xl transition text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono border border-neutral-200">
                            Sem {c.semester}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}>
                            {c.dept || 'CC'}
                          </span>
                          <span className="font-mono font-bold text-neutral-900">{c.code}</span>
                          <span className="text-neutral-600 truncate">{c.name}</span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            c.credits >= 6
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : c.credits === 3
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}>
                            {c.credits >= 6 ? 'Capstone (6 Cr)' : `${c.credits} Cr`}
                          </span>

                          <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Grade {c.recommendedGrade} ({c.recommendedGpv.toFixed(1)})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABSTRACT COMBINATIONS TOGGLE (FOR MATHEMATICAL REFERENCE) */}
        {targetResult.combinations && targetResult.combinations.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowMathCombos(!showMathCombos)}
              className="text-xs text-neutral-500 hover:text-neutral-800 font-semibold flex items-center gap-1.5"
            >
              <span>{showMathCombos ? '▲ Hide' : '▼ View'} Abstract 2-Grade Mathematical Mixes (Legacy reference)</span>
            </button>

            {showMathCombos && (
              <div className="mt-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="text-[11px] text-neutral-500 font-semibold block">
                  Generic linear equation solutions (assuming uniform 2-credit blocks):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {targetResult.combinations.map((c, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white border border-neutral-200 text-xs space-y-1.5 shadow-xs">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-neutral-900">Combination {i + 1}</span>
                        <span className="text-emerald-800 font-bold">{c.difficulty}</span>
                      </div>
                      <div className="text-emerald-800 font-bold">{c.summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. REPEAT BENEFIT ENGINE */}
      {/* ======================================================== */}
      <div className="p-7 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-5">
        <div className="pb-3 border-b border-neutral-200">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-800" />
            <span>Repeat Grade Upgrade Benefit</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Under Faculty regulations, repeats are capped at Grade C (2.0 GPV) unless excused with Senate medical certificate
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1">Select Course to Retake:</label>
            <select
              value={selectedRepeatCode}
              onChange={(e) => setSelectedRepeatCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-800 focus:outline-none"
            >
              <option value="">— Select registered course —</option>
              {allGradedCourses.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} • {c.name} [Grade: {c.grade}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Target Raw Grade:</label>
            <select
              value={targetRepeatGrade}
              onChange={(e) => setTargetRepeatGrade(e.target.value as Grade)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 focus:outline-none"
            >
              <option value="A+">A+ (4.0)</option>
              <option value="A">A (4.0)</option>
              <option value="A-">A- (3.7)</option>
              <option value="B+">B+ (3.3)</option>
              <option value="B">B (3.0)</option>
              <option value="C">C (2.0) [Standard Cap]</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="medExcuseCheck"
            checked={isExcusedMedical}
            onChange={(e) => setIsExcusedMedical(e.target.checked)}
            className="accent-emerald-800 rounded"
          />
          <label htmlFor="medExcuseCheck" className="text-xs text-neutral-600 font-semibold cursor-pointer">
            Senate-approved medical / bereavement excuse (lifts the 2.0 grade cap)
          </label>
        </div>

        {repeatResult && (
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-neutral-900">{repeatResult.courseCode}</span>: {repeatResult.oldGrade} ({repeatResult.oldGpv.toFixed(1)}) ➔ {repeatResult.targetGrade} ({repeatResult.newGpv.toFixed(1)} GPV)
            </div>
            <div className="text-right">
              <span className="font-black text-emerald-800 font-mono text-sm">
                +{repeatResult.deltaCgpa.toFixed(2)} CGPA ({repeatResult.currentCgpa.toFixed(2)} ➔ {repeatResult.projectedCgpa.toFixed(2)})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
