// University of Ruhuna - Faculty of Agriculture
// GradePath Academic Dashboard View — Fully Responsive Multi-Device Command Center
// Features: Responsive Breakpoints, Previous Semesters SGPA Tracking, Real-Time Alerts

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
  Edit3
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

export const DashboardView: React.FC = () => {
  const {
    getActiveProfile,
    getOverallStats,
    getRiskAlerts,
    setActiveTab,
    setSelectedSemesterForCalculator,
    setShowOnboarding
  } = useGradeStore();

  const profile = getActiveProfile();
  const stats = getOverallStats();
  const alerts = getRiskAlerts();
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  const currentYear = profile.currentAcademicYear || 1;
  const currentDeansHonor = stats.deansHonors[currentYear];

  const handleOpenSemester = (semKey: SemesterKey) => {
    setSelectedSemesterForCalculator(semKey);
    setActiveTab('calculator');
  };

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const currentIdx = semKeys.indexOf(profile.currentSemester);
  const previousSemesters = semKeys.slice(0, currentIdx);
  const missingPrevious = previousSemesters.filter(k => stats.semStats[k].gpaCreditsAttempted === 0);

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
            <span className="text-xl sm:text-2xl shrink-0">🌿</span>
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-emerald-800 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100 border border-emerald-300 truncate">
              {profile.degree} (Hons) Undergraduate
            </span>
            <span className="text-xs sm:text-sm text-neutral-500 font-semibold flex items-center gap-1.5">
              <span>Year {profile.currentAcademicYear} • Sem {profile.currentSemester}</span>
              <button
                onClick={() => setShowOnboarding(true)}
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
      {/* MISSING PREVIOUS SEMESTER GRADES ALERT (DIRECT FEEDBACK) */}
      {/* ======================================================== */}
      {missingPrevious.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-amber-900 flex flex-wrap items-center gap-1.5">
                <span>Missing Previous Semester Grades:</span>
                <span className="font-mono font-black text-amber-950 bg-amber-200/80 px-2 py-0.2 rounded-md">
                  {missingPrevious.map(s => `Sem ${s}`).join(', ')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                You are currently in Semester {profile.currentSemester}. To check your past SGPA history and calculate your true Cumulative CGPA, add your subjects and grades from completed semesters.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenSemester(missingPrevious[0])}
            className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition self-start sm:self-auto shadow-xs"
          >
            <span>Add Sem {missingPrevious[0]} Grades</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
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
              {stats.cgpa.toFixed(2)}
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
          </div>
          <div className="text-xs text-neutral-500 border-t border-neutral-100 pt-3 flex justify-between font-medium">
            <span>Attempted: {stats.totalGpaCreditsAttempted} Cr</span>
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
