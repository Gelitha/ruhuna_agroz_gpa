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

export const GpaAnalyticsView: React.FC = () => {
  const { getActiveProfile, getOverallStats } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  // 1. Line chart data: SGPA vs CGPA progression
  let runningPoints = 0;
  let runningCredits = 0;
  const progressionData = semKeys.map(key => {
    const sem = stats.semStats[key];
    runningPoints += sem.weightedPoints;
    runningCredits += sem.gpaCreditsAttempted;
    const runningCgpa = runningCredits > 0 ? runningPoints / runningCredits : 0;

    return {
      semester: key,
      sgpa: sem.gpaCreditsAttempted > 0 ? parseFloat(sem.sgpa.toFixed(2)) : null,
      cgpa: runningCredits > 0 ? parseFloat(runningCgpa.toFixed(2)) : null,
      credits: sem.gpaCreditsEarned
    };
  });

  // 2. Grade distribution data
  const gradeCounts: Record<string, number> = {
    'A+': 0, 'A': 0, 'A-': 0,
    'B+': 0, 'B': 0, 'B-': 0,
    'C+': 0, 'C': 0, 'C-': 0,
    'D+': 0, 'D': 0, 'E': 0
  };

  // 3. Department distribution
  const deptCredits: Record<string, number> = {};

  semKeys.forEach(k => {
    (profile.semesters[k] || []).forEach(c => {
      if (c.grade && gradeCounts[c.grade] !== undefined) {
        gradeCounts[c.grade]++;
      }
      if (!c.isNgpa && c.dept) {
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
          <p className="text-xs text-secondary mt-0.5">
            Visual analysis of your GPA velocity, credit accumulation, and grade distribution across all semesters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-surface-subtle border border-border text-xs">
            <span className="text-secondary">Current CGPA: </span>
            <span className="font-bold text-primary">{stats.cgpa.toFixed(2)}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-surface-subtle border border-border text-xs">
            <span className="text-secondary">Earned Credits: </span>
            <span className="font-bold text-main">{stats.totalGpaCreditsEarned} / {stats.totalRequiredCredits}</span>
          </div>
        </div>
      </div>

      {/* Chart 1: SGPA vs CGPA Line Chart */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-main">GPA Progression Trajectory</h3>
            <p className="text-xs text-secondary">Semester SGPA vs Cumulative CGPA</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary rounded-full" />
              <span className="text-main">Cumulative CGPA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-accent-success rounded-full" />
              <span className="text-secondary">Semester SGPA</span>
            </div>
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
              <Line
                type="monotone"
                dataKey="cgpa"
                stroke="#245C45"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#245C45' }}
                activeDot={{ r: 6 }}
                name="Cumulative CGPA"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="sgpa"
                stroke="#27845B"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#27845B' }}
                name="Semester SGPA"
                connectNulls
              />
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

