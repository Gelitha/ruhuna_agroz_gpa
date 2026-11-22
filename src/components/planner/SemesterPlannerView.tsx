// University of Ruhuna - Faculty of Agriculture
// GradePath Semester Planner & Credit Load Balancer (Enlarged & Vivid)

import React from 'react';
import { CalendarDays, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';
import { DEGREE_INFO, getDepartmentStyle } from '../../database';
import { SemesterKey } from '../../types';

export const SemesterPlannerView: React.FC = () => {
  const { getActiveProfile, getOverallStats, setActiveTab, setSelectedSemesterForCalculator } = useGradeStore();
  const profile = getActiveProfile();
  const stats = getOverallStats();
  const degInfo = DEGREE_INFO[profile.degree] || DEGREE_INFO.ARMT;

  const semKeys: SemesterKey[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Intro Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Academic Planning
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
            Semester Credit Load & Course Planner
          </h2>
          <p className="text-sm text-neutral-600">
            Balance semester credit loads (standard: 15–18 credits per semester) and ensure minimum elective thresholds are met for {profile.degree}.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm shrink-0">
          <span className="text-neutral-500 font-medium">Degree: </span>
          <span className="font-bold text-neutral-900">{profile.degree} (Min {degInfo.totalMinGpaCredits} Credits)</span>
        </div>
      </div>

      {/* 8-Semester Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {semKeys.map(key => {
          const courses = profile.semesters[key] || [];
          const semStat = stats.semStats[key];
          const minComp = degInfo.semesters[key]?.compulsoryCredits || 0;
          const minElect = degInfo.semesters[key]?.minElectives || 0;
          const totalRegisteredCredits = courses.reduce((sum, c) => sum + (c.isNgpa ? 0 : (Number(c.credits) || 0)), 0);
          const isCurrent = profile.currentSemester === key;

          return (
            <div
              key={key}
              className={`p-6 rounded-3xl bg-white border shadow-sm flex flex-col justify-between space-y-4 transition ${
                isCurrent ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-neutral-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-base text-neutral-900">Semester {key}</span>
                    {isCurrent && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {totalRegisteredCredits} Total Cr
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold pt-2.5">
                  <span>Req. Compulsory: {minComp} Cr</span>
                  <span>Min. Elective: {minElect} Cr</span>
                </div>

                {/* Course List Preview */}
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {courses.map(c => {
                    const deptStyle = getDepartmentStyle(c.dept);
                    return (
                      <div
                        key={c.code}
                        className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs hover:bg-neutral-100/70 transition"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}>
                            {c.dept || 'CC'}
                          </span>
                          <span className="font-mono font-bold text-neutral-900">{c.code}</span>
                          <span className="text-neutral-600 truncate">{c.name}</span>
                        </div>
                        <span className="text-xs font-bold text-neutral-700 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-neutral-200">
                          {c.isNgpa ? 'NGPA' : `${c.credits} Cr`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">
                  {semStat.gpaCreditsAttempted > 0 ? (
                    <span className="font-bold text-neutral-900">SGPA: {semStat.sgpa.toFixed(2)}</span>
                  ) : (
                    'No grades finalized'
                  )}
                </span>

                <button
                  onClick={() => {
                    setSelectedSemesterForCalculator(key);
                    setActiveTab('calculator');
                  }}
                  className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition hover:underline"
                >
                  <span>Edit in Calculator</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
