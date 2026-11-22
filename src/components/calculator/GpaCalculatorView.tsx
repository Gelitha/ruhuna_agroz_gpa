// University of Ruhuna - Faculty of Agriculture
// GradePath — Ultra-Modern GPA Calculator & Course Cockpit
// Features: BIG Cumulative Hero, Vibrant Colors, Enlarged Comfortable Controls, Strict Degree Elective Filtering

import React, { useState, useMemo } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Award,
  Search,
  Filter,
  Sliders,
  Compass,
  ArrowUpRight,
  BookOpen,
  Minus,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { Grade, SemesterKey, Course } from '../../types';
import {
  GRADING_SCALE,
  COURSE_CATALOG,
  DEGREE_INFO,
  parseCourseCode,
  DEPARTMENTS,
  getDepartmentStyle,
  getAvailableElectivesForStudent
} from '../../database';
import { calculateCourseGpv, calculateWhatIf } from '../../utils/calculations';

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

export const GpaCalculatorView: React.FC = () => {
  const {
    getActiveProfile,
    getSemesterStats,
    getOverallStats,
    selectedSemesterForCalculator,
    setSelectedSemesterForCalculator,
    setCourseGrade,
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
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  const [activeTabKey, setActiveTabKey] = useState<SemesterKey | 'ORIENTATION'>(
    selectedSemesterForCalculator === 'ALL' ? '1-1' : selectedSemesterForCalculator
  );

  // Search & Filter
  const [courseSearch, setCourseSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ungraded' | 'repeat'>('all');

  // Fast inline course add state
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [inlineCode, setInlineCode] = useState('');
  const [inlineName, setInlineName] = useState('');
  const [inlineCredits, setInlineCredits] = useState<number>(2);

  // Handbook Electives Quick Add panel toggle
  const [showElectiveSuggestions, setShowElectiveSuggestions] = useState(true);

  // Mini What-If slider in sticky rail
  const [railSimulatedGpa, setRailSimulatedGpa] = useState<number>(3.6);
  const railWhatIf = calculateWhatIf(profile, railSimulatedGpa);

  const isOrientation = activeTabKey === 'ORIENTATION';
  const semCourses = isOrientation
    ? profile.orientationCourses
    : profile.semesters[activeTabKey as SemesterKey] || [];

  const semStats = !isOrientation ? getSemesterStats(activeTabKey as SemesterKey) : null;

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return semCourses.filter(c => {
      const matchSearch =
        !courseSearch ||
        c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(courseSearch.toLowerCase());

      if (!matchSearch) return false;
      if (filterType === 'ungraded') return !c.grade;
      if (filterType === 'repeat') return !!c.isRepeat;
      return true;
    });
  }, [semCourses, courseSearch, filterType]);

  // Available handbook electives for this active semester STRICTLY filtered by student's degree
  const availableElectives = useMemo(() => {
    if (isOrientation) return [];
    return getAvailableElectivesForStudent(
      profile.degree,
      activeTabKey as SemesterKey,
      semCourses.map(c => c.code)
    );
  }, [activeTabKey, semCourses, isOrientation, profile.degree]);

  // Quick 1-click add from handbook
  const handleQuickAddElective = (catCourse: any) => {
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
  };

  // Fast custom course add
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCode.trim() || isOrientation) return;
    const clean = inlineCode.trim().toUpperCase();
    const parsed = parseCourseCode(clean);

    // If matches handbook catalog, pull catalog title
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
  };

  // Vibrant, rich button styling per grade
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

  const totalCreditsPercent = Math.min(100, Math.round((stats.totalGpaCreditsEarned / stats.totalRequiredCredits) * 100));
  const remainingCredits = Math.max(0, stats.totalRequiredCredits - stats.totalGpaCreditsEarned);

  return (
    <div className="max-w-[1440px] mx-auto pb-16 space-y-6">
      {/* ======================================================== */}
      {/* MASSIVE & VIBRANT CUMULATIVE METRICS HERO                */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-[#0F3826] via-[#1B4E38] to-[#123324] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        {/* Subtle background botanical ambient light */}
        <div className="absolute right-4 -bottom-10 text-9xl text-white/5 pointer-events-none select-none font-serif">
          🌿
        </div>
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* LEFT: BIG CUMULATIVE GPA */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-4xl sm:text-5xl shrink-0 shadow-lg backdrop-blur-md">
              🌿
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 shadow-xs">
                  {profile.degree} (Hons)
                </span>
                <span className="text-sm text-emerald-200 font-medium">
                  {profile.name} {profile.registrationNumber ? `• ${profile.registrationNumber}` : ''}
                </span>
              </div>

              {/* Massive GPA typography */}
              <div className="flex flex-wrap items-baseline gap-4 mt-2">
                <div className="flex items-baseline">
                  <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                    {stats.cgpa.toFixed(2)}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-emerald-300/80 ml-2">/ 4.00</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-bold px-3.5 py-1.5 rounded-full bg-amber-400/25 text-amber-200 border border-amber-400/40 shadow-sm backdrop-blur-xs flex items-center gap-1.5">
                    <span>★</span>
                    <span>{stats.classStanding}</span>
                  </span>
                  {stats.cgpa < 3.70 && stats.cgpa >= 2.00 && (
                    <span className="text-xs sm:text-sm text-emerald-200 font-medium bg-white/10 px-3 py-1 rounded-full border border-white/15">
                      {(3.70 - stats.cgpa).toFixed(2)} to 1st Class
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: BIG CUMULATIVE CREDITS & ACTIVE SEMESTER SGPA */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:gap-10 items-center border-t lg:border-t-0 pt-6 lg:pt-0 border-white/15">
            {/* Metric 1: BIG Cumulative Credits */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-200/90 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-300" />
                <span>Degree Credits</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                  {stats.totalGpaCreditsEarned}
                </span>
                <span className="text-base font-semibold text-emerald-300/80">
                  / {stats.totalRequiredCredits}
                </span>
              </div>
              <div className="w-44 sm:w-52 bg-white/20 h-2.5 rounded-full overflow-hidden mt-2 border border-white/20 shadow-inner">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-lime-300 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${totalCreditsPercent}%` }}
                />
              </div>
              <div className="text-xs text-emerald-200/80 pt-0.5 font-medium">
                {remainingCredits} credits remaining ({totalCreditsPercent}%)
              </div>
            </div>

            {/* Metric 2: Active Semester SGPA */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                Sem {activeTabKey} SGPA
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                  {semStats && semStats.gpaCreditsAttempted > 0 ? semStats.sgpa.toFixed(2) : '—'}
                </span>
                <span className="text-sm font-semibold text-emerald-300/80">
                  {semStats ? `${semStats.gpaCreditsEarned} Cr` : '0 Cr'}
                </span>
              </div>
              <div className="text-xs text-emerald-200/80 font-medium">
                {semStats?.hasRepeat ? '⚠️ Repeat grades capped' : 'Standard evaluations'}
              </div>
            </div>

            {/* Metric 3: Quick Transcript & Tools */}
            <div className="col-span-2 sm:col-span-1 flex flex-row sm:flex-col gap-2.5 justify-end">
              <button
                onClick={() => setActiveTab('transcript')}
                className="w-full px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/25 transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Transcript</span>
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-400/40 transition shadow-sm"
              >
                <Sliders className="w-4 h-4" />
                <span>Forecast</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2-COLUMN WORKSPACE (Enhanced Size & Visual Hierarchy)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN: DENSE COURSE MATRIX & CREDIT CONTROLS (8)  */}
        {/* ====================================================== */}
        <div className="lg:col-span-8 space-y-4">
          {/* Semester Pill Bar (Enlarged, Responsive & Comfortable) */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto py-0.5">
              {SEMESTERS.map(sem => {
                const isActive = activeTabKey === sem.key;
                let sgpaBadge = '';
                if (sem.key !== 'ORIENTATION') {
                  const st = getSemesterStats(sem.key);
                  if (st.gpaCreditsAttempted > 0) {
                    sgpaBadge = st.sgpa.toFixed(2);
                  }
                }

                return (
                  <button
                    key={sem.key}
                    onClick={() => {
                      setActiveTabKey(sem.key);
                      if (sem.key !== 'ORIENTATION') {
                        setSelectedSemesterForCalculator(sem.key);
                      }
                    }}
                    className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{sem.label}</span>
                    {sgpaBadge && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sgpaBadge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Fill Dropdown */}
            {!isOrientation && (
              <select
                onChange={(e) => {
                  if (e.target.value === 'clear') {
                    clearSemesterGrades(activeTabKey as SemesterKey);
                  } else if (e.target.value) {
                    bulkSetSemesterGrades(activeTabKey as SemesterKey, e.target.value as Grade);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
                className="text-xs sm:text-sm bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-800 font-semibold cursor-pointer shrink-0 focus:outline-none focus:border-emerald-600 transition w-full sm:w-auto"
                title="Batch set grades for this semester"
              >
                <option value="" disabled>Fast Fill Grades...</option>
                <option value="A">All A (4.0)</option>
                <option value="A-">All A- (3.7)</option>
                <option value="B+">All B+ (3.3)</option>
                <option value="B">All B (3.0)</option>
                <option value="C">All C (2.0)</option>
                <option value="clear">Clear Grades</option>
              </select>
            )}
          </div>

          {/* QUICK-ADD RELEVANT HANDBOOK ELECTIVES (Strictly filtered for student's degree) */}
          {!isOrientation && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
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
                      {availableElectives.length} official electives available for your degree programme.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowElectiveSuggestions(!showElectiveSuggestions)}
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-bold px-2 py-1 rounded-md hover:bg-neutral-100"
                >
                  {showElectiveSuggestions ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {showElectiveSuggestions && (
                availableElectives.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
                    No additional electives required or available for Semester {activeTabKey} in {profile.degree}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableElectives.map(cat => {
                      const deptStyle = getDepartmentStyle(cat.dept);
                      return (
                        <button
                          key={cat.code}
                          onClick={() => handleQuickAddElective(cat)}
                          className="p-2.5 rounded-xl bg-neutral-50 hover:bg-emerald-50/60 border border-neutral-200 hover:border-emerald-300 text-left flex items-center justify-between gap-2.5 group transition"
                          title={`${cat.code}: ${cat.name} (${cat.credits} Cr)`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}>
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
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white transition shrink-0">
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

          {/* Filter & Custom Course Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search course code or name..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center rounded-xl border border-neutral-300 bg-white p-1 text-xs font-semibold text-neutral-600 shadow-2xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${filterType === 'all' ? 'bg-neutral-900 text-white font-bold' : 'hover:text-neutral-900'}`}
                >
                  All ({semCourses.length})
                </button>
                <button
                  onClick={() => setFilterType('ungraded')}
                  className={`px-3 py-1.5 rounded-lg transition ${filterType === 'ungraded' ? 'bg-neutral-900 text-white font-bold' : 'hover:text-neutral-900'}`}
                >
                  Ungraded
                </button>
                <button
                  onClick={() => setFilterType('repeat')}
                  className={`px-3 py-1.5 rounded-lg transition ${filterType === 'repeat' ? 'bg-neutral-900 text-white font-bold' : 'hover:text-neutral-900'}`}
                >
                  Repeats
                </button>
              </div>

              {!isOrientation && (
                <button
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Custom</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Custom Course Adder */}
          {showAddCustom && !isOrientation && (
            <form onSubmit={handleAddCustom} className="p-4 bg-emerald-50/50 border border-emerald-300 rounded-2xl flex flex-wrap items-center gap-3 text-sm shadow-sm">
              <input
                type="text"
                placeholder="Code (e.g. CS21023)"
                value={inlineCode}
                onChange={(e) => setInlineCode(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-neutral-300 font-mono font-bold w-36 focus:outline-none focus:border-emerald-600"
              />
              <input
                type="text"
                placeholder="Course title..."
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-neutral-300 flex-1 min-w-[180px] focus:outline-none focus:border-emerald-600"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-600 mr-1">Credits:</span>
                {[1, 2, 3, 6].map(cr => (
                  <button
                    key={cr}
                    type="button"
                    onClick={() => setInlineCredits(cr)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      inlineCredits === cr
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {cr} Cr
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!inlineCode.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm disabled:opacity-40 transition shadow-sm"
              >
                Add Course
              </button>
            </form>
          )}

          {/* DENSE COURSE ROWS LIST (Comfortable Enlarged Sizing, Vivid Colors, Tactile Micro-Grade Chips) */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm divide-y divide-neutral-100 overflow-hidden">
            {filteredCourses.length === 0 ? (
              <div className="p-10 text-center text-sm text-neutral-500">
                No matching courses found in Semester {activeTabKey}.
              </div>
            ) : (
              filteredCourses.map(course => {
                const effectiveGpv = calculateCourseGpv(course);
                const creds = Number(course.credits) || 0;
                const isCapped = course.isRepeat && !course.isExcused && GRADING_SCALE[course.grade || '']?.gpv > 2.0;
                const deptStyle = getDepartmentStyle(course.dept);

                return (
                  <div
                    key={course.code}
                    className={`p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-neutral-50/80 transition-colors ${
                      course.grade === 'E' ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Course Code, Title, Department Tag & Credit Stepper */}
                    <div className="min-w-0 xl:w-5/12 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm sm:text-base text-neutral-900">
                          {course.code}
                        </span>

                        {course.dept && (
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}>
                            {course.dept}
                          </span>
                        )}

                        {/* Interactive Credit Stepper */}
                        {!course.isNgpa && (
                          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setCourseCredits(activeTabKey as SemesterKey, course.code, Math.max(1, creds - 1))}
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
                              onClick={() => setCourseCredits(activeTabKey as SemesterKey, course.code, creds + 1)}
                              title="Increase credit"
                              className="text-neutral-500 hover:text-neutral-900 p-0.5 rounded hover:bg-neutral-200"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {course.isNgpa && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300">
                            NGPA (Non-GPA)
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

                      <div className="text-sm font-semibold text-neutral-800 truncate" title={course.name}>
                        {course.name}
                      </div>
                    </div>

                    {/* Micro Grade Segmented Buttons (Scaled Up: h-9 w-9, Vivid Colors, Touch Scrollable) */}
                    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 max-w-full scrollbar-none">
                      {GRADE_OPTIONS.map(g => {
                        const isSelected = course.grade === g;
                        return (
                          <button
                            key={g}
                            onClick={() => {
                              if (isOrientation) {
                                setOrientationGrade(course.code, isSelected ? '' : g);
                              } else {
                                setCourseGrade(activeTabKey as SemesterKey, course.code, isSelected ? '' : g);
                              }
                            }}
                            className={`h-9 w-9 sm:h-9.5 sm:w-9.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shrink-0 border ${
                              getGradeStyle(isSelected ? g : undefined)
                            }`}
                            title={`${g} (${GRADING_SCALE[g]?.gpv.toFixed(1)} GPV)`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>

                    {/* Status / GPV / Repeat / Actions */}
                    <div className="flex items-center justify-between xl:justify-end gap-3 text-sm shrink-0">
                      {effectiveGpv !== null && !course.isNgpa && (
                        <div className="text-right">
                          <span className="font-mono font-black text-neutral-900 text-sm sm:text-base">
                            {effectiveGpv.toFixed(1)} <span className="text-xs text-neutral-500 font-normal">GPV</span>
                          </span>
                          {isCapped && (
                            <span className="block text-xs text-amber-600 font-bold">Capped 2.0</span>
                          )}
                        </div>
                      )}

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
                              onChange={(e) =>
                                setCourseRepeat(activeTabKey as SemesterKey, course.code, e.target.checked)
                              }
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
                                onChange={(e) =>
                                  setCourseExcused(activeTabKey as SemesterKey, course.code, e.target.checked)
                                }
                                className="hidden"
                              />
                              <span>{course.isExcused ? 'Med✓' : 'Med?'}</span>
                            </label>
                          )}
                        </div>
                      )}

                      {!course.isCompulsory && !course.isNgpa && !isOrientation && (
                        <button
                          onClick={() => removeCourseFromSemester(activeTabKey as SemesterKey, course.code)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove elective from semester"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: LIVE INTELLIGENCE RAIL (4 Cols)          */}
        {/* ====================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Honours Class Standing Audit */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                Degree Class Standing
              </span>
              <span
                className="text-xs font-extrabold px-3 py-1 rounded-full shadow-xs"
                style={{
                  backgroundColor: `${stats.classBadgeColor}20`,
                  color: stats.classBadgeColor,
                  borderColor: `${stats.classBadgeColor}40`,
                  borderWidth: 1
                }}
              >
                ★ {stats.classStanding}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {[
                { name: 'First Class', minGpa: 3.70, color: '#15803d' },
                { name: 'Second Upper', minGpa: 3.30, color: '#0d9488' },
                { name: 'Second Lower', minGpa: 3.00, color: '#b45309' },
                { name: 'Pass', minGpa: 2.00, color: '#475569' }
              ].map(tier => {
                const isMet = stats.cgpa >= tier.minGpa;
                const delta = (stats.cgpa - tier.minGpa).toFixed(2);
                return (
                  <div
                    key={tier.name}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition ${
                      isMet
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-neutral-50/60 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tier.name}</span>
                      <span className="text-xs font-mono text-neutral-500">({tier.minGpa.toFixed(2)})</span>
                    </div>
                    <span className="font-mono font-bold">
                      {isMet ? `+${delta} Met ✓` : `${delta}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Interactive What-If Simulator */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-700" />
                What-If Projected CGPA
              </span>
              <span className="text-sm font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                {railWhatIf.projectedCgpa.toFixed(2)} CGPA
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Slide target SGPA across remaining {railWhatIf.remainingCredits} GPA credits to forecast your final degree standing.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-neutral-700">
                <span>Simulated Future SGPA:</span>
                <span className="font-mono text-emerald-700 text-sm font-black">{railSimulatedGpa.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="2.00"
                max="4.00"
                step="0.05"
                value={railSimulatedGpa}
                onChange={(e) => setRailSimulatedGpa(parseFloat(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer h-2 bg-neutral-200 rounded-lg"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm flex items-center justify-between">
              <span className="text-neutral-600 font-medium">Projected Standing:</span>
              <span className="font-bold text-neutral-900">{railWhatIf.projectedStanding}</span>
            </div>
          </div>

          {/* Card 3: Regulations Reference Check */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-neutral-900">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Official Regulations Checklist</span>
            </div>
            <ul className="space-y-2 text-neutral-600 text-xs pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>Repeat examinations capped at Grade C (2.0 GPV) unless Senate medical excuse is registered.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>Compulsory Non-GPA modules require Grade ≥ C- (1.70) for graduation eligibility.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>Dean's List requires ≥ 3.70 GPA in both semesters with zero grades below B.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
