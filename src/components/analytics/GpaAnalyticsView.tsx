// University of Ruhuna - Faculty of Agriculture
// GradePath Progression & GPA Analytics View (Recharts)

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon, Award } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { SemesterKey } from '../../types';
import { DEPARTMENTS } from '../../database';
import { GpaJourneyBar } from '../projection/GpaJourneyBar';
import { SiSubtext } from '../common/BilingualText';
import { SI } from '../../constants/translations';

export const GpaAnalyticsView: React.FC = () => {
  const { getActiveProfile, getOverallStats, getAcademicProjections } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();
  const proj = getAcademicProjections();

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  // 1. Progression Data: Confirmed Actual Series (Solid Green) + Projected Series (Dashed Blue)
  let runningActualPoints = 0;
  let runningActualCredits = 0;
  let runningProjectedPoints = 0;
  let runningProjectedCredits = 0;

  const progressionData = semKeys.map(key => {
    const sem = stats.semStats[key];
    const semProj = proj.semesterSummaries[key];

    // Confirmed actuals:
    runningActualPoints += sem.realWeightedPoints;
    runningActualCredits += sem.realCreditsAttempted;
    const actualCgpa = runningActualCredits > 0 ? runningActualPoints / runningActualCredits : null;
    const actualSgpa = sem.realCreditsAttempted > 0 ? sem.realSgpa : null;

    // Projected (when semester has projected grades):
    const hasSemProjection = semProj && semProj.predictedGpaCredits > 0;
    const projectedSgpa = hasSemProjection ? semProj.projectedSgpa : null;

    // Combined running projected CGPA:
    const semProjCredits = semProj ? semProj.predictedGpaCredits : 0;
    const semProjPoints = semProj ? semProj.predictedGpaCredits * semProj.projectedSgpa : 0;
    runningProjectedPoints += sem.realWeightedPoints + semProjPoints;
    runningProjectedCredits += sem.realCreditsAttempted + semProjCredits;
    const projectedCgpa = hasSemProjection && runningProjectedCredits > 0
      ? runningProjectedPoints / runningProjectedCredits
      : null;

    return {
      semester: key,
      actualCgpa: actualCgpa !== null ? parseFloat(actualCgpa.toFixed(2)) : null,
      actualSgpa: actualSgpa !== null ? parseFloat(actualSgpa.toFixed(2)) : null,
      projectedCgpa: projectedCgpa !== null ? parseFloat(projectedCgpa.toFixed(2)) : null,
      projectedSgpa: projectedSgpa !== null ? parseFloat(projectedSgpa.toFixed(2)) : null,
      credits: sem.realCreditsEarned
    };
  });

  // 2. Grade distribution data (Confirmed grades only)
  const gradeCounts: Record<string, number> = {
    'A+': 0, 'A': 0, 'A-': 0,
    'B+': 0, 'B': 0, 'B-': 0,
    'C+': 0, 'C': 0, 'C-': 0,
    'D+': 0, 'D': 0, 'E': 0
  };

  // 3. Department distribution (Confirmed courses only)
  const deptCredits: Record<string, number> = {};

  semKeys.forEach(k => {
    (profile.semesters[k] || []).forEach(c => {
      if (!c.isExpected && c.grade && gradeCounts[c.grade] !== undefined) {
        gradeCounts[c.grade]++;
      }
      if (!c.isExpected && !c.isNgpa && c.dept) {
        const creds = Number(c.credits) || 0;
        deptCredits[c.dept] = (deptCredits[c.dept] || 0) + creds;
      }
    });
  });

  const gradeDistributionData = Object.entries(gradeCounts).map(([grade, count]) => ({
    grade,
    count
  }));

  const deptDistributionData = Object.entries(deptCredits).map(([dept, credits]) => ({
    dept,
    deptName: DEPARTMENTS[dept] || dept,
    credits
  }));

  const COLORS = ['#245C45', '#27845B', '#3B82F6', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#64748B'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-main">Academic Progression & GPA Analytics</h2>
          <SiSubtext text={SI.analytics.title} className="text-[#176B45] font-semibold" />
          <p className="text-xs text-secondary mt-0.5">
            Visual analysis of your GPA velocity, credit accumulation, and grade distribution across all semesters
          </p>
          <SiSubtext text={SI.analytics.subtitle} className="text-[#626962]" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-surface-subtle border border-border text-xs">
            <span className="text-secondary">Actual CGPA: </span>
            <span className="font-bold text-primary">
              {stats.totalGpaCreditsAttempted > 0 ? stats.cgpa.toFixed(2) : '—'}
            </span>
          </div>
          {stats.hasExpectedCourses && (
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
              <span className="text-blue-700 font-medium">Projected CGPA: </span>
              <span className="font-bold font-mono text-blue-900">{proj.combinedProjectedCgpa.toFixed(2)}</span>
              <span className="text-[10px] text-blue-600 ml-1 font-semibold">(Est.)</span>
            </div>
          )}
          <div className="px-3.5 py-1.5 rounded-xl bg-surface-subtle border border-border text-xs">
            <span className="text-secondary">Earned Credits: </span>
            <span className="font-bold text-main">{stats.totalGpaCreditsEarned} / {stats.totalRequiredCredits}</span>
          </div>
        </div>
      </div>

      {/* Cumulative GPA Journey */}
      <GpaJourneyBar
        actualCgpa={proj.actualCgpa}
        projectedPendingCgpa={proj.projectedCgpaPending}
        combinedProjectedCgpa={proj.combinedProjectedCgpa}
        targetCgpa={profile.projectionTargetCgpa}
        pendingCount={proj.pendingResultsCount}
        currentSemester={proj.currentSemester}
      />

      {/* Chart 1: SGPA vs CGPA Line Chart */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-main">GPA Progression Trajectory</h3>
            <p className="text-xs text-secondary">Semester SGPA vs Cumulative CGPA</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary rounded-full" />
              <span className="text-main font-semibold">Actual CGPA (Confirmed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600 rounded-full" />
              <span className="text-secondary font-semibold">Actual SGPA (Confirmed)</span>
            </div>
            {stats.hasExpectedCourses && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-600 rounded-full border-b border-dashed border-blue-600" />
                  <span className="text-blue-700 font-semibold">Projected CGPA (Est.)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-400 rounded-full border-b border-dashed border-blue-400" />
                  <span className="text-blue-500 font-semibold">Projected SGPA (Est.)</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1EC" vertical={false} />
              <XAxis dataKey="semester" stroke="#78827A" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 4.0]} stroke="#78827A" fontSize={11} tickLine={false} ticks={[1.0, 2.0, 3.0, 3.3, 3.7, 4.0]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E6EAE5',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              />
              {/* Confirmed Actual Series: Solid Green */}
              <Line
                type="monotone"
                dataKey="actualCgpa"
                stroke="#245C45"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#245C45' }}
                activeDot={{ r: 6 }}
                name="Actual CGPA (Confirmed)"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="actualSgpa"
                stroke="#27845B"
                strokeWidth={1.5}
                dot={{ r: 3, fill: '#27845B' }}
                name="Actual SGPA (Confirmed)"
                connectNulls
              />
              {/* Projected Series: Dashed Blue */}
              {stats.hasExpectedCourses && (
                <>
                  <Line
                    type="monotone"
                    dataKey="projectedCgpa"
                    stroke="#2563EB"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#2563EB' }}
                    name="Projected CGPA (Est.)"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedSgpa"
                    stroke="#60A5FA"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 3, fill: '#60A5FA' }}
                    name="Projected SGPA (Est.)"
                    connectNulls
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Grade Distribution & Credits Accumulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Grade Breakdown */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-main">Grade Distribution</h3>
            <p className="text-xs text-secondary">Total count of confirmed course grades awarded</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1EC" vertical={false} />
                <XAxis dataKey="grade" stroke="#78827A" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#78827A" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E6EAE5',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#245C45" radius={[4, 4, 0, 0]} name="Courses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Department Credit Breakdown */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-main">Credits by Department</h3>
            <p className="text-xs text-secondary">Credit distribution across Faculty departments</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1EC" horizontal={false} />
                <XAxis type="number" stroke="#78827A" fontSize={11} tickLine={false} />
                <YAxis dataKey="dept" type="category" stroke="#78827A" fontSize={11} tickLine={false} width={40} />
                <Tooltip
                  formatter={(val, name, item: any) => [`${val} Credits`, item.payload.deptName]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E6EAE5',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="credits" fill="#27845B" radius={[0, 4, 4, 0]} name="Credits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

