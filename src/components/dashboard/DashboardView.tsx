// University of Ruhuna - Faculty of Agriculture
// GradePath Academic Dashboard View — Fully Responsive Multi-Device Command Center
// Features: Responsive Breakpoints, Previous Semesters SGPA Tracking, Real-Time Alerts

import { AppLogo } from '../common/AppLogo';

import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Compass,
  FileText,
  Sliders,
  Sparkles,
  Target,
  Clock,
  Layers,
  Edit3,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useGradeStore } from '../../store/useGradeStore';
import { DEGREE_INFO } from '../../database';
import { SemesterKey } from '../../types';
import { getOrdinalYear } from '../../utils/calculations';

export const DashboardView: React.FC = () => {
  const {
    getActiveProfile,
    getOverallStats,
    getAcademicProjections,
    getRiskAlerts,
    setActiveTab,
    setSelectedSemesterForCalculator,
    setShowOnboarding,
    openProfileModal,
    startGuidedSetup,
    dismissGuidedSetup,
    finishGuidedSetup
  } = useGradeStore();

  const profile = getActiveProfile();
  const stats = getOverallStats();
  const proj = getAcademicProjections();
  const alerts = getRiskAlerts();
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  const currentYear = profile.currentAcademicYear || 1;
  const currentDeansHonor = stats.deansHonors[currentYear];

  // Check whether any projected grades exist
  const hasProjections = stats.hasExpectedCourses || (proj && proj.combinedTotalCredits > proj.actualGpaCredits) || (stats.projectedCreditsAttempted ?? 0) > 0;
  const projectedCgpa = proj && proj.combinedTotalCredits > 0 ? proj.combinedProjectedCgpa : (stats.projectedCgpa ?? stats.cgpa);
  const projectedCredits = stats.projectedCreditsAttempted ?? (proj ? Math.max(0, proj.combinedTotalCredits - proj.actualGpaCredits) : 0);
  const deltaCgpa = proj ? proj.deltaCombined : (stats.deltaCgpa ?? 0);

  const handleOpenSemester = (semKey: SemesterKey) => {
    setSelectedSemesterForCalculator(semKey);
    setActiveTab('calculator');
  };

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const currentIdx = semKeys.indexOf(profile.currentSemester);
  const previousSemesters = semKeys.slice(0, currentIdx);
  const missingPrevious = previousSemesters.filter(k => stats.semStats[k].gpaCreditsAttempted === 0);

  // Applicable semesters for initial setup guidance
  const applicableSemesters: SemesterKey[] = currentIdx <= 0 ? ['1-1'] : semKeys.slice(0, currentIdx);

  const getSemesterGradeStatus = (sk: SemesterKey) => {
    const courses = profile.semesters[sk] || [];
    let confirmed = 0;
    let projected = 0;
    let empty = 0;
    for (const c of courses) {
      if (c.grade) {
        if (c.isExpected) projected++;
        else confirmed++;
      } else {
        empty++;
      }
    }
    const isReviewed = (profile.guidedSetup?.reviewedSemesters || []).includes(sk);
    return { total: courses.length, confirmed, projected, empty, isReviewed };
  };

  const reviewedCount = applicableSemesters.filter(sk => {
    const st = getSemesterGradeStatus(sk);
    return st.isReviewed || st.confirmed > 0;
  }).length;
  const setupProgressPercent = Math.round((reviewedCount / applicableSemesters.length) * 100);

  const earliestEmptySem = applicableSemesters.find(sk => {
    const st = getSemesterGradeStatus(sk);
    return st.empty > 0;
  }) || applicableSemesters[0];

  // Dynamic Dashboard guidance state (Requirement 8)
  const totalGradedCourses = semKeys.reduce((acc, sk) => acc + (profile.semesters[sk] || []).filter(c => c.grade).length, 0);
  const isSetupCompleted = Boolean(profile.guidedSetup?.completed);
  const isSetupDismissed = Boolean(profile.guidedSetup?.dismissed);
  const showGettingStartedCard = !isSetupCompleted && !isSetupDismissed;

  let dynamicGuidanceMessage = '';
  if (isSetupCompleted) {
    dynamicGuidanceMessage = 'Your academic profile is ready.';
  } else if (totalGradedCourses === 0) {
    dynamicGuidanceMessage = 'Add your academic results to calculate your GPA.';
  } else if (missingPrevious.length > 0) {
    dynamicGuidanceMessage = 'Some previous semester results are still missing. Add them when available.';
  } else {
    dynamicGuidanceMessage = 'Continue entering your available semester results.';
  }

  // Data for GPA Trend Chart
  const trendData = semKeys
    .map(key => {
      const s = stats.semStats[key];
      return {
        name: `Sem ${key}`,
        sgpa: s.gpaCreditsAttempted > 0 ? Number(s.sgpa.toFixed(2)) : null,
        credits: s.gpaCreditsEarned
      };
    })
    .filter(d => d.sgpa !== null);

  const totalCreditsPercent = Math.min(100, Math.round((stats.totalGpaCreditsEarned / stats.totalRequiredCredits) * 100));

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-2 md:px-0">
      {/* ======================================================== */}
      {/* 1. RESPONSIVE WELCOME COMMAND BAR                        */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 shadow-xs">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AppLogo size="sm" />
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-emerald-800 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100 border border-emerald-300 truncate">
              {profile.degree} (Hons) Undergraduate
            </span>
            <span className="text-xs sm:text-sm text-neutral-500 font-semibold flex items-center gap-1.5">
              <span>{getOrdinalYear(profile.currentAcademicYear)} • Sem {profile.currentSemester}</span>
              <button
                onClick={() => openProfileModal('edit')}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 text-xs ml-1"
                title="Change degree or semester"
              >
                <Edit3 className="w-3 h-3" />
                <span className="hidden xs:inline">Change</span>
              </button>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 tracking-tight truncate">
            Welcome back, {profile.name}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 truncate">
            {degInfo.name} {profile.registrationNumber ? `• ${profile.registrationNumber}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={() => handleOpenSemester(profile.currentSemester)}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.01]"
          >
            <span>Enter Sem {profile.currentSemester} Grades</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
            title="View printable transcript"
          >
            <FileText className="w-4 h-4 text-neutral-600 shrink-0" />
            <span>Transcript</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PERSONALIZED GETTING STARTED ONBOARDING CARD          */}
      {/* ======================================================== */}
      {showGettingStartedCard && (
        <div className="p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 border-2 border-emerald-300/80 shadow-sm space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-emerald-800">
                  Getting Started
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Let's set up your academic results
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {profile.currentSemester === '1-1'
                  ? 'Welcome! Add your academic results to calculate your actual CGPA.'
                  : 'Welcome! Add your previous semester results to calculate your actual CGPA.'}
              </p>
            </div>
            <button
              onClick={dismissGuidedSetup}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 p-2 rounded-xl hover:bg-neutral-100 transition shrink-0 min-h-[44px] flex items-center gap-1 touch-manipulation"
              title="I'll do this later"
              aria-label="I'll do this later"
            >
              <span className="hidden xs:inline">I'll Do This Later</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Setup Progress */}
          <div className="space-y-1.5 bg-white/80 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
              <span>Setup Progress</span>
              <span className="text-emerald-800 font-mono">
                {reviewedCount} of {applicableSemesters.length} semesters reviewed ({setupProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/80">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${setupProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Applicable Semesters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {applicableSemesters.map(sk => {
              const st = getSemesterGradeStatus(sk);
              const isDone = st.confirmed === st.total && st.total > 0;
              const hasGrades = st.confirmed > 0;
              const isReviewed = st.isReviewed;

              return (
                <div
                  key={sk}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : hasGrades
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isReviewed
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs sm:text-sm font-black text-neutral-900 truncate">
                      Semester {sk}
                    </div>
                    <div className="text-[11px] font-semibold truncate">
                      {isDone ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>All {st.total} graded</span>
                        </span>
                      ) : hasGrades ? (
                        <span className="text-emerald-700">
                          {st.confirmed} of {st.total} graded
                        </span>
                      ) : st.projected > 0 ? (
                        <span className="text-blue-700">
                          {st.projected} projected
                        </span>
                      ) : isReviewed ? (
                        <span className="text-amber-700">
                          Reviewed (Pending)
                        </span>
                      ) : (
                        <span className="text-neutral-500">
                          Not started ({st.total} courses)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenSemester(sk)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shrink-0 min-h-[44px] flex items-center gap-1.5 transition shadow-2xs touch-manipulation active:scale-95"
                    aria-label={`Semester ${sk} ${hasGrades ? 'Edit' : 'Add Grades'}`}
                  >
                    <span>{hasGrades ? 'Edit' : 'Add Grades'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Primary Action Button Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              onClick={() => handleOpenSemester(earliestEmptySem)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.01] min-h-[44px] touch-manipulation active:scale-95"
            >
              <span>{reviewedCount > 0 ? 'Continue Setup' : 'Start Entering Grades'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={dismissGuidedSetup}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs sm:text-sm font-bold min-h-[44px] transition touch-manipulation text-center"
            >
              I'll Do This Later
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RESUME SETUP BANNER (WHEN DISMISSED WITH MISSING GRADES)  */}
      {/* ======================================================== */}
      {!showGettingStartedCard && !isSetupCompleted && missingPrevious.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-amber-900 flex flex-wrap items-center gap-1.5">
                <span>{dynamicGuidanceMessage}</span>
                <span className="font-mono font-black text-amber-950 bg-amber-200/80 px-2 py-0.2 rounded-md">
                  {missingPrevious.map(s => `Sem ${s}`).join(', ')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                You are currently in Semester {profile.currentSemester}. Enter your official previous semester grades to compute your true Cumulative CGPA.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenSemester(earliestEmptySem)}
            className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition self-start sm:self-auto shadow-xs min-h-[44px] touch-manipulation"
          >
            <span>Continue Setup</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SETUP COMPLETED BANNER                                    */}
      {/* ======================================================== */}
      {isSetupCompleted && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Your academic profile is ready. Official results are used for all GPA calculations.</span>
          </div>
          <button
            onClick={() => handleOpenSemester(profile.currentSemester)}
            className="text-emerald-800 hover:text-emerald-950 text-xs font-black underline shrink-0 min-h-[44px] flex items-center"
          >
            Open Calculator &gt;
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. 4 CORE KPI METRICS (BIG NUMBERS & FLUID RESPONSIVE)    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {/* Metric 1: BIG CUMULATIVE GPA */}
        <div
          onClick={() => setActiveTab('calculator')}
          className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-500 hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Cumulative GPA
            </span>
            <span
              className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
              style={{ backgroundColor: stats.classBadgeColor }}
              title={stats.classStanding}
            />
          </div>
          <div className="my-2.5 sm:my-3">
            <div className="text-3xl sm:text-4xl xl:text-5xl font-black font-mono text-neutral-900 tracking-tight">
              {stats.totalGpaCreditsAttempted > 0 ? stats.cgpa.toFixed(2) : '—'}
              <span className="text-sm sm:text-base font-semibold text-neutral-400 ml-1.5">/ 4.00</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="text-[11px] sm:text-xs font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-2xs border truncate"
                style={{
                  backgroundColor: `${stats.classBadgeColor}15`,
                  color: stats.classBadgeColor,
                  borderColor: `${stats.classBadgeColor}40`
                }}
              >
                ★ {stats.classStanding}
              </span>
            </div>

            {/* SEPARATE PROJECTED CGPA (ESTIMATE) - ONLY DISPLAYED WHEN PROJECTIONS EXIST */}
            {hasProjections && (
              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                    <span>Projected:</span>
                    <span className="font-mono font-black">{projectedCgpa.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">(Est.)</span>
                  </span>
                  {deltaCgpa !== 0 && (
                    <span className={`text-[11px] font-bold font-mono ${deltaCgpa > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {deltaCgpa > 0 ? `+${deltaCgpa.toFixed(2)}` : deltaCgpa.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {projectedCredits} Cr est.
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-neutral-500 border-t border-neutral-100 pt-3 flex justify-between font-medium">
            <span>
              {hasProjections ? `Confirmed: ${stats.totalGpaCreditsAttempted} Cr` : `Attempted: ${stats.totalGpaCreditsAttempted} Cr`}
            </span>
            <span className="text-emerald-700 font-bold group-hover:underline">Calculator &gt;</span>
          </div>
        </div>

        {/* Metric 2: BIG DEGREE CREDITS */}
        <div
          onClick={() => setActiveTab('progress')}
          className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-500 hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Degree Credits
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {totalCreditsPercent}%
            </span>
          </div>
          <div className="my-2.5 sm:my-3">
            <div className="text-3xl sm:text-4xl xl:text-5xl font-black font-mono text-neutral-900 tracking-tight">
              {stats.totalGpaCreditsEarned}
              <span className="text-sm sm:text-base font-semibold text-neutral-400 ml-1.5">/ {stats.totalRequiredCredits}</span>
            </div>
            <div className="w-full bg-neutral-100 h-2.5 sm:h-3 rounded-full overflow-hidden mt-3 border border-neutral-200">
              <div
                className="bg-gradient-to-r from-emerald-600 to-lime-500 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${totalCreditsPercent}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-neutral-500 border-t border-neutral-100 pt-3 flex justify-between font-medium">
            <span>Core: {stats.totalCompulsoryEarned} Cr</span>
            <span>Electives: {stats.totalElectiveEarned} Cr</span>
          </div>
        </div>

        {/* Metric 3: DEAN'S HONOR LIST */}
        <div
          onClick={() => setActiveTab('requirements')}
          className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-500 hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Dean's Honor (Yr {currentYear})
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5 sm:my-3">
            <div className="text-base sm:text-lg font-bold text-neutral-900 line-clamp-1">
              {currentDeansHonor ? currentDeansHonor.status : 'In Progress'}
            </div>
            <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
              {currentDeansHonor?.reason || 'Requires SGPA ≥ 3.70 in both semesters with zero grades below B.'}
            </p>
          </div>
          <div className="text-xs text-neutral-500 border-t border-neutral-100 pt-3 flex items-center justify-between font-medium">
            <span>Annual GPA: {currentDeansHonor?.annualGpa ? currentDeansHonor.annualGpa.toFixed(2) : '—'}</span>
            <span className="text-emerald-700 font-bold group-hover:underline">Criteria &gt;</span>
          </div>
        </div>

        {/* Metric 4: COMPULSORY NON-GPA */}
        <div
          onClick={() => {
            setSelectedSemesterForCalculator('1-1');
            setActiveTab('calculator');
          }}
          className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-500 hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Compulsory Non-GPA
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5 sm:my-3">
            <div className="text-base sm:text-lg font-bold text-neutral-900 truncate">
              {stats.ngpaAllPassed ? 'All Modules Passed ✓' : 'Pending Modules ⚠️'}
            </div>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed line-clamp-2">
              {stats.ngpaAllPassed
                ? 'Orientation & English modules cleared with Grade ≥ C-.'
                : 'Pass mark of C- (1.70) required for degree conferment.'}
            </p>
          </div>
          <div className="text-xs text-neutral-500 border-t border-neutral-100 pt-3 flex items-center justify-between font-medium">
            <span>5 Orientation Modules</span>
            <span className="text-emerald-700 font-bold group-hover:underline">Review &gt;</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DEDICATED ACADEMIC JOURNEY: PREVIOUS SEMESTERS & SGPA  */}
      {/* ======================================================== */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                Academic Journey: Previous Semesters SGPA & Status
              </h3>
              <p className="text-xs text-neutral-500">
                Track how past semester GPVs contribute to your graduation standing:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Active: Semester {profile.currentSemester}
            </span>
          </div>
        </div>

        {/* Previous, Current & Upcoming Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {semKeys.map((key, idx) => {
            const semStat = stats.semStats[key];
            const isPrevious = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isUpcoming = idx > currentIdx;
            const hasGrades = semStat.gpaCreditsAttempted > 0;

            return (
              <div
                key={key}
                onClick={() => handleOpenSemester(key)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2.5 relative ${
                  isCurrent
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 shadow-xs'
                    : isPrevious
                    ? hasGrades
                      ? 'border-neutral-200 bg-white hover:border-emerald-400'
                      : 'border-amber-200 bg-amber-50/40 hover:border-amber-400'
                    : 'border-neutral-200/70 bg-neutral-50/50 hover:bg-white text-neutral-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-neutral-900">
                    Semester {key}
                  </span>
                  {isCurrent ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700 text-white animate-pulse">
                      Current
                    </span>
                  ) : isPrevious ? (
                    hasGrades ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Graded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        ⚠️ Missing
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Upcoming
                    </span>
                  )}
                </div>

                <div className="my-1">
                  <div className="text-xl sm:text-2xl font-black font-mono text-neutral-900">
                    {hasGrades ? semStat.sgpa.toFixed(2) : '—'}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 font-medium">
                    {hasGrades
                      ? `${semStat.gpaCreditsEarned} GPA Credits Earned`
                      : isPrevious
                      ? 'No grades entered yet'
                      : `${degInfo.semesters[key]?.compulsoryCredits || 0} Req. Credits`}
                  </div>
                </div>

                <div className="text-xs font-bold pt-2 border-t border-neutral-200/80 flex items-center justify-between">
                  <span className={isCurrent ? 'text-emerald-800' : isPrevious && !hasGrades ? 'text-amber-800' : 'text-neutral-500'}>
                    {isCurrent ? 'Enter Current Grades' : isPrevious && !hasGrades ? 'Add Subjects' : 'Review'}
                  </span>
                  <span className="text-neutral-400">&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regulation Alerts Bar (if any) */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((alert, idx) => {
            const isDanger = alert.level === 'danger';
            const isWarning = alert.level === 'warning';

            return (
              <div
                key={idx}
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 transition text-xs sm:text-sm ${
                  isDanger
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : isWarning
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                {isDanger ? (
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-rose-600" />
                ) : (
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-amber-600" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{alert.title}</div>
                  <div className="text-xs opacity-90 mt-0.5 leading-relaxed">{alert.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. 2-COLUMN SECTION: SGPA TRAJECTORY + SPECIALIZATION     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT: SGPA TRAJECTORY CHART (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>SGPA Trajectory & Progression Curve</span>
            </span>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {trendData.length > 0 ? (
            <div className="h-44 sm:h-52 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#888" />
                  <YAxis domain={[2.0, 4.0]} tick={{ fontSize: 11 }} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderColor: '#e5e7eb',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sgpa"
                    stroke="#1b4332"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1b4332' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 sm:h-52 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2">
              <span className="text-2xl">📈</span>
              <p className="text-xs text-neutral-600 font-medium">
                No past semester grades entered yet.
              </p>
              <button
                onClick={() => handleOpenSemester(previousSemesters[0] || '1-1')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition"
              >
                Enter Semester Grades
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: SPECIALIZATION STREAM ELIGIBILITY (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div
            onClick={() => setActiveTab('specialization')}
            className="bg-white border border-neutral-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs cursor-pointer hover:border-emerald-500 hover:shadow-md transition flex flex-col justify-between flex-1 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-800 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">Final-Year Specialization Check</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Faculty 3-1 Gateway Rule</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Year 3 Sem 1 CGPA Threshold:</span>
                <span className="font-mono font-bold text-neutral-900">≥ 2.70</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">3rd Year Department Electives:</span>
                <span className="font-mono font-bold text-neutral-900">≥ 50%</span>
              </div>
            </div>

            <div className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
              <span>Inspect Department Quotas & Stream Requirements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Quick Forecast Link Card */}
          <div
            onClick={() => setActiveTab('simulator')}
            className="bg-white border border-neutral-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs cursor-pointer hover:border-emerald-500 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-neutral-900">Target Class Solver & Grade Mixes</div>
                <div className="text-[11px] text-neutral-500">Calculate exact courses needed for First Class / 2nd Upper</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
